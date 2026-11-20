# 0024. Landlord statistics on the landlord overview

**Date**: 2026-11-20
**Status**: In Progress

## Summary

This spec turns `/landlord` from a page of link cards into a real statistics page for the landlord, read from the new `GET /me/statistics`. The landlord picks a date range (the last 30 days by default), and sees number cards with the change against the previous period, one daily chart with a switcher, a text table for the chart, their top listings, the state of their listings and plan, their two rating scores, chat, and money (test payments). It also builds the pieces that the admin overview (#40) and the revenue page (#26) will reuse: the range bar, the number card, the change note and the chart. The side menu stays the only way into the tools.

> **Amended 2026-11-20 by [0025](../0025-admin-overview-statistics/index.md)**: the admin overview (#40) reused the shared pieces and the build lifted the rest to `src/components/stats/`: `StatsFailure` (the error title and the forbidden message are props), `useShownAnswer`, `useRangeInAddress` and the words both screens use (`stats-text.ts`). `TrendAreaChart` and `TrendChart` take `lines` (one or two `ChartLine` entries) in place of the single series props, and `/landlord` was migrated in the same change with no change in what it draws. `src/features/dashboard` (the admin cards, `ToolGrid`, `describeStat`) is deleted, so the line "stay until #40 removes them" is done, and the Follow-up item for #40 is done.

## Requirements

Seeded from scope item #39 and refined with the engineer. Contract with the backend: `api-for-frontend.md` section 6.42 (`GET /me/statistics`), the Metric rules under it, and appendix B (`Statistics`). Patterns to follow: spec 0004 (zones on the canvas, item cards), spec 0008 (the tool list and the menu, which stay), spec 0020 (the plan strip), spec 0002 (the session and the API client), and the admin orders page for a filter kept in the address.

**Out of scope** (settled with the engineer or by the contract): the admin overview (#40) and the revenue page (#26, only the shared pieces are designed for them); a line for the previous period drawn on the chart (the API gives the series of the current period only); grouping the daily series into weeks or months; export; a per listing breakdown beyond the top five; any number worked out in the browser; a `/dev/ui` section or sample screen (the engineer's rule since 2026-11-12).

**User stories**:
- As a landlord, I want to see how many people viewed, saved and followed me, and how many chats opened, in a range I choose, so I know if my listings work.
- As a landlord, I want each number to say how it changed against the period before, so I do not have to remember the old value.
- As a landlord, I want to see my best listings by views, so I know which ones to improve or copy.
- As a landlord, I want to see how many of my listings are showing and why the others are not, so I act on a hidden one.
- As a landlord with nothing posted yet, I want to be told what to do first, not shown a wall of zeros.
- As someone using a screen reader or a keyboard, I want the chart as a table and the changes as words, not as colour or a picture.
- As a landlord on a phone, I want the same page to work at a narrow width.

**Acceptance criteria** (the contract; each is checkable on its own):
- **AC-1**: Page, gate and what goes. `src/app/(landlord)/landlord/page.tsx` keeps its route, `export const instant = false`, no index and no follow, and the tab title "Tổng quan khu chủ trọ". Its `PageHeader` keeps the `h1` "Tổng quan" with a new description, and its body is the statistics screen. The link cards of the landlord overview are gone, so the side menu is the only way into the tools. The screen is drawn only when the session holds `statistic:read` or `statistic:manage`. The session's `permissions` come from `GET /auth/me`, which reads the database, so a landlord whose token is older still passes this check; the token's own copy of the permissions is why the first read can answer 403 (AC-16). A landlord who holds neither sees `ForbiddenState` ("Tài khoản của bạn chưa có quyền xem thống kê. Hãy liên hệ quản trị viên.") and no request is made. The screen mounts under the route gate, which draws a loading state until the session is known, and the query is enabled only when this check passes. A guest and a person of another account type are handled by the existing gate, unchanged.
- **AC-2**: The range lives in the address. The page reads `?from=YYYY-MM-DD&to=YYYY-MM-DD`. With neither, the range is the last 30 days ending today in Vietnam, and the request carries no `from` and no `to` (the API picks the same). The pair is valid only when both are real calendar days with a year from 2000 to 2100, `from` is not after `to`, and the range is 1 to 366 days long. Anything else (one of the two missing, a bad format, an impossible day, reversed, too long) is treated as no params and is never sent. A pair equal to the 30 day default for today (`to` is today in Vietnam and `from` is 29 days before it) is also treated as no params, so the cache key and the request are the default ones. The days the screen shows always come from the answer's `period`, not from the address.
- **AC-3**: The range control. A bar above the numbers has four preset buttons (7, 30, 90 and 365 days) and a "Tùy chọn" choice. A preset ends today in Vietnam and writes `from` as today minus (days minus 1) and `to` as today; "30 ngày" writes no params. With no params in the address, "30 ngày" is active, with no date maths. Otherwise the active preset is the one whose dates equal the address pair, worked out for today in Vietnam; a range that matches none makes "Tùy chọn" active. "Tùy chọn" shows two `DatePicker` fields, "Từ ngày" and "Đến ngày", and an "Áp dụng" button. A draft that breaks the rules of AC-2 is not sent: the error is written under the field ("Chọn ngày bắt đầu", "Chọn ngày kết thúc", "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc", "Khoảng tối đa là 366 ngày", and "Ngày kết thúc không được sau hôm nay" for a draft `to` after today; the address itself still follows AC-2). The draft is seeded from the current range each time the panel opens and is reset when the address changes. "Tùy chọn" is pressed while its panel is open or when no preset matches. A preset or a valid apply replaces the address (no scroll to the top) and the screen reads again. The buttons are a group with the active one marked (`aria-pressed`), at least 44 px high below `md`.
- **AC-4**: One request, and what the screen does while it runs. The screen makes one `GET /me/statistics` per range, through `useApi` and TanStack Query, key `["landlord-stats", { from, to }]` (both `null` for the default), with `staleTime` of 60 seconds and the previous answer kept while a new range loads. The query function passes the abort `signal`. The first load shows one skeleton per block with a fixed minimum height, so the chart and the number cards do not move the page when the answer arrives, with the hidden text "Đang tải thống kê". A later range change keeps the old content, marks the region `aria-busy="true"` and says "Đang cập nhật số liệu" in a status line (visible and spoken), only while the old answer is the one kept for the new range (`isPlaceholderData`); a read on window focus is silent. A window focus reads again only when the answer is older than 60 seconds.
- **AC-5**: Removed on 2026-11-20 at the engineer's request. The screen draws no period caption under the range bar and no sentence about today being only part done. The days of the range are still said where a screen reader needs them: the name of the chart and the caption of the text table (AC-8, AC-9), from `period` through `formatDateOnly`.
- **AC-6**: The four number cards. Directly under the range bar, four item cards sit on the canvas: "Lượt xem" (`views.inRange`), "Lượt lưu mới" (`interest.newFavorites`), "Người theo dõi mới" (`interest.newFollowers`) and "Cuộc trò chuyện mới" (`chat.conversationsOpened`). Each shows the value (`formatCount`), the change note of AC-7, "Kỳ trước: N" (`previous`), and a muted "Tổng từ trước đến nay: N" (`views.allTime`, `interest.totalFavorites`, `interest.totalFollowers`, `chat.totalConversations`) with no arrow. The "Lượt xem" card also says "Lượt xem theo ngày tính từ 16/11/2026."
- **AC-7**: The change note. For a Metric with a `changePercent` that is not null: an arrow, a signed percent and words for a screen reader, drawn green for above 0, red for below 0, and muted with no arrow for 0 ("↑ +33,3%", "↓ -40%", "0%"; spoken "tăng 33,3% so với kỳ trước", "giảm 40% so với kỳ trước", "không đổi so với kỳ trước"). When `changePercent` is null: "Mới" if `value` is above 0 (spoken "mới, kỳ trước là 0") and a dash if `value` is 0 (spoken "cả hai kỳ đều là 0"). Money (`spending.*`) uses the same text and arrows in the muted colour, because spending more is not good or bad. The reply rate is not a Metric: it shows "75%" and then "giảm 5 điểm", "tăng 3 điểm" or "không đổi" from `changePoints`; when `value` is null it shows a dash and "Chưa có cuộc trò chuyện nào mở trong khoảng này"; when only `changePoints` is null it shows the value and no change. A number of the current state (listing counts, totals, unread, `spentAllTime`, a rating `average` and `count`) never gets an arrow. Percents and points are formatted with at most one decimal (`vi-VN`); the API already rounds them to one decimal, so a value that shows as 0 is a real 0. Colour is never the only carrier: the arrow, the sign and the words are always there.
- **AC-8**: The daily chart. One zone "Theo ngày" holds one chart of `series` and a switcher (`Tabs`) with four choices: "Lượt xem" (default), "Lượt lưu", "Người theo dõi", "Cuộc trò chuyện". The chart is an area with a line in the `primary` token, no animation, a Y axis that starts at 0 with whole number ticks (`formatCount`), an X axis with `dd/MM` labels thinned to fit, and a tooltip with the full day and the count ("16/11/2026: 70 lượt xem"). One point per day, no grouping, up to 366 points. The chart is reachable by keyboard (arrow keys move over the days) and has an accessible name that says what it shows and the range, plus the total from the Metric `value` (never a sum of the points). It has a fixed height so the page does not jump. A range of one day draws a dot, because an area of one point is invisible. The Y domain runs from 0 to at least 4 with whole number ticks (about five), so a range of all zeros still reads cleanly. The tab, the series key, the Metric used for the name and the unit word of the tooltip come from one table (`chart-metrics.ts`). The chosen tab and the open table are kept when the range changes and reset when the zone mounts again.
- **AC-9**: The text table. Under the chart, a button "Xem bảng số liệu" (`aria-expanded`) opens a native `table` with a caption naming the range, and the columns Ngày, Lượt xem, Lượt lưu mới, Người theo dõi mới, Cuộc trò chuyện mới, one row per day of `series`, numbers with `formatCount` and days with `formatDateOnly`. The rows scroll inside a labelled region (a keyboard stop) with a sticky header. The table has no totals row. It lists all four columns whichever tab is chosen.
- **AC-10**: Top listings. A zone "Tin xem nhiều nhất" lists `views.top` (up to 5, in the API order): the rank, the title as a link to the edit page of the listing (`/landlord/listings/[id]/edit`), a badge when `isPublic` is false ("Bạn đang ẩn" for `hidden_by_owner`, "Quản trị viên ẩn" for `hidden_by_admin`, "Chưa hiện công khai" for `visible`), the views in the range with a bar whose length compares it to the largest row (the bar is hidden from a screen reader, the number carries the meaning), and a muted "Tổng từ trước đến nay: N". An empty `top` says "Chưa có tin nào có lượt xem trong khoảng này". No total of the rows is shown, because it can be smaller than the views number.
- **AC-11**: Listings and plan. A zone "Tin đăng và gói" shows the plan strip for `membership` (the existing `describeMembership`, drawn from this answer without a second request) and four rows from `listings`: "Đang hiện công khai" (`public`), the held back row (`hiddenByQuota`), "Bạn tự ẩn" (`hiddenByOwner`) and "Quản trị viên ẩn" (`hiddenByAdmin`), each with its count and a thin bar, plus "Tổng N tin" (`total`). The held back row says why from `membership.state`: for `plan` or `trial` "Ẩn bớt vì vượt hạn mức", for `expired` "Ẩn vì hết dùng thử và chưa có gói". Every `membership.state` is listed in `landlord-stats-text.ts` in an exhaustive switch (a new state fails the type check), with a neutral "Đang bị ẩn bớt" for a state the page does not know. All four rows are always drawn, a zero in the muted colour. A link "Quản lý tin" opens `MY_LISTINGS_PATH`. No arrows.
- **AC-12**: Ratings. A zone "Đánh giá" shows two separate panels, never added together and never averaged: "Điểm của bạn" (`ratings.landlord`, the reviews on your profile) and "Điểm của các phòng" (`ratings.rooms`, the reviews on your listings). Each shows `StarRating` and `formatRating(average)`, "N đánh giá" (`count`), and "Đánh giá mới" (`newInRange`) with the change note. An `average` of null shows "Chưa có đánh giá" and no stars.
- **AC-13**: Chat. A zone "Tin nhắn" shows "Tỉ lệ trả lời" (`replyRate`, AC-7), "Cuộc đã trả lời" (`repliedConversations` with the change note), and the unread state "N cuộc, M tin chưa đọc" (`unreadConversations`, `unreadMessages`) or "Không có tin chưa đọc", with a link "Mở hộp thư" to `LANDLORD_CHAT_BASE`.
- **AC-14**: Money. A zone "Chi tiêu (thanh toán thử)" shows `spending.spent` with `formatMoney` and its change note (muted), "Đơn đã trả" (`paidOrders` with its change note), and a muted "Tổng từ trước đến nay: `formatMoney(spentAllTime)`", with a link "Xem lịch sử đơn" to `ORDERS_PATH`. The words "thanh toán thử" are in the zone heading, so every money figure sits under them.
- **AC-15**: Empty state. When `listings.total` is 0, the zones below the range bar are replaced by an `EmptyState` ("Bạn chưa có tin nào", "Thêm nhà trọ rồi đăng tin đầu tiên để xem lượt xem, lượt lưu và tin nhắn ở đây.") with two links, "Thêm nhà trọ" (`/landlord/properties/new`, primary) and "Đăng tin" (`/landlord/listings/new`). The range bar and the plan strip stay: the strip is drawn on its own between the caption and the empty state, because its usual place is a zone the empty state replaces. A landlord who has listings but a quiet range is not empty: the numbers show zeros, the dash or "Mới" as AC-7 says, and the chart and the table show zeros.
- **AC-16**: Failures. The range bar stays usable in every case. A failure after a range change shows the error in place of the zones, so no old numbers stay under a new range. A network error or a 5xx replaces the zones with `ErrorState` and "Thử lại" (a 5xx adds the support code, as `describeError` does). A 429 shows `RateLimitNotice` with the countdown and keeps "Thử lại" off until the wait ends. A 400 `VALIDATION_FAILED` (the page validates first, so this means the contract moved) shows the error message and a button "Dùng 30 ngày gần nhất" that clears the params (shown only when params are present). A 403 `PERMISSION_DENIED` first calls `refreshToken()` (AC-17) and reads once more; a second 403 shows the `ForbiddenState` of AC-1. A 401 or a 403 `ACCOUNT_LOCKED` is handled by the session layer, as everywhere else.
- **AC-17**: Forced token refresh. `SessionActions` gains `refreshToken(): Promise<void>`. It starts a `POST /auth/refresh`, or joins the one already running, and resolves when the new token is held (a guest: resolves at once, nothing to renew). A failure rejects with the `ApiError` and ends the session only for the answers that already end it (`end-reasons.ts`); a network error, a 5xx or a 429 never does. The statistics query is its only caller. After the first 403 `PERMISSION_DENIED` the query function calls it and, unless its `signal` was aborted meanwhile, reads once more. If `refreshToken()` rejects, the query function throws that `ApiError`, so AC-16 shows the matching state (a 429 wait, a 5xx, a network error). "At most once per read" means once per call of the query function; the project retry default (`shouldRetryQuery`) already never retries a 4xx.
- **AC-18**: Layout and accessibility (WCAG AA). Desktop first and fine at 320 px with no sideways scroll. The number cards are item cards on the canvas (one column below `sm`, two from `sm`, four from `xl`); the chart, top listings, listings and plan, ratings, chat and money are `Card` zones with a heading, two to a row from `lg` where they pair (top listings with listings and plan, ratings with chat) and stacked below; no card inside a card. Heading order is `h1`, then a hidden `h2` for the number cards, then one `h2` per zone. Icons and bars are `aria-hidden`. Controls follow the control heights of `AGENTS.md`, and focus rings come from `FOCUS_RING`. Only semantic tokens are used (the chart line is `var(--primary)`, the grid `var(--border)`), and every new text or control pair is in `PAIRS` of `scripts/check-contrast.mjs` in the same change (at least green text and red text on `card`, and the chart line on `card` at 3:1). Motion respects reduced motion (the chart has none).
- **AC-19**: The landlord card code is removed. From `src/features/dashboard` and `workspace-tools.ts` the parts only the landlord cards used are deleted: `LandlordDashboard`, the `stat` of every entry of `LANDLORD_TOOLS`, the landlord keys of `StatKey` and `SOURCES_OF`, and the sources `properties`, `hiddenByAdmin`, `membership` and `unreadChat` with their text rules. The admin cards and the shared card code stay as they are until #40. `LANDLORD_NAV` is unchanged: "Tổng quan" first and every ready tool after it.
- **AC-20**: A write refreshes the statistics. `refreshAfterListingWrite` also marks `["landlord-stats"]` out of date (read again when next opened, not now), so a landlord who posts, hides, shows or deletes a listing and comes back sees the new counts within the first read. The success of a plan purchase (`use-pay-order.ts`, which already refreshes the membership entry) marks it out of date the same way, because a purchase changes the plan, the held back count and the money.
- **AC-21**: Reference and clean build. `npm run check` and `npm run build` pass, with no hydration warning and no console error on `/landlord`, no `any`, no link to a page that does not exist, and `recharts` and `react-is` added through npm with the `chart` component added through the shadcn CLI and edited as spec 0003 says.

## Decision

**Chosen option**: Option 1: One statistics screen on `/landlord` from one request, with shared stats pieces and a shadcn chart.

Replace the body of `/landlord` with a screen built from one `GET /me/statistics` read keyed by the range in the address, built from small shared pieces in `src/components/stats/` (range bar, number card, change note, chart, table) so #40 and #26 reuse them, and draw the chart with the shadcn `chart` component on recharts.

**Implementation skills**: `tanstack-query-best-practices` (`deckardger/tanstack-agent-skills`, `.agents/skills/tanstack-query-best-practices/`) · `shadcn` (`shadcn-ui/ui`, `.agents/skills/shadcn/`) · `tailwind-design-system` (`wshobson/agents`, `.agents/skills/tailwind-design-system/`) · `next-dev-loop` (`vercel/next.js`, `.agents/skills/next-dev-loop/`)

The Next.js docs in `node_modules/next/dist/docs/` win over these skills where they disagree (project rule in `AGENTS.md`). Read the pages on `useSearchParams` with a `<Suspense>` boundary (the route needs one, as `admin/orders/page.tsx` does) and on lazy loading a client component before writing the route and the chart.

## Feature design

**Data model sketch**: no table and nothing stored in the browser. The model is the answer of `GET /me/statistics` and two pieces of screen state.

| Item | Where | Notes |
|---|---|---|
| `Statistics` (nine blocks) | `src/lib/api/types.ts` | Copied from appendix B of the contract with `Metric`, `RateMetric`, `RatingBlock` and `StatisticsTopListing`. `membership` reuses the existing `Membership` type. `AdminOverview` is added by #40, not here. The percent fields (`changePercent`, `replyRate.value`, `previous` of a rate, `changePoints`) are in percent, so 33.3 means 33.3%; a doc comment in `types.ts` says so |
| The range | the address: `from`, `to` (`YYYY-MM-DD`) | No params means the default 30 days. A preset is not stored, only its two dates |
| The chart metric | React state of the zone | One of `views`, `newFavorites`, `newFollowers`, `newConversations`; default `views` |
| Cache entry | TanStack Query, key `["landlord-stats", { from, to }]` | Holds the whole answer: counts, dates, and titles and codes of the landlord's own listings, no personal data (the API sends none) |

A pure module `src/lib/date-range.ts` holds the range rules so they can be read and tested without React: `todayInVietnam(now)` (a `YYYY-MM-DD` in `Asia/Ho_Chi_Minh`, the helper now private to `date-picker.tsx` is lifted here and shared), `parseRange(params)` (AC-2), `presetRange(days, today)`, `activePreset(range, today)`, `validateRange(draft)` (AC-3). `describeChange(metric)` and `describeRate(rate)` in `src/components/stats/` are pure and return the arrow, the tone, the text and the spoken text (AC-7). Today in Vietnam is read when it is needed, on each render and each click, never kept from mount, and no timer updates it. The screen never renders on the server (the gate draws a loading state there), so it has nothing to mismatch.

**State transitions**:
- Screen: `loading` (skeleton) → `ready`, `empty` (`listings.total` is 0), or `error` (network, 5xx, 429, 400, 403). A range change goes `ready` → `ready` with `aria-busy` and the old content, then the new answer. "Thử lại" goes `error` → `loading`.
- Forbidden: a first 403 `PERMISSION_DENIED` → `refreshToken()` → one more read; a second 403 → forbidden, taken from the error of the current query. A new range is a new query and tries again with its own single refresh.

**API surface** (one read, made in the browser with the access token in memory, through `useApi`, auth mode `required`):

| Endpoint | Method | Key inputs | Key outputs used | Auth | Key errors |
|---|---|---|---|---|---|
| `/me/statistics` | GET | `from`, `to` (`YYYY-MM-DD`, both or none; no other param, the API answers 400 to any) | all nine blocks | bearer, `statistic:read` (or the older `statistic:manage` in an old token), landlord account only | 400 `VALIDATION_FAILED`, 401, 403 `PERMISSION_DENIED`, 429 `RATE_LIMITED` |
| `/auth/refresh` | POST | none (cookie) | a new access token | cookie | 401, 429 (60 a minute) |

The statistics API allows 300 reads a minute per IP and the screen reads once per range and per stale window, so the limit is not a concern. The answer carries `Cache-Control: private, no-store`, which only tells the browser HTTP cache; TanStack Query holds the answer in memory and the session clears it when the person changes.

**Value sourcing** (every value the screen shows names where it comes from):

| Value shown | Source |
|---|---|
| The range sent | the address through `parseRange`; none means no params |
| "Today" for presets and the active preset | `todayInVietnam(new Date())` from the browser clock in `Asia/Ho_Chi_Minh`. Presets send explicit dates, so the page needs it; the API default uses the server's Vietnam today |
| The range text in the chart name and the table caption | `period.from`, `to` |
| Views, new saves, new followers, conversations opened, replied conversations, new reviews, spent, paid orders | the `Metric` fields (`value`, `previous`) of the answer |
| Every percent change | `changePercent` of the answer. Never divided in the browser |
| Reply rate and its change | `chat.replyRate.value`, `previous`, `changePoints` |
| Totals since the start | `views.allTime`, `interest.totalFavorites`, `interest.totalFollowers`, `chat.totalConversations`, `spending.spentAllTime`, `ratings.*.count` |
| Chart points and table rows | `series[]`: `date` and the four columns |
| The total in the chart's accessible name | the Metric `value` of the chosen column, not a sum of points |
| Top listing rows | `views.top[]`; the link from `id`; the badge from `status` and `isPublic` |
| Bar lengths (top listings, listing rows) | the row's count against the largest count shown (a width only, hidden from a screen reader) |
| Held back reason | `membership.state` |
| Plan strip | `membership` through `describeMembership` (spec 0020) |
| Stars and score | `ratings.*.average` through `StarRating` and `formatRating`; null means "Chưa có đánh giá" |
| Unread | `chat.unreadConversations`, `chat.unreadMessages` |
| Whether to draw the screen | `can(state, "statistic:read")` or `can(state, "statistic:manage")`, on the `permissions` of `GET /auth/me` (current, not the token's copy) |
| Whether the screen is empty | `listings.total` is 0 |
| Support code of a 5xx | `describeError(error).requestId` |
| Link targets | `MY_LISTINGS_PATH`, `ORDERS_PATH`, `LANDLORD_CHAT_BASE`, the edit page of a listing, and the two create paths, all existing constants |

**Key invariants**:
- The page does no arithmetic on a count, a percent or a money value of the answer. The only computing is with dates (the presets and today in Vietnam), a bar width, and which tick labels fit.
- A pair or sum the contract forbids is never shown: the two rating scores are never combined, and the top listing rows are never summed.
- A current state number never has an arrow. Only period numbers do.
- Every money figure sits under the words "thanh toán thử".
- A range that breaks the contract is never sent. The cache key is the range, so each range is its own entry.
- The chart always has its table one click away, and colour is never the only carrier of a change.
- The shared stats pieces do not import from `landlord-stats`, so #40 and #26 can use them as they are.

**Security model**: the (landlord) route gate already admits only landlords. The screen additionally needs `statistic:read` or `statistic:manage` in the session, and the API enforces it: a tenant or an admin gets 403 whatever the page does. Hiding is a convenience. The answer has no name, email or phone of any person, only counts and the landlord's own listing titles and codes. The access token stays in memory, the cache is cleared when the session changes, and the page is no index. Money is test payments. No regulated data beyond what the role already reads.

**Configuration required**: no environment variable and no credential. Two packages: `recharts` (added by `npx shadcn@latest add chart`; `3.11.0` at the time of writing, with React 19 in its peer range) and `react-is` in the major version of React (a peer of recharts; add it with npm if the CLI does not, and check `npm ls react-is` shows one copy). The shadcn `chart` component, then the edits of spec 0003 ("Edits after adding shadcn files": focus ring, `overlay`, Vietnamese labels, no `dark:` classes), which here also means dropping the dark theme selector of the generated chart styles. Add it without `--overwrite`, and read `git diff` afterwards: if the CLI offers to replace an existing component, say no.

**Where the code goes** (names are binding for the shared parts, free for the rest):

| Path | What |
|---|---|
| `src/lib/api/types.ts` | `Metric`, `RateMetric`, `RatingBlock`, `StatisticsTopListing`, `Statistics` |
| `src/lib/date-range.ts` | the pure range rules above |
| `src/lib/format.ts` | `formatPercent`, `formatSignedPercent` (`signDisplay: "exceptZero"`), `formatPoints`, `formatDayMonth` (`dd/MM`) |
| `src/lib/session/create-session.ts`, `auth-provider.tsx` | `refreshToken` on `SessionActions` (AC-17) |
| `src/components/ui/chart.tsx` | from the shadcn CLI, then edited |
| `src/components/stats/` | `range-bar.tsx`, `metric-card.tsx`, `change-note.tsx` with `describe-change.ts`, `trend-chart.tsx`, `series-table.tsx`; none knows about a landlord |
| `src/features/landlord-stats/api/landlord-stats.ts` | `landlordStatsKey`, the reader, the 403 retry, the `queryOptions` factory |
| `src/features/landlord-stats/hooks/use-landlord-stats.ts` | reads the range from the address and the answer |
| `src/features/landlord-stats/landlord-stats-text.ts` | the pure wording of the listing rows, held back reason, badges and rating text |
| `src/features/landlord-stats/chart-metrics.ts` | one constant table of the four tabs: series key, Metric path, label and unit word. The shared chart and table take these as props |
| `src/features/landlord-stats/components/` | `landlord-stats-screen.tsx` and one file per zone |
| `src/features/membership/components/membership-strip.tsx` | `StripAlert` is exported as a view that takes a `membership` prop; `MembershipStrip` keeps using it |
| `src/features/listing/api/refresh-after-write.ts` | marks `landlordStatsKey` out of date (AC-20) |
| `src/features/order/hooks/use-pay-order.ts` | marks `landlordStatsKey` out of date after a successful payment (AC-20) |
| `src/app/(landlord)/landlord/page.tsx` | thin server page: `PageHeader`, a `<Suspense>` boundary and the screen |

The chart leaf is loaded with `next/dynamic` and `ssr: false` (the data only exists in the browser anyway), with the same fixed height skeleton as its loading state, so recharts stays out of the first script of the page. Check the Next.js docs for the right form before writing it.

**Amendments to earlier specs** (the build adds a short dated note to each):

| Where | Was | Now |
|---|---|---|
| Spec 0008: the landlord half of the dashboard (AC-2, AC-3, AC-7, AC-8, AC-10, AC-11 for the landlord) | `/landlord` shows tool cards with numbers | Replaced by this spec. The tool list, the menu (AC-5, AC-12), the sign in redirect and the account links stay; the admin half stays until #40. The note is already on 0008 |
| Spec 0012, AC-19 (dashboard card number) | the "Tin nhắn" card shows the unread count | The card number is gone with the cards. The header indicator keeps reading the same cache entry |
| Spec 0020, AC-6 (dashboard cards read the shared membership entry) | the cards read `["membership"]` | The cards are gone. The strip and the reason line still read it; this screen reads `membership` from its own answer |
| Spec 0002: `SessionActions` | `signIn`, `signUp`, `signOut`, `signOutAll`, `reload`, `restore` | Gains `refreshToken` |
| Spec 0003: shared components | no chart | Gains `chart` and the chart edits above |

**Critical test scenarios** (each maps to an acceptance criterion):
- Happy path: a landlord with listings, views and a chat opens `/landlord` and sees 30 days, four cards with changes, the chart and the top listings; the numbers match `GET /me/statistics` called by hand, verifies **AC-2**, **AC-4**, **AC-6**, **AC-8**, **AC-10**.
- Range: click 7 days, 90 days, 365 days and back to 30; the address, the numbers and the chart follow, and "30 ngày" leaves a clean address. Custom range with a reversed pair and with 400 days: the error shows and no request is sent. `?from=2026-02-30&to=2026-03-01` in the address acts as the default and is never sent, verifies **AC-2**, **AC-3**, **AC-5**.
- Changes: a Metric with a rise, a fall, zero, a null with value above 0, and a null with value 0; the reply rate with a drop of points and with a null rate; spending in the muted colour. Read each by a screen reader, verifies **AC-7**.
- Chart and table: switch the four tabs, move over days with the arrow keys, open the table and check the columns and the row count equal `period.days` (also at 366), verifies **AC-8**, **AC-9**.
- New landlord with no listing: the empty state with two links, the plan strip stays; a landlord with a listing but a range before any activity sees zeros, verifies **AC-15**.
- Failure: abort the request (network), a 500, a 429 with a wait, and a forced 400: each shows its state with the range bar still usable, and "Thử lại" works after the first two, verifies **AC-16**.
- Old token: a landlord whose token lacks the permission gets 403 once, the screen refreshes the token and shows the numbers without an error; a landlord an admin stripped of `statistic:read` sees the forbidden state and no request, verifies **AC-1**, **AC-16**, **AC-17**.
- Refresh after a write: post, hide or delete a listing, open `/landlord` again, and the listing counts are new, verifies **AC-20**.
- Auth: a tenant or an admin who opens `/landlord` sees the existing forbidden state of the gate, verifies **AC-1**.
- Layout: 320, 390, 768, 1280 px with no sideways scroll, keyboard only through the whole page, verifies **AC-18**.

## Build plan

Tracer Bullet (the project default, `AGENTS.md`): first one thin real thread through every layer (session, types, query, page, range, one number, one chart with its table), checked on the real route with the demo backend; then the other numbers; then the other zones, the custom range, the empty state and the failures; then the cleanup and the polish. Each milestone runs end to end. No `/dev/ui` milestone (the engineer's rule since 2026-11-12): check on the real route, and force the failures with a route abort, a fetch wrapper or a pass through proxy on `API_URL`.

1. **M1, the thin thread**: `refreshToken` on `SessionActions` and in `createSession`, satisfies **AC-17**.
2. **M1**: the types in `types.ts`, `src/lib/date-range.ts` (`todayInVietnam`, `parseRange`, `presetRange`, `activePreset`, `validateRange`), the new `format.ts` helpers, and the query in `src/features/landlord-stats/api/` with the 403 retry through `refreshToken`, satisfies **AC-2**, **AC-4**, **AC-16** (the 403 part).
3. **M1**: the page body: the `Suspense` route, `LandlordStatsScreen` with the permission gate, the skeleton, the range bar with the four presets (no custom yet), the "Lượt xem" number card with `describeChange`, and the green text and red text pairs on `card` in `PAIRS` of `scripts/check-contrast.mjs` (so the commit hook checks them from the first commit that uses the colours), satisfies **AC-1**, **AC-3** (presets), **AC-5**, **AC-6** (views card), **AC-7**, **AC-18** (the pairs).
4. **M1**: `npx shadcn@latest add chart` and the spec 0003 edits, `react-is`, `TrendChart` with the views series, `SeriesTable` with its toggle, and the chart line pair (`primary` on `card`, 3:1) in `PAIRS`, satisfies **AC-8** (one tab), **AC-9**, **AC-18** (the pair).
5. **M1**: open `/landlord` as a landlord with data on the demo backend and check the thread end to end (numbers equal the API, the chart draws, the table opens), satisfies **AC-1**, **AC-4**, **AC-8**, **AC-9**.
6. **M2, every period number**: the other three number cards with totals and the views note, the four tab switcher, all four table columns, satisfies **AC-6**, **AC-8**, **AC-9**.
7. **M2**: the "Tin xem nhiều nhất" zone with the badges, bars and the edit links, satisfies **AC-10**.
8. **M3, the state zones**: export the strip as a view of a `membership` prop, then the "Tin đăng và gói", "Đánh giá", "Tin nhắn" and "Chi tiêu (thanh toán thử)" zones with their change notes and links, satisfies **AC-11**, **AC-12**, **AC-13**, **AC-14**, **AC-7**.
9. **M3**: the custom range: "Tùy chọn" with two `DatePicker` fields, "Áp dụng", the field errors, and the address rule that an invalid pair acts as the default, satisfies **AC-2**, **AC-3**.
10. **M3**: the empty state, the error states (network and 5xx, 429 with the countdown, 400, 403 forbidden) and `aria-busy` with "Đang cập nhật số liệu" on a range change, satisfies **AC-15**, **AC-16**, **AC-4**.
11. **M4, cleanup**: delete the landlord only card code (AC-19) and make `refreshAfterListingWrite` and the success of a payment mark the statistics out of date (AC-20), satisfies **AC-19**, **AC-20**.
12. **M4, polish**: check 320, 390, 768 and 1280 px, the heading order, focus and keyboard on the chart and the table, the new contrast pairs in `scripts/check-contrast.mjs`, the dated notes in specs 0002, 0003, 0012 and 0020, `npm run check` and `npm run build`, and the console on `/landlord`, satisfies **AC-18**, **AC-21**.

Every AC appears in at least one task and every task names an AC.

## Consequences

**Positive**:
- A landlord sees whether their listings work, in one place and in one read, with the change against the period before and no sum worked out in the browser.
- The range bar, number card, change note and chart are ready for the admin overview (#40) and the revenue page (#26), so those two pages are mostly composition.
- The chart has a table and the changes are words, so the page is usable by keyboard and screen reader.
- The dashboard code gets smaller on the landlord side: the card numbers, four sources and their text rules go.

**Negative / tradeoffs**:
- One more dependency (`recharts`, with `react-is`), loaded on one page only and lazily. A library upgrade can change chart internals.
- The landlord no longer sees tool cards on `/landlord`: the side menu is the only door, and a phone user opens the menu to reach a tool. This is the engineer's decision.
- A landlord with a stale token takes one extra request (the 403, the refresh, the second read) the first time. The refresh is capped at once per read.
- The preset ranges are computed from the browser clock. A wrong device clock shifts which preset looks active and which dates a preset writes; the days shown still come from the API `period`.
- Numbers of the period are low in the middle of the day because today counts from its first hour, and the page says nothing about it (the sentence was removed on 2026-11-20 at the engineer's request). Views by day only exist since 2026-11-16, so older ranges show zeros by design.
- `DatePicker` offers days from the start of last year only (its own limit), so a custom range cannot start earlier. Fine for now (views by day start in 2026), not for years of history.
- The first steps badge of the old cards ("Bắt đầu từ đây") is gone. The empty state replaces it, but only for a landlord with no listing, not for one with a listing and no property count to look at.

**Neutral**:
- Specs 0002, 0003, 0008, 0012 and 0020 get short notes (the table above). `src/components/AGENTS.md` and `src/lib/AGENTS.md` should mention `stats/`, `date-range.ts` and `refreshToken` after this ships (the job of `/sync`).
- The admin half of the dashboard, `ToolGrid` and `describeStat` stay until #40 removes them.
- The admin permissions page already lists the `statistic` keys (`src/features/admin-permissions/admin-permissions-text.ts`), so nothing changes there.

## Follow-up

- [ ] #40 (admin overview) reuses `src/components/stats/` and adds `AdminOverview` to `types.ts`. It decides how many series colours the chart needs (`--chart-1` and more) and how the ten daily columns are shown. When it ships, the admin cards, `ToolGrid`, `describeStat` and the `stat` field of `Tool` can all be deleted.
- [ ] #26 (revenue) reuses the range bar and the chart, and decides whether it groups by day or by month (the range bar has no `groupBy`).
- [ ] `/scope` should move the row of #39 to the ready to build shape and note that the landlord half of #31 is replaced (the scope row already says so). `/sync` should record the new shared folder and `refreshToken` in the nested `AGENTS.md` files.
- [ ] `DatePicker` has no `min` or `max` and offers only days from last year to three years ahead. If a range before that is ever needed, give it two props, a change owned by the feature that needs it.
- [ ] Specs 0003 to 0017 still list a `/dev/ui` milestone, and `design.md` points to `/dev/ui/screens` as examples. This spec follows the engineer's rule of 2026-11-12 (no new `/dev/ui` section) and does not edit them.
- [ ] `design.md` has no chart rules. This spec fixes the chart style (one line in `primary`, a light area, no animation, grid from `border`); `design.md` should get a short "Charts" note when #40 settles the multi series colours.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).
