import type { Metadata } from "next";
import { Suspense } from "react";
import {
  OrdersPage,
  OrdersSkeleton,
} from "@/features/order/components/orders-page";
import { ORDERS_CRUMB } from "@/features/order/order-text";

// The route gate draws a loading state until the session is known, so the validator of instant
// navigation never sees this page and warns that the segment was dropped. A page behind a
// gate is not meant to be instant for a guest, so it opts out (Next.js docs, "instant").
export const instant = false;

export const metadata: Metadata = {
  title: ORDERS_CRUMB,
  robots: { index: false, follow: false },
};

export default function OrdersRoute() {
  // `OrdersPage` reads `useSearchParams` (the filter and the page), which needs a boundary.
  return (
    <Suspense fallback={<OrdersSkeleton />}>
      <OrdersPage />
    </Suspense>
  );
}
