import type { OwnerListingSummary } from "@/lib/api/types";
import { ListingStatusBadge } from "./listing-status-badge";

/**
 * The status of one row (spec 0019, AC-2): only the label with its icon. The reason an admin gave
 * for hiding the listing, and the cause of a listing that guests cannot see, are read in "Xem chi
 * tiết" (`RowActions`), so no row grows taller than the others and no small note sits under it.
 */
export function RowStatus({
  listing,
}: {
  listing: Pick<OwnerListingSummary, "status" | "isPublic">;
}) {
  return (
    <ListingStatusBadge
      status={listing.status}
      isPublic={listing.isPublic}
      showReason={false}
    />
  );
}
