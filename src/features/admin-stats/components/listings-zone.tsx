import { StatsZone } from "@/components/stats/stats-zone";
import type { AdminOverview } from "@/lib/api/types";
import {
  LISTING_ADMIN_HIDDEN_LABEL,
  LISTING_NOT_PUBLIC_LABEL,
  LISTING_NOT_PUBLIC_NOTE,
  LISTING_OWNER_HIDDEN_LABEL,
  LISTING_PUBLIC_LABEL,
  LISTINGS_ZONE_TITLE,
  listingsTotalLine,
} from "../admin-stats-text";
import { BarRows } from "./bar-rows";

/**
 * The zone "Tin đăng" (spec 0025, AC-8): the listings by state, each with a bar against the largest
 * of the four, and the total. All four rows are always drawn. "Hiện nhưng khách không thấy" says why
 * a visible listing can still be out of sight. Numbers of the moment: no arrow, and they do not
 * change with the range.
 */
export function ListingsZone({
  listings,
}: {
  listings: AdminOverview["listings"];
}) {
  return (
    <StatsZone title={LISTINGS_ZONE_TITLE}>
      <BarRows
        rows={[
          { label: LISTING_PUBLIC_LABEL, count: listings.public },
          {
            label: LISTING_NOT_PUBLIC_LABEL,
            count: listings.visibleButNotPublic,
            note: LISTING_NOT_PUBLIC_NOTE,
          },
          { label: LISTING_OWNER_HIDDEN_LABEL, count: listings.hiddenByOwner },
          { label: LISTING_ADMIN_HIDDEN_LABEL, count: listings.hiddenByAdmin },
        ]}
      />
      <p className="text-sm text-muted-foreground">
        {listingsTotalLine(listings.total)}
      </p>
    </StatsZone>
  );
}
