# 0013 Rationale: landlord reviews

The reasoning behind [spec 0013](index.md). The build spec is `index.md`; a build does not need this file.

## Context

> ⚠️ Premise note: this feature sits on the landlord profile page of feature #15, and that page does not exist yet (no route, no spec, and `LandlordProfile` in `types.ts` still has seven fields). Building the reviews zone alone would mean guessing the page. The spec therefore states exactly what #15 must provide ("What #15 must provide" in `index.md`) and the build stops if it is missing. The scope already orders #15 before #35, so this is a dependency to respect, not a change of plan.

A rental marketplace shows a listing, but a renter also wants to know who the landlord is. The backend (contract 6.40) lets a renter rate a landlord from 1 to 5 stars with an optional comment, but only after the landlord has answered them in chat, so a rating is at least tied to a real contact. There is one review per renter and landlord, a public list, two numbers on the profile (`reviewCount`, `ratingAverage`) and an admin who can hide a review.

The contract is very specific about how the block must be built, and it warns of five traps: who may call which API (an admin holds every permission but gets 403), when to read the list (the session must finish restoring or `isMine` is `null` and a wrong cache entry stays), that the viewer's own review comes from two places, that two paginations on one page need two URL parameters, and that a hidden review exists only in `GET /review`. The scope row for #35 already fixed several choices, which this design kept: a browser only list, the pinned card, the separate `reviewPage` parameter, and no review of oneself in the list.

What remained open was where the form lives, whether review text should be in the server HTML, whether to emit structured data for search engines, the page size, and how paging should behave on a page that already has a long listings zone above it.

## Options considered

### Option 1: A client only zone, the viewer's review pinned and removed from the list, the form inside the zone (chosen)

The zone loads the public list in the browser after the session restores. The viewer's review comes from `GET /review` and is pinned at the top; the list drops it. The form is part of the zone and the pinned row turns into the form on edit.

**Pros**:
- One path for the viewer's review, so the hidden case and the "have I reviewed" question have a single answer.
- The same data for guest and signed in viewers, so no mismatch between what the server drew and what the browser shows.
- Short flows on a phone: no dialog layer, no focus trap, the draft stays in the page.

**Cons**:
- Review text is not in the server HTML.
- A page can show no row, and the pinned row repeats on every page.

### Option 2: Draw the first page on the server for guests, then replace it in the browser

The server reads page 1 as a guest so the text is in the HTML, and the browser swaps in its own read once the session is known.

**Pros**:
- Search engines and link previews can read the first reviews.

**Cons**:
- Two data paths for one list, with a visible swap and a possible flash.
- The API is `no-store` and depends on the viewer, so the server copy can disagree with the client copy.
- Much more work for a demo, and reviews are not what brings people from search.

### Option 3: One list with the viewer's row marked, no pinned card

The list keeps `isMine` rows in place and shows edit and delete on them.

**Pros**:
- One list, no filtering, no page with zero rows.

**Cons**:
- A hidden review is not in the list at all, so the author still needs a second path, and then there are two ways to show the same thing.
- The viewer's review could sit on page 3 of 3 where nobody finds it.

### Option 4: The write form in a dialog

A "Viết đánh giá" button opens a dialog, like the first message dialog in chat.

**Pros**:
- The zone stays short and the form has its own focus scope.

**Cons**:
- One more layer to build and test (return focus, a draft kept while it is closed).
- Editing a review would also need the dialog, so the review and its editor are in two places.

## Rationale

Option 1 is the contract's own recommended shape (trap number 3 of the five), and the scope row had already chosen its parts, so the main question was only what could be dropped. Option 2 buys search visibility for a list that is public but session dependent; the project is a demo with a deadline (scope header), and the score at the top of the profile comes from the profile read itself (feature #15), which is the part that matters for a shared link. Option 3 looks simpler but cannot show a hidden review, so it needs Option 1's path anyway. Option 4 adds a layer for a form of two fields, and the pinned row that turns into a form keeps the review and its editor in one place.

The price of Option 1 is the odd pages. The page count and the heading count include the viewer's own review (the contract says so, and recomputing them would be wrong), while the rows do not, so a page may hold nine rows or none. This is handled by one pure function, `listView`, with its own lines, instead of being hidden.

## Smaller decisions

Each was settled with the project owner or by the rules of the project. The runner up is named.

- **D1, no JSON-LD `aggregateRating`.** To my knowledge (check again, this area changes fast) the `aggregateRating` property is not defined for the type `Person`, and search engines do not use a rating for an organization that the same site collects about itself. A landlord is a person, so the gain is low and the markup would be easy to get wrong. Runner up: emit it as `Organization` markup when `reviewCount` is above 0, rejected because it states something untrue about who the landlord is.
- **D2, 10 rows per page.** Enough for a phone screen. The sample data has at most 8 visible reviews per landlord, so paging cannot be tried on real data (see Consequences); the `/dev/ui` preview covers it with 25 fake reviews. Runner up: 5 rows, which would show two pages for Khoa and Nhung on real data, rejected because it makes every reader press more on a phone.
- **D3, change page with `router.replace` and no scroll, then focus the zone heading.** The profile has the listings zone above, and a link that scrolls to the top would lose the reader. `replace` keeps the back button for leaving the profile instead of stepping through pages. Runner up: real links through `hrefFor`, rejected because Next scrolls to the top on each one.
- **D4, no value chosen at the start of the stars.** A default of 5 stars would push every review to the top mark by omission. The cost is one more tap. Runner up: a default of 5.
- **D5, an edit that changes nothing sends nothing.** The backend sets `updatedAt` even when the value is identical, and the interface shows "Đã chỉnh sửa" from `updatedAt`, so a no change save would add a false label. Runner up: always send, rejected for that reason.
- **D6, star colors use `text-primary` and `text-muted-foreground`.** Both are already checked against the card, so no color pair is added (the scope rule). Runner up: a warm amber token, rejected because the palette has only the pale `warning` background and a new foreground pair would have to be added and checked.
- **D7, the viewer's own review is read by a separate key without the viewer in it.** The whole cache is emptied when the session changes (spec 0002), so the key does not need it. The list keeps the viewer in its key because the scope row and the contract ask for it, and it costs nothing. Runner up: the viewer in both keys.

## Evidence: what the repository already has

- Types `ReviewStatus`, `PublicReview`, `MyReview`, `MyReviewState`, `AdminReview` and the nine error codes, copied by spec 0012 (AC-23). `formatRating` in `src/lib/format.ts`.
- Rate limit rules in `src/lib/api/rate-limits.ts` cover follow, favorite and chat, but not the three review writes (those would fall to a 60 second wait, the contract says one hour).
- `ListPagination` has a button mode (`onPageChange`) and a link mode (`hrefFor`); the link mode uses a plain `Link`, which scrolls to the top.
- `useFormFailure`, `applyFieldErrors`, `useCountdown`, `formatWait`, `RateLimitNotice`, `ErrorState`, `EmptyState` and the `RadioGroup`, `AlertDialog`, `Textarea`, `Badge` components already exist.
- `check-contrast.mjs` already lists `primary` and `muted-foreground` on `card` and on `accent`.
- No route `/chu-tro/[id]`, no `landlord-profile` feature and no `StarRating` component yet.
