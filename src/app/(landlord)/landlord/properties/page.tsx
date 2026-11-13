import type { Metadata } from "next";
import { Suspense } from "react";
import {
  MyProperties,
  MyPropertiesSkeleton,
} from "@/features/property/components/my-properties";

// The route gate draws a loading state until the session is known, so the validator of instant
// navigation never sees this page and warns that the segment was dropped. A page behind a
// gate is not meant to be instant for a guest, so it opts out (Next.js docs, "instant").
export const instant = false;

export const metadata: Metadata = {
  title: "Nhà trọ của tôi",
  robots: { index: false, follow: false },
};

export default function MyPropertiesPage() {
  // `MyProperties` reads `useSearchParams` (the page), which needs a boundary.
  return (
    <Suspense fallback={<MyPropertiesSkeleton />}>
      <MyProperties />
    </Suspense>
  );
}
