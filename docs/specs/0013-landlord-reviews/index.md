# 0013. Landlord reviews: rate a landlord on their public profile

**Date**: 2026-11-09
**Status**: In Progress

## Summary

This adds a "Đánh giá" (reviews) area to the public landlord profile. A renter whom the landlord has answered in chat can give 1 to 5 stars and an optional comment, then edit or delete it. Everyone can read the list. The list loads in the browser, the renter's own review is pinned at the top of the area, and the form sits inside the area, not in a dialog. The area plugs into the profile page of feature #15, so that page must exist before this one is built. No new library, table or environment variable.

## Requirements

Taken from feature #35 in the scope and settled with the project owner. Contract with the backend: `api-for-frontend.md` section 3 (rate limits), 6.31 (profile, now nine fields), 6.40 (eight review APIs, the five "write block" traps), section 7 ("Hồ sơ chủ trọ", step 5) and Appendix B. Patterns to follow: spec 0002 (client, session, cache emptied when the session changes), 0003 and 0004 (components, zones, type), 0005 (`authHref`), 0009 (`ListPagination`), 0012 (chat: form rules, countdown, query layout, the shared types and nine error codes).

**User stories**:
- As a renter whom a landlord has answered in chat, I want to rate that landlord with stars and a short comment so that other renters can judge them.
- As a renter, I want my review pinned at the top, with edit and delete, and to see when an admin hid it and why.
- As a visitor, I want to page through the reviews with each author's name and date.
- As a guest, I want a clear way to sign in to review. As a landlord or an admin, I only read.
- As a keyboard or screen reader user, I want the star input and the results of my actions to be usable and announced.

**Acceptance criteria** (the contract; each can be checked on its own):

