import type { Metadata } from "next";
import { Suspense } from "react";
import { ADMIN_REVIEWS_TITLE } from "@/features/admin-reviews/admin-reviews-text";
import {
  AdminReviewsPage,
  AdminReviewsSkeleton,
} from "@/features/admin-reviews/components/admin-reviews-page";

// The route gate draws a loading state until the session is known, so the validator of instant
// navigation never sees this page and warns that the segment was dropped. A page behind a
// gate is not meant to be instant for a guest, so it opts out (Next.js docs, "instant").
export const instant = false;

export const metadata: Metadata = {
  title: ADMIN_REVIEWS_TITLE,
  robots: { index: false, follow: false },
};

export default function AdminReviewsRoute() {
  // `AdminReviewsPage` reads `useSearchParams` (the tab, the page and the filters), which needs a
  // boundary.
  return (
    <Suspense fallback={<AdminReviewsSkeleton />}>
      <AdminReviewsPage />
    </Suspense>
  );
}
