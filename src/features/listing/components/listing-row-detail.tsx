"use client";

import {
  DetailItem,
  DetailList,
  RowDetail,
} from "@/components/detail/row-detail";
import { useHoldBackCause } from "@/features/membership/hooks/use-hold-back-cause";
import type { OwnerListingSummary } from "@/lib/api/types";
import {
  formatArea,
  formatCount,
  formatDateTime,
  formatMoney,
} from "@/lib/format";
import { ListingStatusBadge } from "./listing-status-badge";

const DETAIL_TITLE = "Chi tiết tin";
const NO_REASON = "Không có lý do";
const CONTACT_ADMIN = "Liên hệ quản trị viên để tin được hiện lại.";

/**
 * "Xem chi tiết" of one of my listings (spec 0019): everything the row leaves out. A listing an
 * admin hid shows the reason the admin gave, as the admin's own text with its line breaks, and says
 * how to get it back, because the owner cannot show it again. A listing that guests cannot see names
 * its cause from the shared membership (spec 0020, AC-10).
 */
export function ListingRowDetail({
  listing,
  size,
}: {
  listing: OwnerListingSummary;
  size: "sm" | "lg";
}) {
  const cause = useHoldBackCause();
  const hiddenByAdmin = listing.status === "hidden_by_admin";
  return (
    <RowDetail
      name={`tin ${listing.title}`}
      title={DETAIL_TITLE}
      size={size}
      iconOnly
    >
      <DetailList>
        <DetailItem label="Tin">{listing.title}</DetailItem>
        <DetailItem label="Địa chỉ">{listing.fullAddress}</DetailItem>
        <DetailItem label="Giá thuê">{formatMoney(listing.price)}</DetailItem>
        <DetailItem label="Diện tích">{formatArea(listing.areaM2)}</DetailItem>
        <DetailItem label="Lượt xem">
          {formatCount(listing.viewCount)}
        </DetailItem>
        <DetailItem label="Ngày đăng">
          {formatDateTime(listing.createdAt)}
        </DetailItem>
        <DetailItem label="Trạng thái">
          <ListingStatusBadge
            status={listing.status}
            isPublic={listing.isPublic}
            cause={cause}
          />
        </DetailItem>
        {hiddenByAdmin && (
          <>
            <DetailItem label="Lý do quản trị viên ẩn tin">
              {listing.moderationReason ?? NO_REASON}
            </DetailItem>
            <DetailItem label="Hiện lại tin">{CONTACT_ADMIN}</DetailItem>
          </>
        )}
      </DetailList>
    </RowDetail>
  );
}
