"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hashPassword, passwordProblems, verifyPassword, getDummyHash } from "@/lib/auth/password";
import { createSession, destroySession, requireAdmin, signOutEverywhere } from "@/lib/auth/session";
import { audit } from "@/lib/data/audit";
import { addEnquiryNote, deleteEnquiry, updateEnquiry } from "@/lib/data/enquiries";
import {
  createProperty,
  deleteImage,
  deleteProperty,
  DuplicateReferenceError,
  moveImage,
  setPropertyStatus,
  updateImageAlt,
  updateProperty,
} from "@/lib/data/properties";
import { getDb } from "@/lib/db";
import { admins, agents, listingStatus, testimonials, type ListingStatus } from "@/lib/db/schema";
import { formValues, type FormState } from "@/lib/form-state";
import { clientIpFrom, hashIdentifier, hitRateLimit, isRateLimited } from "@/lib/rate-limit";
import { deleteFiles } from "@/lib/server/storage";
import { loadSettings, saveSettings, SETTINGS_SCHEMAS, type SettingsKey } from "@/lib/settings";
import { agentSchema, enquiryUpdateSchema, fieldErrors, loginSchema, noteSchema, propertyFormSchema, testimonialSchema } from "@/lib/validation";
import { z } from "zod";

const now = () => Date.now();
const fail = (message: string, extra: Partial<Extract<FormState, { status: "error" }>> = {}): FormState => ({ status: "error", message, at: now(), ...extra });
const ok = (message: string): FormState => ({ status: "success", reference: "", message, at: now() });

function revalidatePublic(slug?: string) {
  revalidatePath("/", "layout");
  if (slug) revalidatePath(`/properties/${slug}`);
}

// ───────────────────────── Authentication ─────────────────────────

export async function login(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({ email: fd.get("email"), password: fd.get("password") });
  const values = { email: String(fd.get("email") ?? "") };
  if (!parsed.success) return fail("Enter your email address and password.", { values });
  const db = getDb();
  const ip = hashIdentifier(clientIpFrom(await headers()));
  // Only failed attempts count, so legitimate sign-ins never lock an account.
  const ipKey = `login:ip:${ip}`;
  const acctKey = `login:acct:${hashIdentifier(parsed.data.email)}`;
  if ((await isRateLimited(db, ipKey, 20)) || (await isRateLimited(db, acctKey, 5))) {
    return fail("Too many failed sign-in attempts. Please wait 15 minutes and try again.", { values });
  }

  const [admin] = await db.select().from(admins).where(eq(admins.email, parsed.data.email));
  const valid = admin
    ? await verifyPassword(admin.passwordHash, parsed.data.password)
    : (await verifyPassword(await getDummyHash(), parsed.data.password), false);
  if (!admin || !valid || admin.status !== "active") {
    await Promise.all([hitRateLimit(db, ipKey, 20, 15 * 60), hitRateLimit(db, acctKey, 5, 15 * 60)]);
    await audit(db, null, "login.failed", "admin", "", "Failed sign-in attempt");
    return fail("That email and password combination is not correct.", { values });
  }
  await createSession(admin.id);
  await audit(db, admin, "login", "admin", admin.id, "Signed in");
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

export async function changeOwnPassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireAdmin();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  if (next !== String(fd.get("confirm") ?? "")) return fail("The new passwords do not match.", { fieldErrors: { confirm: "Passwords do not match" } });
  const problems = passwordProblems(next);
  if (problems.length) return fail("Choose a stronger password.", { fieldErrors: { next: problems.join("; ") } });
  const db = getDb();
  const [row] = await db.select().from(admins).where(eq(admins.id, me.id));
  if (!row || !(await verifyPassword(row.passwordHash, current))) return fail("Your current password is not correct.", { fieldErrors: { current: "Incorrect password" } });
  await db.update(admins).set({ passwordHash: await hashPassword(next), updatedAt: new Date() }).where(eq(admins.id, me.id));
  await signOutEverywhere(me.id);
  await createSession(me.id);
  await audit(db, me, "password.changed", "admin", me.id, "Changed own password");
  return ok("Password changed. Other devices have been signed out.");
}

// ───────────────────────── Properties ─────────────────────────

