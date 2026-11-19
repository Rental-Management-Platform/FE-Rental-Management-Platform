import Link from "next/link";
import { StatBar } from "@/components/stats/stat-bar";
import { StatRow } from "@/components/stats/stat-row";
import { StatsZone } from "@/components/stats/stats-zone";
import { Button } from "@/components/ui/button";
import { MY_LISTINGS_PATH } from "@/features/listing/listing-filter";
import { StripAlert } from "@/features/membership/components/membership-strip";
import type { Statistics } from "@/lib/api/types";
import { formatCount } from "@/lib/format";
import {
  heldBackLabel,
  LISTINGS_ADMIN_LABEL,
  LISTINGS_OWNER_LABEL,
  LISTINGS_PUBLIC_LABEL,
  LISTINGS_ZONE_TITLE,
  listingsTotalLine,
  MANAGE_LISTINGS_LABEL,
} from "../landlord-stats-text";

/**
 * The zone "Tin đăng và gói" (spec 0024, AC-11): the plan strip, drawn from the membership of this
 * same answer, and the four parts the listings add up to, each with its count and a thin bar
 * against the largest of the four. All four rows are always drawn, and a zero is muted. These are
 * numbers of the moment, so none of them has an arrow.
 */
export function ListingsPlanZone({ statistics }: { statistics: Statistics }) {
  const { listings, membership } = statistics;
  const rows = [
    { label: LISTINGS_PUBLIC_LABEL, count: listings.public },
    { label: heldBackLabel(membership.state), count: listings.hiddenByQuota },
    { label: LISTINGS_OWNER_LABEL, count: listings.hiddenByOwner },
    { label: LISTINGS_ADMIN_LABEL, count: listings.hiddenByAdmin },
  ];
  const largest = Math.max(...rows.map((row) => row.count));

  return (
    <StatsZone title={LISTINGS_ZONE_TITLE}>
      <StripAlert membership={membership} />
      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <li key={row.label} className="flex flex-col gap-1.5">
            <StatRow
              label={row.label}
              value={formatCount(row.count)}
              muted={row.count === 0}
            />
            <StatBar value={row.count} largest={largest} />
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {listingsTotalLine(listings.total)}
        </p>
        <Button asChild variant="outline" className="max-md:h-11">
          <Link href={MY_LISTINGS_PATH}>{MANAGE_LISTINGS_LABEL}</Link>
        </Button>
      </div>
    </StatsZone>
  );
}
