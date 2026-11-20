# 0025. Admin overview statistics on the admin overview

**Date**: 2026-11-20
**Status**: Accepted

## Summary

This spec turns `/admin` from a page of tool cards into a statistics page for the whole platform, read from the new `GET /statistics/overview`. The admin first sees what needs action (hidden listings and reviews, with links to the moderation pages) and the state of accounts, landlords and listings right now. Below a date range bar they see the numbers of the range with the change against the period before, one daily chart with six tabs, and where the new listings came from by ward. It reuses the range bar, number card, change note and chart that spec 0024 built for landlords, adds a second line to the chart, and deletes the old dashboard card code. The side menu stays the only way into the tools.

## Requirements

Seeded from scope item #40 and refined with the engineer. Contract with the backend: `api-for-frontend.md` section 6.43 (`GET /statistics/overview`), the Metric rules under it, and appendix B (`AdminOverview`). Patterns to follow: spec 0024 (the whole statistics screen, its range rules, the shared pieces in `src/components/stats/`, the landlord page as the model route), spec 0008 (the tool list and the menu, which stay), spec 0004 (zones and item cards on the canvas), and the admin moderation pages for the filtered links.

**Out of scope** (settled with the engineer or by the contract): the revenue page (#26) and any money number on `/admin` (section 6.43 has none; revenue and paid orders leave `/admin` until #26 returns them); a line for the previous period on the chart; grouping the daily series into weeks or months; export; a search box or paging for the ward list; links from the state zones to filtered lists (only the "Cần xử lý" strip links); comparing these numbers with a landlord's own (the contract says they count by different rules and must not be set side by side as one figure); any number worked out in the browser; a new colour token; a `/dev/ui` section or sample screen (the engineer's rule since 2026-11-12).

**User stories**:
- As an admin, I want to see at once how many listings and reviews are hidden by admins, and jump to the right list, so I know what needs me.
- As an admin, I want the size and state of the platform now (accounts by type and lock state, landlords on a plan, on trial or expired, listings by state), so I can tell if it is healthy.
- As an admin, I want new registrations, new listings and seven interest numbers for a range I choose, each with its change against the period before, so I see growth without remembering old values.
- As an admin, I want a daily chart grouped by topic, with the days as a table, so I can see when something changed.
- As an admin, I want to know which wards new listings come from, so I see where supply grows.
- As someone using a screen reader or a keyboard, I want charts as tables and changes as words, not as colour or a picture.
- As an admin on a phone, I want the same page to work at a narrow width, and a page that waits about 3 seconds for the server to show that it is waiting.

**Acceptance criteria** (the contract; each is checkable on its own):
- **AC-1**: Page, gate and what goes. `src/app/(admin)/admin/page.tsx` keeps its route, `export const instant = false`, no index and no follow, and the tab title "Tổng quan quản trị". Its `PageHeader` keeps the `h1` "Tổng quan" with the description "Số liệu của cả nền tảng: việc cần xử lý, trạng thái hiện tại và biến động theo khoảng ngày." (no sentence about money, the page shows none), and its body is the overview screen inside a `<Suspense>` boundary (the range is read with `useSearchParams`). The tool cards of the admin overview are gone, so the side menu is the only way into the tools. The screen is drawn only when the session holds `statistic:report` or `statistic:manage`; otherwise it shows `ForbiddenState` ("Tài khoản của bạn chưa có quyền xem tổng quan.") and no request is made. The query is enabled only when this check passes. A guest and a person of another account type are handled by the existing gate of the admin area, unchanged.
- **AC-2**: The range lives in the address, by the rules of spec 0024 AC-2 with the same `parseRange` (no params means the last 30 days ending today in Vietnam and the request carries no `from` and no `to`; anything that breaks the contract, or a pair equal to the 30 day default, acts as no params and is never sent). The days the screen shows always come from the answer's `period`.
- **AC-3**: The range control is the shared `RangeBar`, unchanged (spec 0024 AC-3: 7, 30, 90 and 365 day buttons, "Tùy chọn" with two date fields and "Áp dụng", `aria-pressed`, 44 px high below `md`). It sits between the state zones and the number cards. Everything above it ignores the range and everything below it follows it. A preset or a valid apply replaces the address without scrolling and the screen reads again.
- **AC-4**: One request, caching and loading. The screen makes one `GET /statistics/overview` per range through `useApi` and TanStack Query, key `["admin-stats", { from, to }]` (both `null` for the default), `staleTime` of 5 minutes, `refetchOnWindowFocus` off, the previous answer kept while a new range loads, and the abort `signal` passed. The server needs about 3 seconds when the platform has tens of thousands of listings, so nothing reads again on window focus and no timer reads. The first load draws one skeleton per block with a fixed minimum height, below the range bar and, while no answer has ever been kept, above it too (the bar is drawn at once, because it only needs the address), so nothing moves when the answer arrives, with the hidden text "Đang tải thống kê". While any read runs and an answer is drawn (a range change keeps the old answer, or an entry that AC-17 marked out of date is read again when the admin returns), one region around everything from the strip down, the range bar left out, is marked `aria-busy="true"` and a status line says "Đang cập nhật số liệu" (visible and spoken). A range that was read less than 5 minutes ago and was not marked out of date makes no request when it is opened again. The query inherits the project defaults and does not override them: refetch on mount on (AC-17 needs it), `gcTime` the 5 minute default (never less than `staleTime`), and one retry for a network error or a 5xx (`shouldRetryQuery`), so a failing read of 3 seconds shows its error after about 7 seconds.
- **AC-5**: The "Cần xử lý" strip. A zone at the very top with an `h2` "Cần xử lý" lists three rows from `toHandle`: "Tin đang bị quản trị viên ẩn" (`hiddenListings`), "Đánh giá chủ trọ đang bị ẩn" (`hiddenLandlordReviews`) and "Đánh giá phòng đang bị ẩn" (`hiddenRoomReviews`). A count above 0 is a link row that opens the matching moderation list already filtered to hidden by admin, built with the pages' own helpers: `adminListingsHref({ ...NO_MODERATION_FILTERS, status: "hidden_by_admin" }, 1)`, `adminReviewsHref({ ...NO_LANDLORD_FILTERS, status: "hidden_by_admin" }, 1)` and `adminReviewsHref({ ...NO_LISTING_FILTERS, status: "hidden_by_admin" }, 1)` (the room tab writes `?tab=listing`). A row is a link only when the session holds the permission of the matching entry of `ADMIN_TOOLS` (`moderation` for listings, `reviews` for both review rows), read from that entry and not typed again, otherwise it is plain text. A count of 0 is a muted "Không có" with no link. When all three are 0 the strip also says "Không có gì cần xử lý". Rows are at least 44 px high below `md`. These are numbers of the moment: no arrow, no previous value, and they do not change with the range.
- **AC-6**: Accounts. A zone "Tài khoản" (current state, no arrows) shows "Tổng" (`accounts.total`) with the quiet line "N đang hoạt động, M bị khóa" (`active`, `locked`), then three rows with a thin bar each: "Quản trị viên", "Chủ trọ" and "Người tìm trọ" (`byType.admin`, `landlord`, `tenant`, value `total`, the same quiet line from that type's `active` and `locked`). Bars compare each type with the largest of the three and are hidden from a screen reader. Numbers here and in AC-7 and AC-8 use `formatCount`, a zero is drawn in the muted colour, and a bar has width 0 when the largest value of its zone is 0.
- **AC-7**: Landlords. A zone "Chủ trọ" shows three rows with bars, "Đang có gói" (`landlords.onPlan`), "Đang dùng thử" (`onTrial`) and "Hết dùng thử, chưa có gói" (`trialExpired`), and "Tổng N chủ trọ" (`landlords.total`). All three rows are always drawn, a zero in the muted colour. No arrows.
- **AC-8**: Listings. A zone "Tin đăng" shows four rows with bars, always all four: "Đang hiện công khai" (`listings.public`), "Hiện nhưng khách không thấy" (`visibleButNotPublic`, with the quiet line "Chủ trọ bị khóa, hết dùng thử và hết gói, hoặc vượt hạn mức."), "Chủ trọ ẩn" (`hiddenByOwner`) and "Quản trị viên ẩn" (`hiddenByAdmin`), plus "Tổng N tin" (`listings.total`). A zero is in the muted colour. No arrows.
- **AC-9**: The eleven number cards, in two groups under the range bar, each card an item card on the canvas. A group heading (`h2`) "Đăng ký và tin mới" holds "Đăng ký mới" (`accounts.registered.total`), "Chủ trọ mới" (`registered.landlords`), "Người tìm trọ mới" (`registered.tenants`) and "Tin mới" (`listings.created`). A group heading (`h2`) "Mức quan tâm" holds "Lượt xem" (`engagement.views`), "Cuộc trò chuyện mới" (`conversations`), "Tin nhắn mới" (`messages`), "Đánh giá chủ trọ mới" (`landlordReviews`), "Đánh giá phòng mới" (`roomReviews`), "Lượt theo dõi mới" (`follows`) and "Lượt lưu mới" (`favorites`); under that heading a muted line says "Mọi số ở đây tính cả dòng đang bị ẩn hoặc của tài khoản bị khóa." Each card shows the value (`formatCount`), the change note, and "Kỳ trước: N" (`previous`). The change note follows spec 0024 AC-7 with the same `describeChange` (arrow, signed percent and words, green above 0, red below 0, muted with no arrow for 0, "Mới" or a dash when `changePercent` is null). No card shows a total since the start, because the API gives none. The "Lượt xem" card also says "Lượt xem theo ngày tính từ 16/11/2026." The two review cards are never added together.
- **AC-10**: The daily chart. A zone "Theo ngày" holds one chart of `series` and a switcher (`Tabs`) with six tabs, in this order, the first one chosen at the start: "Người dùng mới" (lines "Chủ trọ" from `newLandlords` and "Người tìm trọ" from `newTenants`), "Tin mới" (`newListings`), "Lượt xem" (`views`), "Trò chuyện" ("Cuộc trò chuyện" from `newConversations` and "Tin nhắn" from `newMessages`), "Đánh giá" ("Về chủ trọ" from `newLandlordReviews` and "Về phòng" from `newRoomReviews`) and "Quan tâm" ("Theo dõi" from `newFollows` and "Lưu" from `newFavorites`). The tab list scrolls sideways inside its own box at 320 px (the page does not). A tab has one or two lines. The first line is the `primary` token on a light area; the second is the `info` token, dashed, with no area, so colour is never the only difference. A tab with two lines shows a visible legend (the name of each line with a sample of its stroke) above the chart. No animation, a Y axis that starts at 0 with whole number ticks and one scale for both lines (from 0 to at least 4, set by the larger line), an X axis with `dd/MM` labels thinned to fit, one point per day, up to 366 points. The tooltip says the full day and the count of each line: with one line "16/11/2026: 70 lượt xem" as on the landlord page, with two lines the day and then "Chủ trọ: 3" and "Người tìm trọ: 12". Arrow keys move over the days. The accessible name reads "<tab> theo ngày từ dd/MM/yyyy đến dd/MM/yyyy" and then ", <line> tổng <N> <unit>" for each line, for example "Người dùng mới theo ngày từ 21/10/2026 đến 19/11/2026, Chủ trọ tổng 7 chủ trọ mới, Người tìm trọ tổng 38 người tìm trọ mới"; each total is the Metric `value` of its line (never a sum of points). The unit words are: chủ trọ mới, người tìm trọ mới, tin mới, lượt xem, cuộc trò chuyện, tin nhắn, đánh giá chủ trọ, đánh giá phòng, lượt theo dõi, lượt lưu. The chart has a fixed height. A range of one day draws a dot per line. The chosen tab and the open table are kept when the range changes and reset when the zone mounts again. The tab list, the lines, their Metric and unit words come from one table (`admin-chart-metrics.ts`).
- **AC-11**: The text table. Under the chart a button "Xem bảng số liệu" (`aria-expanded`) opens a native `table` with the caption "Số liệu theo ngày từ dd/MM/yyyy đến dd/MM/yyyy" (as on the landlord page), a "Ngày" column and one column per line of the chosen tab (one or two), one row per day of `series`, numbers with `formatCount` and days with `formatDateOnly`. The rows scroll inside a labelled region (a keyboard stop) with a sticky header. No totals row. The other tabs' columns are reachable by choosing the tab.
- **AC-12**: New listings by ward. A zone "Tin mới theo phường" lists the first 10 rows of `listings.createdByWard` in the API order: the rank (its position in the list, even when counts tie; the row key is `wardCode`), `wardName`, the count (`formatCount`) and a bar that compares the row with the largest shown (hidden from a screen reader). When the list has more than 10 rows it says "và N phường khác" (N is the length of the list minus 10, a count of rows that adds no counts) and a button "Xem tất cả" (`aria-expanded`, the label does not change) opens, under the top 10 which stays, a native table of every row in the API order (columns "Phường" and "Tin mới", the caption "Tin mới theo phường từ dd/MM/yyyy đến dd/MM/yyyy", a scroll region labelled "Bảng tin mới theo phường" with a sticky header, no totals row). An empty list says "Chưa có tin mới nào trong khoảng này". No total of the rows is shown; the total is the "Tin mới" card. The open table is kept when the range changes and reset when the zone mounts again.
- **AC-13**: Failures. The range bar stays usable in every case. A failure replaces the blocks below the bar with one failure state, so no old numbers stay under a new range (the rule of spec 0024: once a range has failed, the kept old answer is not drawn again below the bar, and "Thử lại" starts from the loading state). The strip and the three state zones above the bar ignore the range, so they stay on screen from the answer kept earlier, if there is one, and the page does not jump; after a first load that failed, nothing is above the bar. The chosen chart tab and the open tables reset after a failure, because their zones mount again. A network error or a 5xx shows `ErrorState` with the title "Không tải được tổng quan" and "Thử lại" (a 5xx adds the support code). A 429 shows `RateLimitNotice` with the countdown and keeps "Thử lại" off until the wait ends. A 400 `VALIDATION_FAILED` (the page validates first, so the contract moved) shows the message and "Dùng 30 ngày gần nhất" when params are present. A 403 `PERMISSION_DENIED` shows the message of AC-1 in a card below the bar, as `/landlord` does, with no token refresh (an admin token already carries `statistic:manage`, which includes `statistic:report`). A 401 or a 403 `ACCOUNT_LOCKED` is handled by the session layer, as everywhere else.
- **AC-14**: Layout and accessibility (WCAG AA). Desktop first and fine at 320 px with no sideways scroll. The strip and each state zone are `Card` zones with a heading; the three state zones sit in one column below `lg`, two columns at `lg` and three from `xl`; the number cards are one column below `sm`, two from `sm`, four from `xl`; the chart and ward zones are full width; no card inside a card. Heading order is `h1`, then one `h2` per zone and per card group. Icons and bars are `aria-hidden`. Controls follow the control heights of `AGENTS.md` and focus rings come from `FOCUS_RING`. Only semantic tokens are used (the lines are `var(--primary)` and `var(--info)`, the grid `var(--border)`), and the new pair, `info` on `card` as a graphic at 3:1, is added to `PAIRS` of `scripts/check-contrast.mjs` in the same change that draws the second line. The area tint under the first line is at most 12% of `primary`, so the `info` line crossing it holds far more than 3:1 and needs no second pair. The chart has no motion.
- **AC-15**: Shared pieces are lifted and `/landlord` does not change. The parts both screens need move to `src/components/stats/` and the landlord screen is migrated to them in the same change: the failure state, `useShownAnswer` (the rule that decides whether the kept answer is drawn after a failed range), the range in the address as a hook, and the words both screens use (loading, updating, retry, reset, "Kỳ trước"). `TrendAreaChart` and `TrendChart` replace their single series props with `lines`: one or two `ChartLine` entries (`key`, `name`, `unit`) and `points` rows that carry `date` and one number per line key; the landlord's call is migrated in the same task and the old props are removed. With one line it draws exactly what spec 0024 AC-8 describes. After the change every acceptance criterion of spec 0024 still holds on `/landlord`.
- **AC-16**: The old dashboard code is removed. `src/features/dashboard` (the admin cards, `ToolGrid`, `ToolCardView`, `describeStat`, the sources, `useStat`) is deleted, together with the "dashboard cards" section of `/dev/ui` and its mount in `src/app/dev/ui/page.tsx`. In `workspace-tools.ts` the `stat` field, `StatKey`, `groupTools`, `ToolGroup`, `visibleTools`, and the `group` and `description` of `Tool` go; if the type check finds another reader, that field stays and the spec gets a dated note saying who reads it. `ADMIN_NAV` and `LANDLORD_NAV` are unchanged: "Tổng quan" first and every ready tool after it.
- **AC-17**: A write refreshes the overview. The three admin write hooks that marked `dashboardKey` out of date (lock and unlock in `use-lock-flow.ts`, hide and unhide of listings in `use-moderation-flow.ts`, hide and unhide of reviews in `use-review-moderation.ts`) mark `["admin-stats"]` out of date instead (read again when next opened, not now), so the strip, the locked count and the hidden by admin row are right when the admin comes back to `/admin`.
- **AC-18**: Reference and clean build. `npm run check` and `npm run build` pass, with no hydration warning and no console error on `/admin`, no `any`, no link to a page that does not exist, and no new package and no new colour token.

## Decision

**Chosen option**: Option 1: One overview screen on `/admin` from one request, "now" zones above the range bar and the range numbers below it, with the shared stats pieces reused.

Replace the body of `/admin` with a screen built from one `GET /statistics/overview` read keyed by the range in the address. Put what ignores the range (the "Cần xử lý" strip and the accounts, landlords and listings zones) above the range bar and what follows it (eleven number cards, the daily chart, the ward list) below. Reuse the shared pieces of spec 0024 and add a second line to the chart.

**Implementation skills**: `tanstack-query-best-practices` (`deckardger/tanstack-agent-skills`, `.agents/skills/tanstack-query-best-practices/`) · `tailwind-design-system` (`wshobson/agents`, `.agents/skills/tailwind-design-system/`) · `next-dev-loop` (`vercel/next.js`, `.agents/skills/next-dev-loop/`)

The Next.js docs in `node_modules/next/dist/docs/` win over these skills where they disagree (project rule in `AGENTS.md`). Follow `src/app/(landlord)/landlord/page.tsx` for the route (a thin server page with a `<Suspense>` boundary around the client screen).

## Feature design

**Data model sketch**: no table and nothing stored in the browser. The model is the answer of `GET /statistics/overview` and three pieces of screen state.

| Item | Where | Notes |
|---|---|---|
| `AdminOverview` (seven blocks) | `src/lib/api/types.ts` | Copied from appendix B with `AccountCounts` and `AdminOverviewDay` (one entry of `series`, ten columns). `Metric` and the period type are reused from spec 0024. The percent fields are percent, so 33.3 means 33.3%. A doc comment says these numbers count every existing row, unlike `Statistics` of a landlord |
| The range | the address: `from`, `to` (`YYYY-MM-DD`) | No params means the default 30 days. A preset is not stored, only its two dates |
| The chart tab | React state of the zone | One of six keys; default the first |
| Open tables | React state of the chart zone and the ward zone | Each is a boolean |
| Cache entry | TanStack Query, key `["admin-stats", { from, to }]` | The whole answer: counts, dates, ward codes and names. No name, email or phone of any person (the API sends none) |

The pure modules of spec 0024 are reused as they are: `src/lib/date-range.ts` (`todayInVietnam`, `parseRange`, `presetRange`, `activePreset`, `validateRange`, `rangeQuery`, `rangeHref`) and `describeChange` in `src/components/stats/`. New pure functions in `src/features/admin-stats/`: `toHandleRows(toHandle, session)` (the three strip rows with their count, link or none, the permission of each read from the `moderation` and `reviews` entries of `ADMIN_TOOLS`), `splitWards(rows, 10)` (the shown rows and the number of rows left) and the six tab table `admin-chart-metrics.ts`. Today in Vietnam is read when needed, never kept from mount. The screen never renders on the server (the gate draws a loading state there).

**State transitions**:
- Screen: `loading` (skeleton below the bar, and above it only while no answer has ever been kept) → `ready` or `error` (network, 5xx, 429, 400, 403). A range change, or a read of an entry marked out of date, goes `ready` → `ready` with `aria-busy` and the old content, then the new answer. "Thử lại" goes `error` → `loading`; the strip and state zones stay from the kept answer.
- Forbidden: a 403 `PERMISSION_DENIED` goes to the forbidden state at once. There is no refresh and no second read.

**API surface** (one read, made in the browser with the access token in memory, through `useApi`, auth mode `required`):

| Endpoint | Method | Key inputs | Key outputs used | Auth | Key errors |
|---|---|---|---|---|---|
| `/statistics/overview` | GET | `from`, `to` (`YYYY-MM-DD`, both or none; no other param, the API answers 400 to any) | all seven blocks | bearer, `statistic:report` (an admin token carries `statistic:manage`, which includes it), admin account only; the API rereads the admin in the database on every call | 400 `VALIDATION_FAILED`, 401, 403 `PERMISSION_DENIED`, 403 `ACCOUNT_LOCKED` |

The API has no rate limit. The answer carries `Cache-Control: private, no-store`, which only tells the browser HTTP cache; TanStack Query holds it in memory for 5 minutes and the session clears it when the person changes. The server runs about sixteen queries in parallel and the read can take about 3 seconds, which is why there is no read on focus.

**Value sourcing** (every value the screen shows names where it comes from):

| Value shown | Source |
|---|---|
| The range sent | the address through `parseRange`; none means no params |
| "Today" for presets and the active preset | `todayInVietnam(new Date())`, the browser clock in `Asia/Ho_Chi_Minh` (decided in spec 0024) |
| The range text in chart names and table captions | `period.from`, `period.to` |
| Whether to draw the screen | `can(state, "statistic:report")` or `can(state, "statistic:manage")` on the `permissions` of `GET /auth/me` |
| Strip counts | `toHandle.hiddenListings`, `hiddenLandlordReviews`, `hiddenRoomReviews` |
| Strip links | `adminListingsHref({ ...NO_MODERATION_FILTERS, status: "hidden_by_admin" }, 1)`, `adminReviewsHref({ ...NO_LANDLORD_FILTERS, status: "hidden_by_admin" }, 1)` and `adminReviewsHref({ ...NO_LISTING_FILTERS, status: "hidden_by_admin" }, 1)`; a row is a link only when the session holds the permission of the `moderation` or `reviews` entry of `ADMIN_TOOLS`, read from that entry |
| Account rows | `accounts.total`, `active`, `locked`, `accounts.byType.admin`, `landlord`, `tenant` |
| Landlord rows | `landlords.onPlan`, `onTrial`, `trialExpired`, `total` |
| Listing rows | `listings.public`, `visibleButNotPublic`, `hiddenByOwner`, `hiddenByAdmin`, `total` |
| Card values and "Kỳ trước" | the `Metric` fields (`value`, `previous`) of `accounts.registered.*`, `listings.created`, `engagement.*` |
| Every percent change | `changePercent` of the answer. Never divided in the browser |
| Chart points and table rows | `series[]`, the columns of the chosen tab |
| The totals in the chart's accessible name | the Metric `value` of each line (table in `admin-chart-metrics.ts`), not a sum of points |
| Ward rows | `listings.createdByWard[]`: `wardName`, `count`, in the API order; the first 10 are drawn |
| "và N phường khác" | the length of `createdByWard` minus 10 (a count of rows) |
| Bar lengths | the row's count against the largest count shown in the same zone (a width only, hidden from a screen reader) |
| Support code of a 5xx | `describeError(error).requestId` |
| Whether the busy line shows | `query.isFetching` while an answer is drawn |
| Link targets | `ADMIN_LISTINGS_PATH`, `ADMIN_REVIEWS_PATH` with the filters above; no other link |

**Key invariants**:
- The page does no arithmetic on a count, a percent or a total of the answer. The only computing is with dates (presets, today in Vietnam), bar widths, which tick labels fit, and the number of ward rows left.
- Numbers of the moment (strip, accounts, landlords, listings states, ward list) never get an arrow. Only the `Metric` cards do.
- A pair the contract forbids is never shown: the two review cards are never added, the two lines of a tab are never summed, and the ward rows are never summed.
- The same fact may appear twice (`toHandle.hiddenListings` and `listings.hiddenByAdmin` are equal by contract), each from its own field.
- These numbers are never put beside a landlord's numbers as one figure. The page carries no money.
- A range that breaks the contract is never sent. The cache key is the range, so each range is its own entry.
- Each chart has its table one click away, and colour is never the only carrier: a change has its arrow, sign and words, and the second line is dashed with a legend.
- Nothing reads on window focus, and every admin write that can change an overview number marks the entry out of date.

**Security model**: the admin area gate already admits only admins. The screen additionally needs `statistic:report` or `statistic:manage` in the session, and the API enforces it with the admin read again from the database on every call, so a locked admin loses the page at once (403 `ACCOUNT_LOCKED`, handled by the session layer) and a landlord gets 403 whatever the page does. Hiding is a convenience. The answer has no name, email, phone, id or content of any person, only counts, dates, ward codes and ward names. The access token stays in memory, the cache is cleared when the session changes, and the page is no index. No regulated data beyond what the role already reads.

**Configuration required**: no environment variable, no credential, no new package and no new colour token. The second line uses the existing `--info`.

**Where the code goes** (names are binding for the shared parts, free for the rest):

| Path | What |
|---|---|
| `src/lib/api/types.ts` | `AccountCounts`, `AdminOverviewDay`, `AdminOverview` |
| `src/components/stats/stats-failure.tsx` | the failure state lifted from `landlord-stats`, with the forbidden message and the error title as props (here "Không tải được tổng quan") |
| `src/components/stats/use-shown-answer.ts` | `useShownAnswer(query)` returns `{ data, placeholder }`: the answer to draw, with the failed range rule inside; each screen decides what "busy" means from `placeholder` and `isFetching` |
| `src/components/stats/use-range-in-address.ts` | `useRangeInAddress()` returns `{ range, setRange }`: reads `from` and `to` with `parseRange`, writes with `rangeHref` and `router.replace(..., { scroll: false })` |
| `src/components/stats/stats-text.ts` | the words both screens use: loading, updating, retry, reset, `previousLine` |
| `src/components/stats/trend-area-chart.tsx`, `trend-chart.tsx` | `lines` prop in place of the single series props (`ChartLine`: `key`, `name`, `unit`; one or two), the dashed `info` second line, the legend, the two line tooltip |
| `src/features/landlord-stats/` | migrated to the lifted pieces, no change in what it draws |
| `src/features/admin-stats/api/admin-stats.ts` | `adminStatsKey`, `adminStatsRangeKey`, the reader, the `queryOptions` factory |
| `src/features/admin-stats/hooks/use-admin-stats.ts` | the answer for the range in the address and the permission check |
| `src/features/admin-stats/admin-stats-text.ts`, `admin-chart-metrics.ts`, `to-handle.ts`, `ward-rows.ts` | pure wording, the six tab table, the strip rows, the ward split |
| `src/features/admin-stats/components/` | `admin-stats-screen.tsx` and one file per block: strip, accounts, landlords, listings, the two card groups, daily chart zone, ward zone, skeleton |
| `src/features/admin-users/hooks/use-lock-flow.ts`, `src/features/admin-listings/hooks/use-moderation-flow.ts`, `src/features/admin-reviews/hooks/use-review-moderation.ts` | `adminStatsKey` in place of `dashboardKey` (AC-17) |
| `src/components/shells/workspace-tools.ts` | the cleanup of AC-16 |
| `scripts/check-contrast.mjs` | `controlOn("info", ["card"])` (AC-14) |
| `src/app/(admin)/admin/page.tsx` | thin server page: `PageHeader`, `<Suspense>` and the screen |
| deleted | `src/features/dashboard/`, `src/app/dev/ui/dashboard-cards.tsx` and its mount in `src/app/dev/ui/page.tsx`, its line in `src/app/dev/AGENTS.md` |

**Amendments to earlier specs** (the build adds a short dated note to each):

| Where | Was | Now |
|---|---|---|
| Spec 0008: the admin half of the dashboard (the admin cards, their number sources, `ToolGrid`, `describeStat`) | `/admin` shows tool cards with numbers | Replaced by this spec. The tool list, the menu, the sign in redirect and the account links stay |
| Spec 0023 (and the admin listing and review moderation rows in the scope): the write marks `dashboardKey` | the card numbers refresh after a lock, hide or unhide | They mark `adminStatsKey`; the cards are gone |
| Spec 0003: `/dev/ui` sections | has a "dashboard cards" section | The section is removed with the code it showed |
| Spec 0024: shared pieces | `StatsFailure`, the range hook and the words live in `landlord-stats`; `TrendAreaChart` draws one line | Lifted to `src/components/stats/`; the chart takes one or two lines. Its Follow-up item for #40 is done |

**Critical test scenarios** (each maps to an acceptance criterion):
- Happy path: an admin opens `/admin` and sees the strip, the three state zones, the bar at "30 ngày", eleven cards, the chart and the ward list; every number equals `GET /statistics/overview` called by hand, verifies **AC-1**, **AC-4**, **AC-5**, **AC-6**, **AC-7**, **AC-8**, **AC-9**.
- Range: press 7, 90, 365 and back to 30, and apply a custom range; the cards, chart and wards follow and the three state zones and the strip stay the same; a bad pair in the address acts as the default and is never sent, verifies **AC-2**, **AC-3**.
- Strip: counts above 0 link to the filtered lists; a 0 is "Không có"; all 0 adds "Không có gì cần xử lý" (force it with a pass through proxy on `API_URL`); an admin without `listing:moderate` sees the count as text, verifies **AC-5**.
- Changes: a rise, a fall, zero, a null with value above 0 and a null with value 0 on the cards, verifies **AC-9**.
- Chart and table: switch the six tabs, check two lines, the legend, the dashed second line, the tooltip with both counts, arrow keys, the accessible name with two totals, and the table columns of the tab and the row count equal to `period.days` (also at 366), verifies **AC-10**, **AC-11**.
- Wards: a list with 10 rows or fewer, one with more (168 on the seed after a long range), and an empty one; "Xem tất cả" opens every row, verifies **AC-12**.
- Slow and cached: delay the answer by 3 seconds; the skeleton has no jump, the bar is usable, focus the tab again and no request is made, return within 5 minutes and no request is made, verifies **AC-4**.
- Failure: abort the request, a 500, a forced 400 and a forced 403 `PERMISSION_DENIED` (and, only if easy to force, a 429 with a wait: the endpoint has no rate limit); each shows its state below a usable bar, and when a range that was read before fails the strip and state zones stay on screen, verifies **AC-13**.
- Writes: lock then unlock a throwaway account, hide then unhide a listing and a review of each kind, return to `/admin`; the old numbers show first with "Đang cập nhật số liệu", then the strip, locked count and hidden row are new, verifies **AC-4**, **AC-17**.
- Auth: a landlord and a tenant who open `/admin` see the existing forbidden state of the gate and no `GET /statistics/overview`, verifies **AC-1**.
- Landlord page: open `/landlord` and repeat its range, chart, failure and one line checks, verifies **AC-15**.
- Layout: 320, 390, 768 and 1280 px with no sideways scroll, keyboard only through the whole page, verifies **AC-14**.

## Build plan

Tracer Bullet (the project default, `AGENTS.md`): first one thin real thread through every layer (lifted shared pieces, types, query, route, gate, skeleton, strip, range bar, one card, one chart with its table), checked on the real route with the demo backend; then the other numbers, the two line chart and the ward zone; then the state zones and the failures; then the cleanup and the polish. Each milestone runs end to end. No `/dev/ui` milestone (the engineer's rule since 2026-11-12): check on the real route, and force the failures with a route abort, a fetch wrapper or a pass through proxy on `API_URL`.

1. **M1, the thin thread**: lift `StatsFailure`, `useShownAnswer`, `useRangeInAddress` and the shared words to `src/components/stats/` and migrate the landlord screen, then open `/landlord` and check it did not change (the chart moves to `lines` in task 7), satisfies **AC-15**.
2. **M1**: the types in `types.ts`, the query in `src/features/admin-stats/api/` (key, 5 minute `staleTime`, no focus read, no refresh on 403) and the hook with the permission check, satisfies **AC-1**, **AC-2**, **AC-4**.
3. **M1**: the page body: the `Suspense` route, `AdminStatsScreen` with the gate, the skeleton above and below the bar, the "Cần xử lý" strip with its links, and the shared range bar between them, satisfies **AC-1**, **AC-3**, **AC-4**, **AC-5**.
4. **M1**: the "Lượt xem" card with `describeChange`, and the "Theo ngày" zone with the views line through the existing chart and its text table, satisfies **AC-9** (views card), **AC-10** (one line), **AC-11**.
5. **M1**: open `/admin` as the demo admin and check the thread (strip counts and links equal the API and open the filtered lists, the views card, the chart draws, the table opens, a range change reads again), satisfies **AC-1**, **AC-4**, **AC-5**, **AC-10**, **AC-11**.
6. **M2, every period number**: the other ten cards in the two groups with their headings and the two notes, satisfies **AC-9**.
7. **M2**: the `lines` prop in place of the single series props of the chart, with the landlord's call migrated in the same task (dashed `info` second line, legend, two line tooltip, shared scale), the `info` on `card` pair in `PAIRS`, the six tab table and the table columns of the chosen tab, then open `/landlord` again, satisfies **AC-10**, **AC-11**, **AC-14** (the pair), **AC-15**.
8. **M2**: the "Tin mới theo phường" zone with the top 10, "và N phường khác" and the full table, satisfies **AC-12**.
9. **M3, the state zones**: "Tài khoản", "Chủ trọ" and "Tin đăng" with their rows, bars and quiet lines, satisfies **AC-6**, **AC-7**, **AC-8**.
10. **M3**: the failure states (network and 5xx, 429 with the countdown, 400, 403 forbidden), the forbidden state of the gate, and `aria-busy` with "Đang cập nhật số liệu" on a range change, satisfies **AC-13**, **AC-1**, **AC-4**.
11. **M4, cleanup**: switch the three write hooks to `adminStatsKey` first, then delete `src/features/dashboard`, the `/dev/ui` section and the dead parts of `workspace-tools.ts`, then search `src` for any import of `features/dashboard` and for `dashboardKey`, satisfies **AC-16**, **AC-17**.
12. **M4, polish**: check 320, 390, 768 and 1280 px, the heading order, focus and keyboard on the chart and both tables, the contrast pair, the dated notes in specs 0003, 0008, 0023 and 0024, `npm run check` and `npm run build`, and the console on `/admin` and `/landlord`, satisfies **AC-14**, **AC-15**, **AC-18**.

Every AC appears in at least one task and every task names an AC.

## Consequences

**Positive**:
- An admin sees what needs action first, the platform's state right now, and how the range moved it, in one read with every percent computed by the server.
- The strip turns a number into a click: from a hidden count straight to the moderation list that is already filtered.
- The shared stats pieces now serve two screens, and #26 (revenue) is mostly composition.
- The dashboard code shrinks: the admin cards, four number sources, `ToolGrid`, `describeStat`, a `/dev/ui` section and three cache marks go.
- The chart and tables are words as well as pictures, so the page is usable by keyboard and screen reader.

**Negative / tradeoffs**:
- `/admin` no longer shows revenue or paid orders, and no tool cards, until #26 returns the money numbers; the side menu is the only door (a phone user opens the menu to reach a tool). This is the engineer's decision.
- The first read can take about 3 seconds, and a 5 minute cache means numbers can be up to 5 minutes old (other people's writes show only after that, or after a range change). There is no refresh button.
- Two lines on one scale: when one is much bigger (messages against conversations, tenants against landlords) the smaller one looks flat. The legend, the tooltip and the table keep the exact numbers.
- The shared chart gets a `lines` prop and the landlord screen is edited to use lifted pieces, so a mistake could change `/landlord`. AC-15 makes that a checked requirement.
- A landlord's own numbers and these numbers count by different rules (these include hidden reviews and locked accounts), so they will not add up. One line under "Mức quan tâm" says so and nothing else compares them.
- The ward table can be 168 rows long. It is closed by default and scrolls in its own region.
- A catalog rename can show an old ward name for up to 5 minutes, because the catalog write does not mark this entry out of date.
- The default range is one cache entry for 5 minutes, so just after midnight the bar can say "30 ngày" while `period` still ends yesterday, until the entry is read again.
- A failed range resets the chosen chart tab and the open tables, because their zones mount again. This is accepted to keep the tab state inside its zone.

**Neutral**:
- Specs 0003, 0008, 0023 and 0024 get short notes (the table above). `src/components/AGENTS.md`, `src/lib/AGENTS.md` and `src/app/dev/AGENTS.md` should mention the lifted pieces and the removed section after this ships (the job of `/sync`).
- The scope rows of #31 and #40 already say the admin half of #31 is replaced; `/scope` should move #40 to the ready to build shape.
- The admin permissions page already lists the `statistic` keys, so nothing changes there.

## Follow-up

- [x] #26 (revenue) reuses the range bar and the chart and brings back the money numbers (paid orders and revenue, test payments) that leave `/admin` here. It decides whether it groups by day or by month. Done 2026-11-20 on the revenue page only (spec 0026, `/admin/revenue`, groups by day or by month); `/admin` stays without money.
- [ ] A link from the "Bị khóa" figure of the accounts zone to `/admin/users` filtered to locked accounts would be cheap (the contract says the numbers equal the totals of `GET /users` with that filter). Left out here because only the strip links; add it if admins ask.
- [ ] `design.md` has no chart rules. Add a short "Charts" note now that two lines exist (the `primary` line on a light area, the dashed `info` line, no animation, grid from `border`). Spec 0024 asked for this once #40 settled the colours.
- [ ] `/scope` should move the row of #40 to the ready to build shape. `/sync` should record `src/features/admin-stats/`, the lifted `src/components/stats/` pieces and the removed `src/features/dashboard/` in the nested `AGENTS.md` files.
- [ ] Specs 0003 to 0017 still list a `/dev/ui` milestone; this spec follows the engineer's rule of 2026-11-12 and does not edit them.
- [ ] If an admin needs fresh numbers inside the 5 minute window, add the "Đọc lại" button with the time of the read (the engineer chose not to for now).

## Rationale

Reasoning and options: see [rationale.md](rationale.md).
