import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderPage } from "@/features/order/components/order-page";
import { OrderSkeleton } from "@/features/order/components/order-skeleton";
import { ORDER_PAGE_TITLE } from "@/features/order/order-text";

// The route gate draws a loading state until the session is known, so the validator of instant
// navigation never sees this page and warns that the segment was dropped. A page behind a
// gate is not meant to be instant for a guest, so it opts out (Next.js docs, "instant").
export const instant = false;

export const metadata: Metadata = {
  title: ORDER_PAGE_TITLE,
  robots: { index: false, follow: false },
};

export default function OrderRoute() {
  // `OrderPage` reads the id with `useParams`, which suspends under Cache Components when the id
  // is not known at build time (Next.js docs, "useParams"). It draws the page header itself,
  // because the title follows the status of the loaded order, so the fallback is the skeleton.
  return (
    <Suspense fallback={<OrderSkeleton />}>
      <OrderPage />
    </Suspense>
  );
}
