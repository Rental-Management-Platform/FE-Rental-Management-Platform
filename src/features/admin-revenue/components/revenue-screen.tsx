"use client";

import { RangeBar } from "@/components/stats/range-bar";
import { StatsFailure } from "@/components/stats/stats-failure";
import { UPDATING_TEXT } from "@/components/stats/stats-text";
import { ForbiddenState } from "@/components/states/forbidden-state";
import { useSession } from "@/lib/session/auth-provider";
import { useAdminRevenue } from "../hooks/use-admin-revenue";
import { ERROR_TITLE, FORBIDDEN_MESSAGE } from "../revenue-text";
import type { ShownRevenue } from "../revenue-view";
import { RevenueChartZone } from "./revenue-chart-zone";
import { RevenueScreenSkeleton, RevenueSkeleton } from "./revenue-skeleton";
import { RevenueTotals } from "./revenue-totals";

/**
 * The body of `/admin/revenue` (spec 0026): the money of paid orders for a range kept in the
 * address. It runs in the browser behind the route gate of the admin area, and draws only when the
 * session holds `order:report`; without it the page says so and makes no request. Its route keeps
 * it inside a `<Suspense>` boundary, because the range is read with `useSearchParams`.
 *
 * The range bar stays usable in every case. When a view fails, everything under it becomes one
 * failure state, so no old numbers stay under a new view.
 */
export function RevenueScreen() {
  const session = useSession();
  const { range, setRange, query, allowed, shown, busy } = useAdminRevenue();

  // The route gate only shows its children to a signed in person, so this is a safety net.
  if (session.status !== "user") return <RevenueScreenSkeleton />;
  if (!allowed) {
    return <ForbiddenState message={FORBIDDEN_MESSAGE} level={2} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <RangeBar range={range} onChange={setRange} />
      {shown !== undefined ? (
        <RevenueBody shown={shown} busy={busy} />
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
        <RevenueSkeleton />
      )}
    </div>
  );
}

// What follows the range bar. `busy` is true while a read runs and this answer is the one drawn (a
// new view, or a return to the tab after the answer went stale): the region says so and the status
// line is spoken.
function RevenueBody({ shown, busy }: { shown: ShownRevenue; busy: boolean }) {
  return (
    <div aria-busy={busy} className="flex flex-col gap-6">
      <p
        role="status"
        className={busy ? "text-sm text-muted-foreground" : "sr-only"}
      >
        {busy ? UPDATING_TEXT : null}
      </p>
      <RevenueTotals answer={shown.answer} />
      <RevenueChartZone shown={shown} />
    </div>
  );
}
