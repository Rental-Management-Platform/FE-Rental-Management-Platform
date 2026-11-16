# 0020. Membership status strip and quota notices

**Date**: 2026-11-16
**Status**: Accepted

## Summary

This spec adds a status strip at the top of "Tin của tôi" and "Đăng tin mới". It tells a landlord whether they are on a trial, on a plan, or out of both, and how many listings they show out of how many they may. It also turns the two refusals (trial ended, limit reached) into calm warnings with a way out, at the row and in the post form, instead of a bare line or a red error. One shared read of `GET /me/membership` feeds the strip, the "why is this listing hidden" line and the dashboard cards, and it is read again after every write that can change the count. The "Mua gói" button points at `/bang-gia` through one constant, a route that #18 creates.

## Context

The backend gates posting and showing a listing by the landlord's membership (a plan, a trial, or neither) and says so with two 403 codes, `MEMBERSHIP_REQUIRED` and `LISTING_QUOTA_REACHED`. The contract (`api-for-frontend.md`, section 6.25 and section 7 step 0 and step 6) asks the front end to show the state before the landlord hits a wall, to treat the two refusals as messages and not as system errors, and never to work out days or limits itself.

Today none of that exists. A refused "Hiện" shows the backend sentence as a line at the row (spec 0019, AC-6), a refused post shows a red alert (spec 0006), and the label "Đang bị ẩn bớt khỏi khách" cannot say why (spec 0006 and 0019 both note this). Specs 0005, 0006 and 0019 each leave the decision on how limits are shown to this feature, because `Can` only hides and never disables.

