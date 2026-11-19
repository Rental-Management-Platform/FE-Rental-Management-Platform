import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { AdminStatsScreen } from "@/features/admin-stats/components/admin-stats-screen";
import { AdminStatsSkeleton } from "@/features/admin-stats/components/admin-stats-skeleton";
import {
  STATS_DESCRIPTION,
  STATS_TITLE,
} from "@/features/admin-stats/admin-stats-text";

// The route gate draws a loading state until the session is known, so the validator of instant
// navigation never sees this page and warns that the segment was dropped. A page behind a
// gate is not meant to be instant for a guest, so it opts out (Next.js docs, "instant").
export const instant = false;

export const metadata: Metadata = {
  title: "Tổng quan quản trị",
  robots: { index: false, follow: false },
};

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={STATS_TITLE} description={STATS_DESCRIPTION} />
      {/* The screen reads the range with `useSearchParams`, which needs a boundary. */}
      <Suspense fallback={<AdminStatsSkeleton />}>
        <AdminStatsScreen />
      </Suspense>
    </div>
  );
}
