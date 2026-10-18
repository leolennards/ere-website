import { existsSync } from "node:fs";

// Scripts run outside Next.js, so load .env.local / .env the same way Next does.
for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}
