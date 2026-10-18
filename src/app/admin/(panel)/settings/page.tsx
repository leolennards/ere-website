import type { Metadata } from "next";
import { saveSettingsGroup } from "@/app/admin/actions";
import { AdminForm } from "@/components/admin/admin-form";
import { AdminHeader } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { loadSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Site settings" };
export const instant = false;

function Group({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="card grid gap-5 p-6 lg:grid-cols-3" aria-label={title}>
      <div><h2 className="heading text-2xl">{title}</h2><p className="mt-1 text-sm text-stone">{description}</p></div>
      <div className="lg:col-span-2">{children}</div>
    </section>
  );
}

export default async function SettingsPage() {
  await requireAdmin({ owner: true });
  const s = await loadSettings(getDb());
  return (
    <div className="max-w-6xl">
      <AdminHeader title="Site settings" description="Changes appear on the website immediately." />
      <div className="grid gap-6">
        <Group title="Business & contact" description="Shown in the header, footer, contact page and listings. Leave optional fields empty to hide them.">
          <AdminForm
            action={saveSettingsGroup.bind(null, "business")}
            columns={2}
            fields={[
              { name: "name", label: "Business name", type: "text", value: s.business.name, required: true },
              { name: "phoneDisplay", label: "Phone (as displayed)", type: "text", value: s.business.phoneDisplay, required: true },
              { name: "phoneE164", label: "Phone (international)", type: "tel", value: s.business.phoneE164, required: true, hint: "e.g. +27824741178" },
              { name: "whatsappE164", label: "WhatsApp number (international)", type: "tel", value: s.business.whatsappE164, required: true },
              { name: "whatsappEnabled", label: "Show WhatsApp buttons", type: "checkbox", value: s.business.whatsappEnabled, hint: "Turn off if this number isn't registered on WhatsApp." },
              { name: "email", label: "Business email", type: "email", value: s.business.email },
              { name: "emailVerified", label: "Email address verified — show it on the website", type: "checkbox", value: s.business.emailVerified },
              { name: "streetAddress", label: "Street address", type: "text", value: s.business.streetAddress, required: true },
              { name: "suburb", label: "Suburb", type: "text", value: s.business.suburb, required: true },
              { name: "city", label: "City", type: "text", value: s.business.city, required: true },
              { name: "postalCode", label: "Postal code", type: "text", value: s.business.postalCode },
              { name: "hours", label: "Office hours", type: "textarea", value: s.business.hours, rows: 3, hint: "One line per day range, e.g. “Mon–Fri: 08:30–17:00”. Empty = hidden." },
              { name: "disclosures", label: "Footer disclosures", type: "textarea", value: s.business.disclosures, rows: 3, hint: "e.g. PPRA Fidelity Fund Certificate number and registration details." },
            ]}
          />
        </Group>
        <Group title="Social media" description="Only filled-in links are shown.">
          <AdminForm
            action={saveSettingsGroup.bind(null, "social")}
            fields={[
              { name: "facebook", label: "Facebook page URL", type: "url", value: s.social.facebook, placeholder: "https://www.facebook.com/…" },
              { name: "instagram", label: "Instagram URL", type: "url", value: s.social.instagram, placeholder: "https://www.instagram.com/…" },
              { name: "linkedin", label: "LinkedIn URL", type: "url", value: s.social.linkedin, placeholder: "https://www.linkedin.com/…" },
            ]}
          />
        </Group>
        <Group title="Listing visibility" description="Which listing statuses the public can see. Drafts and archived listings are never public.">
          <AdminForm
            action={saveSettingsGroup.bind(null, "visibility")}
            fields={[
              { name: "showUnderOffer", label: "Show listings that are under offer", type: "checkbox", value: s.visibility.showUnderOffer },
              { name: "showSold", label: "Show sold listings (and the “Recently sold” homepage section)", type: "checkbox", value: s.visibility.showSold, hint: "Only enable with the seller's permission." },
              { name: "showLet", label: "Show let rentals", type: "checkbox", value: s.visibility.showLet },
            ]}
          />
        </Group>
        <Group title="About page" description="The owner section appears on the About page once a name is entered.">
          <AdminForm
            action={saveSettingsGroup.bind(null, "about")}
            fields={[
              { name: "ownerName", label: "Owner / principal name", type: "text", value: s.about.ownerName },
              { name: "ownerRole", label: "Role", type: "text", value: s.about.ownerRole, placeholder: "e.g. Principal" },
              { name: "ownerBio", label: "Short biography", type: "textarea", value: s.about.ownerBio, rows: 5, hint: "Only include facts you can substantiate." },
              { name: "foundedYear", label: "Year founded", type: "number", value: s.about.foundedYear?.toString() ?? "" },
              { name: "areasServed", label: "Areas served", type: "textarea", value: s.about.areasServed.join("\n"), rows: 4, hint: "One per line. Shown on the homepage." },
            ]}
          />
        </Group>
        <Group title="Search engines" description="Default description used where a page doesn't have its own.">
          <AdminForm action={saveSettingsGroup.bind(null, "seo")} fields={[{ name: "defaultDescription", label: "Default meta description", type: "textarea", value: s.seo.defaultDescription, rows: 3, hint: "20–300 characters." }]} />
        </Group>
      </div>
    </div>
  );
}
