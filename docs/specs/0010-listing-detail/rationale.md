# 0010. Rationale: listing detail

The decision record for [index.md](index.md). The build does not read this file.

## Context

Scope item #9 is the second half of the core loop: a guest finds a listing (#8, done) and opens it. The backend is done. `GET /listings/:slugCode` is public, takes only the 8 character code from the address, returns the right `slug` so the page can fix the address bar, and returns the landlord's phone number only when the request carries a valid token. A guest, a wrong token and an expired token all get `phone: null` with a 200, never a 401.

Forces that shaped the design:
- The page needs SEO and share cards (scope header). The contract (section 4.1) and spec 0001 say the server renders the guest version in full and the browser adds what depends on the viewer. The phone is the one viewer part of this page, and it must not reach the HTML, a cache or a search result.
- Listings must vanish at once when hidden, locked or over quota (spec 0001, demo steps 8 and 9). That rules out caching the read.
- Every server render reaches the API from one IP, and `GET /listings/:slugCode` allows 300 a minute per IP. The backend counts a view once per viewer per listing per 30 minutes, by account or by IP. So the server's own read counts as one viewer, and a guest's real visit is missed unless the browser reads once more (spec 0001 decided this).
- The access token lives only in memory, and the session layer already renews it 30 seconds early for optional reads. That removes the contract's silent "phone is null because the token expired" trap without any new code in this feature.
- The root `[slugCode]` segment catches every unknown top level path, so a bot probe would reach the API unless the code is checked locally first (spec 0001, junk paths).
- The site streams its pages under Cache Components. A page that streams answers 200 even when it ends in `notFound()`, and Next then adds a `noindex` tag. Only a read before any `<Suspense>` boundary could give a real 404, at the price of the static shell.
- Photos come from the API in any shape, and can answer 404 when a listing was just hidden. The contract and the scope say to hide the photo, not to report an error. The list page already decided this (spec 0009), with a 16:9 crop.
- Spec 0009 left this feature a to do list (the card link, the sitemap, the share cards, a gallery) and a Deferred line (a default share image). The sample screen `/dev/ui/screens/listing-detail` already draws the page for a guest and a signed in viewer.
- Alpha workflow and a demo deadline: care goes into what a visitor and a crawler see, not into infrastructure.

If nothing is decided, each of the sitemap, the slug fix, the gallery and the phone layer gets invented during the build, and #11, #14 and #15 add to a shape nobody agreed on.

## Options considered

### Option 1: The guest page on the server, the phone and the view count added by the browser (chosen)

The server reads `GET /listings/<code>` as a guest, uncached, inside `<Suspense>`, and renders all the content, the metadata, the JSON-LD and the sitemap entry. A small client layer reads the session: for a signed in person it repeats the same read with the token and fills in the phone, for a guest it sends one read to get the view counted, and a third piece corrects the address bar.

**Pros**:
- Real HTML for search engines and share crawlers, and no phone number anywhere in it.
- Follows the contract and spec 0001, and reuses the session, the client, the server reader and the failure notice that already exist.
- A hidden listing disappears at once from the page and the sitemap.
- The query key is ready for #14 to add `isFavorite` with no second read.

**Cons**:
- Two reads per visit for everyone: one on the shared server IP, one in the browser.
- The phone appears a moment after load, and not at all without JavaScript.
- A gone listing answers 200 with `noindex` instead of a 404.

### Option 2: A client side page with TanStack Query, like the sample screen

The route is a thin shell, and the browser reads the listing (with the token when there is one), so the phone and the content come in one read.

**Pros**:
- One read per visit, and the phone arrives with the content.
- Simplest to reason about: no overlay merge.

**Cons**:
- Search engines and share crawlers see an empty shell. This breaks the scope's SEO and share card requirement.
- Nothing works with JavaScript off, and the first paint waits for the API.

### Option 3: Read first, stream later (a real 404)

The page reads the listing before any `<Suspense>` boundary, so `notFound()` gives a real 404 status, and the rest of the page is the same as Option 1.

**Pros**:
- Search engines get a true 404 for a gone listing and a true 429 or 500 for a failure.
- The head is complete in the first chunk for every crawler, so Zalo and Telegram need no special list.