export async function saveProperty(id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireAdmin();
  const values = formValues(fd);
  const parsed = propertyFormSchema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return fail("Please fix the highlighted fields.", { fieldErrors: fieldErrors(parsed.error), values });
  const db = getDb();
  try {
    const row = id ? await updateProperty(db, id, parsed.data) : await createProperty(db, parsed.data);
    if (!row) return fail("This property no longer exists.");
    await audit(db, me, id ? "property.updated" : "property.created", "property", row.id, `${row.reference} — status ${row.status}`);
    revalidatePublic(row.slug);
    if (!id) redirect(`/admin/properties/${row.id}?created=1`);
    return ok("Changes saved.");
  } catch (err) {
    if (err instanceof DuplicateReferenceError) return fail(err.message, { fieldErrors: { reference: err.message }, values });
    throw err;
  }
}

export async function changePropertyStatus(id: string, status: ListingStatus) {
  const me = await requireAdmin();
  if (!listingStatus.enumValues.includes(status)) return;
  const row = await setPropertyStatus(getDb(), id, status);
  if (row) {
    await audit(getDb(), me, "property.status", "property", id, `${row.reference} → ${status}`);
    revalidatePublic(row.slug);
  }
  revalidatePath(`/admin/properties/${id}`);
}

export async function removeProperty(id: string, fd: FormData) {
  const me = await requireAdmin({ owner: true });
  if (String(fd.get("confirm") ?? "").trim().toUpperCase() !== "DELETE") redirect(`/admin/properties/${id}?error=confirm`);
  const db = getDb();
  const removed = await deleteProperty(db, id);
  if (removed) {
    await deleteFiles(removed.storageKeys).catch((e) => console.error("[storage] cleanup failed", e));
    await audit(db, me, "property.deleted", "property", id, `${removed.reference} — ${removed.title}`);
    revalidatePublic();
  }
  redirect("/admin/properties?deleted=1");
}

export async function setImageAlt(propertyId: string, imageId: string, fd: FormData) {
  await requireAdmin();
  const alt = z.string().trim().max(200).catch("").parse(fd.get("alt"));
  await updateImageAlt(getDb(), propertyId, imageId, alt);
  revalidatePath(`/admin/properties/${propertyId}`);
}

export async function reorderImage(propertyId: string, imageId: string, direction: "up" | "down" | "first") {
  await requireAdmin();
  await moveImage(getDb(), propertyId, imageId, direction);
  revalidatePath(`/admin/properties/${propertyId}`);
  revalidatePublic();
}

export async function removeImage(propertyId: string, imageId: string) {
  const me = await requireAdmin();
  const keys = await deleteImage(getDb(), propertyId, imageId);
  await deleteFiles(keys).catch((e) => console.error("[storage] cleanup failed", e));
  await audit(getDb(), me, "image.deleted", "property", propertyId, "Removed a photo");
  revalidatePath(`/admin/properties/${propertyId}`);
  revalidatePublic();
}

// ───────────────────────── Enquiries ─────────────────────────

export async function saveEnquiry(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireAdmin();
  const parsed = enquiryUpdateSchema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return fail("Please check the fields.", { fieldErrors: fieldErrors(parsed.error) });
  const row = await updateEnquiry(getDb(), id, parsed.data);
  if (!row) return fail("This enquiry no longer exists.");
  await audit(getDb(), me, "enquiry.updated", "enquiry", id, `${row.reference} → ${parsed.data.status}`);
  revalidatePath("/admin", "layout");
  return ok("Enquiry updated.");
}

export async function addNote(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireAdmin();
  const parsed = noteSchema.safeParse({ body: fd.get("body") });
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  await addEnquiryNote(getDb(), id, me, parsed.data.body);
  revalidatePath(`/admin/enquiries/${id}`);
  return ok("Note added.");
}

export async function removeEnquiry(id: string, fd: FormData) {
  const me = await requireAdmin({ owner: true });
  if (String(fd.get("confirm") ?? "").trim().toUpperCase() !== "DELETE") redirect(`/admin/enquiries/${id}?error=confirm`);
  const row = await deleteEnquiry(getDb(), id);
  if (row) await audit(getDb(), me, "enquiry.deleted", "enquiry", id, `${row.reference} permanently deleted`);
  revalidatePath("/admin", "layout");
  redirect("/admin/enquiries?deleted=1");
}

// ───────────────────────── Settings ─────────────────────────

const boolKeys = new Set(["whatsappEnabled", "emailVerified", "showUnderOffer", "showSold", "showLet"]);

