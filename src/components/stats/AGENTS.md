# src/components/stats

The shared pieces of every statistics screen: the landlord overview ([spec 0024](../../../docs/specs/0024-landlord-statistics/index.md)), the admin overview ([spec 0025](../../../docs/specs/0025-admin-overview-statistics/index.md)), and the revenue page ([spec 0026](../../../docs/specs/0026-revenue-statistics/index.md)). A screen composes these pieces and keeps its own words and numbers in its own feature folder (`src/features/landlord-stats/`, `src/features/admin-stats/`, `src/features/admin-revenue/`).

## Where things live

- `range-bar.tsx` and `use-range-in-address.ts`: `RangeBar` (buttons for 7, 30, 90 and 365 days, and a custom range with two date fields) and `useRangeInAddress()`, which returns `{ range, setRange }`. The range lives in the address as `from` and `to` and is read with `parseRange` from `src/lib/date-range.ts`. A pair that breaks the contract, or equals the 30 day default, acts as no params and is never sent. `setRange` uses `router.replace` without scrolling. The caller needs a `<Suspense>` boundary, because the hook reads `useSearchParams`.
- `use-shown-answer.ts` and `stats-failure.tsx`: `useShownAnswer(query)` decides whether the kept answer of the range before may be drawn (never after a range has failed). `StatsFailure` draws a failed read: a network error or 5xx with "Thử lại", a 429 with a countdown, a 400 with "Dùng 30 ngày gần nhất", a 403 `PERMISSION_DENIED` as the forbidden state. The error title and the forbidden message are props.
- `stats-zone.tsx`, `stat-row.tsx`, `stat-bar.tsx`, `metric-card.tsx`, `change-note.tsx` and `describe-change.ts`: a `Card` zone with an `h2`, a row of label and value, a thin bar, a number card with its change note and "Kỳ trước" (a zero is drawn muted with the `muted` prop), and the pure rule for the arrow, sign, tone and words of a change.
- `trend-chart.tsx`, `trend-area-chart.tsx`, `trend-lines.ts`, `y-axis.ts`, `trend-chart-height.ts` and `series-table.tsx`: the daily chart with one or two lines (the `lines` prop, a list of `ChartLine`; the optional props `yAxisWidth`, `yFloor` and `grain` keep today's look when left out and serve a money axis or a month point), its legend, the scale, the fixed height, and the text table of the same days (a `format` for each column, a `grain` and an optional `footer` row). `src/components/ui/chart.tsx` is the shadcn chart block on recharts.
- `stats-text.ts`: the words both screens share (loading, updating, retry, reset, "Kỳ trước", the range written out, the table caption).

## Rules

- Do no arithmetic on a count, a percent or a total of an answer. The API works out every change and every total. The only computing here is with dates, bar widths and axis ticks.
- A number of the moment (a state, a ranking) has no arrow and no previous value. Only a `Metric` has a change note.
- A change is never colour alone: it has an arrow, a sign and words, and a sentence for a screen reader.
- A chart has one or two lines. The first is `primary` on a light area (at most 12%), the second is `info`, dashed, with no area, and a legend. No animation, a Y axis that starts at 0 with whole number ticks, one scale for both lines. Each chart has its table one click away, and its accessible name carries the range and the total of each line (the `Metric` value, never a sum of the points).
- A month point (`grain="month"`) is dated the first of the month and written `MM/yyyy`. The `footer` row of the table, like every total here, shows a number of the answer and is never a sum of the rows.
- Use the chart through `TrendChart`. It loads recharts late and only in the browser (`ssr: false`), so the library stays out of the first script. Never import `trend-area-chart.tsx` directly.
- Bars are hidden from a screen reader, which reads the number beside them.
- Tokens only. The `info` on `card` pair is in `PAIRS` of `scripts/check-contrast.mjs`.
- These pieces import nothing from `src/features/`, so a new screen can use them as they are.

_Drafted by /sync from the introducing change, worth a quick human pass._