**Cons**:
- The page is blank until the API answers, on every visit and on every client navigation. The static shell can no longer be prepared in advance, which hurts a phone on a slow network.
- It departs from the rule every other public page follows (specs 0001 and 0009).

## Decision calls made while writing (the RECOMMEND items)

| Question | Pick | Why | Runner up |
|---|---|---|---|
| What the server sends the API | the 8 character code only | the contract allows it, a typed slug never reaches the API, and `cache()` shares one request between metadata and page | the full `slug-code` (works, but two addresses make two requests) |
| How the address is checked | a pure `parseListingPath` in `src/lib`, with a 200 character cap | the same regex spec 0001 named, testable on its own, and reused by the card link, the sitemap and later pages | inline regex in the page |
| How the gallery tracks the active slide | scroll position (an observer or the scroll event) | the swipe is native CSS scroll snap, so the position is the truth and no script owns it | a state index that drives a transform (needs a script for the swipe) |
| What a failed photo does | leave the slides and the strip, update the counter | a broken slot in a strip is worse than a shorter strip, and it matches the list rule | keep the slot with the placeholder |
| Alt text of a gallery photo | "title, ảnh n trên N" | the gallery is the main content here, not decoration like the card photo | empty alt as on the card |
| Which query options for the phone read | `staleTime` 5 minutes, no refetch on focus | a signed in person has 60 reads a minute, and the number rarely changes | default options (a refetch on every tab focus) |
| What counts as a failed phone read | a 200 with `phone: null` for a signed in person | the token may have been refused, so a button that says "sign in" would be a lie | treat it as a guest |
| How the share image is made | the optimizer path at 1200 wide, quality 75 | a 5 MiB original is too heavy for a chat preview, and both values are in Next's defaults | the original address from the API |
| The `og:type` | `website` | `article` needs a published time and there is no rental type | `article` |
| Title and description | the listing title, and a 160 character line with price, area and address first | the facts a searcher scans are in the first words, and the description starts later | the first 160 characters of the description |
| The ward crumb | left out until #13 | it has no address to link to, and the JSON-LD breadcrumb cannot hold a crumb with no address | keep it as plain text as in the sample |
| The read failure block | reuse `ListingsFailure` in place | the same retry and countdown rules, and no refactor of spec 0009 code | lift it to `src/components` now |
| The skeleton | its own `ListingDetailSkeleton` | `LoadingState` has no detail variant, and the boxes must match the page to avoid jumping | a new `LoadingState` variant |
| Sitemap freshness | not cached (`await connection()` first), at most 20 reads of 50 | a hidden listing leaves it at once, and the cap keeps the file under the URL limit and the walk under the shared 300 a minute | cache one hour |
| A landlord opens their own listing | a plain line "Đây là tin của bạn.", no phone read | a call button to their own number is odd, and the backend does not count the owner's view anyway | show the number as for anyone else (added by the cross check, the engineer accepted it) |
| JSON-LD | breadcrumb only | the one type that gives a visible result feature, and it matches the page | add `RealEstateListing` |

## Rationale

Option 1 is the only one that meets all three of: real HTML for crawlers, a phone number that never touches the HTML or a cache, and a listing that disappears the moment it is hidden. Option 2 fails the SEO requirement outright. Option 3 buys a true status code, but spec 0001 already accepted the streamed 200 with `noindex` for every public page, and a blank page on every visit costs a phone user more than a search engine loses. The contract (section 4.1) describes exactly the two layers of Option 1.

The engineer chose to build from the existing design and sample screen, a big photo with a thumbnail strip, a quiet address fix, a breadcrumb only JSON-LD, a cover photo share card, a fresh sitemap, fees and amenities left to #11, and a gone page that answers 200. Each of those is also the lower cost, lower risk choice, so there was no conflict between the engineer's picks and the recommendation. The one place this spec departs from spec 0009's to do list is the gallery: `ListingPhoto` crops to 16:9 with an empty alt, and the engineer chose an uncropped 4:3 photo, so a second small component is cheaper than bending the first.

The cost of Option 1 is two reads per visit on a limit shared by every server render. At demo size that is fine, and spec 0001 already names the way out (a short `use cache`). The cost of the streamed 200 is small because Next adds `noindex` by itself and the sitemap is fresh.
