import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { GateCheck } from "@/features/auth/components/gate-check";

// The route gate draws a loading state until the session is known, so the validator of instant
// navigation never sees this page and warns that the segment was dropped. A page behind a
// gate is not meant to be instant for a guest, so it opts out (Next.js docs, "instant").
export const instant = false;

export const metadata: Metadata = {
  title: "Thử cổng khu quản trị",
  robots: { index: false, follow: false },
};

// A fixture for the route gate of the admin area (spec 0005, AC-9), for developers only. In a
// production build the page answers with the not found state. The status line stays 200, since
// the gate draws no children on the server, so a `notFound()` here never sets the status. #20
// deletes this page once a real admin page exists.
export default function AdminGateCheckPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Thử cổng khu quản trị"
        description="Chỉ quản trị viên đã đăng nhập mới thấy trang này."
      />
      <GateCheck area="khu quản trị" />
    </div>
  );
}