- **AC-1**: The zone. `ReviewsZone` is a client component drawn as one `Card` zone with `id="danh-gia"`, placed by the profile page after the listings zone. It takes `landlordId` (a UUID from the route) and reads `reviewPage` from the URL itself. The page wraps it in `<Suspense>` with `ReviewsZoneSkeleton`, because it reads `useSearchParams`. The server HTML holds only the skeleton: no review text comes from the server. The heading is "Đánh giá" with the count taken from `reviewCount` of the shared profile query (AC-16): "12 đánh giá", or "Chưa có đánh giá" when it is 0. While the profile is not loaded the heading has no count. The count is never taken from the list length and never reduced by one for the viewer's own review. A `landlordId` that is not a UUID makes no request and draws nothing.
- **AC-2**: Who sees what. A pure function `reviewRole(session)` in `access.ts` returns `loading` (session still restoring), `guest`, `writer` (a signed in user with `accountType` `tenant` and `can(session, "review:read")`) or `reader` (any other signed in user: landlord, admin, a renter without `review:read`). Only `writer` calls `GET /landlords/:id/review`. Within the writer view the buttons need `review:create` (write), `review:update` (edit) and `review:delete` (delete). Hiding a control is a convenience, the backend decides.
- **AC-3**: The public list. `GET /landlords/:id/reviews?page=<reviewPage>&pageSize=10`, auth mode `optional`. It runs only when the session is `guest` or `user`, never while `loading`. The key is `["landlord-reviews", landlordId, "list", viewer, page]` where `viewer` is `user.id` or `"guest"`. `keepPreviousData` keeps the old rows while the next page loads (the list gets `aria-busy`). `staleTime` 30 seconds. The default retry (once) applies.
- **AC-4**: A review row. Stars (`StarRating`, AC-17), the author name (`author.name`, `null` shows "Người dùng"), the date `formatDateTime(createdAt)`, a small "Đã chỉnh sửa" when `updatedAt` differs from `createdAt`, and the comment as plain text (`white-space: pre-wrap`, `break-words`, never HTML; no comment, no text). Rows are `li` in a `ul` with dividers, in the order the API gives (newest first). A row is not a card, because a card never sits inside a card (spec 0004).
- **AC-5**: My review, pinned. For a `writer` whose `GET /review` returned a `review`, the zone shows it as a highlighted row (`bg-accent`) at the top, above the list, on every page, labeled "Đánh giá của bạn". It is the only place with "Sửa" and "Xóa". The list drops every item with `isMine === true` on every page. `total`, the page count and the heading count are never changed for it (they still include it while it is visible). When `status` is `hidden_by_admin` the row shows the badge "Bị quản trị viên ẩn", the line "Đánh giá này không hiện với mọi người.", the reason as "Lý do: <hiddenReason>", and only "Xóa" (no "Sửa").
- **AC-6**: The write block, for a `writer`, shown under the heading and above the list, first match wins: (1) `GET /review` is loading: a skeleton as high as the form; (2) `review` is not `null`: the pinned row (AC-5); (3) `canReview` is `true`: the form (AC-7); (4) otherwise: the hint "Nhắn tin với chủ trọ và đợi họ trả lời để đánh giá." with a link "Xem tin của chủ trọ" to `#tin-dang` (the listings zone); (5) the read failed: an inline notice "Không tải được trạng thái đánh giá của bạn." with "Thử lại", and `RateLimitNotice` with the countdown on 429. The public list still shows in every case. A `guest` sees one row, "Đăng nhập để đánh giá chủ trọ", a link to `authHref("/login", <current path and query>)`. A `reader` sees no write block and makes no call to `/review`. A landlord on their own profile is a `reader`.
- **AC-7**: The form. React Hook Form with a Zod `reviewSchema`. `stars` is an integer from 1 to 5, with no value chosen at the start, and the error "Hãy chọn số sao." when missing. The star input is a `radiogroup` labeled "Số sao" with five radios named "1 sao" to "5 sao": arrow keys move the choice, one Tab stop, filled stars up to the chosen one. `comment` is a textarea labeled "Nhận xét (không bắt buộc)": whitespace only counts as empty, otherwise 1 to 1000 Unicode characters after trimming (`Array.from(text.trim()).length`, the same rule as `messageLength` in chat), the error "Nhận xét dài tối đa 1000 ký tự.", and a counter `n/1000` that turns `destructive` above the limit. The submit button ("Đăng đánh giá") is locked with `aria-disabled` while sending (not `disabled`, so focus stays) and the fields are `readOnly`. The draft lives in the form state of a component above the write block, so a refetch does not clear it. It is lost when the person leaves the page (no storage).
- **AC-8**: Write. `POST /landlords/:id/review` with `{ stars, comment? }`: `comment` is left out when empty after trimming, otherwise it is sent as typed. On success, in this order: `setQueryData` on the `mine` key to `{ review: <result>, canReview: false }`, invalidate the lists of this landlord and the shared profile query, clear the form, move focus to the pinned row heading, announce "Đã đăng đánh giá của bạn." The pinned row appears at once and the count and average update when the profile read returns.
- **AC-9**: Edit. "Sửa" on a visible pinned row turns that row into the same form, filled with the current stars and comment, with the buttons "Lưu thay đổi" and "Hủy". The body holds only the fields that changed: `stars` when changed, `comment` when changed (empty after trimming sends `null`). If nothing changed, no request is made and the editor just closes (the backend moves `updatedAt` even for an identical value, which would show a false "Đã chỉnh sửa"). On success: `setQueryData` replaces `review` with the result, invalidate the lists and the profile, close the editor, focus returns to "Sửa", announce "Đã lưu thay đổi." "Hủy" drops the draft and returns focus to "Sửa".
- **AC-10**: Delete. "Xóa" (visible or hidden review) opens an `AlertDialog` titled "Xóa đánh giá của bạn?" with "Đánh giá sẽ bị xóa hẳn. Bạn có thể viết lại sau.", the buttons "Giữ lại" and "Xóa đánh giá" (destructive). On confirm, `DELETE /landlords/:id/review` (204). On success: `setQueryData` on `mine` to `{ review: null, canReview: false }`, then the mutation waits for one read of `mine` before it settles, so the card is replaced by the form or the hint in one step; invalidate the lists and the profile; close the dialog; focus moves to the zone heading (the opener is gone); announce "Đã xóa đánh giá."
- **AC-11**: Paging. `ListPagination` in button mode (`onPageChange`), `itemLabel` "đánh giá", `size="lg"`. The page is the URL parameter `reviewPage`, read by Zod (a whole number from 1, anything else is 1), separate from the `page` of the listings zone, which the zone never touches. Changing the page writes `reviewPage` into the current URL and keeps the other parameters (page 1 removes `reviewPage`) with `router.replace(url, { scroll: false })`, then focuses the zone heading and announces "Trang N". The page size is the constant `REVIEWS_PAGE_SIZE = 10`. The page count is `Math.ceil(total / 10)` from the list `total`, which includes the viewer's own visible review.
- **AC-12**: Empty and odd pages, from a pure `listView(...)`. `total` is 0: "Chưa có đánh giá nào." Items remain after dropping the viewer's own: the rows. Items came back but none remain (the page held only the viewer's review, already pinned): "Trang này không có đánh giá nào khác." No items but `total` above 0 (a page past the last): "Trang này không có đánh giá." with the button "Về trang đầu" (page 1). The pagination stays whenever the page count is above 1.
- **AC-13**: Read failures. First load of the list fails: `ErrorState` with "Thử lại" inside the zone, and `RateLimitNotice` with a countdown on 429. 404 `LANDLORD_NOT_FOUND` from either read: the zone draws nothing and invalidates the profile query, so the profile page shows its "không tìm thấy chủ trọ" state. A failure on a later page replaces the list by the same `ErrorState`; the pagination stays.
- **AC-14**: Write failures, from a pure `classifyReviewError(error, action)`. The draft is kept in every case.
  - 400 `VALIDATION_FAILED`: `applyFieldErrors` puts the `stars` and `comment` messages on the fields; anything else becomes a form message through `useFormFailure`.
  - 429: the countdown of `useFormFailure`, the submit stays locked until it ends, the wait is shown with `formatWait` (one hour for the three write APIs, AC-15).
  - 403 `REVIEW_NOT_ELIGIBLE`: show the error `message` and keep the link to the listings zone; read `mine` again (it becomes the hint).
  - 409 `REVIEW_ALREADY_EXISTS`: "Bạn đã đánh giá chủ trọ này rồi."; read `mine` and the lists again (the pinned row appears).
  - 409 `REVIEW_HIDDEN` (edit): "Đánh giá này đang bị quản trị viên ẩn nên không sửa được. Bạn có thể xóa rồi viết lại."; read `mine` again (the editor closes, the hidden row shows).
  - 404 `REVIEW_NOT_FOUND` on edit: "Không tìm thấy đánh giá của bạn. Có thể bạn đã xóa nó ở nơi khác."; read `mine`, the lists and the profile again. On delete it counts as done: the success steps of AC-10 run, with the line "Đánh giá đã được xóa trước đó."
  - 404 `LANDLORD_NOT_FOUND`: "Chủ trọ này không còn."; invalidate the profile query.
  - 403 `PERMISSION_DENIED` and 409 `CANNOT_REVIEW_SELF`: show the `message`, or "Bạn không có quyền đánh giá." when it is empty; read `mine` again.
  - Network, timeout, 5xx: `describeError(error).message` in the form, the button works again, nothing is sent again by itself.
  - 401 and 403 `ACCOUNT_LOCKED` are handled by the session layer (spec 0002).
