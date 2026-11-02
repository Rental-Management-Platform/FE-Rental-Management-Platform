# 0009. Rationale: find listings

The decision record for [index.md](index.md). The build does not read this file.

## Context

Scope item #8 is the first public page and, because the contract has no home page, the front door of the site. A guest should land on a list of rentals, type a keyword, and page through the results. The backend is done: `GET /listings` is public, searches title, property name, address and ward without caring about accents, and paginates. Spec 0001 already fixed the big rendering rules, so what is left for #8 is the page itself and the shared pieces it is the first to need.

Forces that shaped the design:
- The public pages need SEO (scope header). The contract (section 4.1) says the server should render the guest version in full and a browser layer should add what depends on the viewer. For a list, the only viewer part is the heart (`isFavorite`), which belongs to #14.
- Listings must vanish at once when hidden, locked or over quota (spec 0001, demo steps 8 and 9, and the contract's "ngay, không có độ trễ"). That rules out caching the list.
- Every server render reaches the API from one IP, and `GET /listings` allows 300 a minute per IP. Each visit costs one call, so the page should add no extra calls (no prefetch of data, no double reads).
- The site runs with Cache Components and partial prefetching. A link prefetches only the static shell, so page links cost no API call. `searchParams` must be read inside a `<Suspense>` boundary to keep that shell. On a change of `searchParams` alone, a boundary that has already shown content does not show its fallback again, so a loading skeleton needs a boundary whose key changes.
- The API rejects a `page` outside 1 to 1,000,000 and any unknown parameter with a 400, so the address cannot be forwarded as it is. Bots and old links will bring odd addresses.
- `src/lib/api/server.ts` was promised by spec 0001 and does not exist. #8 is the first feature that needs it, and #9 will copy its pattern.
- Photos are served from the API and can answer 404 when a listing was just hidden. The contract and the scope say to hide the photo box then, not to report an error. #9 and #10 need the same behaviour.
- The sample listings screen and its card already exist in `/dev/ui`, built to the design system, with a project rule that a feature lifts that markup instead of redrawing it.
- Alpha workflow and a demo deadline: the extra care goes into things a visitor and a crawler see, not into infrastructure.

If nothing is decided, #8 invents its own server read, its own address rules and its own photo handling, and #9, #13, #14 and #15 each repeat them differently.

## Options considered

### Option 1: A guest read on the server with the whole search in the address (chosen)

The page is a server component. It reads `GET /listings` as a guest, uncached, behind `<Suspense>`. `q` and `page` are the only state, live in the address, and are cleaned by one pure parser. The search is a `next/form` GET form. The card, the photo box and the server reader are shared pieces.

**Pros**:
- Real HTML for search engines, a shareable address, and it works with JavaScript off.
- Fresh on every visit, so a hidden listing disappears at once.
- One call per visit, no browser calls, no token handling on this page.
- The parser and the address builder are pure, so #13 extends them in one place.

**Cons**:
- Every visit and search hits the shared 300 a minute limit.
- A keyed boundary and a client wrapper are needed to get the skeleton on every change.
- A signed in person sees the guest list until #14 adds the overlay.

### Option 2: A client side list with TanStack Query, like the sample screen

The page is a client component. State lives in the address or in React state, and `useQuery` calls the API from the browser, with the token when there is one.

**Pros**:
- One fetch path for guests and signed in people, so `isFavorite` arrives in the same call.
- A natural place for "keep the old results while the new ones load".

**Cons**:
- Search engines get an empty shell, which breaks the scope's SEO requirement for public pages.
- A guest has to restore a session check first, and the first paint is a skeleton for everyone.
- It contradicts spec 0001's two data paths, where public reads run on the server.

### Option 3: A cached server read

The same as option 1, with `use cache` and a short `cacheLife` on `getListings`.

**Pros**:
- Spends far less of the shared 300 a minute limit.
- Faster repeat visits.

**Cons**:
- A hidden or locked listing stays visible until the cache expires, which the contract and demo steps 8 and 9 say must not happen.
- Needs a tag and a way to clear it, and the clearing is not wired to anything (a landlord hides a listing in the browser, not through a server action).
- Optimising a limit nobody has hit yet (spec 0001: "if it bites, add a short `use cache`").

### Option 4: Live search as you type

Option 1 with a debounced `router.replace` on every pause in typing, instead of a submit.

**Pros**:
- Feels quick on a good connection.
- No submit button.

**Cons**:
- Every pause is a server render and an API call, which spends the shared limit faster than any other design here.
- Noisy for screen readers and phone keyboards, and it needs a client controlled field plus a debounce.
- Gives up the no JavaScript path. The engineer chose submit.

## Rationale

Option 1 is the only one that meets all of the forces at once. The scope asks for SEO, which rules out option 2. The contract and spec 0001 ask for a listing to vanish at once, which rules out option 3 for now, and the limit it would protect has not been hit. The demo shares one server IP, which makes option 4 the costly one. Option 1 is also the least code, because it is a server component, a pure parser and a plain GET form.

The two small client pieces (the keyed boundary and the search box that reads the address) are the price of two behaviours that matter on a phone: a skeleton on every new search or page, and a field that follows the back button. Both are thin, and neither holds data.

Putting the card and the photo box in `src/components` instead of the feature folder follows the scope itself: #15 says its list "uses exactly the card of the search page", and #9 and #14 need the photo box and the card. The folder `listing-search` is used for the public feature because `listing` already means the landlord's posting feature.

The engineer chose the submit search (over live search), 12 cards a page (over the API default of 20), a card without a link until #9 (over a link that opens the not found page), the sample card as it is (over a lean one), tolerate odd addresses quietly (over a redirect or a 404), index the plain list pages only, no JSON-LD on the list page, robots in #8 and the sitemap in #9, build to `design.md` and the sample screen, the sample block order, and no References section.

## Calls settled while writing the spec

These were left to the author. Each is a pick, a reason and the runner up.

- **Skeleton on every change**: a client `ResultsBoundary` that keys an inner `<Suspense>` on the cleaned address state. Reason: the page cannot await `searchParams` to make a key without losing the static shell, and `useSearchParams` gives the key without that cost. Runner up: keep the old results and dim them with `aria-busy`, kept as the named fallback if the check in `next dev` shows React holds the old results.
- **Page size 12**: from the engineer. The constant lives in the feature, so #13 does not change it.
- **Server read limit of 10 seconds**: the page streams, so a visitor should see an error block rather than wait the 20 seconds of the browser client. Runner up: the same 20 seconds as the browser client.
- **`getListings(q, page)` takes two primitives and is wrapped in `cache()`**: spec 0001 says every server read is wrapped, and `cache()` compares arguments by identity, so an object argument would never hit. Today there is one caller, so the wrap costs one line and prepares #9.
- **Failure props are plain fields**: the server hands `status`, `code`, `message`, `requestId`, `retryAfterSeconds` and `retryAfterExact` to a client component, which rebuilds an `ApiError`. Reason: spec 0001 asks for props, and the shared `RateLimitNotice` and `useCountdown` take an error object. Runner up: pass the error object itself, which React may not serialise the same way in production.
- **"Thử lại" runs `router.refresh()`** in a transition. Runner up: a link to the same address, which does not clear a failed render.
- **Page links keep the default prefetch**: with partial prefetching a link fetches only the app shell, so it costs no API call.
- **First photo eager**: `loading="eager"` with `fetchPriority="high"` on the first card only. The Next docs for this version deprecate `priority` and say to prefer these over `preload`. Runner up: all photos lazy, which delays the largest paint on a phone.
- **Empty `alt` on the cover**: the title beside it already names the listing and the API has no photo description. Runner up: the title as the alt text, which a screen reader would read twice.
- **`q` is a string and an empty string means no keyword**: simpler for a form than `null`. The "API fields keep the backend's null" rule is about API answers, not the address.
- **A bad `page` becomes 1**, including above 1,000,000, so a bot's `?page=99999999` never costs a 400. A valid page past the last one shows a message, because the API answers it with no rows and no error.
- **Titles**: "Tìm phòng trọ", with ", trang N" after page 1, and `Kết quả cho “q”` for a keyword. No city in the copy, because the contract does not say the site covers one city. No Open Graph image, because the share cards belong to #9.
- **`robots.txt`**: besides the private areas, `/*?q=` and `/*&q=` are blocked so crawlers do not spend the shared limit on keyword addresses. The `noindex` tag on those pages stays as a second layer for a link that arrives from outside. The sitemap line comes with #9.
- **JSON-LD**: none on the list page. To my knowledge search engines give rich results only for some types, and a list of rentals does not get one. The real structured data (price, address) belongs on the detail page. This space moves, so check before relying on it.
- **The sample screen is left alone**: `/dev/ui/screens/listings` keeps its own card and its ward, price and sort controls for #13. Reason: the project rule says nothing outside `/dev` imports from there, and the reverse is optional.
