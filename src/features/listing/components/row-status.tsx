import type { OwnerListingSummary } from "@/lib/api/types";
import { ListingStatusBadge } from "./listing-status-badge";

/**
 * The status of one row (spec 0019, AC-2): the label with its icon, and for a listing an admin
 * hid, the reason the admin gave. The reason is the admin's own text, shown as it came.
 */
export function RowStatus({
  listing,
}: {
  listing: Pick<
    OwnerListingSummary,
    "status" | "isPublic" | "moderationReason"
  >;
}) {
  return (
    <div className="flex flex-col items-start gap-1">
      <ListingStatusBadge
        status={listing.status}
        isPublic={listing.isPublic}
        compact
      />
      {listing.status === "hidden_by_admin" &&
        listing.moderationReason !== null && (
          <p className="max-w-56 text-sm whitespace-normal">
            Lý do: {listing.moderationReason}
          </p>
        )}
    </div>
  );
}
