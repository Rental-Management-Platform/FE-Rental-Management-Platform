import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingState } from "@/components/states/loading-state";
import { NewListing } from "@/features/listing/components/new-listing";

// The route gate draws a loading state until the session is known, so the validator of instant
// navigation never sees this page and warns that the segment was dropped. A page behind a
// gate is not meant to be instant for a guest, so it opts out (Next.js docs, "instant").
export const instant = false;

export const metadata: Metadata = {
  title: "Đăng tin mới",
  robots: { index: false, follow: false },
};

export default function NewListingPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Đăng tin mới"
        description="Điền thông tin phòng cho thuê. Tin hiện ngay khi đăng, không có bước duyệt."
      />
      {/* `NewListing` reads `?propertyId=`, which a prerendered page cannot know: the part
          below the header waits in a Suspense boundary (Next.js docs, "useSearchParams"). */}
      <Suspense fallback={<LoadingState variant="form" fields={5} />}>
        <NewListing />
      </Suspense>
    </div>
  );
}
