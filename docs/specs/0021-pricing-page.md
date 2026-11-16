# 0021. Pricing page and the buy button

**Date**: 2026-11-16
**Status**: Accepted

## Summary

This spec adds the public pricing page at `/bang-gia`: one card per plan from `GET /plans`, cheapest first, with a "Mua" (buy) button only for a landlord. Pressing it creates an order and opens the order confirmation page at `/landlord/orders/[id]`, which feature #19 builds, so until then that step shows the 404 page. A landlord also sees their trial or plan status, a notice when an unpaid order is waiting, and a calm message with a next step for each failure (plan taken off sale, too many requests, no permission). A guest is led to sign in, and a renter or an admin sees the prices with no buy button.

## Context

> ⚠️ Premise note: The buy button depends on a page that has no spec and no code yet (the order confirmation step of #19). This spec fixes that page's address and how the order id reaches it, so #19 builds to a known address instead of choosing again. Until #19 ships, a successful press ends on the 404 page and leaves a real unpaid order behind, which the engineer accepted.

A landlord cannot buy a plan from the front end yet. Feature #17 (spec 0020) already points every "Mua gói" button and "Xem bảng giá" link at `/bang-gia` through `PRICING_PATH`, so today those links end on the 404 page. The contract (`api-for-frontend.md`, the pricing flow, sections 6.26 and 6.27) says what the page does: one public card per plan, a buy button that creates an order and moves to a confirmation step, a sign in link for a guest, no button for a renter or an admin, a reminder about an unpaid order, and a note that a second plan joins after the running one.

Backend facts that shape the design. `GET /plans` is public, lists only plans on sale, is already sorted by price and then name, and allows 300 reads a minute per address. `POST /orders` is for a landlord account only and allows 30 calls an hour. A new order starts `pending`, and creating it cancels the landlord's older unpaid order in the same call, except when the create fails (then the old one stays). An admin can hold the `order:create` permission and is still refused with 403, the same trap as saved listings. The membership answer that #17 already reads tells the front end whether the landlord is on a trial, on a plan or on neither, and a plan bought later joins after the running one.

Two things already exist. The sample screen `/dev/ui/screens/pricing` (spec 0003, AC-14) was built with fake data and a pretend viewer, so its layout and copy are settled. Spec 0001 still reserves the name `pricing` where #17 chose `/bang-gia`. The confirmation step, the order history and the payment belong to #19 and have no address yet.

## Requirements

Seeded from scope item #18 and refined with the engineer. Contract with the backend: `api-for-frontend.md` section 6.26 (`GET /plans`), section 6.27 (`POST /orders`, `GET /orders`) and "Bảng giá gói (khách và chủ trọ)". Patterns to follow: spec 0020 (the shared membership entry, `MembershipStrip`, `RateLimitNotice` and quiet `Alert` notices), spec 0003 (the sample pricing screen), spec 0010 and the landlord profile (a public page with a static shell, a server read as a guest inside `Suspense`, and its metadata), `features/favorites/access.ts` (an account type rule kept in the feature), and `design.md`.

**Out of scope** (settled with the engineer): the order confirmation page, payment, cancel and order history (#19); a plan comparison table; a "most popular" badge (the backend has no such field); remembering the chosen plan through sign in; creating or editing plans (admin, #22); a new `/dev/ui` section (the existing sample screen stays as it is).

**User stories**:
- As a guest or a renter, I want to read the plans and prices without an account, so I know what a landlord pays.
- As a landlord, I want to pick a plan and press "Mua" to start an order, and to see my current trial or plan, so I know what I am buying on top of.
- As a landlord with an unpaid order, I want to be told before I press "Mua" again, because a new order cancels the old one.
- As a landlord, I want a clear message when a plan was just taken off sale or when I send too many orders.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: `/bang-gia` is a public page in the `(public)` group, readable without a login. It has its own title ("Bảng giá gói đăng tin") and description, the canonical address `/bang-gia`, and is open to search engines, with no structured data. "Bảng giá" is an item of `PUBLIC_NAV` (so the header menu and the footer show it), and `/bang-gia` is in `/sitemap.xml`.
- **AC-2**: The cards come from one server read of `GET /plans` as a guest, with no token and no cookie. There is one card per plan in the order the API gave (price ascending, then name). Each card shows the name as a heading, the price with `formatMoney` and "mỗi N ngày", and three points: "Hiện cùng lúc tối đa N tin", "Mỗi kỳ N ngày" and "Tin hiện lại với khách ngay khi thanh toán xong". No plan name, price or limit is written in the code, and nothing is sorted, highlighted or divided in the front end. The page says that payment is a test payment. Below the cards sits the zone "Cần biết trước khi mua" with the three points of the sample screen.
- **AC-3**: What each viewer sees under a card is decided by `canBuyPlans(session)` (a landlord account that holds `order:create`). A guest sees a link "Đăng nhập để mua" to `/login?next=/bang-gia`. A landlord who may buy sees a button "Mua gói <tên gói>". A renter, an admin, or a landlord without the permission sees no button and one line: "Chỉ chủ trọ mới mua được gói, nên tài khoản này không có nút mua." While the session is not known yet, the button area is a placeholder of the same height (44 px), so the cards do not jump.
- **AC-4**: Pressing "Mua" calls `POST /orders` with only `{ planId }`. On 201 the order is stored in the cache under its own key, the pending order entry is marked out of date, and the browser goes to `/landlord/orders/<order.id>` with `router.push`. Until #19 builds that page, the address shows the 404 page, which is accepted.
- **AC-5**: While a create runs, and after it succeeded until the next page opens, every "Mua" button is disabled. The pressed button reads "Đang tạo đơn" with a spinner and `aria-busy`. Nothing is sent again by itself. After a failure all buttons work again, except as AC-9 and AC-10 say.
- **AC-6**: For a person who may buy, a status strip sits under the header: the shared membership entry through `MembershipStrip` (spec 0020) without its buy action, because the cards are right below. When `state` is `plan` the strip is followed by the line "Gói mua thêm nối vào cuối kỳ hiện tại, không đổi gói ngay." The strip keeps its own loading, failed and rate limit states and never blocks the cards. Other viewers see no strip and cause no membership request.
- **AC-7**: For a person who may buy and holds `order:read`, the page reads `GET /orders?status=pending` (page 1, one row) when it opens. When an order comes back, a `warning` notice above the cards says: "Bạn có một đơn chờ thanh toán: gói <planName>, <price>. Chọn gói khác sẽ hủy đơn này." with a button "Tiếp tục thanh toán" to `/landlord/orders/<id>`. The plan and the price come from the order's own fields. A failed read (including 429) draws nothing and never blocks the page. The entry is read again when the page opens and after a create.
- **AC-8**: A `409 PLAN_INACTIVE` or `404 PLAN_NOT_FOUND` on "Mua" shows a `warning` notice above the cards with the backend `message` and "Hãy chọn gói khác." The plan list is read again from the server (`router.refresh()`) so the gone plan leaves the page. Nothing is sent again. The older unpaid order is untouched (the contract does not cancel it on a failed create).
- **AC-9**: A `429 RATE_LIMITED` on "Mua" shows the shared `RateLimitNotice` with its countdown above the cards, and every "Mua" button stays disabled until the wait ends.
- **AC-10**: A `403 PERMISSION_DENIED` on "Mua" shows a `warning` notice with the backend `message` and hides every "Mua" button for the rest of that visit (a reload reads the permissions again). A `401` and `ACCOUNT_LOCKED` are left to the session layer (spec 0002), with no notice here.
- **AC-11**: Any other failure of "Mua" (network, timeout, 5xx, 400) shows a destructive `Alert` with the message from `describeError` (and the support code for a 5xx). The buttons stay so the person can try again by hand.
- **AC-12**: A failed server read of `GET /plans` shows the shared error state (a 429 shows the rate limit notice) with a retry, in the place of the cards, while the header stays. An empty list shows an empty state, "Chưa có gói nào đang bán", with no buy control.
- **AC-13**: Layout and accessibility. The page has one `h1` and each card an `h2`. The cards are a list, one column on phones and three from `md`. Every notice uses words and an icon, never color alone, semantic tokens only, and no new color pair. Notices are quiet `status` regions, except the red failure. Buttons are `size="lg"`. At 320, 390, 768 and 1280 px nothing scrolls sideways. Every string is Vietnamese and money uses `vi-VN`.
- **AC-14**: The front end computes nothing the backend owns: no order of plans, no price or limit, no "will this press be allowed". The only checks are the session (account type and `order:create`), `state` equal to `plan`, and whether the pending list has a row.

## Options considered

### Option 1: Create the order on the pricing page, then hand over to `/landlord/orders/[id]`

The press calls `POST /orders`, stores the answer, and opens a confirmation page addressed by the order id. #19 builds that page and the history under `/landlord/orders`.

**Pros**:
- Matches the contract and the scope text word for word, and the confirmation page shows the order's fixed copy of the plan.
- The address survives a reload and is the same one "Tiếp tục thanh toán" uses from the pending notice and later from the history.
- No throwaway code: #19 only adds the page.

**Cons**:
- Until #19 ships, a press ends on the 404 page and leaves a real unpaid order, which also cancels an older unpaid order (the demo accounts `tam.vo` and `mai.dang` each have one).

### Option 2: Link to a confirmation page that creates the order

The card links to `/landlord/orders/new?planId=...`, and #19's page creates the order when it opens.

**Pros**:
- Pressing "Mua" creates nothing, so no side effect before #19.

**Cons**:
- A reload or a back button creates another order and silently cancels the last one.
- Contradicts the contract and the scope line ("bấm Mua tạo đơn"), and moves the create into a page that does not exist yet.

### Option 3: Build #19 first, then wire the buy button

Build the confirmation page and the history first (they can be tried with the seeded unpaid orders), then build #18 against the real page.

**Pros**:
- No 404 window and no stray orders.

**Cons**:
- #18 waits, the plan order changes, and `/bang-gia` stays missing, so every "Mua gói" of #17 leads to the 404 page for longer.

### Option 4: No API call until #19, a "coming soon" message

The button only shows that the confirmation step is being built.

**Pros**:
- Safe for the demo data.

**Cons**:
- Code written only to be removed, and the main job of the page is not shown working.

## Decision

**Chosen option**: Option 1: Create the order on the pricing page, then hand over to `/landlord/orders/[id]`.

The pricing page lives at `/bang-gia` (`PRICING_PATH`), creates the order with `POST /orders`, and opens `/landlord/orders/[id]`, which #19 builds.

**Implementation skills**: `tanstack-query-best-practices` (`deckardger/tanstack-agent-skills`, `.agents/skills/tanstack-query-best-practices/`)

**Decided by the engineer**:
- The confirmation page is `/landlord/orders/[id]` (the order id in the address), and the history is `/landlord/orders`.
- The press creates the order now, and the address shows the 404 page until #19 ships.
- An unpaid order is announced above the cards with "Tiếp tục thanh toán".
- A landlord sees the #17 strip without its buy action, plus a line about how a second plan joins.
- Failures: `PLAN_INACTIVE` and `PLAN_NOT_FOUND` warn and read the plans again; `429` shows the shared notice and locks the buttons; `403` warns and hides the buttons; every "Mua" button is locked while an order is being made.
- The design comes from `design.md` and the sample screen, with the same layout and no "most popular" label.
- The page is in the public menu and the sitemap, with its own title and description and open to search engines.
- A guest returns to `/bang-gia` after sign in and presses "Mua" again.

**Decided here (recommended, the engineer may override)**:
- The buy rule `canBuyPlans(session)` is a landlord account with `order:create`, in `src/features/pricing/access.ts`. Why: `can.ts` keeps account type rules in the feature, and an admin may hold the permission yet is refused (the saved listings case). Runner up: the permission alone, rejected because it shows a button to an admin who then gets 403.
- Orders get their own feature folder, `src/features/order/` (keys, the create call, the pending read, the paths), and the page lives in `src/features/pricing/`. Why: #19 reuses and extends the order code. Runner up: everything in one folder.
- The sample's line "Khoảng X mỗi tin trong một kỳ" is dropped. Why: it is the only number the front end would compute, and neither the contract nor the scope asks for it. Runner up: keep it only when `maxListings` is above 0.
- The plans are read on the server at request time through a `cache()` wrapped `getPlans` (one call, `pageSize` 50, the maximum), inside `Suspense`, and nothing is kept between visits. Why: an admin turning a plan off must reach the next visit, and it follows the landlord profile page. Runner up: a timed cache, rejected for the same reason.
- One notice area sits directly above the cards, order: the pending notice, then at most one failure notice. A new press clears the old failure.
- After a create, `setQueryData` stores the order under `orderKey(id)` so #19's page can show it at once, and `invalidateQueries` marks the orders entries out of date.
- `MembershipStrip` gets one optional prop, `showAction` (default true), that the pricing page sets to false.

## Rationale

The forces in Context point one way. The contract and the scope say the press creates the order and then moves on, so Option 2 changes a decided flow and makes a reload create orders. Option 3 delivers the safest sequence but leaves #17's links on the 404 page longer and holds the pricing page back for a reason the engineer already weighed and accepted for #17. Option 1 keeps one code path, with no rework when #19 lands, and the cost is a short 404 window with a stray unpaid order, a cost of the same kind #17 accepted for its link.

The status strip and the pending notice are there because creating an order has a side effect the person cannot see: it cancels the older unpaid order, and it joins after a running plan instead of replacing it. Saying both before the press is cheaper than explaining after. Reusing the shared membership entry (spec 0020) costs no new request and cannot disagree with the strip on the listing pages.

Every failure is a message with a next step, not a system error, and every control the backend would refuse is hidden or locked on the same rule the rest of the app uses (the backend still decides). The pricing read stays a server read as a guest, so the HTML is the same for everyone and the landlord only adds what depends on the session.

## Feature design

**Data model sketch**: none. There is no storage and no new API. The `Plan`, `Order` and `Membership` types already exist in `src/lib/api/types.ts`. New client state is two cache entries and small component state. `ordersKey` is `["orders"]`, the pending read is `["orders", "pending"]`, and one order is `["orders", id]` (`orderKey`). The session clears the cache when it changes, so no key needs a user id. Component state: which plan is being sent, the failure notice, and a `denied` flag for AC-10.

**State transitions** (the buy flow of one visit):

| State | What the cards show | Next |
|---|---|---|
| idle | "Mua gói <tên>" on each card | press: sending |
| sending | all buttons disabled, the pressed one "Đang tạo đơn" | 201: created; error: failed |
| created | all buttons stay disabled | the browser opens `/landlord/orders/<id>` |
| failed: plan gone | warning notice, plans read again, buttons work | press again on another card |
| failed: rate limited | rate limit notice with countdown, all buttons disabled | the wait ends: buttons work |
| failed: permission | warning notice, buttons hidden for this visit | reload |
| failed: other | red alert, buttons work | press again |

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/plans` | GET | `page`, `pageSize` (50) | `items` of `id`, `name`, `price`, `maxListings`, `durationDays`; `total` | none (server, as a guest) | 429 |
| `/orders` | POST | `planId`:uuid (req) | the new `pending` order | bearer, `order:create`, landlord account | 400, 403 `PERMISSION_DENIED`, 404 `PLAN_NOT_FOUND`, 409 `PLAN_INACTIVE`, 429 |
| `/orders` | GET | `status=pending`, `pageSize=1` | `items` (at most one order) | bearer, `order:read` | 403, 429 |
| `/me/membership` | GET | none | the shared `Membership` | bearer, `subscription:read` | existing (spec 0020) |

**Value sourcing** (every value each action produces, computes or displays names its source):
| Action | Value produced / displayed | Source |
|---|---|---|
| Cards | name, price, `maxListings`, `durationDays` | the items of `GET /plans`, shown as given, price through `formatMoney` |
| Cards | the order of the cards | the API order (price ascending, then name), no sort in the front end |
| Under each card | which control the viewer sees | `session.status`, `session.user.accountType` and `session.permissions` through `canBuyPlans` |
| Guest link | the sign in address | `/login?next=` plus `PRICING_PATH`, checked by the existing `safeNextPath` |
| Press "Mua" | the request body | the `id` of the pressed plan, nothing else |
| After a create | where the browser goes | `orderHref(order.id)` from the 201 answer, with `ORDERS_PATH` set to `/landlord/orders` |
| Pending notice | plan name, price, link | `planName`, `price` and `id` of the pending order (the fixed copy on the order) |
| Status strip | the numbers and the text | the shared `Membership` of spec 0020, nothing new |
| Renewal line | whether to show it | `membership.state` equal to `plan`; a fixed sentence |
| Failure notice | the sentence | the backend `error.message` for `PLAN_INACTIVE`, `PLAN_NOT_FOUND` and `PERMISSION_DENIED`; the added hint "Hãy chọn gói khác." is fixed copy |
| Failure notice | which kind it is | `error.status` and `error.code` through one pure `classifyBuyError` |
| 429 | seconds to wait | `Retry-After` through `RateLimitNotice` and `useCountdown` (spec 0002) |
| Page head | title, description, canonical | fixed copy in the feature, canonical from `PRICING_PATH` |
| Sitemap | the entry | `NEXT_PUBLIC_SITE_URL` plus `PRICING_PATH` |
| Renter and admin line | the sentence | fixed copy |

**Key invariants**:
- The only thing the front end sends to create an order is `planId`.
- At most one create runs at a time, and the buttons stay locked until the next page opens or a failure ends it. Nothing is retried by itself.
- A guest, a renter and an admin never get a buy control. Hiding it is a convenience, and the backend decides every press.
- No plan name, price or limit lives in the code, and no plan data is kept between visits on the server.
- The front end never cancels or edits an order. The older unpaid order is cancelled only by the backend, inside a successful create.
- The notice area holds at most one failure notice, and a new press clears the old one.
- Every link to buy uses `PRICING_PATH`, and every link to an order uses `orderHref`.

**Security model**: the plan list is public data read as a guest. A purchase needs a landlord account with `order:create`, checked in the browser with the access token held in memory only (spec 0002), never on the server. The order id in the address is the id of the person's own order, and the confirmation page of #19 must answer 403 `NOT_RESOURCE_OWNER` or 404 for anyone else. The `next` value is checked by `safeNextPath`. The page says payment is a test payment, so no real payment data is touched and no compliance scope applies.

**Configuration required**: none. No environment variable and no library.

**Suggested code layout** (`/develop` may rename):
- `src/features/pricing/`: `access.ts` (`canBuyPlans`), `api/get-plans.ts` (`getPlans`), `buy-failure.ts` (the pure `classifyBuyError` and the copy), `metadata.ts`, `components/pricing-screen.tsx` (server, reads the plans and handles the failed and empty states), `plan-cards.tsx` (the client part: cards, buttons, the notice area), `pending-order-notice.tsx`.
- `src/features/order/`: `api/orders.ts` (`createOrder`, `pendingOrderQuery`), `api/order-keys.ts` (`ordersKey`, `orderKey`), `order-paths.ts` (`ORDERS_PATH`, `orderHref`).
- `src/app/(public)/bang-gia/page.tsx` with a static shell and the screen inside `Suspense`.
- Edits: `nav-config.ts` (the "Bảng giá" item in `PUBLIC_NAV`), `sitemap.ts` (one more entry), `membership-strip.tsx` (the `showAction` prop).
- No `/dev/ui` section and no new sample screen (engineer's rule since 2026-11-12): lift the markup of `src/app/dev/ui/screens/pricing/pricing-screen.tsx` into the real components and check them against the demo backend.

**Critical test scenarios** (each maps to an acceptance criterion in ## Requirements):
- Happy path: a landlord with no unpaid order opens `/bang-gia`, sees the cards in the API order, presses "Mua gói <tên>", one `POST /orders` with only `planId` goes out, the buttons lock, and the browser opens `/landlord/orders/<id>` (the 404 page until #19), verifies **AC-2**, **AC-3**, **AC-4**, **AC-5**.
- Happy path: a guest sees the same cards and a "Đăng nhập để mua" link that carries `next`; a renter and an admin see the cards, the one line and no button, with no request but the plan read, verifies **AC-1**, **AC-3**.
- Happy path: a landlord on a plan sees the strip with no "Mua gói" button and the renewal line; a landlord with a pending order sees the notice and "Tiếp tục thanh toán", and a failed pending read changes nothing, verifies **AC-6**, **AC-7**.
- Failure case: an admin turns the plan off after the page loaded: "Mua" gives 409, the warning shows with "Hãy chọn gói khác.", the plans are read again and the card is gone, verifies **AC-8**.
- Failure case: 429, 403 and a network or 5xx failure each show their own notice and keep or hide the buttons as stated (forced with a proxy), verifies **AC-9**, **AC-10**, **AC-11**.
- Failure case: `GET /plans` fails on the server (a production build with a mock on `API_URL`): the error state with a retry replaces the cards, and an empty list shows the empty state, verifies **AC-12**.
- Layout: at 320, 390, 768 and 1280 px the cards, the notices and the buttons read well with no sideways scroll, verifies **AC-13**.
- Value rules: no plan data in the code, and no front end sort, verifies **AC-2**, **AC-14**.

## Build plan

The approach is Tracer Bullet (from the scope): milestone 1 runs one thin thread through every layer, and each later milestone thickens it while the app keeps running.

1. **Milestone 1, thin thread: a real card that creates a real order.** `src/features/order` with `ordersKey`, `orderKey`, `createOrder` and `orderHref`; `getPlans`; the route `/bang-gia` with the plan cards from the real API; `canBuyPlans`; the "Mua gói" button that creates the order and goes to `/landlord/orders/<id>`; the "Đăng nhập để mua" link; the line for a renter and an admin. Satisfies **AC-2**, **AC-3**, **AC-4**.
2. **Milestone 2, the full buy flow.** Locking of every button while sending and until the page opens, the notice area, the pure `classifyBuyError`, and the five failure kinds (plan gone with a server refresh, 429 with the shared notice, 403 with hidden buttons, other failures as a red alert). Satisfies **AC-5**, **AC-8**, **AC-9**, **AC-10**, **AC-11**.
3. **Milestone 3, the landlord's context.** `MembershipStrip` with `showAction`, the renewal line, the pending order read and its notice with "Tiếp tục thanh toán", and the cache write after a create. Satisfies **AC-4**, **AC-6**, **AC-7**.
4. **Milestone 4, the public finish.** The server read failure and empty states, the metadata, the "Bảng giá" menu item, the sitemap entry, the zone "Cần biết trước khi mua", the height placeholder while the session loads, a check at 320, 390, 768 and 1280 px, `npm run check` and `npm run build`. Satisfies **AC-1**, **AC-2**, **AC-12**, **AC-13**, **AC-14**.

## Consequences

**Positive**:
- The "Mua gói" links of #17 finally land on a real page, and a landlord can start an order.
- A landlord is told about an unpaid order and about how a second plan joins before pressing, instead of after.
- #19 builds to a fixed address and a ready order cache, with no further choices to make.
- The page adds no new request for guests, and one shared read for landlords.

**Negative / tradeoffs**:
- Until #19 ships, a successful "Mua" ends on the 404 page and leaves a real unpaid order, and each press cancels the older one. The seeded unpaid orders of `tam.vo` and `mai.dang` can be cancelled by a test press, so test with another account or accept it.
- A landlord's visit costs the plan read on the server plus the pending order read and the membership read in the browser.
- With scripts off, the cards wait in the loading state, the same known gap as the listing search (the plan read sits inside `Suspense`).
- The sample screen and the real page now hold similar markup. The sample stays as a reference, and a later change must touch both or retire the sample.
- `MembershipStrip` gains a prop, so the listing pages must keep passing nothing and stay unchanged.

**Neutral**:
- Spec 0001's route table and reserved names still say `/pricing`; this spec uses `/bang-gia` and `/landlord/orders`.
- The "Gói và đơn của tôi" tool of the landlord dashboard stays `soon` until #19 gives it an address.

## Follow-up

- [x] #19 builds `/landlord/orders/[id]` (it may show the order already in the cache from the 201 answer, and reads `GET /orders/:id`) and `/landlord/orders`, turns the "Gói và đơn của tôi" tool to `ready` with that address, and after a test payment calls `invalidateQueries` for `membershipKey` (spec 0020) and `ordersKey`.
- [ ] `/sync` adds `bang-gia` to the reserved top level names and `/bang-gia` and `/landlord/orders` to the route table of spec 0001, and ticks the follow up of spec 0020 that says #18 creates `/bang-gia`.
- [ ] If the number of plans ever goes above 50, the pricing read needs paging. It is not expected.
- [ ] Decide later whether a plan chosen before sign in should be remembered (a `?plan=` on the sign in link). The engineer chose the simple return to `/bang-gia` for now.
