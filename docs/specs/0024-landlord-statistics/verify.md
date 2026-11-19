# Verify: landlord statistics · spec 0024 · updated 2026-11-20

_Steps derived from spec 0024 acceptance criteria and its value sourcing table. `/check verify` runs these; `/test` locks the durable ones. Run as a demo landlord with listings, views and chats (Trần Minh Khoa had 17 listings on 2026-11-20), then as a landlord with no listing, a tenant and an admin._

## UI / manual

**Page, gate and range**

- [ ] Sign in as a landlord, open `/landlord` → h1 "Tổng quan", tab title "Tổng quan khu chủ trọ", no tool cards, the side menu lists every ready tool → AC-1, AC-19
- [ ] As a tenant and as an admin open `/landlord` → the existing forbidden state of the gate, no `GET /me/statistics` → AC-1
- [ ] As a landlord whose session lacks `statistic:read` and `statistic:manage` (an admin removed it) → the forbidden state "Tài khoản của bạn chưa có quyền xem thống kê…", no request is made → AC-1
- [ ] Open `/landlord` with no params → "30 ngày" pressed, the request has no `from` and no `to`, the caption reads the days of `period` → AC-2, AC-3, AC-5
- [ ] Open `/landlord?from=2026-02-30&to=2026-03-01`, `?from=2026-11-10&to=2026-11-01`, `?from=2025-01-01&to=2026-11-20` (too long) and `?from=2026-11-01` (one day only) → each acts as the default, "30 ngày" pressed, only the default request is sent → AC-2
- [ ] Open the pair that equals the 30 day default for today → "30 ngày" pressed, no params sent → AC-2
- [ ] Press 7, 90 and 365 days, then 30 → the address, caption, numbers and chart follow; "30 ngày" leaves a clean `/landlord`; no scroll to the top → AC-3
- [ ] Press "Tùy chọn" → two date fields seeded from the current range (the default pair when the address is clean), "Tùy chọn" pressed while open, the quick buttons not pressed → AC-3
- [ ] In the panel clear both days and press "Áp dụng" → "Chọn ngày bắt đầu" and "Chọn ngày kết thúc", no request → AC-3
- [ ] Pick a "Đến ngày" before "Từ ngày" → "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc", no request → AC-3
- [ ] Pick a range of 367 days or more → "Khoảng tối đa là 366 ngày", no request → AC-3
- [ ] Apply a valid custom range that matches no quick button → the address holds both days, "Tùy chọn" pressed, the panel closes; change the address by hand → the panel closes → AC-3
- [ ] At 320 px the range buttons are at least 44 px high; each is a group member with `aria-pressed` → AC-3, AC-18

**Request and loading**

- [ ] First load → one skeleton per block with a fixed height and the hidden text "Đang tải thống kê", no layout jump when the answer arrives → AC-4
- [ ] Change the range with a slow answer → the old content stays, the region has `aria-busy="true"`, "Đang cập nhật số liệu" is visible and spoken; a focus refetch is silent; a focus within 60 seconds makes no request → AC-4
- [ ] Count `GET /me/statistics` per range (resource timing) → one request per range, key per range, an abort on a range change cancels the one in flight → AC-4
- [ ] The caption ends today → the muted sentence "Hôm nay mới qua một phần…" shows; a range that ends earlier → it does not → AC-5

**Numbers, changes, chart and table**

- [ ] Four cards in order: Lượt xem, Lượt lưu mới, Người theo dõi mới, Cuộc trò chuyện mới, each with value, change note, "Kỳ trước: N" and a muted "Tổng từ trước đến nay: N" with no arrow; the views card also says "Lượt xem theo ngày tính từ 16/11/2026." → AC-6
- [ ] Compare each card with `GET /me/statistics` called by hand → every number and percent equals the API, nothing is divided in the browser → AC-6, AC-7
- [ ] Change notes: a rise (green, arrow up, "+33,3%"), a fall (red, arrow down), 0 ("0%", muted, no arrow), `changePercent` null with value above 0 ("Mới"), null with value 0 (a dash); each has the spoken sentence → AC-7
- [ ] Reply rate with a drop of points ("giảm 5 điểm"), with a null rate (a dash and "Chưa có cuộc trò chuyện nào mở trong khoảng này"), with only `changePoints` null (value, no change) → AC-7, AC-13
- [ ] Money changes use the same text and arrows in the muted colour; no current state number has an arrow → AC-7, AC-14
- [ ] Chart: four tabs, "Lượt xem" by default; the line is the primary colour, no animation, Y axis from 0 with whole number ticks and at least 4, `dd/MM` ticks thinned → AC-8
- [ ] Focus the chart and press the arrow keys → the tooltip reads "16/11/2026: 70 lượt xem" for each day; the chart box shows the focus ring; its accessible name says what it shows, the range and the total of the Metric → AC-8
- [ ] A range of one day draws a dot; a range of all zeros reads cleanly on a 0 to 4 axis → AC-8
- [ ] Switch tab, then change the range → the tab and the open table are kept; reload → they reset → AC-8
- [ ] "Xem bảng số liệu" (`aria-expanded`) opens a table with the caption, five columns, one row per day (30 rows at the default, 366 at the longest), a sticky header, a scroll region that is a keyboard stop, no totals row → AC-9

