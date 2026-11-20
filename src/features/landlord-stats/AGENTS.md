# src/features/landlord-stats

The landlord overview on `/landlord` ([spec 0024](../../../docs/specs/0024-landlord-statistics/index.md)): number cards for a range with the change against the period before, a four tab daily chart, and the state of the account now. It reads one `GET /me/statistics` and uses the shared pieces in `src/components/stats/` (see [its AGENTS.md](../../components/stats/AGENTS.md)).

## Where things live

- `api/landlord-stats.ts`: `landlordStatsKey` (`["landlord-stats"]`), `landlordStatsRangeKey`, `getLandlordStats` and `landlordStatsQuery`.
- `hooks/use-landlord-stats.ts`: the answer for the range in the address and the permission check (`statistic:read` or `statistic:manage`).
- `components/`: `LandlordStatsScreen`, `PeriodCards`, `DailyChartZone`, `TopListingsZone`, `ListingsPlanZone`, `RatingsZone`, `ChatZone`, `SpendingZone` and `StatsSkeleton`.
- `chart-metrics.ts`: the four tabs of the chart (views, saves, followers, conversations) in one table. `landlord-stats-text.ts`: the words.

## Rules

- One request per range, fresh for 60 seconds. A first 403 `PERMISSION_DENIED` asks the session for a new token (`refreshToken()` from `useSessionActions`) and reads once more, because a token issued before `statistic:read` was granted answers 403 until it is renewed. A second 403 is the forbidden state.
- A listing write or a plan purchase marks `landlordStatsKey` out of date (`src/features/listing/api/refresh-after-write.ts` and `src/features/order/hooks/use-pay-order.ts`). Do the same for any new write that changes a statistics number.
- The score of the landlord and the score of a room are shown apart and never added or averaged together. Money is a test payment.
- No arithmetic on the answer. Every total in a chart name is the `Metric` value, never a sum of the points.

_Drafted by /sync from the introducing change, worth a quick human pass._
