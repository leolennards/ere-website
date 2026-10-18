import { notFound } from "next/navigation";
import Link from "next/link";
import { PropertyDetail } from "@/components/property/property-detail";
import { requireAdmin } from "@/lib/auth/session";
import { getPropertyDetailById } from "@/lib/data/properties";
import { getDb } from "@/lib/db";
import { getSiteSettings } from "@/lib/server/site";
import { publicContact } from "@/lib/settings";

export const metadata = { title: "Preview" };
export const instant = false;

export default async function PreviewProperty({ params }: PageProps<"/admin/properties/[id]/preview">) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const p = await getPropertyDetailById(getDb(), id);
  if (!p) notFound();
  return (
    <div className="-mx-4 -my-8 bg-bone sm:-mx-8 lg:-mx-10 lg:-my-10">
      <div className="sticky top-0 z-20 flex items-center justify-between bg-warning-wash px-4 py-2 text-sm text-warning">
        <span>Preview of how the listing page looks</span>
        <Link href={`/admin/properties/${id}`} className="link">Back to editing</Link>
      </div>
      <div className="-mt-20">
        <PropertyDetail p={p} contact={publicContact(await getSiteSettings())} preview />
      </div>
    </div>
  );
}
