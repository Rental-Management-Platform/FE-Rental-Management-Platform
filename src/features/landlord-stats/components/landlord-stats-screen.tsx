"use client";

import { HousePlusIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { RangeBar } from "@/components/stats/range-bar";
import { EmptyState } from "@/components/states/empty-state";
import { ForbiddenState } from "@/components/states/forbidden-state";
import { Button } from "@/components/ui/button";
import { NEW_LISTING_PATH } from "@/features/listing/listing-filter";
import { StripAlert } from "@/features/membership/components/membership-strip";
import { NEW_PROPERTY_PATH } from "@/features/property/property-list";
import type { Statistics } from "@/lib/api/types";
import { rangeHref, todayInVietnam, type DateRange } from "@/lib/date-range";
import { useSession } from "@/lib/session/auth-provider";
import { useLandlordStats } from "../hooks/use-landlord-stats";
import {
  ADD_PROPERTY_LABEL,
  EMPTY_DESCRIPTION,
  EMPTY_TITLE,
  FORBIDDEN_MESSAGE,
  PARTIAL_DAY_NOTE,
  periodCaption,
  POST_LISTING_LABEL,
  UPDATING_TEXT,
} from "../landlord-stats-text";
import { ChatZone } from "./chat-zone";
import { DailyChartZone } from "./daily-chart-zone";
import { ListingsPlanZone } from "./listings-plan-zone";
import { PeriodCards } from "./period-cards";
import { RatingsZone } from "./ratings-zone";
import { SpendingZone } from "./spending-zone";
import { LandlordStatsSkeleton, StatsBlocksSkeleton } from "./stats-skeleton";
import { StatsFailure } from "./stats-failure";
import { TopListingsZone } from "./top-listings-zone";

/**
 * The body of `/landlord` (spec 0024): the statistics of the landlord for a range kept in the
 * address. It runs in the browser behind the route gate of the landlord area, and draws only when
 * the session holds `statistic:read` or `statistic:manage`; with neither it says so and makes no
 * request. Its route keeps it inside a `<Suspense>` boundary, because the range is read with
 * `useSearchParams`.
 */
export function LandlordStatsScreen() {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { range, query, allowed } = useLandlordStats();

  // The route gate only shows its children to a signed in person, so this is a safety net.
  if (session.status !== "user") return <LandlordStatsSkeleton />;
  if (!allowed) {
    return <ForbiddenState message={FORBIDDEN_MESSAGE} level={2} />;
  }

  // A new range replaces the address and stays where the page is, so the screen reads again.
  const go = (next: DateRange | null) =>
    router.replace(rangeHref(pathname, next), { scroll: false });

  // The answer of the range before stays on screen while a new range loads. But once a range has
  // failed, "Thử lại" starts from the loading state (error to loading, spec 0024), so old numbers
  // never come back under the range that failed.
  const showAnswer =
    query.data !== undefined &&
    !(query.isPlaceholderData && query.errorUpdatedAt > 0);

  return (
    <div className="flex flex-col gap-6">
      <RangeBar range={range} onChange={go} />
      {showAnswer && query.data !== undefined ? (
        <StatsBody statistics={query.data} busy={query.isPlaceholderData} />
      ) : query.isError ? (
        <StatsFailure
          error={query.error}
          onRetry={() => void query.refetch()}
          onReset={() => go(null)}
          hasRange={range !== null}
        />
      ) : (
        <StatsBlocksSkeleton />
      )}
    </div>
  );
}

// What is drawn once an answer exists. `busy` is true only while the answer of the range before is
// the one kept on screen for a new range: the region says so and the status line is spoken. A read
// on window focus is silent.
function StatsBody({
  statistics,
  busy,
}: {
  statistics: Statistics;
  busy: boolean;
}) {
  const { period } = statistics;
  const endsToday = period.to === todayInVietnam(new Date());
  // A landlord with no listing is told what to do first, not shown a wall of zeros. A landlord
  // with a listing and a quiet range is not empty: the zones show their zeros.
  const empty = statistics.listings.total === 0;

  return (
    <div aria-busy={busy} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{periodCaption(period)}</p>
        {endsToday && (
          <p className="text-sm text-muted-foreground">{PARTIAL_DAY_NOTE}</p>
        )}
        <p
          role="status"
          className={busy ? "text-sm text-muted-foreground" : "sr-only"}
        >
          {busy ? UPDATING_TEXT : null}
        </p>
      </div>
      {empty ? (
        <>
          {/* The strip is drawn on its own: its usual place is a zone the empty state replaces. */}
          <StripAlert membership={statistics.membership} />
          <EmptyState
            icon={HousePlusIcon}
            title={EMPTY_TITLE}
            description={EMPTY_DESCRIPTION}
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild size="lg">
                  <Link href={NEW_PROPERTY_PATH}>{ADD_PROPERTY_LABEL}</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href={NEW_LISTING_PATH}>{POST_LISTING_LABEL}</Link>
                </Button>
              </div>
            }
          />
        </>
      ) : (
        <>
          <PeriodCards statistics={statistics} />
          <DailyChartZone statistics={statistics} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TopListingsZone top={statistics.views.top} />
            <ListingsPlanZone statistics={statistics} />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <RatingsZone statistics={statistics} />
            <ChatZone statistics={statistics} />
          </div>
          <SpendingZone statistics={statistics} />
        </>
      )}
    </div>
  );
}
