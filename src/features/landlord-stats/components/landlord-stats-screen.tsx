"use client";

import { usePathname, useRouter } from "next/navigation";
import { RangeBar } from "@/components/stats/range-bar";
import { ErrorState } from "@/components/states/error-state";
import { ForbiddenState } from "@/components/states/forbidden-state";
import type { Statistics } from "@/lib/api/types";
import { rangeHref, todayInVietnam, type DateRange } from "@/lib/date-range";
import { useSession } from "@/lib/session/auth-provider";
import { useLandlordStats } from "../hooks/use-landlord-stats";
import {
  FORBIDDEN_MESSAGE,
  PARTIAL_DAY_NOTE,
  periodCaption,
  UPDATING_TEXT,
} from "../landlord-stats-text";
import { DailyChartZone } from "./daily-chart-zone";
import { PeriodCards } from "./period-cards";
import { LandlordStatsSkeleton } from "./stats-skeleton";

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
  if (!allowed) return <ForbiddenState message={FORBIDDEN_MESSAGE} />;

  // A new range replaces the address and stays where the page is, so the screen reads again.
  const go = (next: DateRange | null) =>
    router.replace(rangeHref(pathname, next), { scroll: false });

  return (
    <div className="flex flex-col gap-6">
      <RangeBar range={range} onChange={go} />
      {query.data !== undefined ? (
        <StatsBody statistics={query.data} busy={query.isPlaceholderData} />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <LandlordStatsSkeleton />
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
      <PeriodCards statistics={statistics} />
      <DailyChartZone statistics={statistics} />
    </div>
  );
}
