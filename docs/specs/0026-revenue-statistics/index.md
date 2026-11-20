# 0026. Revenue statistics page for admins

**Date**: 2026-11-20
**Status**: Accepted

## Summary

This spec adds the admin page `/admin/revenue`, read from `GET /orders/revenue`. It shows the money of paid orders for a date range (the last 30 days by day when the page opens), as two total cards, a daily or monthly chart with a text table, and a list by plan. It reuses the range bar, number card, chart, table and failure state built for the landlord and admin overviews, with small additions to the chart and the table. Every amount is labelled a test payment, and one quiet note says the total counts by paid date, so it can differ from the orders screen.

## Requirements

Seeded from scope item #26 and refined with the engineer. Contract with the backend: `api-for-frontend.md` section 6.38 (`GET /orders/revenue`) and the notes under it. Patterns to follow: spec 0025 (the admin overview, the range in the address, failures, caching), spec 0024 (the shared pieces in `src/components/stats/`), spec 0004 (zones and item cards on the canvas) and spec 0008 (the tool list, where "Doanh thu" is a `soon` tool of the admin area).

**Out of scope** (settled with the engineer or by the contract): money numbers on `/admin` (the revenue page and the side menu are the only doors); a comparison with the period before and any arrow (the API gives none); revenue per landlord, counts of pending or cancelled orders, export (the API has none); a link from this page to the orders list (the two screens filter by different dates, so a link would mislead); a range longer than 366 days and an "all time" choice (the shared range rules stay); a choice of time zone; any number worked out in the browser except filling empty days and months with 0; a new colour token; a `/dev/ui` section or sample screen (the engineer's rule since 2026-11-12).

**User stories**:
- As an admin, I want the money of paid orders for a range I choose, so I can tell if sales go up or down.
- As an admin, I want it by day or by month, so I can see a week or a year.
- As an admin, I want it by plan, so I know which plan sells best.
- As an admin, I want the page to say these are test payments and that the date is the paid date, so I do not read them as real revenue or compare them wrongly with the orders screen.
- As someone using a screen reader or a keyboard, I want the chart as a table and every change in words.
- As an admin on a phone, I want the same page at a narrow width.

**Acceptance criteria** (the contract; each is checkable on its own):
- **AC-1**: Page, gate and menu. `src/app/(admin)/admin/revenue/page.tsx` is a thin server page with `export const instant = false`, no index and no follow, the tab title "Doanh thu", and a `PageHeader` with the `h1` "Doanh thu" and the description "Tiền của các đơn đã trả, tính theo ngày trả. Đây là thanh toán thử, không phải doanh thu thật." Its body is the revenue screen inside a `<Suspense>` boundary (the range is read with `useSearchParams`). The "revenue" entry of `ADMIN_TOOLS` becomes `ready` with the address `ADMIN_REVENUE_PATH` (`/admin/revenue`), so "Doanh thu" appears in the side menu right after "Đơn của mọi chủ trọ". The screen is drawn only when the session holds `order:report`; otherwise it shows `ForbiddenState` ("Tài khoản của bạn chưa có quyền xem doanh thu.") and makes no request. The query is enabled only when this check passes. A guest and a person of another account type are handled by the existing gate of the admin area, unchanged.
- **AC-2**: The view lives in the address. `?from=&to=` is read with the same `parseRange` as spec 0024 AC-2 (a pair that breaks the contract, or equals the 30 day default, acts as no params). `?groupBy=month` means by month, and anything else or nothing means by day. With no range in the address the page uses the last 30 days ending today in Vietnam (`defaultRange(todayInVietnam(new Date()))`). Unlike the overviews, the request always carries `from`, `to` and `groupBy` (`day` or `month`), because this API reads no days as all time and no `groupBy` as `month`. A pair that breaks the contract is never sent.
- **AC-3**: Controls. The range control is the shared `RangeBar`, unchanged (spec 0024 AC-3). Beside it, on the same row when it fits and under it when it does not, a switch of two buttons "Theo ngày" and "Theo tháng" with `aria-pressed`, 44 px high below `md`. A preset, a valid apply, or a press of the switch replaces the address without scrolling, keeps the other part of the view, and the screen reads again. "Theo ngày" removes `groupBy` from the address.
- **AC-4**: One request, caching and loading. The screen makes one `GET /orders/revenue` per view through `useApi` and TanStack Query, key `["admin-revenue", { from, to, groupBy }]` (all three always set), `staleTime` of 1 minute, the previous answer kept while a new view loads, and the abort `signal` passed. It reads again when the window gets focus after the answer is stale (the project default is kept, because this API takes about 50 ms and a payment can arrive at any time). A view read less than a minute ago makes no request when it is opened again. The query keeps the other project defaults (one retry only for a network error or a 502, 503 or 504 through `shouldRetryQuery`, `gcTime` of 5 minutes). The first load draws one skeleton per block with a fixed minimum height, below the range controls, with the hidden text "Đang tải thống kê". While any read runs and an answer is drawn, one region around everything below the range controls is `aria-busy="true"` and a status line says "Đang cập nhật số liệu" (visible and spoken).
- **AC-5**: Totals. Below the range controls, a section with the `h2` "Tổng trong khoảng (thanh toán thử)" holds two item cards: "Doanh thu (thanh toán thử)" with `formatMoney(paidAmount)`, and "Đơn đã trả" with `formatCount(paidCount)`. They have no arrow and no previous value. A zero is drawn in the muted colour. Under the cards, one quiet line says: "Tổng tính theo ngày trả. Màn Đơn của mọi chủ trọ lọc theo ngày tạo đơn, nên cùng một khoảng ngày hai tổng có thể khác nhau."
- **AC-6**: Labels. The words "(thanh toán thử)" end the title of every zone that shows money (AC-5, AC-7, AC-10), and the page description of AC-1 says the same. No text on the page calls these numbers real revenue, except the negation in the page description.
- **AC-7**: The chart. A zone "Doanh thu theo ngày (thanh toán thử)" (or "Doanh thu theo tháng (thanh toán thử)" when grouped by month) holds one chart and a switcher (`Tabs`) with two tabs, "Doanh thu" first and chosen at the start, then "Đơn đã trả". Each tab has one line, `primary` on a light area, so each has its own scale. No animation, a Y axis that starts at 0 with whole number ticks written in full (for example 1.500.000) on an axis wide enough for them, one point per day or month, and an X axis of `dd/MM` labels by day or `MM/yyyy` by month, thinned to fit. The Y axis of "Doanh thu" ends at 100.000 at least, and that of "Đơn đã trả" at 4 at least. The tooltip says the whole period and the value: by day "16/11/2026: 398.000 ₫", by month "11/2026: 3.980.000 ₫", and in the count tab "16/11/2026: 3 đơn". Arrow keys move over the periods. The accessible name reads "<tab> theo ngày từ dd/MM/yyyy đến dd/MM/yyyy" (or "theo tháng"), then ", tổng <value>": "Doanh thu ..., tổng 5.970.000 ₫ (thanh toán thử)" and "Đơn đã trả ..., tổng 30 đơn", where each total is `paidAmount` or `paidCount` of the answer (never a sum of points). The chart has a fixed height. One period draws a dot. When grouped by month, a quiet line under the tabs says "Tháng đầu và tháng cuối chỉ tính các ngày trong khoảng đã chọn." The chosen tab and the open table are kept when the range or the grouping changes and reset when the zone mounts again.
- **AC-8**: Empty periods are 0. `series` is sparse (a day or month with no paid order has no entry). Before drawing, and for the table, the page fills every day from `from` to `to` (by day) or every month from the month of `from` to the month of `to` (by month) with `paidAmount` 0 and `paidCount` 0, and places each entry of `series` by its `period`. This is the only computing the page does on the answer.
- **AC-9**: The text table. Under the chart a button "Xem bảng số liệu" (`aria-expanded`) opens a native `table` with the caption "Doanh thu theo ngày từ dd/MM/yyyy đến dd/MM/yyyy (thanh toán thử)" (or "theo tháng"), a first column "Ngày" (by day, `formatDateOnly`) or "Tháng" (by month, `MM/yyyy`), a column "Doanh thu" (`formatMoney`) and a column "Đơn đã trả" (`formatCount`), and one row per filled period. The rows scroll inside a labelled region ("Bảng số liệu theo ngày" or "theo tháng") that is a keyboard stop, with a sticky header. A last row "Tổng" shows `paidAmount` and `paidCount` of the answer (AC-11). The table lists both columns whichever tab is chosen.
- **AC-10**: By plan. A zone "Doanh thu theo gói (thanh toán thử)" lists every entry of `byPlan` in the order the API gave (amount falling). Each row shows `planName`, `formatMoney(paidAmount)`, the quiet line "N đơn" (`paidCount`) and a thin bar that compares the row with the largest amount shown (hidden from a screen reader). A last row "Tổng" shows `paidAmount` and `paidCount` of the answer (AC-11). With no entry, the zone says "Chưa có đơn nào được trả trong khoảng này". The name is the plan's current name, as the API gives it.
- **AC-11**: The three totals match. The card (AC-5), the last row of the plan list (AC-10) and the last row of the table (AC-9) show the same two numbers, `paidAmount` and `paidCount` of the answer, never added in the browser. The API guarantees that the rows add up to them (one query), and the verify steps check it by hand.
- **AC-12**: Failures. The range controls stay usable in every case. A failure replaces the blocks below them with one failure state, so no old numbers stay under a new view (the rule of spec 0024 and 0025: once a view has failed, the kept old answer is not drawn again, and "Thử lại" starts from the loading state). A network error or a 5xx shows `ErrorState` with the title "Không tải được doanh thu" and "Thử lại" (a 5xx adds the support code). A 429 shows `RateLimitNotice` with the countdown. A 400 `VALIDATION_FAILED` (the page validates first, so the contract moved) shows the message and "Dùng 30 ngày gần nhất" when a range is in the address, which clears the range and keeps the grouping. A 403 `PERMISSION_DENIED` shows the message of AC-1 in a card below the controls, with no token refresh (an admin token carries `order:report`). A 401 or a 403 `ACCOUNT_LOCKED` is handled by the session layer. The chosen tab and the open table reset after a failure, because their zones mount again.
- **AC-13**: An empty range. When no order was paid in the range, the totals are 0 in the muted colour, the chart draws a flat line at 0 through every period, the table lists every period as 0 with a total row of 0, and the plan zone says the sentence of AC-10.
- **AC-14**: Layout and accessibility (WCAG AA). Desktop first and fine at 320 px with no sideways scroll. The chart and plan zones are `Card` zones with an `h2`, the totals are two item cards (one column below `sm`, two from `sm`), and there is no card inside a card. Heading order is `h1`, then the `h2` of the totals, the chart and the plans. Icons and bars are `aria-hidden`. Controls follow the control heights of `AGENTS.md`, and focus rings come from `FOCUS_RING`. Only semantic tokens are used, no new colour token, and no new contrast pair (the line is `primary` on `card`, which `PAIRS` already holds). The chart has no motion.
- **AC-15**: Shared pieces grow without changing what they draw today. `TrendChart` and `TrendAreaChart` gain `grain` (`day` or `month`, default `day`: the X labels and the tooltip day), `yAxisWidth` (default 44) and `yFloor` (default 4, the least the axis reaches). `SeriesTable` gains `grain` (the first column and the region label), a `format` for each column (default `formatCount`) and an optional footer row. `src/lib/format.ts` gains `formatMonthYear`. After the change every acceptance criterion of spec 0024 and 0025 still holds on `/landlord` and `/admin`.
- **AC-16**: Reference and clean build. `npm run check` and `npm run build` pass, with no hydration warning and no console error on `/admin/revenue`, no `any`, no link to a page that does not exist, no new package and no new colour token.

## Decision

**Chosen option**: Option 1: A dedicated page `/admin/revenue` with one request per view, built from the shared statistics pieces.

Add the page `/admin/revenue` (the "Doanh thu" tool of the admin area), read from one `GET /orders/revenue` that always carries `from`, `to` and `groupBy`, with the range and the grouping in the address. Reuse `RangeBar`, `MetricCard`, `StatsZone`, `StatBar`, `TrendChart`, `SeriesTable` and `StatsFailure`, and add a few optional props to the chart and the table.

**Implementation skills**: `tanstack-query-best-practices` (`deckardger/tanstack-agent-skills`, `.agents/skills/tanstack-query-best-practices/`) · `tailwind-design-system` (`wshobson/agents`, `.agents/skills/tailwind-design-system/`) · `next-dev-loop` (`vercel/next.js`, `.agents/skills/next-dev-loop/`)

The Next.js docs in `node_modules/next/dist/docs/` win over these skills where they disagree (project rule in `AGENTS.md`). Follow `src/app/(admin)/admin/page.tsx` for the route (a thin server page with a `<Suspense>` boundary around the client screen).

## Feature design

**Data model sketch**: nothing is stored. The model is the answer of `GET /orders/revenue` and four pieces of screen state.

| Item | Where | Notes |
|---|---|---|
| `RevenueResponse` | `src/lib/api/types.ts` (exists) | `from`, `to`, `groupBy`, `timeZone`, `paidCount`, `paidAmount`, `byPlan[]`, `series[]`. `from` and `to` are `null` in the type, but this page always sends both. Amounts are whole dong of test payments. `series` is sparse |
| The range | the address: `from`, `to` (`YYYY-MM-DD`) | No params means the last 30 days. A preset is not stored, only its two dates |
| The grouping | the address: `groupBy` | `month` only; day is the absence of the param |
| The chart tab | React state of the chart zone | One of two keys; default "Doanh thu" |
| Open tables | React state of the chart zone | A boolean |
| Cache entry | TanStack Query, key `["admin-revenue", { from, to, groupBy }]` | The whole answer: totals, plan names and ids, periods. No name, email or phone of any person (the API sends none) |

New pure functions in `src/features/admin-revenue/`: `parseGroupBy(value)` and `revenueHref(pathname, range, groupBy)` (the address of a view, so a change of range keeps the grouping and the reverse), `effectiveRange(range, today)` (the range sent), and `fillSeries(series, from, to, groupBy)` (every day or month with its entry or 0, each with a `date` the chart reads: the day, or the first of the month for a month). Today in Vietnam is read when needed, never kept from mount. The screen never renders on the server (the gate draws a loading state there).

**State transitions**:
- Screen: `loading` (skeleton below the controls) → `ready` or `error` (network, 5xx, 429, 400, 403). A change of range or grouping goes `ready` → `ready` with `aria-busy` and the old content, then the new answer. "Thử lại" goes `error` → `loading`.
- Forbidden: a 403 `PERMISSION_DENIED` goes to the forbidden state at once. There is no refresh and no second read.

**API surface** (one read, made in the browser with the access token in memory, through `useApi`, auth mode `required`):

| Endpoint | Method | Key inputs | Key outputs used | Auth | Key errors |
|---|---|---|---|---|---|
| `/orders/revenue` | GET | `from`, `to` (`YYYY-MM-DD`, the paid date in Vietnam time), `groupBy` (`day` or `month`); no other param, the API answers 400 to any | `paidCount`, `paidAmount`, `byPlan[]`, `series[]`, `from`, `to`, `groupBy` | bearer, `order:report`, admin only; the API rereads the admin in the database on every call | 400 `VALIDATION_FAILED`, 401, 403 `PERMISSION_DENIED`, 403 `ACCOUNT_LOCKED` |

The API has no rate limit and answers with `Cache-Control: private, no-store`, which only tells the browser HTTP cache. TanStack Query holds the answer in memory for 1 minute and the session clears it when the person changes. The server answers in about 50 ms at 50 thousand orders, so reading on focus is cheap.

**Value sourcing** (every value the screen shows names where it comes from):

| Value shown | Source |
|---|---|
| The range sent | the address through `parseRange`; none means `defaultRange(todayInVietnam(new Date()))`, sent as two real days |
| `groupBy` sent | the address (`month`, else `day`); always sent |
| "Today" for the default range and the presets | the browser clock in `Asia/Ho_Chi_Minh` (decided in spec 0024) |
| The range text in chart names and captions | `from` and `to` of the answer (the API gives back what was sent) |
| Whether to draw the screen | `can(state, "order:report")` on the `permissions` of `GET /auth/me` |
| Total cards, and the "Tổng" rows of the plan list and the table | `paidAmount` and `paidCount` of the answer, never added |
| Days or months of the chart and table | filled from the month or day of `from` to that of `to`, with `addDays` and a month step |
| Value of a day or month | the entry of `series` with that `period`, else 0 |
| Date of a month point | `period` plus `-01`, labelled `MM/yyyy` |
| Plan rows | `byPlan[]` in the API order: `planName`, `paidAmount`, `paidCount` |
| Bar lengths | the row's `paidAmount` against the largest shown in the plan zone (a width only, hidden from a screen reader) |
| Axis scale | `yAxisScale(largest point, floor)`: the largest point decides where the axis ends, not a sum |
| Totals in the chart's accessible name | `paidAmount` and `paidCount` of the answer |
| Support code of a 5xx | `describeError(error).requestId` |
| Whether the busy line shows | `query.isFetching` while an answer is drawn |
| Link targets | none |

**Key invariants**:
- The page does no arithmetic on a count, an amount or a total of the answer. The only computing is with dates (the default range, the filled periods), bar widths and axis ticks.
- Every money figure is labelled a test payment, and no text calls it real revenue.
- The three totals are one API number shown three times, so they match by construction.
- A range that breaks the contract is never sent. The cache key is the whole view, so each view is its own entry.
- The two tabs are never drawn on one scale, and `byPlan` rows are never added.
- Each chart has its table one click away, and colour is never the only carrier.

**Security model**: the admin area gate already admits only admins. The screen additionally needs `order:report` in the session, and the API enforces it with the admin read again from the database on every call, so a locked admin loses the page at once (403 `ACCOUNT_LOCKED`, handled by the session layer) and a landlord gets 403 whatever the page does. Hiding is a convenience. The money is a test payment: `paid` only means the landlord pressed confirm, and no card or bank data exists. The answer has no name, email, phone or id of any person, only counts, amounts, dates, plan ids and plan names. The access token stays in memory, the cache is cleared when the session changes, and the page is no index. No regulated data beyond what the role already reads.

**Configuration required**: no environment variable, no credential, no new package and no new colour token.

**Where the code goes** (names are binding for the shared parts, free for the rest):

| Path | What |
|---|---|
| `src/app/(admin)/admin/revenue/page.tsx` | thin server page: `PageHeader`, `<Suspense>` and the screen |
| `src/features/admin-revenue/admin-revenue-path.ts` | `ADMIN_REVENUE_PATH` |
| `src/features/admin-revenue/api/admin-revenue.ts` | `adminRevenueKey`, `adminRevenueRangeKey`, the reader, the `queryOptions` factory |
| `src/features/admin-revenue/hooks/use-admin-revenue.ts` | the view in the address, the answer for it and the permission check |
| `src/features/admin-revenue/revenue-view.ts`, `fill-series.ts`, `revenue-text.ts` | pure: the view and its address, the filled periods, the words |
| `src/features/admin-revenue/components/` | `revenue-screen.tsx`, `group-switch.tsx`, `revenue-totals.tsx`, `revenue-chart-zone.tsx`, `plans-zone.tsx`, `revenue-skeleton.tsx` |
| `src/components/stats/trend-area-chart.tsx`, `trend-chart.tsx`, `y-axis.ts`, `series-table.tsx` | the optional props of AC-15, with today's defaults |
| `src/lib/format.ts` | `formatMonthYear` |
| `src/components/shells/workspace-tools.ts` | the "revenue" entry from `soon` to `ready` with `ADMIN_REVENUE_PATH` |

**Amendments to earlier specs** (the build adds a short dated note to each):

| Where | Was | Now |
|---|---|---|
| Spec 0024, Follow-up: the item for #26 | "#26 reuses the range bar and the chart, and decides whether it groups by day or by month" | Done: the page groups by day or by month with a switch of its own, and the shared chart and table gain the optional props of AC-15 |
| Spec 0025, Follow-up: the item for #26 | "#26 brings back the money numbers" | Done on the revenue page only; `/admin` stays without money |

**Critical test scenarios** (each maps to an acceptance criterion):
- Happy path: an admin opens `/admin/revenue` and sees the totals, the chart, the table and the plan list for the last 30 days by day; every number equals `GET /orders/revenue` called by hand with the same `from`, `to` and `groupBy=day`, verifies **AC-1**, **AC-2**, **AC-5**, **AC-7**, **AC-9**, **AC-10**.
- Range and grouping: press 7, 90 and 365 days, apply a custom range, press "Theo tháng" and back; the cards, chart, table and plans follow, the address keeps the other part of the view, a bad pair acts as the default and is never sent, and a year by month shows 12 or 13 months, verifies **AC-2**, **AC-3**, **AC-8**.
- Zero fill and the match: pick a range with days that had no order; those days are 0 in the chart and the table; the rows of the table and of the plan list add up (by hand) to the card, and the three show the same two numbers, verifies **AC-8**, **AC-11**.
- Empty: a range with no paid order shows zeros, a flat line, a table of zeros and the empty plan sentence, verifies **AC-13**.
- Labels: the page description, every zone title and the date note read as written, and nothing calls the money real revenue, verifies **AC-5**, **AC-6**.
- Slow and cached: delay the answer by 3 seconds; the skeleton has no jump and the controls stay usable; return to a view within a minute and no request is made; focus the tab after a minute and one request is made, verifies **AC-4**.
- Failure: abort the request, a 500, a forced 400 and a forced 403 `PERMISSION_DENIED`; each shows its state below usable controls, verifies **AC-12**.
- Auth: a landlord and a tenant who open `/admin/revenue` see the existing forbidden state of the gate and no `GET /orders/revenue`; the menu item "Doanh thu" is there for an admin, verifies **AC-1**.
- Shared pieces: open `/landlord` and `/admin` and repeat their chart and table checks, verifies **AC-15**.
- Layout: 320, 390, 768 and 1280 px with no sideways scroll, keyboard only through the whole page, verifies **AC-14**.

## Build plan

Tracer Bullet (the project default, `AGENTS.md`): first one thin real thread through every layer (route, menu, gate, query, skeleton, totals, one chart with its table), checked on the real route with the demo backend; then the month grouping, the second tab and the plan list with the shared additions; then the failures and the empty state; then the polish. Each milestone runs end to end. No `/dev/ui` milestone (the engineer's rule since 2026-11-12): check on the real route, and force the failures with a route abort, a fetch wrapper or a pass through proxy on `API_URL`.

1. **M1, the thin thread**: the route, `ADMIN_REVENUE_PATH`, the menu entry from `soon` to `ready`, the query in `src/features/admin-revenue/api/` (key, 1 minute `staleTime`, no refresh on 403) and the hook with the `order:report` check and the view in the address (range only, by day, always sending `from`, `to` and `groupBy=day`), satisfies **AC-1**, **AC-2**, **AC-4**.
2. **M1**: the screen with the gate, the skeleton, the shared `RangeBar`, the two total cards with the date note and the labels, satisfies **AC-1**, **AC-3** (range part), **AC-4**, **AC-5**, **AC-6**.
3. **M1**: the chart zone with the "Doanh thu" line by day and the text table with its "Tổng" row, `fillSeries` for days, and the `yAxisWidth` and `yFloor` props of the chart, satisfies **AC-7** (amount, by day), **AC-8**, **AC-9**, **AC-11**, **AC-15** (the props used).
4. **M1**: open `/admin/revenue` as the demo admin and check the thread (the totals equal the API, the chart draws, the table opens and its rows add up, a range change reads again), satisfies **AC-1**, **AC-4**, **AC-5**, **AC-9**, **AC-11**.
5. **M2, every view**: the grouping switch and `groupBy` in the address, `fillSeries` for months, `grain` and `formatMonthYear` in the chart and the table, and the month note, satisfies **AC-2**, **AC-3**, **AC-7**, **AC-8**, **AC-9**, **AC-15**.
6. **M2**: the second tab "Đơn đã trả" (its own scale, floor of 4, tooltip in "đơn") and the accessible names of both tabs, then open `/landlord` and `/admin` again, satisfies **AC-7**, **AC-15**.
7. **M2**: the plan zone with its rows, bars, "Tổng" row and empty sentence, satisfies **AC-10**, **AC-11**.
8. **M3, states**: the failure states (network and 5xx, 429, 400, 403 forbidden), the forbidden state of the gate, `aria-busy` with "Đang cập nhật số liệu", and the empty range, satisfies **AC-12**, **AC-13**, **AC-1**, **AC-4**.
9. **M4, polish**: check 320, 390, 768 and 1280 px, the heading order, focus and keyboard on the chart and both tables, the dated notes in specs 0024 and 0025, `npm run check` and `npm run build`, and the console on `/admin/revenue`, `/admin` and `/landlord`, satisfies **AC-14**, **AC-15**, **AC-16**.

Every AC appears in at least one task and every task names an AC.

## Consequences

**Positive**:
- An admin sees the money of paid orders by range, by day or month and by plan, with every total taken from the API and labelled a test payment.
- The three totals match by construction, so there is no number to explain.
- The shared statistics pieces serve a third screen, and the last planned feature of the scope becomes mostly composition.
- The chart and the tables are words as well as pictures, so the page works by keyboard and screen reader.

**Negative / tradeoffs**:
- The range stops at 366 days and there is no "all time" view, although the API allows more. A year by month is the longest view.
- A month cut by the range (the first and last month) shows only the days inside it, and the page says so in one line. Someone who wants whole months picks a range that starts on the 1st and ends on the last day.
- The page cannot prove that the rows add up to the totals, because it does no arithmetic. The match is the API's guarantee and a step of the verify list.
- `byPlan` shows the current name of a plan, so a renamed plan carries its old sales under the new name, while the orders screen keeps the name at the time of the sale.
- The paid date and the created date differ, so a total here can differ from the one on the orders screen. The page says so in one line and links nowhere.
- Reading on window focus costs a request for every return to the tab after a minute. The API takes about 50 ms, so this is cheap.

**Neutral**:
- Specs 0024 and 0025 get short notes (the table above). `src/components/stats/AGENTS.md` should mention the new props, and `/sync` should record `src/features/admin-revenue/` after this ships.
- `RevenueResponse` already exists in `types.ts` and nothing used it before this page.

## Follow-up

- [ ] An "all time" choice and a range longer than 366 days (the API accepts days from 2000 to 2100) if admins ask. It needs a new maximum in `date-range.ts` or a range bar of the revenue page.
- [ ] A comparison with the period before (arrows and percent) when the API gives one. Today it gives none.
- [ ] Revenue per landlord, counts of pending and cancelled orders and an export, when the API has them.
- [ ] A link between the revenue page and the orders list needs a decision on the two kinds of date, because they filter differently.
- [ ] `design.md` has no chart rules. Add the short "Charts" note asked for in specs 0024 and 0025 (the `primary` line on a light area, the dashed `info` line, no animation, grid from `border`), and a line about money axes in full numbers.
- [ ] `/sync` should record `src/features/admin-revenue/` and the new props of the shared chart and table in the nested `AGENTS.md` files.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).
