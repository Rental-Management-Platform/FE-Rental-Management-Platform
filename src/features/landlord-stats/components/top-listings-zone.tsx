import Link from "next/link";
import { StatBar } from "@/components/stats/stat-bar";
import { StatsZone } from "@/components/stats/stats-zone";
import { Badge } from "@/components/ui/badge";
import type { StatisticsTopListing } from "@/lib/api/types";
import { FOCUS_RING } from "@/lib/focus-ring";
import { formatCount } from "@/lib/format";
import { editListingHref } from "@/features/listing/listing-filter";
import {
  topListingBadge,
  TOP_LISTINGS_EMPTY,
  TOP_LISTINGS_TITLE,
  totalLine,
} from "../landlord-stats-text";

/**
 * The zone "Tin xem nhiều nhất" (spec 0024, AC-10): up to five listings in the order the API
 * gives, each a link to its edit page with its views in the range, a bar that compares it with
 * the largest row, and the views since the start. No total of the rows is shown, because it can
 * be smaller than the views number (a deleted listing has views but is never in the list).
 */
export function TopListingsZone({ top }: { top: StatisticsTopListing[] }) {
  const largest = Math.max(0, ...top.map((listing) => listing.viewsInRange));

  return (
    <StatsZone title={TOP_LISTINGS_TITLE}>
      {top.length === 0 ? (
        <p className="text-sm text-muted-foreground">{TOP_LISTINGS_EMPTY}</p>
      ) : (
        <ol className="flex flex-col">
          {top.map((listing, index) => {
            const badge = topListingBadge(listing);
            return (
              <li
                key={listing.id}
                className="flex flex-col gap-2 border-b py-3 first:pt-0 last:border-b-0 last:pb-0"
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="w-5 shrink-0 text-sm text-muted-foreground tabular-nums"
                  >
                    {index + 1}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={editListingHref(listing.id)}
                        className={`${FOCUS_RING} min-w-0 rounded-sm font-medium break-words text-primary underline-offset-4 hover:underline`}
                      >
                        {listing.title}
                      </Link>
                      {badge !== null && (
                        <Badge variant="outline">{badge}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {totalLine(formatCount(listing.viewsAllTime))}
                    </p>
                  </div>
                  <p className="shrink-0 text-right text-sm text-muted-foreground">
                    <span className="text-base font-semibold text-card-foreground tabular-nums">
                      {formatCount(listing.viewsInRange)}
                    </span>{" "}
                    lượt xem
                  </p>
                </div>
                <StatBar
                  value={listing.viewsInRange}
                  largest={largest}
                  className="ml-8"
                />
              </li>
            );
          })}
        </ol>
      )}
    </StatsZone>
  );
}