**Zones**

- [ ] "Tin xem nhiều nhất": up to five rows in the API order, each a link to `/landlord/listings/[id]/edit`, a badge for a listing guests cannot see ("Bạn đang ẩn", "Quản trị viên ẩn", "Chưa hiện công khai"), the views in range, a bar against the largest, and a muted total; an empty list says "Chưa có tin nào có lượt xem trong khoảng này" → AC-10
- [ ] "Tin đăng và gói": the plan strip, four rows (public, held back, "Bạn tự ẩn", "Quản trị viên ẩn"), a zero muted, "Tổng N tin", "Quản lý tin" opens "Tin của tôi" → AC-11
- [ ] Held back reason: plan or trial says "Ẩn bớt vì vượt hạn mức", expired says "Ẩn vì hết dùng thử và chưa có gói" → AC-11
- [ ] "Đánh giá": two panels ("Điểm của bạn", "Điểm của các phòng") with stars, score, count and new reviews with a change note; an average of null says "Chưa có đánh giá" and shows no stars; the two scores are never combined → AC-12
- [ ] "Tin nhắn": reply rate, replied conversations with a change note, "N cuộc, M tin chưa đọc" or "Không có tin chưa đọc", "Mở hộp thư" opens the inbox → AC-13
- [ ] "Chi tiêu (thanh toán thử)": spent and paid orders with muted change notes, a muted total since the start, "Xem lịch sử đơn" opens the orders page → AC-14

**Empty and failures**

- [ ] A landlord with no listing → the zones are replaced by "Bạn chưa có tin nào" with "Thêm nhà trọ" and "Đăng tin"; the range bar, the caption and the plan strip stay → AC-15
- [ ] A landlord with a listing and a quiet range → not empty: zeros, dashes and "Mới" in the zones, the chart and table show zeros → AC-15
- [ ] Network error (abort the request) and a 500 → the error state in place of the zones with "Thử lại" (a 500 adds the support code), no old numbers, the range bar still works; "Thử lại" goes to the loading skeleton and recovers → AC-16, AC-4
- [ ] A 429 with `Retry-After` → the countdown notice, "Thử lại" disabled until it ends → AC-16
- [ ] A 400 `VALIDATION_FAILED` with params in the address → the message and "Dùng 30 ngày gần nhất", which clears the params; with no params the button is not shown → AC-16
- [ ] A first 403 `PERMISSION_DENIED` → one `POST /auth/refresh`, one more read, numbers shown with no error; a second 403 → the forbidden state, once per read → AC-16, AC-17
- [ ] A landlord token issued before `statistic:read` existed → 403 once, refresh, numbers shown → AC-17
- [ ] Refresh fails with a 429, a 5xx or a network error → that state is shown and the session is kept; a 401 ends the session as elsewhere → AC-17

**Writes, layout and build**

- [ ] Post, hide, show or delete a listing, then open `/landlord` → the listing counts are new within the first read; pay for a plan, open `/landlord` → the plan, held back count and money are new → AC-20
- [ ] 320, 390, 768 and 1280 px → no sideways scroll; one column below `sm`, two cards from `sm`, four from `xl`; the zones pair from `lg` → AC-18
- [ ] Heading order → h1, a hidden h2 for the number cards, then one h2 per zone (h3 only for the two rating panels) → AC-18
- [ ] Tab through the whole page → every stop shows a focus ring; the tab list is one stop; the chart is one stop; icons and bars are hidden from a screen reader → AC-18
- [ ] Read `git diff` of `src/components/ui/chart.tsx` → no `dark:` classes, no dark selector, focus ring on the chart box, popover tokens in the tooltip → AC-21