- **AC-15**: Rate limits. `src/lib/api/rate-limits.ts` adds `POST`, `PATCH` and `DELETE` for `/landlords/:id/review` with a block of one hour (contract section 3: 20 per hour for each API). The two reads fall to the 60 second default, which matches the contract (300 per minute, blocked one minute). The section comment of the file names this spec.
- **AC-16**: Keys and refresh. `reviewKeys` in `api/review-keys.ts`: `all(landlordId)`, `lists(landlordId)`, `list(landlordId, viewer, page)` and `mine(landlordId)`, all starting with `"landlord-reviews"`. The `mine` key has no viewer: the whole cache is emptied when the session changes (spec 0002). After any successful write the lists are invalidated and so is the shared profile query of #15 (`landlordKeys.profile(landlordId)`, the name #15 exports), which is how the stars and counts at the top of the profile change.
- **AC-17**: Accessibility. `StarRating` (display only, in `src/components/star-rating.tsx`, shared with #15 and #36) has `role="img"` with `aria-label` "4 trên 5 sao"; the icons are `aria-hidden`; filled stars use `text-primary` and empty ones `text-muted-foreground`, both pairs already in `scripts/check-contrast.mjs` (so no new pair). One visually hidden `role="status"` line, always mounted in the zone, carries the announcements named above and never any comment text. Focus targets that are not controls (the zone heading, the pinned row heading) have `tabIndex={-1}`. Controls are 44 px high (`size="lg"`) at every width.
- **AC-18**: Safety and privacy. No `dangerouslySetInnerHTML` in `src/features/landlord-reviews`. A comment and a `hiddenReason` are shown only as text. The draft is never in a URL, storage, the console, a toast or a live region. The list shows the author name only (the API sends no id, email or phone). No JSON-LD and no meta tag change for ratings. Only a `writer` calls `GET /review`, and every call carries the `signal` TanStack gives.
- **AC-19**: Mobile. The zone works at 390 px: rows wrap, buttons and radios are 44 px, the pagination uses its short "Trang n/m" form below `sm`.
- **AC-20**: The numbers at the top. The profile header of #15 reads `reviewCount` and `ratingAverage` from the same query that AC-16 invalidates, and shows "4,3 (12 đánh giá)" (`formatRating` and `StarRating`) or "Chưa có đánh giá". This zone never computes an average.
- **AC-21**: Preview in `/dev/ui`. A new section on fake data, no backend: the zone as a guest, as a `reader`, as a `writer` with the hint, with the empty form, with the form's errors, with a visible pinned row, with a hidden pinned row and its reason, the delete dialog, a list of 25 reviews over three pages including the page that holds only the viewer's review and a page past the last, and the 429 countdown. Both `/dev` routes already answer 404 in production. This is the last milestone and can be skipped.

## Decision

**Chosen option**: Option 1: a client only zone, the viewer's review pinned from `GET /review` and removed from the list, the form inside the zone.

The zone is a thin layer on contract 6.40. The profile page mounts it and gives it a landlord id; it owns everything below its heading. Its smaller decisions (no JSON-LD, page size 10, replace without scrolling, skip an edit that changes nothing) are in `rationale.md`.

**Implementation skills**: `tanstack-query-best-practices` (`deckardger/tanstack-agent-skills`, `.agents/skills/tanstack-query-best-practices/`) · `react-hook-form` (`pproenca/dot-skills`, `.agents/skills/react-hook-form/`) · `zod` (`pproenca/dot-skills`, `.agents/skills/zod/`) · `shadcn` (`shadcn-ui/ui`, `.agents/skills/shadcn/`)

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

## Feature design

**Data model sketch** (nothing is stored here; the shapes are the contract types, already in `src/lib/api/types.ts` from spec 0012 AC-23, plus what #15 adds):

| Shape | Source | Fields | Rule |
|---|---|---|---|
| `LandlordProfile` (extended) | `GET /landlords/:id`, built by #15 | adds `reviewCount` (whole number from 0) and `ratingAverage` (number or `null`) | `null` average exactly when the count is 0 |
| `PublicReview` | `GET /landlords/:id/reviews` | `id`, `stars`, `comment` or `null`, `author.name` or `null`, `isMine` (`true`, `false`, `null`), `createdAt`, `updatedAt` | belongs to one landlord (the id comes from the path); one review per (author, landlord) |
| `MyReviewState` | `GET /landlords/:id/review` | `review` (`MyReview` or `null`), `canReview` | the only truth for "have I reviewed" |
| `MyReview` | same API, and the result of `POST` and `PATCH` | `id`, `stars`, `comment`, `status` (`visible` or `hidden_by_admin`), `hiddenReason`, `createdAt`, `updatedAt` | a visible one is also in the public list with `isMine` `true` |
| Browser state | URL and components | `reviewPage` (whole number from 1), the draft (`stars`, `comment`), the editing flag, the announcement text | no storage |

New types, added to the body section of `types.ts`: `CreateReviewBody { stars: number; comment?: string }` and `UpdateReviewBody { stars?: number; comment?: string | null }`.

**State transitions**: the viewer's review: none to `visible` (POST), `visible` to `visible` (PATCH), `visible` to none and `hidden_by_admin` to none (DELETE). `visible` and `hidden_by_admin` switch by an admin action (feature #36); this zone never causes it. PATCH on `hidden_by_admin` is 409. The write block (AC-6): `checking`, then one of `pinned`, `editing`, `form`, `hint`, `error`; after a successful DELETE it goes back through `checking` to `form` or `hint`.

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/landlords/:id/reviews` | GET | `page`, `pageSize` (only these two) | `{ items, total, page, pageSize }`, `isMine` set when a token is sent | `optional` (never 401) | 404 `LANDLORD_NOT_FOUND`, 400, 429 |
| `/landlords/:id/review` | GET | none | `{ review, canReview }` | `required`, `review:read`, tenant only | 403 `PERMISSION_DENIED`, 404 `LANDLORD_NOT_FOUND`, 429 |
| `/landlords/:id/review` | POST | `stars` (required), `comment` (optional) | the review (201) | `required`, `review:create` | 400 `VALIDATION_FAILED`, 403 `REVIEW_NOT_ELIGIBLE`, 409 `REVIEW_ALREADY_EXISTS`, 409 `CANNOT_REVIEW_SELF`, 404, 429 |
| `/landlords/:id/review` | PATCH | `stars` and or `comment` (`null` clears it), at least one | the review (200) | `required`, `review:update` | 400, 404 `REVIEW_NOT_FOUND`, 409 `REVIEW_HIDDEN`, 429 |
| `/landlords/:id/review` | DELETE | none | 204 | `required`, `review:delete` | 404 `REVIEW_NOT_FOUND`, 404 `LANDLORD_NOT_FOUND`, 429 |
| `/landlords/:id` | GET | none | the profile with `reviewCount`, `ratingAverage` | built and owned by #15 | 404 |

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| Every call | `landlordId` | the route `[id]` of the profile page (#15), checked as a UUID |
| List key | `viewer` | session: `user.id`, or `"guest"` |
| List read | `page` | URL parameter `reviewPage` through Zod, default 1 |
| List read | page size | constant `REVIEWS_PAGE_SIZE` (10) |
| Heading | review count | `reviewCount` of the shared profile query (#15), not the list length |
| Pagination | page count | `Math.ceil(list.total / 10)` |
| Row | author label | `author.name`, else "Người dùng" |
| Row | date, "Đã chỉnh sửa" | `formatDateTime(createdAt)`; shown when `updatedAt !== createdAt` |
| Row | stars text | `stars` and the words "trên 5 sao" |
| Pinned row | hidden label and reason | `MyReview.status`, `MyReview.hiddenReason` |
| Write block | which state | `reviewRole(session)`, then `mine.review`, then `mine.canReview` |
| Guest row | return address | `usePathname()` and the current query through `useSearchParams()`, passed to `authHref` |
| Hint | link target | the id `tin-dang` that #15 gives its listings zone |
| Edit | request body | the difference between the form values and `mine.review` |
| 429 | wait | `ApiError.retryAfterSeconds`, else `blockSecondsFor` (AC-15) |
| Buttons | shown or hidden | `can(session, "review:create" \| "review:update" \| "review:delete")` |
| Profile header | average text | `formatRating(ratingAverage)` (exists since spec 0012) |

**What #15 must provide** (it has no spec; its build must meet this, and `/develop` of #35 stops if it does not):
1. The route `/chu-tro/[id]`, with the id checked as a UUID.
2. `reviewCount` and `ratingAverage` on `LandlordProfile`, and the header line of AC-20.
3. A browser read of the profile under one exported key (`landlordKeys.profile(id)`) and a hook that returns it, shared by the follow button, the header and this zone.
4. The listings zone with `id="tin-dang"`, then `<Suspense fallback={<ReviewsZoneSkeleton />}><ReviewsZone landlordId={id} /></Suspense>` after it.
5. The listings zone keeps its own `page` parameter and leaves `reviewPage` alone.

**Code layout**:
```
src/features/landlord-reviews/
  access.ts                reviewRole(session)
  review-list.ts           REVIEWS_PAGE_SIZE, withoutMine, listView, pageCount (pure)
  review-errors.ts         classifyReviewError(error, action) (pure)
  schemas/review-schema.ts reviewSchema, COMMENT_MAX, commentLength, toCreateBody, toPatchBody
  schemas/review-page.ts   parseReviewPage(raw)
  api/                     review-api.ts, review-keys.ts, review-queries.ts
  hooks/                   use-review-list.ts, use-my-review.ts, use-review-actions.ts, use-review-page.ts, use-announce.ts
  components/              reviews-zone.tsx, reviews-zone-skeleton.tsx, write-block.tsx, my-review-row.tsx,
                           review-form.tsx, star-input.tsx, review-row.tsx, review-list.tsx, delete-review-dialog.tsx
src/components/star-rating.tsx   (display only; create it if #15 has not)
src/lib/api/rate-limits.ts       (three rules)
src/app/dev/ui/reviews.tsx, reviews-sample.ts   (preview)
```

**Key invariants**:
- The form and the pinned row are never shown together.
- "Have I reviewed" comes only from `GET /review` (`review`, `canReview`), never from the absence of `isMine` in the list (a hidden review is not in the list).
- The list drops `isMine === true` items and no count is adjusted for it.
- Only a `writer` calls `GET /review`. The list never runs while the session is `loading`.
- A PATCH body is never empty; an edit that changes nothing sends nothing.
- `stars` is a whole number from 1 to 5. `comment` is `null` or 1 to 1000 Unicode characters after trimming.
- Nothing in this zone writes to storage or to the server HTML.

**Security model**: the list is public and readable by a guest. `GET`, `POST`, `PATCH` and `DELETE` on `/review` act on the person in the token only, and the landlord is always the path id, so nobody can read or change someone else's review. The backend returns 403 to an admin on those four calls even with `review:*`, so the zone treats an admin as a `reader`. Author names are public with no opt out (contract). No compliance scope beyond that.

**Configuration required**: none.

**Critical test scenarios** (each maps to an acceptance criterion):
- Happy path: a renter the landlord has answered writes 4 stars and a comment, sees the pinned row at once and the count and average change, edits it, then deletes it and sees the form again, verifies **AC-5**, **AC-7**, **AC-8**, **AC-9**, **AC-10**, **AC-20**.
- Hidden review: the author of a review hidden by an admin sees the badge, the reason and only "Xóa"; the review is not in the public list or the count, verifies **AC-5**, **AC-3**.
- Not eligible: a renter who messaged but got no reply sees the hint and no form; a forced `POST` that returns `REVIEW_NOT_ELIGIBLE` reads `mine` again, verifies **AC-6**, **AC-14**.
- Paging on fake data: page 2 of 3 keeps the scroll position and moves focus to the heading; a page that holds only my review shows the "không có đánh giá nào khác" line; a page past the last offers "Về trang đầu", verifies **AC-11**, **AC-12**.
- Two tabs: a double submit gives one review and the other call lands on `REVIEW_ALREADY_EXISTS`, which shows the pinned row; delete in one tab then edit in the other shows the `REVIEW_NOT_FOUND` line, verifies **AC-14**.
- Rate limit: the 21st write in an hour shows the countdown and keeps the draft, verifies **AC-14**, **AC-15**.
- Roles: a guest sees the sign in row, a landlord (also on their own profile) and an admin see the list only and make no `/review` call, verifies **AC-2**, **AC-6**.
- Safety: a comment with `<img onerror>` and several line breaks shows as plain text with the breaks kept, verifies **AC-4**, **AC-18**.
- Data to use (from the contract sample data): Khoa has 8 visible reviews (one more from a locked author is not shown); Nhung has 7 visible and one hidden by an admin (written by Quân); Bảo has 4, and Tuấn messaged Bảo without an answer (the hint); Phát has 3, and Lan Anh and Việt were answered but have not reviewed (write); Tâm has exactly 1; Mai has none. A write or a delete changes shared demo data, so delete what you wrote.

## Build plan

Build approach: Tracer Bullet (the project default). M1 is one thin real thread from the session to the server and back; the later milestones thicken it. Precondition: feature #15 meets "What #15 must provide". Read the Next.js guides for `useSearchParams`, `useRouter` and `<Suspense>` in `node_modules/next/dist/docs/` before writing the pages and the hooks.

1. **M1, the thin thread: a renter writes a review and sees it pinned and counted.** Add the three write rules to `rate-limits.ts` (AC-15), `CreateReviewBody` and `UpdateReviewBody` to `types.ts`, `review-api.ts`, `review-keys.ts`, `review-queries.ts` (AC-3, AC-16), `reviewRole` (AC-2), `StarRating` (AC-17, only if #15 has not made it), the zone with its skeleton and heading, the guest row, the plain page 1 list with rows (AC-1, AC-3, AC-4), the write block with `mine` and a minimal form (stars and comment) that posts and shows the pinned row (AC-5 visible case, AC-6, AC-7, AC-8), and the profile refresh (AC-16, AC-20).
2. **M2, edit, delete and the hidden state.** The editor with the changed fields only and the no change rule, the delete dialog with the wait for `mine`, the hidden pinned row, the focus moves and the announcement line (AC-9, AC-10, AC-5 hidden case, AC-17).
3. **M3, paging and the states of the list.** `reviewPage` through Zod, `ListPagination` in button mode with `router.replace` and no scroll, the page heading focus, the empty and odd page lines through `listView`, the read failures, the mobile check at 390 px (AC-11, AC-12, AC-13, AC-19).
4. **M4, failures and safety.** `classifyReviewError` for every case and its use in the form and the dialog, the 429 countdown, the privacy pass (AC-14, AC-18).
5. **M5, preview (skip it if time runs out).** The `/dev/ui` section on fake data (AC-21).

## Consequences

**Positive**:
- One read path for the viewer's review and one for the public list, so "have I reviewed" has a single truth and the hidden case needs no special lookup.
- The zone is an island: the profile page only gives it an id, and #36 (the admin side) reuses `StarRating` and the types.
- No new library, table, environment variable or server code.

**Negative / tradeoffs**:
- Review text is not in the server HTML, so a search engine does not read it, and with no JSON-LD there are no stars in search results.
- A page can show no row at all (it held only the viewer's review), which needs its own line, and the pinned row repeats on every page.
- The page count includes the viewer's own review while the rows do not, so a page can hold 9 rows.
- Pagination cannot be tried on the sample data (at most 8 visible reviews per landlord, 10 per page); only the `/dev/ui` preview and the pure functions cover it.
- This spec depends on a page (#15) that has no spec yet, so a mismatch in names is possible until #15 is built.
- Each write reads the profile again, which is one more request than editing the count by hand.

**Neutral**:
- A new feature folder `src/features/landlord-reviews/`, three rate limit rules, and `StarRating` as a shared component.
- Reviewer names are public with no way to hide them (contract).

## Follow-up

- [ ] Build #15 first and meet "What #15 must provide". `/develop landlord profile and follow` should read that section; if #15 chooses other names, update the names here in one pass.
- [ ] The scope text of #15 says the JSON-LD `aggregateRating` is "chốt ở #35"; this spec decided not to build it, so the #15 row should drop that sentence at the next `/scope` run.
- [ ] If #15 already made a star display, point `StarRating` at it instead of a second one.
- [ ] Not built, waiting for the backend (already in the scope Deferred list): report a review, landlord replies, star distribution, filter or sort by stars, photos, "helpful" votes, text search, anonymous reviews.