Two facts shape the design. The membership answer is already read by the dashboard cards (spec 0008) under its own key `["dashboard","membership"]`, so a second reader would mean two requests and two cache entries for one answer. And the pricing page (#18) does not exist and has no route yet; spec 0001 names `/pricing`, but its route table is already out of date elsewhere (the landlord profile is `/chu-tro/[id]`, not `/landlords/[id]`). The scope's "Done when" for #17 still asks for a "Mua gói" button.

## Requirements

Seeded from scope item #17 and refined with the engineer. Contract with the backend: `api-for-frontend.md` section 6.25 (`GET /me/membership`), section 7 "Đăng và quản lý tin" steps 0 and 6, and the error table (`MEMBERSHIP_REQUIRED`, `LISTING_QUOTA_REACHED`). Patterns to follow: spec 0019 (rows, `refreshAfterListingWrite`, `RowNotice`), spec 0006 (the post form and `ListingStatusBadge`), spec 0008 (the dashboard membership source), spec 0005 (`Can` only hides), and `design.md` (a notice the person must act on is an `Alert` that stays on the page).

**Out of scope** (settled with the engineer): the pricing page, the order and payment steps (#18, #19); disabling any button because of the limit; a strip on edit pages, property pages or the dashboard; any warning threshold on trial days (no rule the backend does not give); a "Gói và đơn của tôi" page; changing what `describeStat` says on the dashboard cards.

**User stories**:
- As a landlord, I want to see at the top of my listings whether I am on a trial or a plan and how many listings I show out of how many I may, so I am not surprised by a refusal.
- As a landlord who is refused, I want the page to say why in plain words and show me the way out (hide or delete a listing, or buy a plan), without losing what I typed.
- As a landlord whose listings are held back from guests, I want each listing to say whether it is the limit or the ended trial that holds it back.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: A status strip is drawn on `/landlord/listings` and on `/landlord/listings/new`, between the `PageHeader` and the first zone, for a person who holds `subscription:read`. On the new listing page it stays on screen after a successful post (above the result). Other landlord pages have no strip.
- **AC-2**: The strip is one `Alert` that reads `GET /me/membership` and says, by `state`: `trial` → "Còn N ngày dùng thử · đang hiện X trên Y tin"; `plan` → "Gói <planName> đến hết ngày <endsAt> · đang hiện X trên Y tin", with "đã trả đến <paidUntil>" added only when `paidUntil` is a different moment from `endsAt`; `expired` → a warning that the trial ended and there is no plan, that posting and showing are not possible, and that hiding, editing and deleting still work, with a "Mua gói" button. When `trialDaysLeft` is `null` the trial line says "Đang dùng thử" without a number. N, X and Y come straight from the answer (`trialDaysLeft`, `visibleCount`, `listingLimit`); dates use `formatDateTime`.
- **AC-3**: Tone and way out. `trial` and `plan` with room left use the `info` alert and no button. When `remaining` is 0, or `overLimitCount` is above 0, the alert is `warning`: it adds the line "{O} tin đang bị ẩn bớt khỏi khách vì vượt hạn mức" when `overLimitCount` is O above 0, a hint to hide or delete a listing or buy a bigger plan, and a "Xem bảng giá" link. `expired` is always `warning`, and when `visibleCount` is above 0 it also says how many listings guests cannot see. No alert is `destructive`.
- **AC-4**: The strip never blocks the page. While loading it shows a skeleton of fixed height (no jump). A failed first read shows "Không tải được trạng thái gói." with "Thử lại". A 429 shows the shared rate limit notice with its countdown and a disabled "Thử lại" until it ends. A 403 `PERMISSION_DENIED`, or no `subscription:read`, draws nothing. A failed read that follows a good one keeps showing the last good numbers. An unknown `state` value draws nothing and does not crash.
- **AC-5**: The strip is current. The read happens on mount and on window focus (the defaults), and the shared entry is read again after every write that can change the count: hide, show, delete, post, and photo changes (all through `refreshAfterListingWrite`), and after a refused answer (AC-8, AC-9). After "Ẩn" or "Hiện" the strip's X changes without a page reload.
- **AC-6**: One shared read. The membership query key and reader live in `src/features/membership`. The dashboard's `membership` source reads the same entry, so the cards "Đăng tin", "Tin của tôi" and "Gói và đơn của tôi" show exactly the numbers the strip shows, and their text does not change. The cache holds the plain `Membership` answer.
- **AC-7**: Nothing is disabled by the limit. "Đăng tin mới", "Hiện" and the form's "Đăng tin" stay clickable in every state, and the backend decides. Hiding, editing, deleting and property management work in every state.
- **AC-8**: A "Hiện" press refused with `MEMBERSHIP_REQUIRED` or `LISTING_QUOTA_REACHED` keeps the backend `message` in the quiet warning at the row (spec 0019, AC-6) and adds the way out: for `MEMBERSHIP_REQUIRED` a "Mua gói" button; for `LISTING_QUOTA_REACHED` the line "Hãy ẩn hoặc xóa bớt một tin, hoặc mua gói lớn hơn." and a "Xem bảng giá" link. The listing stays "Bạn đã ẩn", nothing is sent again by itself, and the membership entry is read again.
- **AC-9**: A post refused with the same two codes shows a `warning` alert (not red) above the "Đăng tin" button with the backend `message` and the same way out as AC-8. The typed text, the chosen property and the photos stay, the submit button stays enabled, nothing is retried by itself, and the membership entry is read again. Every other failure of the post form looks and works as before.
- **AC-10**: For a `visible` listing whose `isPublic` is false, the reason line of `ListingStatusBadge` names the cause from the shared membership: `state` is `expired` → "Khách chưa thấy tin này: bạn đã hết dùng thử và chưa có gói."; otherwise `overLimitCount` above 0 → "Khách chưa thấy tin này: bạn đang hiện nhiều tin hơn hạn mức."; the badge label stays "Đang bị ẩn bớt khỏi khách". When the membership is not loaded, or neither holds, the line keeps today's generic sentence. This applies in the rows of "Tin của tôi", on the result screen after a post, and on the edit page.
- **AC-11**: Every "Mua gói" button and "Xem bảng giá" link goes to `PRICING_PATH`, one constant (`/bang-gia`) in one file, used with `next/link`. The route is created by #18 with the same constant. Until then the link leads to the 404 page, which is accepted.
- **AC-12**: Layout and accessibility. The strip and the two notices use words and an icon, never color alone, semantic tokens only, and no new color pair. Buttons are `size="lg"` (44 px) on phones. At 320, 390, 768 and 1280 px nothing scrolls sideways. The strip is a quiet status region read as one sentence when its text changes. Every string is Vietnamese.
- **AC-13**: The front end computes nothing the backend owns: no days left, no limit, no "will this press be allowed". The only comparisons are `remaining` equal to 0, `overLimitCount` above 0, `visibleCount` above 0, `state`, and `paidUntil` against `endsAt`.

## Options considered

### Option 1: One shared read, one strip on two pages, warnings with a way out

A new `src/features/membership` owns the key, the reader, the hook and the strip. The dashboard source reads the same entry. The strip sits on "Tin của tôi" and "Đăng tin mới". Buttons stay clickable. The two refusals become warnings with a "Mua gói" or "Xem bảng giá" action, and the cause label reads the shared entry.

**Pros**:
- One request and one cache entry for one answer; strip, labels and dashboard cannot disagree.
- Follows the contract word for word (message kept, form kept, not a system error, button to the pricing page).
- Same pattern the dashboard already uses for the chat unread count (shared key plus `select`).

**Cons**:
- Touches the dashboard source and the `ListingStatusBadge` callers, so there is regression risk in cards that already work.
- "Mua gói" leads to a 404 until #18.

### Option 2: Strip only on "Tin của tôi", reuse the dashboard key

The listing feature reads `["dashboard","membership"]` directly. Refusals keep their current plain line with a link added. No cause label.

**Pros**:
- Smallest change and no dashboard edit.

**Cons**:
- The listing feature then depends on the dashboard feature for a landlord concept.
- The post form, where a refusal hurts most (a long form is lost to a surprise), gets no up front notice.
- The "why hidden" question from specs 0006 and 0019 stays open.

### Option 3: Disable the buttons when there is no room

Turn "Đăng tin mới", "Hiện" and "Đăng tin" off while `remaining` is 0 or the state is `expired`, with the reason in the strip.

**Pros**:
- Saves one round trip per refused press.

**Cons**:
- The strip can be stale (another tab freed a place), so a good press would be blocked.
- A disabled button hides the way to buy, and `Can` deliberately never disables (spec 0005).
- It lets the front end decide what the backend decides.

### Option 4: One strip in the landlord layout, on every page

**Pros**:
- Always visible, nothing to remember per page.

**Cons**:
- One more request and a block of text on pages that do not depend on the limit (editing a property, the dashboard).
- Competes with page level notices.

## Decision

**Chosen option**: Option 1: One shared read, one strip on two pages, warnings with a way out.

A new `src/features/membership` owns the one cache entry for `GET /me/membership`. The strip is drawn on "Tin của tôi" and "Đăng tin mới". The buttons are never disabled by the limit. The two refusals are warnings with a way out at the row and in the post form. The "Mua gói" address is the constant `PRICING_PATH`, set to `/bang-gia`.

**Decided by the engineer**: the link goes to the pricing address through one constant now (a 404 until #18); buttons always clickable; strip on "Tin của tôi" and "Đăng tin mới" only; one shared entry in a new membership feature; the row keeps the backend line and gains the button; the form shows a warning alert with the way out.

**Decided here (recommended, the engineer may override)**:
- Address `/bang-gia`. Why: the public pages already use Vietnamese addresses (`/chu-tro/[id]`, `/tin-nhan`) and the product is Vietnamese only. Runner up: `/pricing` (spec 0001), rejected because that table is stale.
- Freshness: the default `staleTime` of 0, so the entry is read on mount and on focus. Why: it gates posting, so an older answer is worse than one extra small read. Runner up: 30 seconds.
- Tone: `info` when there is room, `warning` when there is none, over the limit or expired. No warning at "few trial days left". Why: the backend gives no such rule and the front end must not invent one. Runner up: warn at 7 days or fewer.
- The cause is named in the reason line, and the badge label does not change. Why: the label is scanned in a table and should stay short and stable.
- The membership entry is read again after a refused answer. Why: the refusal proves the strip was out of date.
- The strip has its own failure states and never blocks the list or the form. Why: the page works without it.
- The strip text and the "what to say" rules are a pure function (`describeMembership`) that returns tone, lines and the action, so the rules can be read and tested without rendering.

**Implementation skills**: `tanstack-query-best-practices` (`deckardger/tanstack-agent-skills`, `.agents/skills/tanstack-query-best-practices/`)

## Rationale

The forces in Context point one way. The answer is already read by the dashboard, so a second key would double the requests and let the strip and the cards drift; the chat unread count already shows the project's pattern for sharing one entry (same key, `select` on top). The contract and `Can` both say the backend decides, which rules out disabling buttons: the strip can be minutes old and a disabled button hides the only path to buying. The two limits matter on exactly two pages, the list where "Hiện" is refused and the form where posting is refused, so the strip goes there and not in the layout.

The row keeps the backend sentence because the person just pressed there and the words are the backend's own; the strip above explains the state, and the new action turns the sentence into a next step. The form moves from a red alert to a warning for these two codes only because the contract says they are not system errors, and a red box reads as "something broke". Pointing at `/bang-gia` now costs a short 404 window but nothing to rewire later, and the scope's "Done when" asks for the button; the alternatives (words only, a stub page) either leave rework for #18 or pull part of #18 into this feature.

## Feature design

**Data model sketch**: none. There is no storage and no new API. The `Membership` and `Subscription` types already exist in `src/lib/api/types.ts`. The only new state is one TanStack Query cache entry, `["membership"]`, holding the plain `Membership` answer. The session clears the cache when it changes (spec 0002), so the key needs no user id.

**State transitions**: the strip is a view of one query.

| Query state | The strip draws |
|---|---|
| no `subscription:read` | nothing |
| pending, no data | skeleton of fixed height |
| error, no data | "Không tải được trạng thái gói." and "Thử lại" (429: rate limit notice with countdown) |
| error 403 `PERMISSION_DENIED` | nothing |
| success, `state` is `trial` or `plan` | `info` alert (or `warning` when `remaining` is 0 or `overLimitCount` is above 0) |
| success, `state` is `expired` | `warning` alert with "Mua gói" |
| success, unknown `state` | nothing |
| error after success | the last good data, unchanged |

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/me/membership` | GET | none | `state`, `trialEndsAt`, `trialDaysLeft`, `subscription`, `listingLimit`, `visibleCount`, `remaining`, `overLimitCount` | bearer, `subscription:read` | 401, 403 `PERMISSION_DENIED`, 429 |
| `/me/listings/:id/show` and the post call | existing | none new | none new | bearer | 403 `MEMBERSHIP_REQUIRED`, 403 `LISTING_QUOTA_REACHED` (already in `ERROR_CODES`) |

**Value sourcing** (every value each action produces, computes or displays names its source):
| Action | Value produced / displayed | Source |
|---|---|---|
| Strip, trial line | N days left | `trialDaysLeft` (the backend rounds up; the front end never computes it) |
| Strip, trial and plan lines | X shown, Y allowed | `visibleCount`, `listingLimit` |
| Strip, plan line | plan name, end date | `subscription.planName`, `subscription.endsAt` through `formatDateTime` (`Asia/Ho_Chi_Minh`) |
| Strip, plan line | "đã trả đến" date and whether to show it | `subscription.paidUntil`; shown only when its moment differs from `endsAt` |
| Strip, over the limit line | O hidden from guests | `overLimitCount` |
| Strip, expired text | how many listings guests cannot see | `visibleCount` (equal to `overLimitCount` when expired, per section 6.25) |
| Strip tone and "Xem bảng giá" link | whether there is no room | `remaining` equal to 0, or `overLimitCount` above 0 |
| Strip, which text to draw | the state | `state` from the answer |
| Strip, whether to draw | permission | `can(session, "subscription:read")`, and a 403 `PERMISSION_DENIED` from the read |
| Row and form notice | the sentence | `error.message` from the backend, shown as it came |
| Row and form notice | which way out | `error.code`: `MEMBERSHIP_REQUIRED` → "Mua gói" button; `LISTING_QUOTA_REACHED` → hint line plus "Xem bảng giá" link |
| Every button and link to buy | the address | `PRICING_PATH`, decided here (`/bang-gia`) |
| Reason line of the badge | the cause | derived from the shared `Membership`: `state` is `expired` → ended trial; else `overLimitCount` above 0 → over the limit; else the generic sentence |
| Dashboard cards | the numbers | the same shared entry through `select`; text rules stay in `describeStat` (spec 0008) |
| 429 countdown | seconds to wait | `Retry-After` through `RateLimitNotice` and `useCountdown` (spec 0002) |

**Key invariants**:
- The front end shows what the API gave and never computes days, limits or whether a press will be allowed (AC-13).
- The two refusals are never a red error alert, never retried by themselves, and never cost the person their typed text.
- There is one cache entry for the membership answer. Every write that can change the count reads it again through `refreshAfterListingWrite`, and so does a refused answer.
- The strip's failure never blocks the list, the form or any button.
- No button is disabled because of the limit or the trial state. Hide, edit, delete and property management work in every state.
- Every link to buy uses `PRICING_PATH`, and only that.

**Security model**: display only. The strip needs `subscription:read` (landlords have it, seekers do not), shown through `Can` or `can()`, and a 403 from the API also hides it. The backend checks every call, so a hidden strip protects nothing and a visible one grants nothing. The answer is the caller's own data, held in memory in the query cache and never in storage or a URL. The area sits behind the landlord route gate (spec 0005) and is `noindex`. No compliance scope: no payment happens here (#19 owns the test payment).

**Configuration required**: none. No environment variable, no library.

**Suggested code layout** (`/develop` may rename):
- `src/lib/pricing-path.ts`: `PRICING_PATH`.
- `src/features/membership/`: `api/membership-query.ts` (`membershipKey`, `membershipQuery`), `hooks/use-membership.ts` (query enabled by the permission), `membership-text.ts` (`describeMembership`, `holdBackCause`), `components/membership-strip.tsx`, and one small component for the buy action shared by the strip, the row and the form.
- Edits: `src/features/dashboard/api/stats.ts` (the membership source reads the shared query and wraps it with `select`; the `CachedSource` check must still tell a `Membership` from an `UnreadSummary`), `src/features/listing/api/refresh-after-write.ts` (read `membershipKey` again), `row-failure.ts`, `row-ui.ts`, `components/row-notice.tsx`, `hooks/use-listing-actions.ts` (a `blocked` notice that carries the code), `components/post-listing-form.tsx` and `listing-form.tsx` (the refusal notice above the submit), `components/listing-status-badge.tsx` (an optional cause), and its callers `row-status.tsx`, `listing-created.tsx`, `edit-listing.tsx`; the strip is mounted in `my-listings.tsx` and `new-listing.tsx`.
- No `/dev/ui` section and no sample screen (engineer's rule since 2026-11-12): write the real components and check them against the demo backend.

**Critical test scenarios** (each maps to an acceptance criterion in ## Requirements):
- Happy path: a trial landlord opens "Tin của tôi" and reads "Còn N ngày dùng thử · đang hiện X trên Y tin" with the numbers of `GET /me/membership`; pressing "Ẩn" on a visible listing changes X without a reload, verifies **AC-1**, **AC-2**, **AC-5**.
- Happy path: the dashboard cards "Đăng tin", "Tin của tôi" and "Gói và đơn của tôi" show the same numbers as the strip, and only one `GET /me/membership` is made when both were opened in a row, verifies **AC-6**.
- Failure case: a trial landlord at the limit presses "Hiện" on a hidden listing: the row keeps the backend sentence, adds the hint and "Xem bảng giá", stays "Bạn đã ẩn", and the strip turns `warning`, verifies **AC-3**, **AC-7**, **AC-8**.
- Failure case: the same landlord submits the post form: a `warning` alert (not red) appears above "Đăng tin" with the way out, every field and photo is kept, the button stays enabled, verifies **AC-7**, **AC-9**.
- Failure case: an expired landlord (forced with a wrapped `fetch` answer, since the demo has no such account) sees the `warning` strip with "Mua gói"; `MEMBERSHIP_REQUIRED` at the row and in the form shows the "Mua gói" button; "Ẩn", "Sửa" and "Xóa" still work, verifies **AC-2**, **AC-3**, **AC-8**, **AC-9**.
- Failure case: a listing with `isPublic` false names the right cause for an expired landlord and for an over the limit landlord, and falls back to the generic sentence when the membership read has failed, verifies **AC-10**.
- Failure case: block `**/me/membership`: the strip shows "Không tải được trạng thái gói." and "Thử lại", the list and the form still work; a 429 shows the countdown; a 403 hides the strip, verifies **AC-4**.
- Failure case: a `plan` answer with `paidUntil` later than `endsAt` shows "đã trả đến"; with the same moment it does not; a `null` `trialDaysLeft` shows "Đang dùng thử"; an unknown `state` draws nothing, verifies **AC-2**, **AC-4**, **AC-13**.
- Auth/permission: a seeker or an admin never reaches these pages (route gate); a landlord without `subscription:read` sees no strip and no request is made, verifies **AC-1**, **AC-4**.
- Layout: at 320, 390, 768 and 1280 px the strip and both notices read well, buttons are 44 px on phones and nothing scrolls sideways; the "Mua gói" link opens `/bang-gia` (the 404 page until #18), verifies **AC-11**, **AC-12**.

## Build plan

The approach is Tracer Bullet (from the scope): milestone 1 runs one thin thread through every layer, and each later milestone thickens it while the app keeps running.

1. **Milestone 1, thin thread: a real strip that moves.** `PRICING_PATH`; `src/features/membership` with the key, the query and the hook; the dashboard membership source reads the shared entry through `select` (cards unchanged); a thin `MembershipStrip` with the three state lines and real numbers, mounted on "Tin của tôi"; `refreshAfterListingWrite` reads the entry again. Satisfies **AC-1**, **AC-2** (basic lines), **AC-5**, **AC-6**, **AC-11**.
2. **Milestone 2, the full strip.** `describeMembership` as a pure function (tone, lines, action; `paidUntil` rule, `null` days, the no room and over the limit lines, the "Xem bảng giá" link, unknown state); loading skeleton, error with "Thử lại", 429 with countdown, 403 and missing permission hide, last good data kept; the quiet status region. Satisfies **AC-2**, **AC-3**, **AC-4**, **AC-12**, **AC-13**.
3. **Milestone 3, refusals and cause.** A `blocked` row notice that carries the code and draws the way out; `use-listing-actions` reads the membership again after a refusal; the post form separates the two refusals from other failures and draws the `warning` notice above the submit; `ListingStatusBadge` gets the optional cause and its three callers pass it. Satisfies **AC-5**, **AC-7**, **AC-8**, **AC-9**, **AC-10**.
4. **Milestone 4, post page and finish.** Mount the strip on "Đăng tin mới" above the form and result; check at 320, 390, 768 and 1280 px; confirm no new color pair is needed (the info and warning alert pairs already exist in `scripts/check-contrast.mjs`); `npm run check` and `npm run build`. Satisfies **AC-1**, **AC-5**, **AC-12**.

## Consequences

**Positive**:
- A landlord sees their limit before a refusal, and a refusal always comes with a next step.
- One request and one cache entry for the membership answer; the strip, the labels and the dashboard cannot disagree.
- The "why is this listing hidden" question left open by specs 0006 and 0019 is answered.
- The front end gains no business rule it must keep in step with the backend.

**Negative / tradeoffs**:
- "Mua gói" and "Xem bảng giá" lead to a 404 until #18 ships.
- The dashboard source changes, so cards that already work carry regression risk; the check is that their text and numbers stay identical.
- The same fact can appear in three places after a refusal (the row or form notice, the strip, and the reason line of the badge), which is accepted so that each place can be read alone.
- Every visit to the two pages makes one small read, and the numbers can change a moment after a write while the entry is read again.
- The `expired` and `plan` states cannot be reached with the demo accounts yet, so they are checked with a forced answer until #19 gives a landlord a plan.

**Neutral**:
- `ListingStatusBadge` gains one optional prop and three callers pass it.
- #19 must read the entry again after a test payment so the strip and the cards follow.
- Spec 0001's route table lists `/pricing`; this spec uses `/bang-gia`.

## Follow-up

- [ ] #18 creates `/bang-gia` with `PRICING_PATH`. Until then every "Mua gói" and "Xem bảng giá" leads to the 404 page.
- [ ] #19 calls `invalidateQueries({ queryKey: membershipKey })` after a test payment (and after cancelling an order if the plan could change), so the strip and the dashboard cards follow.
- [ ] `/sync` ticks the follow ups this spec closes: spec 0005 ("Item #17 decides how quota and trial limits are shown"), spec 0006 (the #17 follow up and the `isPublic` cause), spec 0019 (the #17 follow up and AC-6's "no Mua gói button yet", now replaced by AC-8 here).
- [ ] `/sync` or `/scope` notes that spec 0001's route table names `/pricing` and `/landlords/[id]`, now `/bang-gia` and `/chu-tro/[id]`.
- [ ] Spec 0008's `describeStat` text for the cards is unchanged on purpose. If the engineer later wants the dashboard to name the cause too, that is a small separate change.
