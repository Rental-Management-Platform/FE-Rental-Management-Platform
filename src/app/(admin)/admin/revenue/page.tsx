import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { RevenueScreen } from "@/features/admin-revenue/components/revenue-screen";
import { RevenueScreenSkeleton } from "@/features/admin-revenue/components/revenue-skeleton";
import {
  REVENUE_DESCRIPTION,
  REVENUE_TITLE,
} from "@/features/admin-revenue/revenue-text";

// The route gate draws a loading state until the session is known, so the validator of instant
// navigation never sees this page and warns that the segment was dropped. A page behind a
// gate is not meant to be instant for a guest, so it opts out (Next.js docs, "instant").
export const instant = false;

export const metadata: Metadata = {
  title: REVENUE_TITLE,
  robots: { index: false, follow: false },
};

export default function AdminRevenuePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={REVENUE_TITLE} description={REVENUE_DESCRIPTION} />
      {/* The screen reads the range with `useSearchParams`, which needs a boundary. */}
      <Suspense fallback={<RevenueScreenSkeleton />}>
        <RevenueScreen />
      </Suspense>
    </div>
  );
}
