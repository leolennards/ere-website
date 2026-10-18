/**
 * Administrator provisioning (the only way to create the first account).
 *
 *   npm run admin:create -- --email owner@example.com --name "Owner Name" [--role owner|staff]
 *   npm run admin:reset-password -- --email owner@example.com
 *   npm run admin:disable -- --email someone@example.com
 *
 * The password is read from a hidden prompt, or from ADMIN_PASSWORD for
 * non-interactive environments. It is never logged.
 */
import "./_env";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { createInterface } from "node:readline";
import { createPool } from "../src/lib/db";
import { admins, sessions } from "../src/lib/db/schema";
import { hashPassword, passwordProblems } from "../src/lib/auth/password";

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

async function promptHidden(question: string): Promise<string> {
  if (!process.stdin.isTTY) throw new Error("No TTY for password prompt; set ADMIN_PASSWORD instead.");
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  const out = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
  let muted = false;
  out._writeToOutput = (s: string) => {
    if (!muted || s.includes(question)) out.output.write(muted ? question : s);
  };
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    muted = true;
  });
}

async function readNewPassword() {
  const fromEnv = process.env.ADMIN_PASSWORD;
  const pw = fromEnv ?? (await promptHidden("New password: "));
  if (!fromEnv) {
    const again = await promptHidden("Repeat password: ");
    if (again !== pw) throw new Error("Passwords do not match.");
  }
  const problems = passwordProblems(pw);
  if (problems.length) throw new Error(`Password rejected: ${problems.join("; ")}`);
  return pw;
}

async function main() {
  const cmd = process.argv[2];
  const email = arg("email")?.trim().toLowerCase();
  if (!cmd || !email) throw new Error("Usage: admin.ts <create|reset-password|disable> --email <email> [--name <name>] [--role owner|staff]");

  const pool = createPool();
  const db = drizzle(pool);
  try {
    const [existing] = await db.select().from(admins).where(eq(admins.email, email));
    if (cmd === "create") {
      if (existing) throw new Error(`An administrator with ${email} already exists.`);
      const name = arg("name")?.trim();
      if (!name) throw new Error("--name is required.");
      const role = arg("role") === "staff" ? "staff" : "owner";
      const passwordHash = await hashPassword(await readNewPassword());
      await db.insert(admins).values({ email, name, role, passwordHash });
      console.log(`✓ Created ${role} account for ${email}. Sign in at /admin/login`);
    } else if (cmd === "reset-password") {
      if (!existing) throw new Error(`No administrator with ${email}.`);
      const passwordHash = await hashPassword(await readNewPassword());
      await db.update(admins).set({ passwordHash, status: "active", updatedAt: new Date() }).where(eq(admins.id, existing.id));
      await db.delete(sessions).where(eq(sessions.adminId, existing.id));
      console.log(`✓ Password reset for ${email}; existing sessions signed out.`);
    } else if (cmd === "disable") {
      if (!existing) throw new Error(`No administrator with ${email}.`);
      await db.update(admins).set({ status: "disabled", updatedAt: new Date() }).where(eq(admins.id, existing.id));
      await db.delete(sessions).where(eq(sessions.adminId, existing.id));
      console.log(`✓ Disabled ${email}.`);
    } else {
      throw new Error(`Unknown command "${cmd}".`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("✗", err instanceof Error ? err.message : err);
  process.exit(1);
});
