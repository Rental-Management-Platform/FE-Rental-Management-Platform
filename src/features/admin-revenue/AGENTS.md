# src/features/admin-revenue

The revenue page on `/admin/revenue` ([spec 0026](../../../docs/specs/0026-revenue-statistics/index.md)): the money of paid orders for a range and a grouping kept in the address, shown as two total cards, a chart by day or by month with a text table, and a list by plan. It reads one `GET /orders/revenue` and uses the shared pieces in `src/components/stats/` (see [its AGENTS.md](../../components/stats/AGENTS.md)).

## Where things live

- `admin-revenue-path.ts`: `ADMIN_REVENUE_PATH`, the one address of the page. The "Doanh thu" tool of `src/components/shells/workspace-tools.ts` and any link use it.
- `api/admin-revenue.ts`: `adminRevenueKey` (`["admin-revenue"]`), `adminRevenueRangeKey`, `getAdminRevenue` and `adminRevenueQuery`.
- `hooks/use-admin-revenue.ts`: the view in the address (the range through `useRangeInAddress`, the grouping through `parseGroupBy`), the answer for it and the permission check (`order:report`). `setRange` and `setGroupBy` each keep the other part of the view. It also returns `shown` (the answer with the view it is the answer of) and `busy`.
- `revenue-view.ts` (`parseGroupBy`, `effectiveRange`, `revenueHref`, `answeredView`), `fill-series.ts` (`fillSeries`), `revenue-chart-metrics.ts` (the two tabs, the table columns, `tabPoints`) and `revenue-text.ts` (the words): pure, no React and no network.
- `components/`: `RevenueScreen`, `GroupSwitch`, `RevenueTotals`, `RevenueChartZone`, `PlansZone` and `RevenueSkeleton`.

## Rules

- The request always carries `from`, `to` and `groupBy`, because this API reads no days as all time and no `groupBy` as `month`. With no range in the address it sends the last 30 days ending today in Vietnam (`effectiveRange`). A range that breaks the contract is never sent.
- One request per view (the key holds all three parts), fresh for 1 minute. It reads again on window focus once stale, because the API takes about 50 ms and a payment can arrive at any time. A 403 `PERMISSION_DENIED` is final: no token refresh and no second read.
- The chart and the table read the view from the answer (`answeredView`), not from the address, because the answer of the view before stays on screen while a new one loads.
- `series` is sparse. `fillSeries` puts every day or month of the range in, with 0 where there is no entry. That, bar widths and axis ticks are the only computing. Never add counts or amounts: the card, the last row of the plan list and the last row of the table are the same two numbers of the answer.
- Every zone that shows money ends its title with "(thanh toán thử)", and no text calls the money real revenue.
- The two tabs are never drawn on one scale. The money tab asks the chart for a `yFloor` of 100.000 and a wider `yAxisWidth`, so the axis is written in full ("1.500.000").
- `/admin` shows no money. This page is the only place for the money numbers.
- The heights of `RevenueSkeleton` were measured from the drawn blocks (the plan zone with four plans). Measure them again when a block changes its height.

_Drafted by /sync from the introducing change, worth a quick human pass._
