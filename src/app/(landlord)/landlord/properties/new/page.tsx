import type { Metadata } from "next";
import { BreadcrumbTrail } from "@/components/layout/breadcrumb-trail";
import { PageHeader } from "@/components/layout/page-header";
import { PropertyCreate } from "@/features/property/components/property-create";
import { MY_PROPERTIES_PATH } from "@/features/property/property-list";

// The route gate draws a loading state until the session is known, so the validator of instant
// navigation never sees this page and warns that the segment was dropped. A page behind a
// gate is not meant to be instant for a guest, so it opts out (Next.js docs, "instant").
export const instant = false;

export const metadata: Metadata = {
  title: "Thêm nhà trọ",
  robots: { index: false, follow: false },
};

export default function NewPropertyPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={
          <BreadcrumbTrail
            parent={{ label: "Nhà trọ của tôi", href: MY_PROPERTIES_PATH }}
            current="Thêm nhà trọ"
          />
        }
        title="Thêm nhà trọ"
        description="Nhà trọ giữ địa chỉ của các phòng bạn cho thuê. Tạo một lần, rồi đăng nhiều tin vào đó."
      />
      <PropertyCreate />
    </div>
  );
}