export async function saveSettingsGroup(key: SettingsKey, _prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireAdmin({ owner: true });
  if (!(key in SETTINGS_SCHEMAS)) return fail("Unknown settings group.");
  const db = getDb();
  const current = (await loadSettings(db))[key] as Record<string, unknown>;
  const raw: Record<string, unknown> = {};
  for (const field of Object.keys(current)) {
    if (boolKeys.has(field)) raw[field] = fd.get(field) === "on";
    else if (field === "areasServed") raw[field] = String(fd.get(field) ?? "").split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
    else if (field === "foundedYear") raw[field] = fd.get(field) ? Number(fd.get(field)) : null;
    else raw[field] = String(fd.get(field) ?? "");
  }
  const parsed = SETTINGS_SCHEMAS[key].safeParse(raw);
  if (!parsed.success) return fail("Please fix the highlighted fields.", { fieldErrors: fieldErrors(parsed.error), values: formValues(fd) });
  await saveSettings(db, key, parsed.data as never, me.id);
  await audit(db, me, "settings.updated", "settings", key, `Updated ${key} settings`);
  revalidatePath("/", "layout");
  return ok("Settings saved.");
}

// ───────────────────────── Testimonials & team ─────────────────────────

export async function saveTestimonial(id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireAdmin();
  const parsed = testimonialSchema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return fail("Please fix the highlighted fields.", { fieldErrors: fieldErrors(parsed.error), values: formValues(fd) });
  const db = getDb();
  if (id) await db.update(testimonials).set({ ...parsed.data, updatedAt: new Date() }).where(eq(testimonials.id, id));
  else await db.insert(testimonials).values(parsed.data);
  await audit(db, me, id ? "testimonial.updated" : "testimonial.created", "testimonial", id ?? "", parsed.data.name);
  revalidatePath("/", "layout");
  if (!id) redirect("/admin/testimonials?saved=1");
  return ok("Testimonial saved.");
}

export async function removeTestimonial(id: string) {
  const me = await requireAdmin();
  await getDb().delete(testimonials).where(eq(testimonials.id, id));
  await audit(getDb(), me, "testimonial.deleted", "testimonial", id, "");
  revalidatePath("/", "layout");
}

export async function saveAgent(id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireAdmin();
  const parsed = agentSchema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return fail("Please fix the highlighted fields.", { fieldErrors: fieldErrors(parsed.error), values: formValues(fd) });
  const db = getDb();
  if (id) await db.update(agents).set({ ...parsed.data, updatedAt: new Date() }).where(eq(agents.id, id));
  else await db.insert(agents).values(parsed.data);
  await audit(db, me, id ? "agent.updated" : "agent.created", "agent", id ?? "", parsed.data.name);
  revalidatePath("/", "layout");
  if (!id) redirect("/admin/team?saved=1");
  return ok("Team member saved.");
}

export async function removeAgent(id: string) {
  const me = await requireAdmin();
  await getDb().delete(agents).where(eq(agents.id, id));
  await audit(getDb(), me, "agent.deleted", "agent", id, "");
  revalidatePath("/", "layout");
}

// ───────────────────────── Users (owner only) ─────────────────────────

export async function createUser(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireAdmin({ owner: true });
  const schema = z.object({
    name: z.string().trim().min(2).max(80),
    email: z.email().max(120).transform((v) => v.toLowerCase()),
    role: z.enum(["owner", "staff"]),
    password: z.string().refine((p) => passwordProblems(p).length === 0, `Use at least 12 characters`),
  });
  const parsed = schema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return fail("Please fix the highlighted fields.", { fieldErrors: fieldErrors(parsed.error), values: formValues(fd, ["password"]) });
  const db = getDb();
  const [exists] = await db.select({ id: admins.id }).from(admins).where(eq(admins.email, parsed.data.email));
  if (exists) return fail("An account with that email already exists.", { fieldErrors: { email: "Already in use" }, values: formValues(fd, ["password"]) });
  const { password, ...rest } = parsed.data;
  await db.insert(admins).values({ ...rest, passwordHash: await hashPassword(password) });
  await audit(db, me, "user.created", "admin", "", `${rest.email} (${rest.role})`);
  revalidatePath("/admin/users");
  return ok(`Account created for ${rest.email}. Share the password with them securely and ask them to change it.`);
}

export async function setUserStatus(id: string, status: "active" | "disabled") {
  const me = await requireAdmin({ owner: true });
  if (id === me.id) return;
  const db = getDb();
  if (status === "disabled") {
    // Never disable the last active owner.
    const owners = await db.select({ id: admins.id }).from(admins).where(and(eq(admins.role, "owner"), eq(admins.status, "active"), ne(admins.id, id)));
    if (!owners.length) return;
    await signOutEverywhere(id);
  }
  await db.update(admins).set({ status, updatedAt: new Date() }).where(eq(admins.id, id));
  await audit(db, me, `user.${status}`, "admin", id, "");
  revalidatePath("/admin/users");
}
