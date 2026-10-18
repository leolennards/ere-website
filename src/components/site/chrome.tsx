import { Suspense } from "react";
import { getSiteSettings } from "@/lib/server/site";
import { DEFAULT_SETTINGS, publicContact } from "@/lib/settings";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

const fallbackContact = publicContact(DEFAULT_SETTINGS);

async function headerContact() {
  const c = publicContact(await getSiteSettings());
  return { phoneDisplay: c.phoneDisplay, phoneE164: c.phoneE164, whatsappE164: c.whatsappE164 };
}

async function FooterFromSettings() {
  const c = publicContact(await getSiteSettings());
  return <SiteFooter contact={c} year={new Date().getFullYear()} />;
}

/** Header/footer render instantly with verified defaults, then reflect Admin → Settings. The header itself never remounts. */
export function Header() {
  return <SiteHeader contact={headerContact()} fallback={fallbackContact} />;
}

export function Footer() {
  return (
    <Suspense fallback={<SiteFooter contact={fallbackContact} />}>
      <FooterFromSettings />
    </Suspense>
  );
}
