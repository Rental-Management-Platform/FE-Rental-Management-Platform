import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { LandlordDashboard } from "@/features/dashboard/components/landlord-dashboard";

// The route gate draws a loading state until the session is known, so the validator of instant
// navigation never sees this page and warns that the segment was dropped. A page behind a
// gate is not meant to be instant for a guest, so it opts out (Next.js docs, "instant").
export const instant = false;

export const metadata: Metadata = {
  title: "Tổng quan khu chủ trọ",
  robots: { index: false, follow: false },
};

export default function LandlordDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tổng quan"
        description="Mọi công cụ quản lý nhà trọ và tin đăng của bạn ở một chỗ."
      />
      <LandlordDashboard />
    </div>
  );
}
