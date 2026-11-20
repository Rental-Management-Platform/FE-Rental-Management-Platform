# src/features/admin-stats

The admin overview on `/admin` ([spec 0025](../../../docs/specs/0025-admin-overview-statistics/index.md)): the state of the platform now above the range bar, and the numbers of the range below it. It reads one `GET /statistics/overview` and uses the shared pieces in `src/components/stats/` (see [its AGENTS.md](../../components/stats/AGENTS.md)).

## Where things live

- `api/admin-stats.ts`: `adminStatsKey` (`["admin-stats"]`), `adminStatsRangeKey`, `getAdminStats` and `adminStatsQuery`.
- `hooks/use-admin-stats.ts`: the answer for the range in the address and the permission check (`statistic:report` or `statistic:manage`). It also returns `shown` (what to draw under the bar), `kept` (what stays above the bar when a range fails) and `busy`.
- `components/`: `AdminStatsScreen` and one file per block: `ToHandleStrip`, `AccountsZone`, `LandlordsZone`, `ListingsZone`, `PeriodCards`, `DailyChartZone`, `WardsZone` and `AdminStatsSkeleton`. `BarRows` draws the rows with bars.
- `admin-chart-metrics.ts`: the six tabs of the daily chart, each with its one or two lines, series field, `Metric` and unit word. The chart, the legend, the table and the accessible name all read it, so they cannot disagree.
- `to-handle.ts` (`toHandleRows`, the rows of "Cần xử lý" with their filtered links), `ward-rows.ts` (`splitWards`, `largestCount`) and `admin-stats-text.ts` (the words): pure, no React and no network.

## Rules

- One request per range, fresh for 5 minutes, no read on window focus, because the server needs about 3 seconds. The query keeps the project retry default: a plain 500 is not retried, a network error and a 502, 503 or 504 are, once.
- An admin lock, unlock, hide or unhide marks `adminStatsKey` out of date (`use-lock-flow.ts`, `use-moderation-flow.ts`, `use-review-moderation.ts`), and the overview reads again when the admin opens `/admin`. Do the same for any new write that changes an overview number.
- What ignores the range (the strip and the three state zones) sits above `RangeBar`, and what follows it sits below. When a range fails, the part below becomes one failure state and the part above stays from the kept answer.
- A strip row is a link only when the session holds the permission of the matching `ADMIN_TOOLS` entry (`moderation` or `reviews`), read from that entry and not typed again.
- These counts include hidden rows and locked accounts, so never set them beside a landlord's own numbers as one figure. The page shows no money until #26.
- No arithmetic on the answer: never add the two lines of a tab, the two review cards or the ward rows.

_Drafted by /sync from the introducing change, worth a quick human pass._
