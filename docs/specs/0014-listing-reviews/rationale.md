# 0014 Rationale: listing reviews

## Context

The listing page (spec 0010) is built on the server on every visit, as a guest, with no cache and no token, so everyone gets the same HTML. The contract now gives that page a room score: two new fields on the public detail (`reviewCount`, `ratingAverage`) and five APIs under `/listings/:id` that mirror the landlord review APIs (6.40) one for one, with their own table, their own five error codes and their own writing rule (the landlord must have answered about this exact listing, not about any listing of theirs).

Feature #35 already built the landlord version of this area and it is the pattern the owner wants followed. Of its 29 files, only the API calls, keys, queries, actions, error classifier, zone and write block know they are about a landlord, and the rest draw rows, forms, a pinned card, a delete dialog and a paged list that say nothing about who is reviewed. The write block alone is about 340 lines of focus, notice and delete logic that took a full milestone of fixes to get right. Building the room version means deciding whether that logic exists once or twice.

Three things about the host page matter. The two new numbers are read by the server and go stale as soon as a renter writes, while the page has no cache to invalidate. If the server read fails during a refresh, `ListingDetail` replaces the whole page with its failure view. And the demo data has at most 4 visible reviews on any listing, so paging cannot be tried live.

Search markup is a separate question: the contract suggests an `aggregateRating`, but the review text is only built in the browser, and a room for rent has no rich result type of its own.

## Options considered

### Option 1: A shared review core with a subject adapter (chosen)

Move the neutral parts into `src/features/reviews/`. Each subject (landlord, room) passes its list, `mine`, actions, classifier, wording and hint into one shared view and one shared write block. The landlord zone is rewritten as a thin subject in the same change, so there is no second copy.

**Pros**:
- The delicate write logic exists once. A fix lands for both.
- #36 (review moderation) and any later reviewed thing reuse the same core.
- The room block is small: API, keys, queries, vocabulary, wording, hint, summary read.

**Cons**:
- It edits shipped #35 code whose verify was skipped. A move can break it quietly.
- Props make the shared parts a little more abstract than the original.

### Option 2: A separate room zone that imports the small parts and has its own write block

Leave `landlord-reviews` where it is. The room zone imports rows, form, star input and pure helpers from it and writes a second `WriteBlock` and a second actions hook with room wording.

**Pros**:
- #35 stays untouched, so no regression risk there.
- Less to do before the first visible result.

**Cons**:
- About 340 lines of focus and notice logic exist twice, and so does the error switch.
- The room feature imports from a folder named for landlords, and #36 would too.

### Option 3: A full copy under `listing-reviews`

Copy the whole folder and rename.

**Pros**:
- No coupling at all, and the quickest start.

**Cons**:
- Every fix, now and later, is made twice, and the two copies drift.

## Rationale

Option 1 pays its cost once and gets the benefit for every later change. The force that decides it is the write block: it is the one piece with real logic and real history of bugs, it is neutral except for three things (which API, which codes, which words), and copying it is the failure this project cannot afford with a deadline and light verification. The risk of touching #35 is real, so the plan puts the move alone in milestone 1, with no new behaviour mixed in, and ends it on a live pass of the landlord block and the unchanged `/dev/ui` preview. Option 2 is the choice if that risk cannot be accepted, and it is cheaper to start, but the doubled write block would cost more than the move within one more feature.

The rest follows from the host page. A browser summary read for the numbers keeps the page itself alive, which a `router.refresh()` does not (see below). The block goes last so a long list does not push the property info down. No JSON-LD, because the only types Google shows stars for are not a room for rent, and the review text is not in the server HTML.

## Smaller decisions

