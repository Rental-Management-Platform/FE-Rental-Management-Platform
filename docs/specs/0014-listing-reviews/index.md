# 0014. Listing reviews: rate a room on the listing page

**Date**: 2026-11-10
**Status**: Proposed

## Summary

This adds a "Đánh giá phòng" (room reviews) block at the bottom of the public listing page. A renter whom the landlord has answered about that exact listing can give 1 to 5 stars and an optional comment, then edit or delete it. Everyone can read the list and the room's score. To avoid building the landlord reviews area of spec 0013 twice, the first milestone moves its shared parts into one neutral folder, and both the landlord block and the room block become thin users of it. No new library, table, environment variable or search markup.

## Requirements

Taken from feature #37 in the scope and settled with the project owner on 2026-11-10. Contract with the backend: `api-for-frontend.md` section 3 (rate limits), 6.20 (the detail and its `id`), 6.41 (the five reader and writer APIs, the six "build the block" traps), section 7 ("Đánh giá phòng trên chi tiết tin"). Patterns to follow: spec 0010 (the listing page), 0012 (the chat control), 0013 (the reviews area; its acceptance criteria apply to the room block unless this spec says otherwise).

**User stories**:
- As a renter whom a landlord answered about a listing, I want to rate that room with stars and a short comment so that other renters can judge it.
- As a renter, I want my review pinned at the top of the block, with edit and delete, and to see when an admin hid it and why.
- As a visitor, I want to see the room's score and page through its reviews with each author's name and date.
- As a guest, I want a clear way to sign in to review. As a landlord (the listing's owner too) or an admin, I only read.
- As a renter who may not review yet, I want to be told what to do and get the message button right there.
- As a keyboard or screen reader user, I want the star input and the results of my actions to be usable and announced.

**Acceptance criteria** (the contract; each can be checked on its own):

- **AC-1**: The block. `ListingReviews` is a client component drawn as one `Card` zone with `id="danh-gia-phong"` and the heading "Đánh giá phòng" (an `h2` and a focus target, `tabIndex={-1}`). `ListingDetail` puts it last in the left column, after the "Nhà trọ" card, inside `<Suspense fallback={<ReviewsZoneSkeleton heading="Đánh giá phòng" reviewCount={…} ratingAverage={…} />}>`, and passes it `id`, `code`, `title`, `landlord` (`{ id, name }`), `reviewCount` and `ratingAverage` from its own server read. An `id` that is not a UUID (`isUuid`) makes no request and draws nothing. The server HTML holds the heading, the score line (AC-3) and skeletons, and no review text. `ReviewsZoneSkeleton` takes `heading`, `reviewCount` and `ratingAverage` (all optional; the landlord page passes none) and draws the real heading and a static score line, so this holds even if the block suspends on `useSearchParams`. The page still reads no cookie, header or token, so everyone gets the same HTML.
- **AC-2**: Layout. On a phone the block is one more card in the single column, last, always open (no fold). From `lg` it sits in the left column (`lg:col-start-1`) and the row span of the contact aside grows by one, so the contact card stays sticky beside the reviews: its class is `lg:row-span-5` with a description and `lg:row-span-4` without (today 4 and 3), chosen by a ternary between two whole class strings, never built with a template string, which Tailwind would not see. The structured data of spec 0010 (AC-16) stays one breadcrumb: no JSON-LD for ratings, no meta tag change.
- **AC-3**: The score line. Under the heading, `RatingLine` draws `StarRating` and "4,3 (12 đánh giá)", or only "Chưa có đánh giá" when `reviewCount` is 0 (never 0 stars). The numbers come from `useListingSummary` (AC-4). The block never computes an average, never reduces the count for the viewer's own review, and never takes it from the list length.
- **AC-4**: The numbers and how they refresh. `useListingSummary` is a `useQuery` under `listingReviewKeys.summary(listingId)`: `GET /listings/<code>` with `auth: "none"` (the same guest read the server makes), the `queryFn` fetches the detail and returns only `{ reviewCount, ratingAverage }` (no `select`, because `initialData` must have the same shape the `queryFn` returns), `initialData` is the server numbers, `staleTime` is `Infinity` and `gcTime` is `0` (so a visit the server renders starts from the numbers it just read, never from an older cache entry; the browser back button can still replay an old page, see Consequences). Nothing reads it on a timer: only the invalidate after a write (AC-19) does. The project default retry applies (once, and only when a retry can help). A failed read keeps the old numbers and shows nothing. `LISTING_NOT_FOUND` is AC-16.
- **AC-5**: Who sees what. The shared `reviewRole(session)` of 0013 AC-2: `loading`, `guest`, `writer` (a signed in `tenant` with `review:read`) or `reader` (anyone else signed in: a landlord, the owner of this listing, an admin, a renter without `review:read`). Only a `writer` calls `GET /listings/:id/review`. In the writer view the buttons need `review:create`, `review:update` and `review:delete`. Hiding a control is a convenience; the backend decides.
- **AC-6**: The public list. `GET /listings/:id/reviews?page=<reviewPage>&pageSize=10`, auth `optional`, only when the session is `guest` or `user` (never `loading`). Key `["listing-reviews", listingId, "list", viewer, page]` with `viewer` the `user.id` or `"guest"`. The previous page stays while the next loads, only for the same viewer. `staleTime` 30 seconds, default retry. `:id` is the `id` of the listing detail, never the slug or the code.
- **AC-7**: A row and my pinned card. The shared components and rules of 0013 AC-4 and AC-5: stars, author name (`null` shows "Người dùng"), date, "Đã chỉnh sửa", the comment as plain text with its line breaks; my visible review pinned at the top with "Sửa" and "Xóa"; my hidden review shows "Bị quản trị viên ẩn", "Đánh giá này không hiện với mọi người.", the reason, and only "Xóa". The list drops every item with `isMine === true` on every page and no count is changed for it.
- **AC-8**: The write block, under the score line and above the list. For a `writer`, first match wins: (1) `GET /review` loading: a skeleton as high as the form; (2) the read failed: "Không tải được trạng thái đánh giá của bạn." with "Thử lại", and `RateLimitNotice` with the countdown on 429; (3) `review` not `null`: the pinned card; (4) `canReview` true: the form under "Viết đánh giá của bạn" when the person has `review:create`, and nothing at all when not (no hint either, as in 0013, because the hint would send them to chat for something they cannot do); (5) `canReview` false: the hint (AC-9). A `guest` sees one row, "Đăng nhập để đánh giá phòng", a link to `authHref("/login", <current path and query>)`. A `reader` sees no write block and makes no call to `/review`. The public list shows in every case.
- **AC-9**: The hint. For a `writer` with `review` `null` and `canReview` false: the sentence "Nhắn tin cho chủ trọ về tin này và đợi họ trả lời để đánh giá phòng." and under it the chat control of spec 0012: the first message button when no conversation about this listing exists, "Xem tin nhắn của bạn" (a link) when one does, a skeleton while the lookup runs. The control is `ChatEntryControl` with the props `{ entry, listing: { id, title }, landlordName, basePath, describedBy? }`, taken out of `ChatEntrySlot`. `ChatEntrySlot` keeps `toChatEntry`, the lookup, the divider and the card wrapper, and wraps the control, so the contact card and the hint share it. A failed lookup draws what the contact card draws today (the first message button). The hint passes `describedBy` pointing at its sentence, so a screen reader can tell the page's two message buttons apart. The lookup is the same `byListingQuery(api, listing.id)` the contact card runs, so it costs no second request. When the viewer cannot chat at all (`ChatEntry` is `none`) no hint is drawn. The block shows only what `canReview` says: a chat about another listing of the same landlord does not unlock it, and the block never guesses.
- **AC-10**: The form. The shared `ReviewForm` of 0013 AC-7, unchanged: `stars` a whole number from 1 to 5 with no value at the start, radiogroup "Số sao", `comment` optional, whitespace only counts as empty, otherwise 1 to 1000 Unicode characters after trimming, counter `n/1000`, the button locked with `aria-disabled` while sending, fields `readOnly`. The draft lives in the write block above the part that swaps form, card and hint, so a refetch never clears it, and it is lost when the person leaves the page.
- **AC-11**: Write. `POST /listings/:id/review` with `{ stars, comment? }` (`comment` left out when empty). On success, in this order: `setQueryData` on the `mine` key to `{ review: <result>, canReview: false }`, invalidate the lists and the summary of this listing, clear the form, focus the pinned card heading, announce "Đã đăng đánh giá của bạn." The pinned card appears at once, and the score line and the count change when the summary read returns.
- **AC-12**: Edit. As 0013 AC-9: "Sửa" turns the pinned card into the same form with "Lưu thay đổi" and "Hủy", only changed fields go out (`comment` empty sends `null`), nothing changed means no request, success replaces `review` in `mine`, invalidates the lists and the summary, closes the editor, returns focus to "Sửa" and announces "Đã lưu thay đổi."
- **AC-13**: Delete. As 0013 AC-10: `AlertDialog` "Xóa đánh giá của bạn?", `DELETE /listings/:id/review` (204), `mine` set to `{ review: null, canReview: false }` then one read of `mine` before the mutation settles, lists and summary invalidated, focus to the block heading, announce "Đã xóa đánh giá."
- **AC-14**: Paging. As 0013 AC-11 and AC-12, with two differences. The page is the address parameter `reviewPage` (Zod, a whole number from 1, anything else is 1). `useReviewPage` gets a `navigate` option: this block uses the native `window.history.replaceState`, which keeps the other parameters and the hash and asks the server for nothing (page 1 removes `reviewPage`); the landlord zone keeps its `router.replace`. The call is `window.history.replaceState(null, "", pathname + (query === "" ? "" : "?" + query) + window.location.hash)`, where `query` comes from a copy of `useSearchParams()` with `reviewPage` set or removed. After a page change focus goes to the block heading without scrolling (`focus({ preventScroll: true })`) and "Trang N" is announced. `ListPagination` in button mode, `itemLabel` "đánh giá", `size="lg"`, 10 rows a page, the page count from the list `total`. The empty page, the page that holds only my review and the page past the last come from the shared `listView`. The slug fix of spec 0010 (AC-11) keeps the query, so `/<code>?reviewPage=2` still shows page 2 after the fix.
- **AC-15**: Read failures. The first load of the list fails: `ErrorState` with "Thử lại" inside the block, and `RateLimitNotice` with a countdown on 429. A failure on a later page replaces the list by the same notice and the pagination stays.
- **AC-16**: The listing is gone. `ListingReviews` holds this check in one place: one effect watches the errors of the list, of `mine` and of the summary for `LISTING_NOT_FOUND`, and the write path calls `onGone` when the classifier returns `gone`. Either one makes the block draw nothing and call `router.refresh()`, guarded by a `useRef` flag so it runs once per mount (the flag also survives the StrictMode double effect). The server read of `ListingDetail` then answers `LISTING_NOT_FOUND` and the page becomes the not found page (spec 0010, AC-12). A write that hits it first shows "Tin này không còn." until then. No other error mentions the listing.
- **AC-17**: Write failures, from the shared `classifyReviewFailure(error, action, vocabulary)` with the room vocabulary (its result keeps the shipped `ReviewFailure` shape and adds `gone`, which AC-16 acts on). The draft is kept in every case. 400 `VALIDATION_FAILED`: field messages on `stars` and `comment`. 429: the countdown, the button locked until it ends, the wait from `formatWait`. 403 `LISTING_REVIEW_NOT_ELIGIBLE`: the server `message`, read `mine` again (it becomes the hint). 409 `LISTING_REVIEW_ALREADY_EXISTS`: "Bạn đã đánh giá phòng này rồi."; read `mine`, the lists and the summary again. 409 `LISTING_REVIEW_HIDDEN` (edit): the hidden message of 0013; read `mine` again. 404 `LISTING_REVIEW_NOT_FOUND`: on edit "Không tìm thấy đánh giá của bạn. Có thể bạn đã xóa nó ở nơi khác." and read `mine`, the lists and the summary again; on delete it counts as done with "Đánh giá đã được xóa trước đó." 403 `PERMISSION_DENIED` and 409 `CANNOT_REVIEW_SELF`: the `message`, or "Bạn không có quyền đánh giá."; read `mine` again. Network, timeout, 5xx: `describeError(error).message`, nothing is sent again by itself. 401 and `ACCOUNT_LOCKED` belong to the session layer (spec 0002).
- **AC-18**: Rate limits. `src/lib/api/rate-limits.ts` adds `POST`, `PATCH` and `DELETE` for `/listings/:id/review` with a one hour block (20 an hour each). The two reads fall to the 60 second default, which matches the contract (300 a minute). The section comment names this spec.
- **AC-19**: Keys and refresh. `listingReviewKeys` in `listing-reviews/api/review-keys.ts`: `all(listingId)`, `lists(listingId)`, `list(listingId, viewer, page)`, `mine(listingId)`, `summary(listingId)`, all starting with `"listing-reviews"`. No key is shared with `landlord-reviews`, and a room write never invalidates a landlord key or the landlord profile (contract trap 6). After any successful write the lists and the summary are invalidated. The `mine` key has no viewer: the whole cache is emptied when the session changes (spec 0002).
- **AC-20**: Types. `ListingDetail` in `src/lib/api/types.ts` gets `reviewCount: number` and `ratingAverage: number | null`. `OwnerListingDetail` omits both (the owner's detail has neither), and every object that builds a `ListingDetail` (samples in `/dev/ui`) gets the two fields. `npm run check` is clean.
- **AC-21**: Accessibility, privacy and phone. As 0013 AC-17 to AC-19: `StarRating` is one image labelled "4 trên 5 sao"; one visually hidden `role="status"` line, always mounted, carries the announcements and never a comment; focus targets that are not controls have `tabIndex={-1}`; controls are 44 px high. No `dangerouslySetInnerHTML` in `listing-reviews`. A comment and a `hiddenReason` are shown only as text. The draft is never in a URL, storage, the console, a toast or a live region. The list shows the author name only. The block works at 390 px with the short "Trang n/m" pagination below `sm`. No new color pair.
- **AC-22**: The shared core. The neutral parts of `landlord-reviews` live in `src/features/reviews/` (the list in *Code layout*), and neither `landlord-reviews` nor `listing-reviews` imports the other. The landlord block behaves exactly as before the move: same texts, keys, focus moves, announcements and failures. Its `/dev/ui` preview still draws and imports from the shared folder.
- **AC-23**: Preview in `/dev/ui`. A new section on fake data, no backend: the room block as a guest, as a `reader`, as a `writer` with the hint (the message button, the "Xem tin nhắn của bạn" link and the skeleton), with the empty form, with the form's errors, with a visible pinned card, with a hidden pinned card and its reason, the delete dialog, the score line with and without reviews, 25 reviews over three pages with the page that holds only my review and a page past the last, and the 429 countdown. The `/dev` routes already answer 404 in production. This is the last milestone and can be skipped.

## Decision

**Chosen option**: Option 1: a shared review core with a subject adapter, and the room block as a thin subject on top of it.

The neutral parts of the landlord reviews area move to `src/features/reviews/`. Each subject (a landlord, a room) keeps only what truly differs: its API calls, keys, queries, actions, error vocabulary and wording. The two numbers on the page start from the server read and a small browser summary read updates them after each write. The block is the last card, always open, with no JSON-LD. Its smaller decisions are in `rationale.md`.

**Implementation skills**: `tanstack-query-best-practices` (`deckardger/tanstack-agent-skills`, `.agents/skills/tanstack-query-best-practices/`) · `react-hook-form` (`pproenca/dot-skills`, `.agents/skills/react-hook-form/`) · `zod` (`pproenca/dot-skills`, `.agents/skills/zod/`) · `shadcn` (`shadcn-ui/ui`, `.agents/skills/shadcn/`)

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

## Feature design

**Data model sketch** (nothing is stored on our side; the shapes are the contract types):

| Shape | Source | Fields | Rule |
|---|---|---|---|
| `ListingDetail` (extended) | `GET /listings/:slugCode`, read on the server | adds `reviewCount` (whole number from 0) and `ratingAverage` (number or `null`) | `null` average exactly when the count is 0; `OwnerListingDetail` omits both |
| `PublicReview` | `GET /listings/:id/reviews` | `id`, `stars`, `comment` or `null`, `author.name` or `null`, `isMine` (`true`, `false`, `null`), `createdAt`, `updatedAt` | same seven fields as 6.40; one review per (author, listing) |
| `MyReviewState` and `MyReview` | `GET /listings/:id/review`, and the result of `POST` and `PATCH` | `review` or `null`, `canReview`; `id`, `stars`, `comment`, `status`, `hiddenReason`, `createdAt`, `updatedAt` | the only truth for "have I reviewed" |
| Listing summary | `GET /listings/:code` in the browser | `reviewCount`, `ratingAverage` | equals `total` of the list after each read |
| Browser state | URL and components | `reviewPage`, the draft, the editing flag, the announcement text | no storage |

The review types already exist in `types.ts` from spec 0012 (`PublicReview`, `MyReview`, `MyReviewState`, `ReviewStatus`); the body types `CreateReviewBody` and `UpdateReviewBody` come from spec 0013. Only the two `ListingDetail` fields are new.

**State transitions**: the viewer's review is none to `visible` (POST), `visible` to `visible` (PATCH), `visible` or `hidden_by_admin` to none (DELETE). An admin switches `visible` and `hidden_by_admin` (feature #36); this block never causes it. PATCH on `hidden_by_admin` is 409. The write block shows, in order: a skeleton while `mine` loads, the failure notice if the read failed, then one of the pinned card, the editor, the form or the hint. After a delete the dialog stays open until one read of `mine` has landed, so the card gives way to the form or the hint in one step.

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/listings/:id/reviews` | GET | `page`, `pageSize` (only these two) | `{ items, total, page, pageSize }`, `isMine` set when a token is sent | `optional` (never 401) | 404 `LISTING_NOT_FOUND`, 400 `INVALID_ID`, 429 |
| `/listings/:id/review` | GET | none | `{ review, canReview }` | `required`, `review:read`, tenant only | 403 `PERMISSION_DENIED`, 404 `LISTING_NOT_FOUND`, 429 |
| `/listings/:id/review` | POST | `stars` (required), `comment` (optional) | the review (201) | `required`, `review:create` | 400, 403 `LISTING_REVIEW_NOT_ELIGIBLE`, 409 `LISTING_REVIEW_ALREADY_EXISTS`, 409 `CANNOT_REVIEW_SELF`, 404, 429 |
| `/listings/:id/review` | PATCH | `stars` and or `comment` (`null` clears it), at least one | the review (200) | `required`, `review:update` | 400, 404 `LISTING_REVIEW_NOT_FOUND`, 409 `LISTING_REVIEW_HIDDEN`, 429 |
| `/listings/:id/review` | DELETE | none | 204 | `required`, `review:delete` | 404 `LISTING_REVIEW_NOT_FOUND`, 404 `LISTING_NOT_FOUND`, 429 |
| `/listings/:code` | GET | none | the detail with `reviewCount`, `ratingAverage` | `none` (browser summary read); the server reads it as a guest | 404 `LISTING_NOT_FOUND`, 429 |

`:id` is the UUID `id` of the detail. Sending `slug-code` or `code` is 400 `INVALID_ID`.

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| Every review call | `listingId` | `listing.id` of the server read, passed as a prop, checked by `isUuid`; never the slug or the code |
| Summary read | `code` | `listing.code`, a prop |
| Score line, first paint | `reviewCount`, `ratingAverage` | the same server read, passed as props, used as `initialData` |
| Score line, after a write | the two numbers | the summary read (AC-4) |
| List key | `viewer` | session: `user.id`, or `"guest"` |
| List read | `page` | URL parameter `reviewPage` through Zod, default 1 |
| List read | page size | constant `REVIEWS_PAGE_SIZE` (10) |
| Pagination | page count | `Math.ceil(list.total / 10)` |
| Row | author label, date, "Đã chỉnh sửa", stars text | as 0013: `author.name` else "Người dùng"; `formatDateTime(createdAt)`; `updatedAt !== createdAt`; `stars` |
| Pinned card | hidden label and reason | `MyReview.status`, `MyReview.hiddenReason` |
| Write block | which state | `reviewRole(session)`, then `mine.review`, then `mine.canReview` |
| Guest row | return address | `usePathname()` and the current query through `useSearchParams()`, passed to `authHref` |
| Hint | the chat control | `toChatEntry(session, { landlord }, lookup)` with `lookup` from `byListingQuery(api, listing.id)`; `basePath` from `chatBasePath(accountType)`; the dialog gets `{ id, title }` and the landlord name from props |
| Page change | new address | `useSearchParams()` for the other parameters, `usePathname()`, `window.location.hash`; written with `history.replaceState` |
| Listing gone | the trigger | `ApiError.code === "LISTING_NOT_FOUND"` from the list, `mine`, summary or a write |
| 429 | wait | `ApiError.retryAfterSeconds`, else `blockSecondsFor` (AC-18) |
| Buttons | shown or hidden | `can(session, "review:create" \| "review:update" \| "review:delete")` |
| Edit | request body | the difference between the form values and `mine.review` |
| Wording | heading, guest row, hint, "already reviewed", "gone" | the room vocabulary and texts of `listing-reviews`, not the landlord ones |

**Code layout** (the move is milestone 1; names of moved files stay the same):
```
src/features/reviews/                       the shared core
  access.ts                                 reviewRole(session)
  types.ts                                  ReviewSubject (what a subject hands to the shared view and write block)
  review-list.ts                            REVIEWS_PAGE_SIZE, withoutMine, listView, pageCount
  text.ts                                   authorName, isEdited, hasComment, reviewCountText, ratingText
  review-errors.ts                          classifyReviewFailure(error, action, vocabulary), ReviewFailure (adds gone), ReloadPlan (profile is now summary), neutral messages
  schemas/                                  review-schema.ts, review-page.ts
  hooks/                                    use-review-form.ts (takes classify), use-announce.ts, use-focus-request.ts,
                                            use-last-total.ts, use-review-page.ts (navigate option)
  components/                               reviews-zone-frame.tsx (heading and summary props), reviews-zone-skeleton.tsx (heading and numbers props),
                                            reviews-zone-view.tsx (new: role, page, total, announcements, heading focus),
                                            write-block.tsx (props: actions, classify, guestLabel, hint), my-review-row.tsx,
                                            review-form.tsx, star-input.tsx, review-row.tsx, review-list.tsx,
                                            review-list-area.tsx, list-states.tsx, delete-review-dialog.tsx (takes classify),
                                            rating-line.tsx (moved from landlord-profile)
src/features/landlord-reviews/              what is landlord only
  api/ (review-api.ts, review-keys.ts, review-queries.ts)  hooks/ (use-review-actions.ts, use-review-list.ts, use-my-review.ts)
  review-errors.ts (vocabulary), components/reviews-zone.tsx (thin), landlord hint and guest label
src/features/listing-reviews/               new
  api/ (review-api.ts, review-keys.ts, review-queries.ts)
  hooks/ (use-review-actions.ts, use-review-list.ts, use-my-review.ts, use-listing-summary.ts)
  review-errors.ts (vocabulary), listing-reviews-texts, components/listing-reviews.tsx, listing-hint.tsx
src/features/chat/components/chat-entry-control.tsx   the control taken out of ChatEntrySlot
src/lib/is-uuid.ts                          isUuid (isLandlordId stays as a thin alias)
src/lib/api/rate-limits.ts                  three rules (AC-18)
src/lib/api/types.ts                        ListingDetail fields, OwnerListingDetail omit (AC-20)
src/features/listing-detail/components/listing-detail.tsx   mounts the block, aside row span
src/app/dev/ui/reviews.tsx, reviews-sample.ts   preview (AC-23)
```

**The adapter**: `src/features/reviews/types.ts` defines `ReviewSubject`, the parts a subject hands to the shared view and write block: `list` and `mine` (the TanStack query results), `actions` (the plain functions `create`, `update` and `remove` of its actions hook, each returning the promise of its call, plus the boolean `removing`), `classify` (its bound classifier), `heading`, `summary` (a node), `guestLabel`, `hint` (a node) and `onGone`. The subject zone calls `useReviewPage`, then its own list, `mine` and actions hooks, builds a `ReviewSubject` and draws `ReviewsZoneView`. The shared write block calls no data hook. `classifyReviewFailure` returns the shipped `ReviewFailure` shape (`message`, `reload` with `mine`, `lists` and `summary`, `alreadyDone`) plus `gone` (true when the error carries the subject gone code). Its vocabulary is five codes (`notEligible`, `alreadyExists`, `hidden`, `notFound`, `subjectGone`) and two subject messages ("already reviewed", "gone"). `PERMISSION_DENIED` and `CANNOT_REVIEW_SELF` are the same codes for both subjects, so they stay in the shared part with the neutral texts (hidden, edit not found, deleted before, no permission). Each subject's actions hook maps `reload.summary` to its own summary: the landlord profile query for #35, `listingReviewKeys.summary` for the room.

**Key invariants**:
- The form and the pinned card are never shown together.
- "Have I reviewed" comes only from `GET /review`, never from the absence of `isMine` in the list.
- The list drops `isMine === true` items and no count is adjusted for it.
- Only a `writer` calls `GET /review`. The list never runs while the session is `loading`.
- A PATCH body is never empty; an edit that changes nothing sends nothing.
- A room write never touches a landlord key, and a landlord write never touches a room key.
- The heading numbers are the summary numbers; the page count is the list `total`. They are two reads and can differ for a moment.
- Nothing in this block writes to storage, and no review text is in the server HTML.

**Security model**: the list is public and readable by a guest. `GET`, `POST`, `PATCH` and `DELETE` on `/review` act on the person in the token only and the listing is always the path id, so nobody can read or change someone else's review. The backend answers 403 to an admin on those four calls even with `review:*`, and landlords hold no `review:*` key, so both are readers. Author names are public with no opt out (contract). The summary read is a guest read and carries no token. No compliance scope beyond that.

**Configuration required**: none.

**Critical test scenarios** (each maps to an acceptance criterion; demo accounts and listings from the contract sample data):
- Happy path: Lan Anh (`lananh.nguyen@demo.example.com`) opens Phát's oldest listing ("Phòng trọ Quận 7 gần ĐH Tôn Đức Thắng, có máy lạnh"), which has no reviews. She sees "Chưa có đánh giá", the form, writes 4 stars and a comment, sees the pinned card at once and "4,0 (1 đánh giá)" when the summary returns, edits it, then deletes it and sees the form again. Verifies **AC-3**, **AC-4**, **AC-8**, **AC-10**, **AC-11**, **AC-12**, **AC-13**, **AC-19**.
- Not eligible: Lan Anh on another listing of Phát sees the hint and the message button, not the form (the chat about the oldest listing does not unlock it). Tuấn on a listing of Bảo sees the hint too. Verifies **AC-8**, **AC-9**.
- Hidden review: Quân on Khoa's 18m² room ("Phòng trọ 18m² mới xây, wifi tốc độ cao") sees the badge, the reason and only "Xóa". The public list shows 4 rows and the score "4,3 (4 đánh giá)" (the sixth row and the locked author never show). Verifies **AC-3**, **AC-6**, **AC-7**.
- Scores: Nhung's Pasteur studio shows "5,0 (1 đánh giá)", her airport room "(3 đánh giá)", a listing with no review "Chưa có đánh giá" with no stars. Verifies **AC-3**.
- Roles: a guest sees "Đăng nhập để đánh giá phòng", Khoa on his own listing and the admin see the list only and make no `/review` call. Verifies **AC-5**, **AC-8**.
- Listing gone: the page of `Phòng tầng 2 đã cho thuê, tạm ẩn tin` is the not found page with no block. With a tab open, the landlord hides a listing, then the renter acts: "Tin này không còn." and the page becomes not found after the refresh. Verifies **AC-16**.
- Paging: `/<code>?reviewPage=2` on a four review listing shows "Trang này không có đánh giá." with "Về trang đầu"; pressing it changes the address with no server request for the page (browser network panel) and keeps the other parameters and the hash. The address fix keeps `reviewPage`. Full paging only in the preview. Verifies **AC-14**, **AC-2**.
- Two tabs: a double submit gives one review and the other call lands on `LISTING_REVIEW_ALREADY_EXISTS`; delete in one tab then edit in the other shows the not found line. Verifies **AC-17**.
- Failed summary read: block `GET /listings/<code>` in the browser, write a review, and the score line keeps the old numbers while the pinned card and the list update. Verifies **AC-4**.
- Rate limit: the 21st write in an hour shows the countdown and keeps the draft. Verifies **AC-17**, **AC-18**.
- Safety: a comment with `<img onerror>` and several line breaks shows as plain text with the breaks kept. Verifies **AC-7**, **AC-21**.
- Landlord regression: on `/chu-tro/<id>` the reviews area writes, edits, deletes, pages and fails exactly as before the move. Verifies **AC-22**.
- A write changes shared demo data, so delete what you wrote.

## Build plan

Build approach: Tracer Bullet (the project default). Milestone 1 is not a user visible thread: it is a move with no change of behaviour, and it comes first because everything else stands on it. Milestone 2 is the thin real thread (a renter writes and sees it pinned and counted on the listing page); the later ones thicken it. Preconditions: features #34 (chat), #15 (landlord profile) and #35 (landlord reviews) are built. Read the Next.js guides in `node_modules/next/dist/docs/` for `useSearchParams`, `useRouter` (`refresh`) and the native History API part of linking and navigating before writing the hooks.

1. **M1, move the shared core with no change of behaviour.** Create `src/features/reviews/` and move the neutral files into it with `git mv` (the list in *Code layout*). Turn `classifyReviewError` into `classifyReviewFailure(error, action, vocabulary)` and rename `ReloadPlan.profile` to `summary`; give `useReviewForm` and `DeleteReviewDialog` a `classify` prop; give `ReviewsZoneFrame` a `heading` and a `summary` prop; give `WriteBlock` the props `actions`, `classify`, `guestLabel` and `hint`; add `ReviewsZoneView` and the `navigate` option of `useReviewPage` (default `router.replace`); move `RatingLine` and `ratingText` from `landlord-profile`; add `isUuid`. Rewrite the landlord zone as a thin subject, and fix the imports in `landlord-profile` and `/dev/ui`. Done when `npm run check` passes; the `/dev/ui` reviews preview looks the same, including its 25 reviews over three pages and the 429 countdown; and one live pass at `/chu-tro/<id>` as Lan Anh on Phát (write, edit, delete) behaves as before, plus one forced failure there (delete in one tab, then edit in the other, which shows the "Không tìm thấy đánh giá của bạn" line), satisfies **AC-22**.
2. **M2, the thin thread: a renter writes a room review and sees it pinned and counted.** Add the two `ListingDetail` fields and the `OwnerListingDetail` omit (AC-20), the three write rules (AC-18), the `listing-reviews` API, keys and queries (AC-6 for page 1, AC-19), the room vocabulary file and the announcement line (AC-17 and AC-21 in part), `useListingSummary` and the score line (AC-3, AC-4), the skeleton with the heading and numbers (AC-1), the block with its frame, the guest row, the page 1 list with rows, the write block with `mine` and the form that posts and shows the pinned card (AC-5, AC-7 visible card only, AC-8 states 1, 3 and 4 and the guest row, AC-10, AC-11), and mount it as the last card of `ListingDetail` with the aside classes (AC-1, AC-2), satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6** (page 1), **AC-7** (visible card), **AC-8** (states 1, 3, 4 and the guest row), **AC-10**, **AC-11**, **AC-18**, **AC-19**, **AC-20**.
3. **M3, edit, delete, the hidden card, the hint and a vanished listing.** The editor with the changed fields only, the delete dialog with the wait for `mine`, the hidden pinned card, focus moves and announcements; `ChatEntryControl` taken out of `ChatEntrySlot` and the hint with it; the `LISTING_NOT_FOUND` rule with `router.refresh()`. Done when the contact card still draws and works as before in every `ChatEntry` state, satisfies **AC-9**, **AC-12**, **AC-13**, **AC-16**, **AC-7** (hidden card), **AC-8** (states 2 and 5).
4. **M4, paging, odd pages, failures and the phone.** `reviewPage` through Zod with the `history.replaceState` mode, `ListPagination`, the empty, only mine and past the end pages, the read failures, every write failure with the room vocabulary, the 429 countdown, the privacy pass and the check at 390 px, satisfies **AC-6** (every page), **AC-14**, **AC-15**, **AC-17**, **AC-21**.
5. **M5, preview (skip it if time runs out).** The `/dev/ui` section on fake data for the room block, satisfies **AC-23**.

## Consequences

**Positive**:
- One write block, one list area and one error classifier for both kinds of review, so a bug fixed once is fixed for both, and #36 reuses the same types and parts.
- The listing page keeps its static shell, its single server read and the same HTML for everyone; the score is in the server HTML.
- A failed refresh of the numbers never takes the page down, because the page itself is not refreshed unless the listing is gone.
- No new library, table, environment variable or server code.

**Negative / tradeoffs**:
- The move touches shipped #35 code whose `/check verify` was skipped, so a regression is possible. Milestone 1 does the move alone and ends on a live pass of the landlord block.
- The heading numbers and the list total are two reads. After someone else writes they differ until the next read, and after a sign in or out on the same page the cache is emptied and the heading goes back to the numbers of the page load.
- Going back to the page with the browser back button can replay the page as it was (the Next.js router keeps the old server result), so the score line can be older than a review the person just wrote, next to a list that already holds it. A reload fixes it.
- The hint and the contact card read the same chat lookup, so a failed lookup degrades both places at once.
- Review text is not in the server HTML and there is no JSON-LD, so a search engine reads the score line as text only and shows no stars.
- Every write costs one more read of `GET /listings/<code>` for the summary, from the shared 300 reads a minute of that person's address.
- A page can hold fewer than 10 rows (it held the viewer's own review), and the pinned card repeats on every page.
- Paging cannot be tried on demo data: the most visible reviews on one listing is 4. Only the preview and the pure functions cover it.
- `useReviewPage` has two ways to write the address (`router.replace` and `history.replaceState`).
- The block is the last card, so on a phone the score is below the fold, and the page now has two message buttons (the contact card and the hint).
- If a listing comes back right after `router.refresh()` was called for it, the block stays blank until the page is reloaded.

**Neutral**:
- New folders `src/features/reviews/` and `src/features/listing-reviews/`, one shared chat control, and the `isUuid` helper.
- Spec 0013's code layout and the scope row of #35 name files that move.

## Follow-up

- [ ] After milestone 1, update the code layout of spec [0013](../0013-landlord-reviews/index.md) and the `code in` line of feature #35 in the scope (the files now live in `src/features/reviews/`). `/sync` flags this too.
- [ ] While building milestone 4, confirm in the running app (`next-dev-loop`) that `useSearchParams` follows `history.replaceState` and that a page change makes no request to the server route. If it does not, fall back to `router.replace` and note it here.
- [ ] While building milestone 2, check with `curl` that the server HTML holds the heading and the score line (from the block, or from its skeleton if it suspends).
- [ ] `/sync` adds `src/features/reviews/` and `src/features/listing-reviews/` to the context files.
- [ ] Not built, waiting for the backend (already in the scope Deferred list): stars on listing cards (the four card lists have no score fields), report a review, landlord replies, star distribution, filter or sort by stars, photos, helpful votes, text search.
- [ ] The moderation tab for room reviews (`/moderation/listing-reviews`) belongs to feature #36; it can reuse `StarRating`, the types and shapes like `AdminReview` once #36 is designed.
