import { EyeIcon, EyeOffIcon } from "lucide-react";
import {
  DetailItem,
  DetailList,
  RowDetail,
} from "@/components/detail/row-detail";
import { Button } from "@/components/ui/button";
import type { ModerationListing } from "@/lib/api/types";
import { formatDateTime, formatMoney } from "@/lib/format";
import {
  ADDRESS_LABEL,
  COLUMN_CREATED,
  COLUMN_LANDLORD,
  COLUMN_LISTING,
  COLUMN_PRICE,
  COLUMN_STATUS,
  DETAIL_TITLE,
  HIDE_BUTTON,
  MODERATION_REASON_LABEL,
  NO_NAME,
  NO_REASON,
  UNHIDE_BUTTON,
  hideButtonName,
  unhideButtonName,
} from "../admin-listings-text";
import { moderationActionOf } from "../moderation-rule";
import { ModerationStatus } from "./moderation-status";

/**
 * "Xem chi tiết" of one listing: everything the row leaves out. The reason an admin gave when
 * hiding is the text an admin typed, so it is shown as plain text with its line breaks. The reason
 * is only set while the status is `hidden_by_admin` (api 6.29), so it is never shown for another
 * status.
 */
function ListingDetail({
  listing,
  size,
}: {
  listing: ModerationListing;
  size: "sm" | "lg";
}) {
  return (
    <RowDetail name={listing.title} title={DETAIL_TITLE} size={size}>
      <DetailList>
        <DetailItem label={COLUMN_LISTING}>{listing.title}</DetailItem>
        <DetailItem label={ADDRESS_LABEL}>{listing.fullAddress}</DetailItem>
        <DetailItem label={COLUMN_LANDLORD}>
          {listing.landlord.name?.trim() || NO_NAME}
        </DetailItem>
        <DetailItem label={COLUMN_PRICE}>
          {formatMoney(listing.price)}
        </DetailItem>
        <DetailItem label={COLUMN_CREATED}>
          {formatDateTime(listing.createdAt)}
        </DetailItem>
        <DetailItem label={COLUMN_STATUS}>
          <ModerationStatus listing={listing} />
        </DetailItem>
        {listing.status === "hidden_by_admin" && (
          <DetailItem label={MODERATION_REASON_LABEL}>
            {listing.moderationReason ?? NO_REASON}
          </DetailItem>
        )}
      </DetailList>
    </RowDetail>
  );
}

/**
 * The buttons of one row, as `moderationActionOf` decided them: "Ẩn" for a listing that shows or
 * that the landlord hid, "Gỡ ẩn" for one an admin hid, then "Xem chi tiết". The names carry the
 * title of the row, so a screen reader that lists the buttons of the page can tell them apart.
 * `data-moderation-actions` is how a dialog finds the button of the same row to give focus back to
 * when the one that opened it is gone.
 */
export function ModerationRowActions({
  listing,
  size,
  onHide,
  onUnhide,
}: {
  listing: ModerationListing;
  /** 32 px in the table, 44 px in the blocks. */
  size: "sm" | "lg";
  onHide: (listing: ModerationListing) => void;
  onUnhide: (listing: ModerationListing) => void;
}) {
  const unhide = moderationActionOf(listing.status) === "unhide";
  return (
    <div
      data-moderation-actions={listing.id}
      className="flex flex-wrap items-center gap-2"
    >
      <Button
        type="button"
        variant="outline"
        size={size}
        aria-label={
          unhide
            ? unhideButtonName(listing.title)
            : hideButtonName(listing.title)
        }
        onClick={() => (unhide ? onUnhide(listing) : onHide(listing))}
      >
        {unhide ? (
          <EyeIcon data-icon="inline-start" aria-hidden="true" />
        ) : (
          <EyeOffIcon data-icon="inline-start" aria-hidden="true" />
        )}
        {unhide ? UNHIDE_BUTTON : HIDE_BUTTON}
      </Button>
      <ListingDetail listing={listing} size={size} />
    </div>
  );
}