- **How the page gets the new numbers after a write**: a small browser summary read (chosen), starting from the server numbers. The runner up was `router.refresh()` after every write: one source and less code, but when the server read fails (a 429 on the shared reads, a 5xx) `ListingDetail` swaps the whole page for its failure view right after a write that worked. A third option, reusing `listingDetailQuery`, was dropped: it only runs for signed in non landlords, keeps data 5 minutes and carries phone data. `router.refresh()` is still used, once, when a review API says the listing is gone, because then the server answering 404 is exactly what is wanted.
- **The summary query settings**: `auth: "none"` because the numbers are the same for everyone and a guest read has no side effect and needs no token refresh; `initialData` from the server numbers; `staleTime: Infinity` so nothing reads it by itself; `gcTime: 0` so a revisit cannot show an older cached entry in place of the fresh server numbers (`initialData` is ignored when the cache already has data). The landlord profile uses `initialDataUpdatedAt: 0`, which costs an extra read on every signed in visit; the room does not need the token.
- **Position**: last, after "Nhà trọ" (chosen). The runner up was right after the description, which is what the scope and contract say literally, but it moves the property card below up to ten reviews. On `lg` the aside's row span grows by one so the contact card stays sticky.
- **JSON-LD**: none (chosen), as in #35. As far as I know, Google shows review stars only for supported types such as Product and LocalBusiness and has no type for a room for rent. A `Product` with `aggregateRating` could be judged as not matching the page, and `Apartment` or `Accommodation` is valid schema.org but I do not expect stars from it. This was not verified on the web; it is worth a check if search stars ever matter. The score is still text in the server HTML.
- **Fold on a phone**: always open (chosen). A fold needs its own focus and announcement rules and hides the write form. The runner up, a fold with only the score line, would shorten the page.
- **A score near the title**: only in the block (chosen), as the scope reads. The runner up, one line under the title that links down, helps discovery on a phone but adds a second place to update after a write.
- **Where the shared parts live**: a new `src/features/reviews/` (chosen). Keeping them inside `landlord-reviews` would make the room feature import from a folder named for landlords. `src/components/reviews/` would leave the hooks and pure helpers without a home.
- **How the page changes address**: the room block uses `window.history.replaceState` (the Next.js docs say it stays in sync with `useSearchParams`). A `router.replace` on this dynamic page is expected to ask the server for the page segment again, which runs the detail read again from the shared 300 reads a minute and renders the whole detail again. The landlord zone keeps `router.replace` so #35 does not change. This is expected, not measured, so it is a Follow-up check; the fallback is `router.replace` for both.
- **The hint's control**: reuse the chat control of spec 0012 rather than a link to the contact card. The renter who is not eligible is either someone with no conversation about this listing (the first message button) or someone waiting for an answer (the link to the conversation), and the control already knows which. If the viewer cannot chat at all, no hint is drawn, the same rule 0013 uses for a renter who lacks `review:create`.
- **One classifier with a vocabulary**: `classifyReviewFailure(error, action, vocabulary)`. Two copies of the switch would repeat the 0013 rules for `ALREADY_EXISTS`, `HIDDEN`, `NOT_FOUND` and `PERMISSION_DENIED`. The reload plan field `profile` is renamed `summary` because it now means "the numbers at the top" for either subject.
- **`RatingLine` and `ratingText` move to the shared core**: the room block needs the same line as the landlord header, and it should not import from `landlord-profile`.
- **A preview in `/dev/ui`**: included as the last, skippable milestone. It is the only way to see paging, the odd pages, the hidden card with more than one state and the 429 countdown, and it shows that the shared core still draws the landlord block.
- **`isUuid`**: `isLandlordId` lives in `landlord-profile` and says landlord. The shared core and the room block need the same check, so it goes to `src/lib` and `isLandlordId` stays as an alias.

## Evidence: what the repository already has

- `landlord-reviews` has 29 files. Neutral (no landlord word in the code): `access.ts` apart from comments, `review-list.ts`, `text.ts`, the two schemas, `use-announce.ts`, `use-focus-request.ts`, `use-last-total.ts`, `use-review-page.ts`, `star-input.tsx`, `review-row.tsx`, `review-list.tsx`, `list-states.tsx` (one comment), `my-review-row.tsx`, `review-form.tsx`, `reviews-zone-skeleton.tsx`, `reviews-zone-frame.tsx` (the heading "Đánh giá" is fixed), `review-list-area.tsx`. Landlord bound: `review-api.ts`, `review-keys.ts`, `review-queries.ts`, `use-review-actions.ts` (also invalidates `landlordKeys.profile`), `use-review-list.ts`, `use-my-review.ts`, `review-errors.ts` (the codes and the messages), `reviews-zone.tsx`, `write-block.tsx` (calls those and holds the landlord hint and guest row), `use-review-form.ts` and `delete-review-dialog.tsx` (call the classifier).
- `src/lib/api/rate-limits.ts` already has the landlord review rules and matches whole path segments, so `/listings/:id/review` does not collide with `GET /listings/:slugCode`.
- `ListingContact` already runs `listingDetailQuery` for a signed in person who is not the landlord, and `byListingQuery(api, id)` for the chat entry. The hint reuses the second one.
- `ListingAddressFix` writes the corrected address with `history.replaceState` and keeps the query string and the hash.
- The landlord profile already shows the pattern of server data as `initialData` for a browser query (`useLandlordProfile(id, initial)`).
- Contract facts used: `:id` is the UUID of the detail (the slug or code is 400 `INVALID_ID`); the five review APIs are 404 `LISTING_NOT_FOUND` for any listing that is not public, including the writer's own delete; `total` equals `reviewCount`; the four card lists and `GET /me/listings/:id` have no score fields.
- Demo data: the 18m² room of Khoa has 6 rows but `reviewCount` 4 and `ratingAverage` 4,3 (5, 4, 4, 4 is 4,25, rounded half up; one row hidden by an admin, one by a locked author); Nhung's Pasteur studio has exactly 1; Phát's oldest listing is where Lan Anh and Việt can write; the most visible reviews on one listing is 4.
- Next.js docs (`node_modules/next/dist/docs/01-app/`): `router.refresh()` requests the route again and merges the payload without losing client state; the native History API `pushState` and `replaceState` integrate with `usePathname` and `useSearchParams`.