**One step per row of the value sourcing table**

- [ ] The range sent: vary the address (valid, invalid, default) → what is sent is the address through `parseRange`, none means no params → AC-2
- [ ] "Today" for presets, the active preset and the partial day line: set the device time zone away from Vietnam (or the clock past midnight in Vietnam) → the preset dates and the "Hôm nay mới qua một phần" line follow `Asia/Ho_Chi_Minh` → AC-3, AC-5
- [ ] Range and previous range text: compare with `period.from`, `to`, `days`, `previousFrom`, `previousTo` → AC-5
- [ ] Period numbers: compare views, saves, followers, conversations, replied, new reviews, spent and paid orders with the `value` and `previous` of each Metric → AC-6, AC-12, AC-13, AC-14
- [ ] Percent changes: compare each with `changePercent` and confirm no division in the browser (a mocked answer with `changePercent` 12.3 and different values still shows 12,3%) → AC-7
- [ ] Reply rate and its change: compare with `chat.replyRate.value`, `previous`, `changePoints` → AC-7, AC-13
- [ ] Totals since the start: compare with `views.allTime`, `interest.totalFavorites`, `interest.totalFollowers`, `chat.totalConversations`, `spending.spentAllTime`, `ratings.*.count` → AC-6, AC-12, AC-14
- [ ] Chart points and table rows: compare with `series[]` (date and four columns); the row count equals `period.days` → AC-8, AC-9
- [ ] The total in the chart name: use a mocked answer whose `series` does not add up to the Metric `value` → the name shows the Metric `value`, not the sum → AC-8
- [ ] Top rows: link from `id`, badge from `status` and `isPublic` (mock each of the three) → AC-10
- [ ] Bar lengths: the largest row is full width and the others are proportional, with a zero row empty → AC-10, AC-11
- [ ] Held back reason: mock `membership.state` as `plan`, `trial`, `expired` → the three words → AC-11
- [ ] Plan strip: compare with `describeMembership` of `membership` and confirm no second `GET /me/membership` → AC-11
- [ ] Stars and score: compare with `ratings.*.average` through `formatRating`; null shows "Chưa có đánh giá" → AC-12
- [ ] Unread: compare with `chat.unreadConversations` and `chat.unreadMessages` → AC-13
- [ ] Whether to draw the screen: remove the permission of the landlord and press reload of the session (`GET /auth/me` is current, the token's copy is not) → the forbidden state or the screen follows `permissions` → AC-1
- [ ] Whether the screen is empty: mock `listings.total` as 0 and as 1 → the empty state follows `listings.total` only → AC-15
- [ ] Support code of a 5xx: compare with the `requestId` of the answer → AC-16
- [ ] Link targets: follow "Quản lý tin", "Mở hộp thư", "Xem lịch sử đơn", a top listing, "Thêm nhà trọ" and "Đăng tin" → each opens an existing page → AC-10, AC-11, AC-13, AC-14, AC-15, AC-21

## Commands

- [ ] `npm run check` → lint, typecheck, format check and contrast all pass; the contrast table holds green text and red text on `card` and the chart line on `card` → AC-18, AC-21
- [ ] `env -u NODE_ENV -u NEXT_RUNTIME -u NEXT_PRIVATE_START_TIME npm run build` (the API running and seeded) → passes, `/landlord` is listed → AC-21
- [ ] `npm ls recharts react-is` → `recharts` and `react-is@19.3.0` present; `grep -rn "any" src/features/landlord-stats src/components/stats` shows no `any` type → AC-21
- [ ] `grep -rn "LandlordDashboard\|isFirstStep\|Bắt đầu từ đây" src` → no match; `LANDLORD_NAV` still starts with "Tổng quan" → AC-19

## Acceptance-criteria coverage

- AC-1 … Page, gate and what goes · AC-2 … the range in the address · AC-3 … the range control · AC-4 … one request and loading · AC-5 … the period caption · AC-6 … number cards · AC-7 … change notes · AC-8 … chart · AC-9 … text table · AC-10 … top listings · AC-11 … listings and plan · AC-12 … ratings · AC-13 … chat · AC-14 … money · AC-15 … empty state · AC-16 … failures · AC-17 … forced token refresh · AC-18 … layout and accessibility · AC-19 … landlord card code removed · AC-20 … a write refreshes the statistics · AC-21 … reference and clean build. Each is covered by at least one step above.
