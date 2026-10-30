import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/states/loading-state";
import { EditListing } from "@/features/listing/components/edit-listing";

// The route gate draws a loading state until the session is known, so the validator of instant
// navigation never sees this page and warns that the segment was dropped. A page behind a
// gate is not meant to be instant for a guest, so it opts out (Next.js docs, "instant").
export const instant = false;

export const metadata: Metadata = {
  title: "Sửa tin",
  robots: { index: false, follow: false },
};

export default function EditListingPage() {
  // `EditListing` reads the id with `useParams`, which suspends under Cache Components when the
  // id is not known at build time (Next.js docs, "useParams"). It draws the page header itself,
  // because the status label needs the loaded listing, so the fallback is only the skeleton.
  return (
    <Suspense fallback={<LoadingState variant="form" fields={5} />}>
      <EditListing />
    </Suspense>
  );
}
