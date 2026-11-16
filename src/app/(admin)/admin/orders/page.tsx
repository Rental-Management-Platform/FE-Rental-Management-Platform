import type { Metadata } from "next";
import { Suspense } from "react";
import { ADMIN_ORDERS_TITLE } from "@/features/admin-orders/admin-orders-text";
import {
  AdminOrdersPage,
  AdminOrdersSkeleton,
} from "@/features/admin-orders/components/admin-orders-page";

// The route gate draws a loading state until the session is known, so the validator of instant
// navigation never sees this page and warns that the segment was dropped. A page behind a
// gate is not meant to be instant for a guest, so it opts out (Next.js docs, "instant").
export const instant = false;

export const metadata: Metadata = {
  title: ADMIN_ORDERS_TITLE,
  robots: { index: false, follow: false },
};

export default function AdminOrdersRoute() {
  // `AdminOrdersPage` reads `useSearchParams` (the filters and the page), which needs a boundary.
  return (
    <Suspense fallback={<AdminOrdersSkeleton />}>
      <AdminOrdersPage />
    </Suspense>
  );
}
