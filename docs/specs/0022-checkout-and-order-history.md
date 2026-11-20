# 0022. Checkout and order history

**Date**: 2026-11-16
**Status**: Accepted

## Summary

This spec adds the two landlord pages that finish buying a plan. The order page at `/landlord/orders/[id]` shows what is being bought and lets the landlord confirm it with a test payment or cancel it. The history at `/landlord/orders` lists every order by status. After a test payment the same page turns into the paid result, and the status strip, the dashboard and the pricing page read fresh data. Today a press on "Mua" ends on the 404 page, and this spec removes that gap.


> **Amended 2026-11-20 (no spec of its own, at the engineer's request)**: a row of the history (AC-15) no longer has the "Kỳ gói" column or the period text in the stacked block. Every row, whatever its status, gets "Xem chi tiết" with the plan, price, limit, status, the dates of creation, payment and cancel, and the period of a paid order. The buttons "Tiếp tục thanh toán" and "Hủy" are unchanged. The admin list of every landlord's orders (#25) follows the same rule and gains a "Thao tác" column with "Xem chi tiết" only.
## Context

> ⚠️ Premise note: The scope says "hủy đơn đã trả báo `ORDER_STATE_INVALID`", but the page never shows a cancel button on a paid order, so that error can only reach a person through a second browser tab (paid in one tab, cancel pressed in the other). Test it with two tabs, not with a button. The test payment is only a click: no card data is read or sent, so no compliance scope applies.

A landlord who presses "Mua" on `/bang-gia` (spec 0021) ends on the 404 page and leaves a real unpaid order that nothing in the app can pay or cancel. A landlord on `expired` therefore cannot get a plan from the app at all, and the demo's core flow (choose a plan, pay, post listings) stops halfway.

Backend facts that shape the design (`api-for-frontend.md`, section 6.27 and "Bảng giá gói"). A landlord has at most one unpaid order, and a new order cancels it. An order keeps a fixed copy of the plan (name, price, limit, days), so it is shown from its own fields. `GET /orders` lists the caller's own orders, newest first, with `page`, `pageSize` and an optional `status`. `GET /orders/:id` answers 404 `ORDER_NOT_FOUND` or 403 `NOT_RESOURCE_OWNER`. `POST /orders/:id/pay` (permission `order:create`, landlord account only, no body) answers 200 with the paid order and its period. Paying a paid order answers the same 200 and makes no second period. A cancelled order answers 409 `ORDER_STATE_INVALID`, and a plan turned off answers 409 `PLAN_INACTIVE` while the order stays pending. `POST /orders/:id/cancel` (permission `order:cancel`, no body) answers 200, a cancelled order answers 200 again, and a paid order answers 409 `ORDER_STATE_INVALID`. Paid and cancelled are final. A plan bought while another one runs joins after it, and `GET /me/membership` gives `subscription.paidUntil`, the end of everything already paid.

What already exists. Spec 0021 fixed the two addresses and built `src/features/order/` (`ordersKey`, `pendingOrderKey`, `orderKey(id)`, `createOrder`, `orderHref`, `ORDERS_PATH`). A successful press already stores the new order under `orderKey(id)` and marks the orders out of date. Spec 0020 gave the shared membership entry and `MembershipStrip`. The list of my listings (#12, spec 0019) is the pattern for a landlord list: one zone, line tabs in `?status=` and `?page=`, a table from `md` and stacked blocks below, one shared dialog, `lastPageOf`. The dashboard tool "Gói và đơn của tôi" (`billing.mine`) is still `soon`. The landlord pages sit behind the route gate, so their data is read in the browser with the token held in memory. Spec 0021 left a follow up for this feature: build both pages, turn the tool to `ready`, and after a test payment mark `membershipKey` and `ordersKey` out of date.

## Requirements

Seeded from scope item #19 and refined with the engineer. Contract with the backend: `api-for-frontend.md` section 6.27 (`GET /orders`, `GET /orders/:id`, `POST /orders/:id/pay`, `POST /orders/:id/cancel`) and section 6.25 (`GET /me/membership`). Patterns to follow: spec 0021 (the order feature, `classifyBuyError`, the lock with `aria-disabled`, the notice area), spec 0020 (the shared membership entry and `MembershipStrip`), spec 0019 (the landlord list, the shared dialog, focus when a row leaves, `BreadcrumbTrail`), and `design.md`.

**Out of scope** (settled with the engineer): real payment of any kind, refunds, changing a plan in the middle of a period, searching orders by code, export or print, a receipt or invoice, the admin view of all orders (#25), revenue (#26), polling, and a count on each filter tab (the API gives none without one call each).

**User stories**:
- As a landlord who just pressed "Mua", I want to see what I am buying and when it starts, and confirm with a test payment, so that my plan starts at once.
- As a landlord, I want to cancel an unpaid order I no longer want, so that it stops waiting.
- As a landlord, I want to see all my orders by status, and continue paying or cancel an unpaid one, so that I never lose track of an order.
- As a landlord with a running plan, I want to be told that a new plan starts after the running one, so that I know no days are lost.
- As a landlord, I want a calm message with a next step when a plan was turned off, an order changed in another tab, or I send too many requests.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):

The order page, `/landlord/orders/[id]`:
- **AC-1**: The page is in the `(landlord)` group, behind the route gate, titled "Đơn mua gói", kept out of search (`noindex`), and has `instant = false` like the other gated pages. It reads in the browser with the token. A person without `order:read` sees `ForbiddenState` and no request is made. An id that is not a UUID shows the not found state with no request (`isUuid`).
- **AC-2**: The order comes from one query under `orderKey(id)`. An order already in the cache (stored by a press on "Mua", spec 0021) shows at once and is read again in the background. With nothing cached the page shows a loading state of the same shape. A later failed read keeps the order on screen, and window focus reads it again, so a payment made in another tab shows up.
- **AC-3**: Every status shows a breadcrumb "Gói và đơn của tôi" to `ORDERS_PATH`, an `h1` by status ("Xác nhận đơn", "Đơn đã thanh toán", "Đơn đã hủy"), a status badge with words and an icon, and one summary zone: the plan name, the price with `formatMoney` and "mỗi N ngày", "Hiện cùng lúc tối đa N tin", the order code and the day the order was made. Every value is the order's own field and is never read again from `GET /plans`.
- **AC-4**: A pending order says "Đây là thanh toán thử, không có tiền thật." When the shared membership has `state` equal to `plan`, one line says "Gói mới bắt đầu sau khi gói hiện tại hết, vào <paidUntil>." When `state` is `trial` or `expired`, it says "Gói bắt đầu ngay khi bạn thanh toán xong." While the membership read is loading, failed or refused, no start line is drawn and nothing is blocked. A further line says "Chọn gói khác ở bảng giá sẽ hủy đơn này." with a link "Xem bảng giá" to `PRICING_PATH`.
- **AC-5**: For a pending order, "Thanh toán thử" calls `POST /orders/:id/pay` with no body. On 200 the answer is stored under `orderKey(id)`, `ordersKey` and `membershipKey` are marked out of date, and the page turns into the paid view in place. There is no toast, because the result is the page. Focus moves to the new `h1`.
- **AC-6**: The paid view shows "Thanh toán lúc <paidAt>" and "Kỳ gói: từ <startsAt> đến hết <endsAt>" from the order, the same summary, and two links: "Xem tin của tôi" (`MY_LISTINGS_PATH`) and "Đăng tin mới" (`NEW_LISTING_PATH`). It has no pay or cancel button. A paid order opened later (from the history or after a reload) shows the same view.
- **AC-7**: For a pending order, "Hủy đơn" opens an alert dialog: the title "Hủy đơn này?", the safe button "Giữ đơn" and the destructive action "Hủy đơn". Confirming calls `POST /orders/:id/cancel` with no body. On 200 the answer is stored under `orderKey(id)`, `ordersKey` is marked out of date (the limit does not change, so `membershipKey` is left alone), and the page turns into the cancelled view in place: "Đã hủy lúc <cancelledAt>" and the links "Xem bảng giá" and "Về lịch sử đơn". Focus moves to the new `h1`. A cancelled order opened later shows the same view with no button.
- **AC-8**: "Thanh toán thử" shows only when `canBuyPlans(session)` is true (a landlord holding `order:create`), and "Hủy đơn" only with `order:cancel`. With neither, one line says "Tài khoản này không thể thanh toán hay hủy đơn." While a pay or a cancel runs, both buttons are locked with `aria-disabled` (focus stays on the pressed one), the pressed one reads "Đang thanh toán" or "Đang hủy" with a spinner and `aria-busy`, a second press in the same instant sends nothing, and nothing is sent again by itself.
- **AC-9**: A `409 PLAN_INACTIVE` on pay shows a `warning` notice with the backend sentence and two ways out, "Chọn gói khác" (a link to `PRICING_PATH`) and "Hủy đơn". The order stays pending and "Thanh toán thử" stays available, because the backend decides every press.
- **AC-10**: A `409 ORDER_STATE_INVALID` on pay or cancel (cancelled in another tab, or paid in another tab) shows a `warning` notice with the backend sentence, and the order is read again so the page shows its real status (the cancelled view or the paid view). A `404 ORDER_NOT_FOUND` or `403 NOT_RESOURCE_OWNER` on pay or cancel switches the page to the not found state.
- **AC-11**: A `429` shows the shared `RateLimitNotice` with its countdown, and both buttons stay locked until the wait ends. A `403 PERMISSION_DENIED` shows a `warning` notice with the backend sentence and hides both buttons for the rest of the visit. A `401` and `ACCOUNT_LOCKED` are left to the session layer (spec 0002), with no notice here. Any other failure (network, timeout, 5xx, 400) shows a destructive `Alert` with the message from `describeError` (and the support code for a 5xx), and the buttons stay. There is one failure notice at a time, and a new press clears the old one.
- **AC-12**: A failed read of the order: `404 ORDER_NOT_FOUND` and `403 NOT_RESOURCE_OWNER` both show the same `NotFoundState` "Không tìm thấy đơn" with a link to the history, so nothing says that an order with that id exists. A `403 PERMISSION_DENIED` shows `ForbiddenState`. A `429` shows the rate limit notice with a "Thử lại" that stays locked during the wait. Anything else shows `ErrorState` with "Thử lại" (and the support code for a 5xx).

The history, `/landlord/orders`:
- **AC-13**: The page is gated, titled "Gói và đơn của tôi", `noindex`, `instant = false`, and built on `ORDERS_PATH`. A person without `order:read` sees `ForbiddenState` and no request is made. `PageHeader` holds the `h1` "Gói và đơn của tôi", a description that says payment is a test payment, and the action "Mua gói" (a link to `PRICING_PATH`). Under it sits `MembershipStrip` with `showAction={false}`, from the shared membership entry (no extra request). It keeps its own states and never blocks the list.
- **AC-14**: One `Card` zone holds line tabs and the list. The tabs are real links "Tất cả", "Chờ thanh toán", "Đã thanh toán" and "Đã hủy" to `?status=pending`, `?status=paid` and `?status=cancelled` (no value means all, and an unknown value is treated as all), plus `?page=`. A new filter starts on page 1. One read of `GET /orders` carries `status`, `page` and `pageSize` 10, and the rows keep the order the API gave (newest first), with no sort in the front end. A heading above the rows gives the count from `total`, is read out politely when it changes, and is where focus goes when a row leaves.
- **AC-15**: The rows are a table from `md` and stacked blocks below. Each row shows the code (a link to the order page by `orderHref`), the plan name and the price from the order, the status badge, the day the order was made, and for a paid order the period from `startsAt` to `endsAt`. A pending row has "Tiếp tục thanh toán" (a link to the order page) and "Hủy" (opens the cancel dialog). Buttons in the table are 32 px high and buttons in the blocks are 44 px.
- **AC-16**: "Hủy" on a row opens the same alert dialog as AC-7, one dialog for every row. On 200 `ordersKey` is marked out of date and the row shows "Đã hủy", or leaves the list when the filter is "Chờ thanh toán", and then focus moves to the list heading. Failures show inside the dialog, which stays open. A `409 ORDER_STATE_INVALID` shows the backend sentence and the list is read again behind it. A `429` shows the countdown with the confirm button locked. A `403 PERMISSION_DENIED` says so and hides the "Hủy" buttons for the visit. Any other failure is the destructive alert with `describeError`.
- **AC-17**: With no orders at all the page shows `EmptyState` "Bạn chưa có đơn nào" with "Xem bảng giá". With no order for a filter it shows "Chưa có đơn nào ở mục này" with "Xem tất cả đơn". While the first read runs it shows the table skeleton. A failed first read shows `ErrorState` with "Thử lại", and a 429 shows the countdown with "Thử lại" locked. A page past the last one goes to the last page that has rows (`lastPageOf`), never while the rows on screen belong to the page before.
- **AC-18**: The tool `billing.mine` changes from `soon` to `ready` with `href` set to `ORDERS_PATH`, so the dashboard card links to it and the side menu gains "Gói và đơn của tôi". The menu item is the current page on `/landlord/orders` and on an order page.

Both pages:
- **AC-19**: Each page has one `h1`. Every notice uses words and an icon, never color alone, and is a quiet `status` region except the red failure. Tokens are semantic only, with no new color pair. The main buttons of the order page are `size="lg"`. At 320, 390, 768 and 1280 px nothing scrolls sideways. When the order page switches view, focus goes to the `h1`. When a dialog closes, focus returns to what opened it, or to the list heading when that row is gone (`useReturnFocus`). Every string is Vietnamese, money uses `vi-VN`, and dates use `Asia/Ho_Chi_Minh`.
- **AC-20**: The front end computes nothing the backend owns: no order of the rows, no price or limit, no end of a period, no guess that a press will be accepted. The only checks are the session permissions, the order's own `status`, `membership.state` equal to `plan`, and whether the list has rows.

## Options considered

### Option 1: One order page for every status, plus a history list

The address `/landlord/orders/[id]` is the confirmation of an unpaid order, the result after payment, and the detail of an old order, all drawn from the order's `status`. Pay and cancel live there, and a pending row in the history links to it. The history is a list with status tabs.

**Pros**:
- Matches the address spec 0021 already fixed, so the pricing page and its pending notice need no change.
- The address survives a reload and works from the history, from "Tiếp tục thanh toán" and from "Mua".
- One place holds the plan snapshot, the start date and the test payment note, so payment is never pressed blind.

**Cons**:
- The page has three views to draw and test, and a stale tab can land on a view the person did not expect.

### Option 2: A confirmation page for unpaid orders and a separate receipt page for paid ones

An unpaid order opens a confirmation page, and after payment the browser moves to a different receipt address.

**Pros**:
- Each page does one thing, and the receipt can be printed or shared without buttons.

**Cons**:
- The address changes after payment, so a reload or the back button lands on a page that no longer fits the order.
- Two routes and two loading and failure shapes for one order, and the history needs a rule for which address a row opens.

### Option 3: No order page, confirm and pay in a dialog

"Mua" and the history open a dialog that holds the summary and the pay and cancel buttons.

**Pros**:
- Fewer pages, and the person never leaves the pricing page or the history.

**Cons**:
- Spec 0021 sends the browser to `/landlord/orders/<id>`, so the pricing page would need rework.
- No address for an order: a reload loses it, and "Tiếp tục thanh toán" has nowhere to point.

## Decision

**Chosen option**: Option 1: One order page for every status, plus a history list.

The order page at `/landlord/orders/[id]` is the confirmation, the result and the detail of an order, with pay and cancel only there (cancel also on a pending row of the history). The history at `/landlord/orders` lists orders by status with tabs and pages.

**Implementation skills**: `tanstack-query-best-practices` (`deckardger/tanstack-agent-skills`, `.agents/skills/tanstack-query-best-practices/`)

**Decided by the engineer**:
- After a successful test payment the page stays and turns into the paid result, with the period dates and two links ("Xem tin của tôi", "Đăng tin mới").
- The history has a "Mua gói" button in its header and the shared status strip under it, without the strip's own buy button.
- Cancelling an unpaid order asks first, with an alert dialog on both pages.
- Someone else's order and an id that does not exist show the same not found page.
- A `PLAN_INACTIVE` on pay warns, keeps the order, and offers two ways out: "Chọn gói khác" and "Hủy đơn".
- Payment happens only on the order page. A pending row of the history has "Tiếp tục thanh toán" (a link) and "Hủy" (the dialog).

**Decided here (recommended, the engineer may override)**:
- The order code grows in `src/features/order/` (queries, pay and cancel calls, the failure classifier, the pages and rows), next to what spec 0021 built. Why: both features use the same orders. Runner up: a new `checkout` folder, rejected because it would split one entity across two folders.
- One pure function `classifyOrderError` sorts a failed pay or cancel into `plan-gone`, `conflict`, `rate-limited`, `denied`, `not-found`, `session` and `other`, in the style of `classifyBuyError`. Why: both buttons share every failure. Runner up: one function per action, rejected as duplicated rules.
- The lock is `aria-disabled` plus a ref guard, as on the pricing page and the follow button. Why: focus stays on the pressed button and a double press sends one request.
- After a 200 from pay or cancel the answer is stored under `orderKey(id)` and `ordersKey` is marked out of date (one extra read of the order is accepted). After pay only, `membershipKey` is marked out of date too. Why: it is the one rule that cannot leave the strip, the dashboard or the pricing notice stale. Runner up: invalidate exact keys, rejected as more code to save one read.
- `OrderStatusBadge` draws the status as words with an icon: "Chờ thanh toán" (`warning`, clock), "Đã thanh toán" (`success`, check), "Đã hủy" (`secondary`, cross). Why: status is never color alone (`design.md`).
- The history shows 10 rows a page, the day of each date through `formatDateTime`, and no count on the tabs. Why: it matches #12, and the API has no counts.
- No toast anywhere: every result is shown on the page. Why: the result carries dates the person may want to read again.

## Rationale

The forces in Context point one way. Spec 0021 already sends the browser to `/landlord/orders/<id>` and shows "Tiếp tục thanh toán" with that address, so Option 3 would undo a built and tested flow, and Option 2 would change the address in the middle of it. A single page driven by `status` keeps one address that survives a reload, which matters because the backend lets an unpaid order wait forever and the person will come back to it from the history.

Payment needs the context beside it: the plan snapshot, the start date (after the running plan or at once) and the note that it is a test payment. That is why pay happens only on the order page and a history row links to it. Cancelling is final, so it asks first, and the row button is easy to hit by mistake in a table.

Every failure is a message with a next step, not a system error, and every control the backend would refuse is hidden or locked on the same permission rules as the rest of the app (the backend still decides). The pages read in the browser because the gate and the token live there, and the shared membership entry keeps the strip, the dashboard and the start line from ever disagreeing.

## Feature design

**Data model sketch**: none. There is no storage and no new API. The `Order`, `Page<Order>` and `Membership` types already exist in `src/lib/api/types.ts`, and `ORDER_NOT_FOUND`, `ORDER_STATE_INVALID`, `NOT_RESOURCE_OWNER` and `PLAN_INACTIVE` are already in `ERROR_CODES`. New client state is one cache key and small component state.

| Key | Holds | Note |
|---|---|---|
| `ordersKey` = `["orders"]` | the prefix of every order entry | marked out of date after a pay or a cancel |
| `pendingOrderKey` = `["orders","pending"]` | the unpaid order of the pricing notice | exists (spec 0021) |
| `orderKey(id)` = `["orders", id]` | one order | written by "Mua" (201), by pay and cancel (200), read by the order page |
| `ordersListKey({status,page,pageSize})` = `["orders","list",{...}]` | one page of the history | new, starts with `ordersKey` |
| `membershipKey` | the shared membership | exists (spec 0020), marked out of date after a pay |

`list` and `pending` can never collide with an order id, because ids are UUIDs. The session clears the cache when it changes, so no key needs a user id. Component state: the lock (a pay or cancel running or done), the failure notice, a `hidden` flag when permission was refused, the dialog target (the order of a history row), and the focus targets.

**State transitions** (the order is the backend's, the front end only reads the result):

| Order status | The page shows | Pay | Cancel | After |
|---|---|---|---|---|
| `pending` | confirmation, with "Thanh toán thử" and "Hủy đơn" | 200, becomes `paid` | 200, becomes `cancelled` | a newer order from the pricing page also cancels it (backend only) |
| `paid` | the paid result, no buttons | 200 with the same answer, no second period | 409 `ORDER_STATE_INVALID` | final |
| `cancelled` | the cancelled result, no buttons | 409 `ORDER_STATE_INVALID` | 200 with the same answer | final |

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/orders` | GET | `status` (opt: `pending`, `paid`, `cancelled`), `page`, `pageSize` (10) | `items` of `Order`, `total` | bearer, `order:read` | 403 `PERMISSION_DENIED`, 429 |
| `/orders/:id` | GET | `id`: uuid (path) | one `Order` | bearer, `order:read` | 404 `ORDER_NOT_FOUND`, 403 `NOT_RESOURCE_OWNER`, 403 `PERMISSION_DENIED`, 429 |
| `/orders/:id/pay` | POST | `id`: uuid (path), no body | the `paid` `Order` with `paidAt`, `startsAt`, `endsAt` | bearer, `order:create`, landlord account | 409 `PLAN_INACTIVE`, 409 `ORDER_STATE_INVALID`, 404, 403 `NOT_RESOURCE_OWNER`, 403 `PERMISSION_DENIED`, 401, 429 |
| `/orders/:id/cancel` | POST | `id`: uuid (path), no body | the `cancelled` `Order` with `cancelledAt` | bearer, `order:cancel` | 409 `ORDER_STATE_INVALID`, 404, 403 `NOT_RESOURCE_OWNER`, 401, 429 |
| `/me/membership` | GET | none | the shared `Membership` | bearer, `subscription:read` | existing (spec 0020) |

The rate limit wait of both POST calls comes from the table in `src/lib/api/rate-limits.ts` or from `Retry-After`. A bad id is never sent (`isUuid`), and an unknown `status` is never sent (the filter parser falls back to all).

**Value sourcing** (every value each action produces, computes or displays names its source):
| Action | Value produced / displayed | Source |
|---|---|---|
| Order page | plan name, price, `maxListings`, `durationDays`, code, day made | the `Order` itself (its fixed copy), price through `formatMoney`, day through `formatDateTime` |
| Order page | which view and which `h1` | `order.status` |
| Pending view | whether the start line says "after the running plan" and the date | `membership.state` equal to `plan` and `membership.subscription.paidUntil` from the shared entry (spec 0020), through `formatDateTime`; for `trial` or `expired` a fixed sentence; no line while unknown |
| Paid view | paid time, period start, period end | `paidAt`, `startsAt`, `endsAt` of the `Order` answered by pay or read |
| Cancelled view | cancel time | `cancelledAt` of the `Order` |
| Buttons | who sees "Thanh toán thử" and "Hủy đơn" | `canBuyPlans(session)` and `can(session, "order:cancel")` |
| Press pay or cancel | the request | the order `id` of the address (or of the row), no body |
| Failure notice | the sentence | the backend `error.message` for `PLAN_INACTIVE`, `ORDER_STATE_INVALID` and `PERMISSION_DENIED`, plus fixed hints ("Chọn gói khác") |
| Failure notice | which kind | `error.status` and `error.code` through the pure `classifyOrderError` |
| 429 | seconds to wait | `Retry-After` through `RateLimitNotice` and `useCountdown` (spec 0002) |
| Links | pricing, history, one order, listings, new listing | `PRICING_PATH`, `ORDERS_PATH`, `orderHref`, `MY_LISTINGS_PATH`, `NEW_LISTING_PATH` |
| History | rows, count in the heading | `items` and `total` of `GET /orders`, in the API order |
| History | the filter and the page | `?status=` and `?page=`, parsed by `parseOrderFilter` and `parsePageParam` |
| History | the last page for a page past the end | `lastPageOf(total, 10)` |
| History row | the period of a paid order | `startsAt` and `endsAt` of the row, shown only when `status` is `paid` |
| Strip | the numbers and text | the shared `Membership` (spec 0020), nothing new |
| Dashboard card and menu | the address | `ORDERS_PATH` in `workspace-tools.ts` |
| Page head | titles | fixed copy in the feature |

**Key invariants**:
- Pay and cancel send no body, and nothing is sent again by itself.
- One pay or cancel runs at a time on the order page, and one cancel at a time in the history.
- The order is always shown from its own fields. It is never joined to `GET /plans`.
- The view always follows the `status` of the order in the cache. After a conflict (`ORDER_STATE_INVALID`) the order is read again so the view cannot disagree with the backend.
- The front end never changes an order's status by itself. Only a 200 answer from the backend does.
- Every link to an order uses `orderHref`, to the history `ORDERS_PATH`, and to the plans `PRICING_PATH`.
- Focus is never lost: a view switch moves it to the `h1`, a closed dialog returns it, and a row that leaves moves it to the list heading.

**Security model**: an order is private to its landlord. The id in the address is the id of the person's own order, and the backend answers 403 `NOT_RESOURCE_OWNER` or 404 to anyone else, which the page shows as one not found state. Hiding a button is a convenience, and the backend decides every press. The permissions are `order:read`, `order:create` (pay, landlord account only) and `order:cancel`. The token stays in memory (spec 0002) and never goes in the address. The landlord gate keeps guests and other account types out, and an admin who somehow reaches an order is refused by the backend. The payment is a test: no card data exists, so no compliance scope applies.

**Configuration required**: none. No environment variable and no library.

**Critical test scenarios** (each maps to an acceptance criterion in ## Requirements):
- Happy path: a landlord presses "Mua" on `/bang-gia`, lands on the order page with the cached order shown at once, presses "Thanh toán thử", and the page turns into the paid view while the strip and the dashboard show the new plan, verifies **AC-2**, **AC-3**, **AC-5**, **AC-6**.
- Happy path: the same landlord opens an unpaid order from the history ("Tiếp tục thanh toán"), sees the start line for a running plan or for none, and cancels it through the dialog from the page and from a row, verifies **AC-4**, **AC-7**, **AC-15**, **AC-16**.
- Happy path: the history lists orders newest first, filters with the tabs, pages 10 at a time, and shows the period only for paid rows, verifies **AC-13**, **AC-14**, **AC-15**.
- Failure case: an admin turns the plan off after the order was made, so pay answers 409 and the page offers the two ways out; a second tab pays or cancels the order, so the first tab's press answers 409 `ORDER_STATE_INVALID` and the view corrects itself, verifies **AC-9**, **AC-10**.
- Failure case: 429, 403 and a network or 5xx failure each show their own notice and lock, hide or keep the buttons as stated (forced with a proxy), verifies **AC-11**.
- Failure case: an id that is not a UUID, an id that does not exist and the id of another landlord's order each show the same not found page, with no request for the first one, verifies **AC-1**, **AC-12**.
- Failure case: the list is empty, empty for a filter, failed, rate limited and past the end, verifies **AC-17**.
- Auth/permission: a person without `order:read` sees the forbidden state with no request, a landlord without `order:create` or `order:cancel` sees no such button, verifies **AC-1**, **AC-8**, **AC-13**.
- Layout and focus: at 320, 390, 768 and 1280 px nothing scrolls sideways, and focus lands on the `h1` after a pay or a cancel, verifies **AC-19**.
- Dashboard: the card and the menu item appear and the menu marks the right page, verifies **AC-18**.
- Value rules: no sort, no computed end of period, no plan data joined to an order, verifies **AC-20**.

## Build plan

The approach is Tracer Bullet (from the scope): milestone 1 runs one thin thread through every layer and already ends the 404 for the most common press, and each later milestone thickens it while the app keeps running.

1. **Milestone 1, thin thread: pay a real order.** `getOrder` and `payOrder` with `orderQuery` in `src/features/order/api/`; the order route (gate, title, `noindex`, `instant = false`, the `isUuid` check) and its screen that draws the three views from `order.status` (the summary, `OrderStatusBadge`, the test payment note and "Thanh toán thử" on a pending order, the paid view with its two links, the cancelled view with its two links); pay stores the answer under `orderKey(id)` and marks `ordersKey` and `membershipKey` out of date; a bad id or a 404 shows the not found state. Satisfies **AC-1**, **AC-2**, **AC-3**, **AC-5**, **AC-6**.
2. **Milestone 2, the full order page.** `cancelOrder` and the alert dialog with the cancelled view; the pure `classifyOrderError`; the lock with `aria-disabled` and the buttons by permission; the start line and the "Chọn gói khác" line; the failure notices (plan turned off, order changed elsewhere with a read again, 429, 403, session, other); the read failure states (not found for 404 and 403, forbidden, 429, error with "Thử lại"). Satisfies **AC-4**, **AC-7**, **AC-8**, **AC-9**, **AC-10**, **AC-11**, **AC-12**.
3. **Milestone 3, the history.** `ordersListQuery` and `ordersListKey`; `parseOrderFilter` and the address helper; the route `/landlord/orders` with the header, the "Mua gói" button, `MembershipStrip` without its action, the tabs, the table and the stacked blocks, the pagination, the states (empty, empty for a filter, loading, failed, 429, past the end). Satisfies **AC-13**, **AC-14**, **AC-15**, **AC-17**.
4. **Milestone 4, rows and the finish.** Cancel from a row with the shared dialog and the focus rules; the tool `billing.mine` turned to `ready` with `ORDERS_PATH` and the menu item checked on both pages; a check at 320, 390, 768 and 1280 px; `npm run check` and `npm run build`. Satisfies **AC-16**, **AC-18**, **AC-19**, **AC-20**.

## Consequences

**Positive**:
- Every "Mua" now lands on a real page, and the whole buying flow (choose, confirm, pay, post) works end to end in the app.
- Unpaid orders can be paid or cancelled, and the history shows what happened to each order.
- The strip, the dashboard cards and the pricing notice update after a payment with no extra code in them, because they read the shared entries.
- Spec 0021's follow up is closed, and the order code stays in one folder.

**Negative / tradeoffs**:
- A test payment changes a demo account for good: it adds a period and can turn an expired landlord into a plan landlord, and a cancel leaves a cancelled order in the history. Test with accounts you can afford to change (`tam.vo` and `mai.dang` each have a seeded unpaid order).
- The order page makes one extra read after "Mua" (the cached order shows at once, then one read confirms it), and one more after a pay or a cancel.
- The history tabs show no counts, because the API gives none without one call per tab.
- With scripts off, both pages stay in their loading state, because they read in the browser behind the gate.
- A paid order cannot be refunded or changed in this backend, so the only way out of a wrong plan is to wait for the period to end.

**Neutral**:
- Pay uses the permission name `order:create`, and cancel uses `order:cancel`. Both are checked by the backend.
- `OrderStatusBadge` stays in the order folder. The admin orders feature (#25) can lift it to `src/components` when it needs it.
- The pricing page's pending notice and these pages share `pendingOrderKey` through `ordersKey`, so a pay or a cancel clears the notice at once.

## Follow-up

- [ ] When #25 (orders of all landlords) is designed, decide whether `OrderStatusBadge` and the order summary move to `src/components`.
- [ ] Decide later whether the paid view should say how many held back listings the new plan brings back. The front end must not compute it (the plan's limit may be lower than the count), so it needs a field from the backend.
- [ ] After the build, `/check verify` should include the two tab cases (paid in one tab and cancelled in the other), because no button reaches `ORDER_STATE_INVALID` on its own.
- [x] Tick the follow up of spec 0021 that says #19 builds `/landlord/orders/[id]` and `/landlord/orders`, once this feature is done.
