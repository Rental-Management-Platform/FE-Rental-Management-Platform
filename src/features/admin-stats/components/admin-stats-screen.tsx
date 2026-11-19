"use client";

import { RangeBar } from "@/components/stats/range-bar";
import { StatsFailure } from "@/components/stats/stats-failure";
import { UPDATING_TEXT } from "@/components/stats/stats-text";
import { ForbiddenState } from "@/components/states/forbidden-state";
import type { AdminOverview } from "@/lib/api/types";
import { useSession } from "@/lib/session/auth-provider";
import type { SessionState } from "@/lib/session/create-session";
import { ERROR_TITLE, FORBIDDEN_MESSAGE } from "../admin-stats-text";
import { useAdminStats } from "../hooks/use-admin-stats";
import {
  AboveBarSkeleton,
  AdminStatsSkeleton,
  BelowBarSkeleton,
} from "./admin-stats-skeleton";
import { DailyChartZone } from "./daily-chart-zone";
import { PeriodCards } from "./period-cards";
import { ToHandleStrip } from "./to-handle-strip";

/**
 * The body of `/admin` (spec 0025): the overview of the platform for a range kept in the address.
 * It runs in the browser behind the route gate of the admin area, and draws only when the session
 * holds `statistic:report` or `statistic:manage`; with neither it says so and makes no request.
 * Its route keeps it inside a `<Suspense>` boundary, because the range is read with
 * `useSearchParams`.
 *
 * What ignores the range (the strip and the state zones) sits above the range bar and what follows
 * it sits below. When a range fails, the part below becomes one failure state and the part above
 * stays from the answer read before.
 */
export function AdminStatsScreen() {
  const session = useSession();
  const { range, setRange, query, allowed, shown, kept, busy } =
    useAdminStats();

  // The route gate only shows its children to a signed in person, so this is a safety net.
  if (session.status !== "user") return <AdminStatsSkeleton />;
  if (!allowed) {
    return <ForbiddenState message={FORBIDDEN_MESSAGE} level={2} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {kept !== undefined ? (
        <div aria-busy={busy}>
          <AboveBar overview={kept} session={session} />
        </div>
      ) : query.isError ? null : (
        <AboveBarSkeleton />
      )}
      <RangeBar range={range} onChange={setRange} />
      {shown !== undefined ? (
        <BelowBar overview={shown} busy={busy} />
      ) : query.isError ? (
        <StatsFailure
          error={query.error}
          onRetry={() => void query.refetch()}
          onReset={() => setRange(null)}
          hasRange={range !== null}
          title={ERROR_TITLE}
          forbiddenMessage={FORBIDDEN_MESSAGE}
        />
      ) : (
        <BelowBarSkeleton />
      )}
    </div>
  );
}

// Numbers of the moment: they have no arrow and do not change with the range.
function AboveBar({
  overview,
  session,
}: {
  overview: AdminOverview;
  session: SessionState;
}) {
  return (
    <div className="flex flex-col gap-6">
      <ToHandleStrip toHandle={overview.toHandle} session={session} />
    </div>
  );
}

// What follows the range. `busy` is true while a read runs and this answer is the one drawn (a new
// range, or an entry a write marked out of date): the region says so and the status line is spoken.
function BelowBar({
  overview,
  busy,
}: {
  overview: AdminOverview;
  busy: boolean;
}) {
  return (
    <div aria-busy={busy} className="flex flex-col gap-6">
      <p
        role="status"
        className={busy ? "text-sm text-muted-foreground" : "sr-only"}
      >
        {busy ? UPDATING_TEXT : null}
      </p>
      <PeriodCards overview={overview} />
      <DailyChartZone overview={overview} />
    </div>
  );
}
