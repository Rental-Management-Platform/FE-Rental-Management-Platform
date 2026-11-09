# src/features/reviews

The shared core of the two reviews areas: a landlord's reviews on the public profile (feature #35, [spec 0013](../../../docs/specs/0013-landlord-reviews/index.md)) and a room's reviews on the listing page (feature #37, [spec 0014](../../../docs/specs/0014-listing-reviews/index.md)). This folder holds what is the same for both. Each subject keeps a thin adapter of its own: `src/features/landlord-reviews/` and `src/features/listing-reviews/`. Contract with the backend: [api-for-frontend.md](../../../api-for-frontend.md) (6.40 for landlords, 6.41 for rooms).

## Where things live

- `access.ts`: `reviewRole(session)` gives `loading`, `guest`, `writer` or `reader`. Only a `writer` (a signed in `tenant` with `review:read`) calls a `GET .../review`. A landlord and an admin are readers.
- `types.ts`: `ReviewSubject`, everything an adapter hands to the shared view (the `list` and `mine` query results, `actions`, `classify`, `heading`, `summary`, `guestLabel`, `hint`, `onGone`), and `ReviewActions`.
- `review-errors.ts`: `classifyReviewFailure(error, action, vocabulary)`, pure. It says what each failed write means, what to read again (`ReloadPlan`: `mine`, `lists`, `summary`), and whether the subject is gone. A subject passes a `ReviewVocabulary` (the five codes that differ and two sentences that name the subject). The adapters bind it as `classifyLandlordReview` and `classifyListingReview`.
- `review-list.ts`: `REVIEWS_PAGE_SIZE` (10), `withoutMine`, `pageCount` and `listView` (`empty`, `rows`, `only-mine`, `past-end`).
- `text.ts`: the shared words and small rules (`authorName`, `isEdited`, `ratingText`, `reviewCountText`).
- `schemas/`: `review-schema.ts` (the form) and `review-page.ts` (`parseReviewPage`).
- `hooks/`: `use-review-page.ts` (`useReviewPage`, `REVIEW_PAGE_PARAM`) and small helpers (`use-review-form.ts`, `use-announce.ts`, `use-focus-request.ts`, `use-last-total.ts`).
- `components/`: `ReviewsZoneView` (the one view: frame, write block and list area), `ReviewsZoneFrame`, `ReviewListArea`, `WriteBlock`, `ReviewForm`, `StarInput`, the row and pinned card, the delete dialog, `RatingLine`, `CountLine`, and the skeletons (`ReviewsZoneSkeleton`, `WriteBlockSkeleton`).

## Rules

- This folder calls no data hook. A subject reads its own list, `mine`, writes and numbers, builds a `ReviewSubject` and hands it to `ReviewsZoneView`. A new subject is a new adapter folder, never a branch in here.
- Two subjects never share a query key. Keys start with `landlord-reviews` or `listing-reviews` and the subject id. A list key carries the viewer (`user.id` or `"guest"`) because `isMine` depends on the token. `mine` does not, since the whole cache is emptied when the session ends (spec 0002).
- The viewer's own visible review comes from `GET .../review`, is pinned at the top and is dropped from every page of the list (`withoutMine`). `total`, the page count and the count in the heading are never reduced for it.
- The count and the average always come from the subject's own numbers (`reviewCount`, `ratingAverage`), never from the list. With no review the line says "Chưa có đánh giá", never 0 stars.
- The page of reviews lives in the address as `reviewPage`, its own parameter (listings use `page`). `useReviewPage("router")` is the default and asks the server to render again (the landlord profile). `useReviewPage("history")` uses `window.history.replaceState` and asks the server for nothing (the listing page). Both keep the other parameters and do not scroll.
- A comment is plain text with its line breaks, never HTML. A failed write keeps the draft, nothing is sent again by itself, and `classifyReviewFailure` decides what to read again. A new backend error code must first be added to `ERROR_CODES` in `src/lib/api/types.ts`, or the client turns it into `HTTP_ERROR` and the classifier never sees it.
- Hiding a control is a convenience, and the backend decides.
- `/dev/ui` shows this folder on fake data: `src/app/dev/ui/reviews.tsx` (landlord) and `listing-reviews.tsx` (room) share `reviews-sample.ts`.

_Drafted by /sync from the introducing change, worth a quick human pass._
