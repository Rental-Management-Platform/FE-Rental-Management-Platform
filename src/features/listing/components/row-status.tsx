"use client";

import { useHoldBackCause } from "@/features/membership/hooks/use-hold-back-cause";
import type { OwnerListingSummary } from "@/lib/api/types";
import { ListingStatusBadge } from "./listing-status-badge";

/**
 * The status of one row (spec 0019, AC-2): the label with its icon, and for a listing an admin
 * hid, the reason the admin gave. The reason is the admin's own text, shown as it came. A listing
 * that guests cannot see names its cause from the shared membership (spec 0020, AC-10).
 */
export function RowStatus({
  listing,
}: {
  listing: Pick<
    OwnerListingSummary,
    "status" | "isPublic" | "moderationReason"
  >;
}) {
  const cause = useHoldBackCause();
  return (
    <div className="flex flex-col items-start gap-1">
      <ListingStatusBadge
        status={listing.status}
        isPublic={listing.isPublic}
        cause={cause}
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
