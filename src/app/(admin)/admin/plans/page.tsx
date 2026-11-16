import type { Metadata } from "next";
import { ADMIN_PLANS_TITLE } from "@/features/admin-plans/admin-plans-text";
import { AdminPlansPage } from "@/features/admin-plans/components/admin-plans-page";

// The route gate draws a loading state until the session is known, so the validator of instant
// navigation never sees this page and warns that the segment was dropped. A page behind a
// gate is not meant to be instant for a guest, so it opts out (Next.js docs, "instant").
export const instant = false;

export const metadata: Metadata = {
  title: ADMIN_PLANS_TITLE,
  robots: { index: false, follow: false },
};

// The page reads no address parameter, so it needs no `<Suspense>` boundary of its own.
export default function AdminPlansRoute() {
  return <AdminPlansPage />;
}
