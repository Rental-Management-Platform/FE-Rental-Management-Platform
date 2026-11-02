# 0009. Find listings: the public list page with keyword search

**Date**: 2026-11-03
**Status**: Proposed

## Summary

This feature turns the front door of the site (`/`) into a public list of rental listings. A guest types a street, a ward or a keyword, sees cards with a cover photo, price, area and address, and moves between pages. The search and the page number live in the address, so a result can be bookmarked or shared. The server builds the page as a guest (no login, no token), so search engines read real HTML. It also creates three pieces that later features reuse: the server reader, the listing card and the listing photo box. A card does not open anything yet, because the detail page is #9. It adds no package, table, endpoint or environment variable.

## Requirements

Seeded from scope item #8 and refined with the engineer. Contract with the backend: `api-for-frontend.md` sections 2 (pagination), 4.1 (Next.js with the token in memory), 6.19 (`GET /listings`) and 7 ("Tìm trọ"). Patterns to follow: spec 0001 (two data paths, rendering and freshness, junk paths), specs 0003 and 0004 (components, zones, canvas, type), spec 0007 (`mediaUrl`, AC-12), spec 0008 (feature folder layout, a `/dev/ui` section per feature).

**User stories**:
- As a guest on a phone, I want to type a street, a ward or a word and see the rooms that match, so that I find a place without signing in.
- As a guest, I want to move between pages and to keep or share the address of a result.
- As a guest on a slow phone, I want a loading skeleton and no broken photo icons.
- As the site owner, I want the plain list pages to be real HTML with a title and description, so that search engines can index them.
- As someone using a screen reader or a keyboard, I want the result count announced, a clear heading order and working page links.

**Acceptance criteria** (the contract; each is checkable on its own):
- **AC-1**: The page. `src/app/(public)/page.tsx` serves `/` and replaces the placeholder. It has a `PageHeader` whose `h1` is "Tìm phòng trọ" with the one line description of AC-12 for a plain list page, then the search card, then the results. The header and the shape of the search card are in the static shell. `searchParams` is read only inside `<Suspense>` boundaries (spec 0001). The page does not export `instant = false`, and it reads no cookie, header or token. Everyone, signed in or not, sees the same list.
- **AC-2**: The address is the search state. The address carries `q` (the keyword) and `page` only. Two pure functions own it: `parseListingSearch` (raw values to `{ q, page }`) and `listingsHref` (`{ q, page }` to an address). `listingsHref` leaves out an empty `q` and a `page` of 1, and writes `q` before `page`, so the plain list is `/`. Parsing then building gives the same address back for any clean state. The same two functions feed the page links, the form, the canonical address and the boundary key.
- **AC-3**: Odd addresses are tolerated quietly. `q`: the first value when it repeats, trimmed, cut at 500 characters (the API limit), an empty result means no keyword. `page`: a whole number from 1 to 1,000,000 (the API range), anything else counts as 1. Other parameters are ignored and never sent on. There is no redirect and no error, so the API never answers 400 to a query this page sent.
- **AC-4**: The search box. A `next/form` form with `action="/"` and a `q` field: `type="search"`, `size="lg"`, `maxLength` 500, `enterKeyHint="search"`, an accessible name "Từ khóa: tên đường, phường hoặc tiêu đề tin" and the placeholder "Tên đường, phường hoặc từ khóa" (both as in the sample screen), inside a `role="search"` region labelled "Tìm phòng trọ". A button "Tìm trọ" submits it. It works with JavaScript off. It has no `page` field, so a search always starts at page 1, and it never searches while typing. The field shows the current keyword from the address and follows the back and forward buttons. When a keyword is set, a link "Xóa tìm kiếm" to `/` is shown beside the form.
- **AC-5**: The read. One server read per visit: `GET /listings?q&page&pageSize=12`, made as a guest through the new `src/lib/api/server.ts`, uncached, inside `<Suspense>`. The page size is the constant `LISTING_PAGE_SIZE` (12). Nothing is sent from the browser by this page, and `isFavorite` (always `null` for a guest) is not read or shown.
- **AC-6**: The loading skeleton. Each new search or page shows `LoadingState variant="cards"` until its results arrive, and the old results never stay on screen beside a new heading. This holds on the first visit and on every later change of the address.
- **AC-7**: The results. A heading `h2` "N tin phù hợp" (with " với “q”" added when a keyword is set, q cut at 60 characters with "…" in the heading, N formatted with `formatCount`), a list of cards (one `li` per row, `key` is the row `id`), then `ListPagination` with `hrefFor` (each page is a real link), `itemLabel="tin"` and `size="lg"`. The count comes from `total`. The heading is a polite live region, so a screen reader hears the new count once.
- **AC-8**: The card. `src/components/listing-card.tsx`, lifted from the sample card in `src/app/dev/ui/screens/listing-card.tsx` and taking the `GET /listings` row as it is. It shows the cover, the title (an `h3`), the price with "mỗi tháng", the area, the deposit only when it is not `null`, "Vào ở từ" only when `availableFrom` is not `null`, the full address, the landlord name (or "Chủ trọ" when `null`) and the posted date. Money, area and dates use `src/lib/format.ts`. The card takes an optional `href`. Without it, which is how #8 uses it, the title is plain text, the card is not a link and not a tab stop, and it has no hover shadow. With it, the title is the link and a stretched link covers the whole card, as the sample does.
- **AC-9**: The photo box. `src/components/listing-photo.tsx` (a client component) takes the address already made by `mediaUrl(coverImageUrl)`. A `null` address shows `ImagePlaceholder`. An address whose load fails hides the photo box and shows no error. It uses `next/image` with `fill` inside a 16:9 box, an empty `alt` (the title beside it names the listing), and `sizes` that match the grid. The first card of the page loads its photo at once (`loading="eager"` and `fetchPriority="high"`), and the others load lazily. It does not use the deprecated `priority` property. #9 and #14 reuse it.
- **AC-10**: Nothing found, and a page past the last. With a keyword and no row, an `EmptyState` titled "Không có tin nào phù hợp" with the description "Thử đổi từ khóa để xem thêm phòng." and a "Xóa tìm kiếm" action. With no keyword and no row, an `EmptyState` titled "Chưa có tin nào được đăng" with the description "Hãy quay lại sau, chủ trọ sẽ sớm đăng tin mới." and no action. When `total` is above 0 and the page has no row (`?page=99`), an `EmptyState` titled "Trang này không có tin" with a link "Xem trang cuối" to the last page, and the page links stay (`ListPagination` keeps the last page's links). All three answer 200.
- **AC-11**: Failures. A failed read throws an `ApiError`. The page catches it with `isApiError` and hands its plain fields (`status`, `code`, `message`, `requestId`, `retryAfterSeconds`, `retryAfterExact`) to a client component, which rebuilds the error with `createApiError`. A 429 shows `RateLimitNotice` with the countdown, and "Thử lại" is disabled until the wait ends. Any other failure (a 5xx, `NETWORK_ERROR`, `TIMEOUT`, `INVALID_RESPONSE`) shows `ErrorState` with the backend or client message, and the support code for a 5xx only. "Thử lại" runs `router.refresh()` in a transition. The header and the search box stay usable. Anything that is not an `ApiError` is rethrown to the route `error.tsx`. The server never retries by itself.
- **AC-12**: Page metadata. `generateMetadata` reads only the cleaned search from the address and makes no API call. A plain list page: title "Tìm phòng trọ" (page N above 1 adds ", trang N"), the description "Phòng trọ, nhà cho thuê và căn hộ mini do chủ trọ đăng trực tiếp. Tìm theo tên đường, phường hoặc từ khóa.", a canonical address `listingsHref` of the cleaned state (so `?page=abc` canonicalises to `/`), and Open Graph tags for type `website`, site name, locale `vi_VN`, title, description and address, with no image. A page with a keyword: title `Kết quả cho “q”` (q cut at 60 characters for the title, page N added the same way), the description "Các tin cho thuê phù hợp với “q” trên Mái Hiên." (the site name comes from `SITE_NAME`), the same canonical rule, and `robots` set to `noindex, follow`. No JSON-LD on this page.
- **AC-13**: `robots.txt`. `src/app/robots.ts` allows `/` and disallows `/landlord`, `/admin`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/favorites`, `/account`, `/*?q=` and `/*&q=`. It has no sitemap line yet (#9 adds the sitemap and the line).
- **AC-14**: The server reader. `src/lib/api/server.ts` imports `server-only` and exports `serverGet<T>(path, query)`. It builds the address with `buildUrl(serverEnv.API_URL, …)`, sends no `Authorization` and no cookie, gives up after 10 seconds (`timeoutError()`), turns a failed connection into `networkError()`, and reads the answer with `parseResponse`, so every failure is an `ApiError`. `getListings(q, page)` in `src/features/listing-search/api/get-listings.ts` calls it and is wrapped in React `cache()` with primitive arguments.
- **AC-15**: Layout and accessibility (WCAG AA). Phone first and fine at 320 px with no sideways scroll: one card column below `sm`, two from `sm`, three from `lg`, cards in one row have equal height, and a hidden photo box does not break the row. The heading order is `h1`, `h2`, `h3`. Controls are `size="lg"` at every width, focus rings come from `FOCUS_RING`, and only semantic tokens are used. A new text or control colour pair is added to `PAIRS` in `scripts/check-contrast.mjs` in the same change. The search is a `Card` zone on the canvas, and the result cards sit directly on the canvas, never inside a zone (spec 0004), as in the sample screen. When a failure replaces the results, it sits under an `h2` "Kết quả tìm kiếm".
- **AC-16**: Reference and clean build. `/dev/ui` shows the card and its states on fake data with no API call: with a photo, with no photo, with a photo that fails to load, with an `href` and without one, with a long title and address. It also shows the failure notice for a 5xx with a support code and for a 429 with a wait. `npm run check` and `npm run build` pass, with no hydration warning and no console error on `/`, `/?q=…`, `/?page=2` and `/?page=99`, no `any`, and no link to a page that does not exist.

## Decision

**Chosen option**: Option 1: A guest read on the server with the whole search in the address

The list is read on the server as a guest, uncached and inside `<Suspense>`. `q` and `page` live in the address and are cleaned by one pure parser. The search is a `next/form` GET form. The card and the photo box are shared components in `src/components`, and the server reader is a small shared function in `src/lib/api`.

**Implementation skills**: `zod` (`pproenca/dot-skills`, `.agents/skills/zod/`) · `tailwind-design-system` (`wshobson/agents`, `.agents/skills/tailwind-design-system/`) · `shadcn` (`shadcn-ui/ui`, `.agents/skills/shadcn/`) · `next-dev-loop` (`vercel/next.js`, `.agents/skills/next-dev-loop/`)

The Next.js docs in `node_modules/next/dist/docs/` win over these skills where they disagree (project rule in `AGENTS.md`). Read these pages before writing code: `generate-metadata` (the part "With Cache Components"), `form`, `image` (`preload`, `loading`, `fetchPriority`), `adopting-partial-prefetching` (URL data behind Suspense) and `instant`. No new skill or MCP server was searched for, because no new tool is chosen.

## Feature design

**Data model sketch**: no table, no stored data, nothing in browser storage. Two shapes:

```ts
// The search state, the only thing the address carries.
// src/features/listing-search/schemas/search-params.ts
export const LISTING_PAGE_SIZE = 12;
export type ListingSearch = {
  q: string; // trimmed, at most 500 characters, "" means no keyword
  page: number; // whole number, 1 to 1,000,000
};
// #13 later adds wardCode, minPrice, maxPrice and sort to this same shape.
```

The answer is the existing `Page<PublicListingSummary>` in `src/lib/api/types.ts` (`items`, `total`, `page`, `pageSize`). Each row has `id`, `code`, `slug`, `title`, `price`, `areaM2`, `deposit`, `availableFrom`, `coverImageUrl`, `ward`, `addressText`, `fullAddress`, `landlord { id, name }`, `createdAt` and `isFavorite`. No new type is needed. A page holds 0 to 12 rows, and `total` counts every match.

**State of the results area** (per address):
- `loading`: the skeleton, from the first byte until the answer.
- `results`: `items` is not empty.
- `empty`: `total` is 0 (with or without a keyword, two copies).
- `past last`: `total` is above 0 and `items` is empty.
- `failed`: an `ApiError` (429 or other). `failed` goes to `loading` on "Thử lại", and any change of the address goes to `loading`.

**API surface** (one read, on the server, as a guest):

| Endpoint | Method | Key inputs | Key outputs used | Auth | Key errors |
|---|---|---|---|---|---|
| `/listings` | GET | `q` (opt), `page` (opt), `pageSize=12` | `items[]`, `total`, `page`, `pageSize` | none, no `Authorization` | 429 `RATE_LIMITED`; 5xx; client side `TIMEOUT`, `NETWORK_ERROR`, `INVALID_RESPONSE`. A 400 cannot come from a cleaned query. |

Routes of the frontend: `/` (`src/app/(public)/page.tsx`) and `/robots.txt` (`src/app/robots.ts`). The "Tìm trọ" item of `PUBLIC_NAV` already points at `/`, so the menu does not change.

**Value sourcing** (every value names its source):

| Action | Value produced or displayed | Source |
|---|---|---|
| Read the list | API address | `serverEnv.API_URL` (`src/lib/env.server.ts`) |
| Read the list | `q` and `page` sent | the cleaned state from `parseListingSearch` (AC-3) |
| Read the list | `pageSize` | the constant `LISTING_PAGE_SIZE` (12), decided in this spec |
| Read the list | wait after a 429 | `Retry-After` header (readable on the server), carried as `retryAfterSeconds` and `retryAfterExact` |
| Show the heading | N and the keyword | `total` of the answer, and the cleaned `q` |
| Show the range line and the page links | first row, last row, page count | `page`, `pageSize` and `total` of the answer, drawn by `ListPagination` |
| Page link address | `/?q=…&page=N` | `listingsHref` from the cleaned state and N |
| Search box | current keyword | the cleaned `q` (`useSearchParams`, cleaned by the same parser) |
| Search box | which clear link shows | the cleaned `q` is not empty |
| Card | photo address | `mediaUrl(row.coverImageUrl)`; `null` shows the placeholder |
| Card | whether the first photo loads at once | the position in `items` is 0 |
| Card | price, area, deposit | `formatMoney`, `formatArea` on the row |
| Card | move in date | `availableFrom` as written, with no time zone shift (`formatDateOnly`, spec 0001) |
| Card | posted date | `createdAt` in `Asia/Ho_Chi_Minh` (`formatDateTime`) |
| Card | landlord | `landlord.name`, else "Chủ trọ" |
| Card | link (from #9) | `/<slug>-<code>` from the row, passed by #9 as `href` |
| Which empty copy | with or without a keyword | the cleaned `q` is empty or not |
| Failure notice | support code | `requestId` of the error body, for a 5xx only (`describeError`) |
| Tab title, description, canonical | text and address | the cleaned state, the fixed copy in AC-12, `NEXT_PUBLIC_SITE_URL` through `metadataBase` |
| Page header | the one line description | the plain list description of AC-12 (the same words on screen and in the metadata) |
| Indexing | `noindex, follow` | the cleaned `q` is not empty |
| Skeleton key | when the boundary resets | the cleaned state of the current address |

**Key invariants**:
- The server never holds a token, so the list is the same for everyone. A hidden or locked listing leaves the page at once, because the list is not cached.
- The keyword is text. It goes into the address only through `URLSearchParams` and onto the page only as React text, never as HTML.
- The API never receives a `page` outside 1 to 1,000,000, a `q` over 500 characters, or a parameter it does not know (an unknown field is a 400).
- A card never shows a broken image icon or an image error. No photo gives the placeholder, a failed photo hides the box.
- A card is a link only when it is given an `href`, so no link points at a page that does not exist.
- The list never carries a phone number, and this page never reads `isFavorite`.

**Security model**: a public page with no sign in. The server reads as a guest and sends no token or cookie (spec 0001). The keyword comes from the address, is cleaned, and is shown as plain text in the page, the title and the description (React and Next escape it). Rate limit: `GET /listings` allows 300 per minute per IP, and every server render shares one IP (spec 0001), so the keyword addresses are blocked in `robots.txt` to keep crawlers from spending it. No regulated data.

**Configuration required**: none. It uses `API_URL`, `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SITE_URL`, which already exist.

**Where the code goes** (names are binding for the shared parts, free for the rest):

| Path | What |
|---|---|
| `src/lib/api/server.ts` | `serverGet<T>(path, query)`, `server-only`, the 10 second limit (AC-14) |
| `src/features/listing-search/api/get-listings.ts` | `getListings(q, page)` wrapped in `cache()` |
| `src/features/listing-search/schemas/search-params.ts` | `LISTING_PAGE_SIZE`, `ListingSearch`, `parseListingSearch` (a Zod schema with a fallback for each bad value) |
| `src/features/listing-search/search-href.ts` | `listingsHref` |
| `src/features/listing-search/components/search-box.tsx` | client; `next/form`, `useSearchParams`, the clear link, the fallback form |
| `src/features/listing-search/components/results-boundary.tsx` | client; reads `useSearchParams` and renders an inner `<Suspense key={…} fallback={<LoadingState variant="cards" />}>` around its children (AC-6) |
| `src/features/listing-search/components/results.tsx` | async server component; reads `searchParams`, calls `getListings`, draws the heading, the list, the pagination, the empty and past last messages, and the failure |
| `src/features/listing-search/components/listings-failure.tsx` | client; rebuilds the `ApiError`, draws `RateLimitNotice` or `ErrorState`, the "Thử lại" button |
| `src/components/listing-card.tsx`, `src/components/listing-photo.tsx` | shared, reused by #9, #14 and #15 |
| `src/app/(public)/page.tsx` | the page and `generateMetadata` |
| `src/app/robots.ts` | `robots.txt` |
| `src/app/dev/ui/listing-cards.tsx` | `ListingCardsSection`, mounted in `src/app/dev/ui/page.tsx` (AC-16) |

The page keeps the static shell (header and search card shape) outside every boundary. The order is: `PageHeader`, a card holding `<Suspense fallback={fallback form}><SearchBox/></Suspense>`, then `<Suspense fallback={skeleton}><ResultsBoundary><Results searchParams={…}/></ResultsBoundary></Suspense>`. The outer boundary covers the first visit, because `useSearchParams` needs one. The inner keyed boundary covers every later change. If a check in `next dev` shows that React keeps the old results on screen instead of the skeleton, keep the old results and mark the area `aria-busy` with a dimmed look, and say so in the verify notes.

**Critical test scenarios** (each maps to an acceptance criterion):
- Happy path: open `/` as a guest, see 12 cards of the 37 demo listings and 4 pages. Type `tan dinh` and press Enter: the address becomes `/?q=tan%20dinh`, the heading shows the count with the keyword, the cards match, verifies **AC-1**, **AC-2**, **AC-4**, **AC-5**, **AC-7**.
- Paging: press "Trang 2": the address is `/?page=2`, the skeleton shows, then rows 13 to 24, and "previous" works. A keyword and page 2 give `/?q=…&page=2`, verifies **AC-2**, **AC-6**, **AC-7**.
- Odd addresses: `/?page=abc`, `/?page=0`, `/?page=2000000` and `/?q=` all show page 1 with no error and no redirect. `/?q=<script>` shows the text, not a script. A 600 character `q` is cut at 500, verifies **AC-3**.
- Past the last page: `/?page=99` shows "Trang này không có tin" and a link to page 4, verifies **AC-10**.
- Empty: `/?q=zzzzzz` shows "Không có tin nào phù hợp" and "Xóa tìm kiếm" returns to `/`. With every listing hidden, `/` shows "Chưa có tin nào được đăng", verifies **AC-10**.
- Photos: a row with `coverImageUrl: null` shows the placeholder. A row whose photo answers 404 loses its photo box, with no error and no layout break. The first card's photo is `eager`, verifies **AC-9**, **AC-15**.
- Failure: stop the API: an error block with "Thử lại", and the search box still works. A 429 shows the wait and disables the button until it ends. Start the API and press "Thử lại": the list comes back, verifies **AC-11**, **AC-14**.
- No token: view the page source and the network tab as a signed in landlord: no `Authorization`, no phone number, no `isFavorite` value, no request from the browser to the API, verifies **AC-1**, **AC-5**.
- Search engines: `/` and `/?page=2` have index tags and their own canonical. `/?q=x` has `noindex, follow`. `/robots.txt` lists the rules of AC-13, verifies **AC-12**, **AC-13**.
- No JavaScript: with scripts off, the form still searches and the page links still work, verifies **AC-4**, **AC-7**.
- Phone: 320 and 390 px, no sideways scroll, one column, controls 44 px high, verifies **AC-15**.

## Build plan

Tracer Bullet (the project default, `AGENTS.md`): one thin real thread through every layer first (server reader, address parser, the page, real rows from the API), then the card, then the search and the states, then the crawler side. Each milestone runs end to end.

1. **M1, the thin thread**: `src/lib/api/server.ts` and `serverGet` with the 10 second limit and no token. Satisfies **AC-14**.
2. **M1**: `search-params.ts` (`parseListingSearch`, `LISTING_PAGE_SIZE`) and `search-href.ts` (`listingsHref`), both pure. Satisfies **AC-2**, **AC-3**.
3. **M1**: `getListings` with `cache()`, and the page: `PageHeader`, the static shell, an async `Results` that reads `searchParams` inside `<Suspense>` and draws the rows as a plain list (title and price) with `ListPagination hrefFor`. `/`, `/?q=…` and `/?page=2` work against the seeded API. Satisfies **AC-1**, **AC-5**, **AC-7**.
4. **M2, the card**: lift the sample card into `src/components/listing-card.tsx` with the optional `href`, and write `src/components/listing-photo.tsx` (placeholder, hide on a failed load, `sizes`, eager first photo). Draw the grid and the equal height rows. Satisfies **AC-8**, **AC-9**, **AC-15** (grid).
5. **M2**: `ResultsBoundary` with the keyed inner `<Suspense>`, the outer boundary and the skeleton, and the heading as a polite live region. Check in `next dev` that each new search or page shows the skeleton. Satisfies **AC-6**, **AC-7**.
6. **M3, search and states**: `SearchBox` with `next/form`, the fallback form, the clear link and the keyed field. Satisfies **AC-4**.
7. **M3**: the empty states, the past last message, and `ListingsFailure` with `RateLimitNotice`, `ErrorState` and "Thử lại". Satisfies **AC-10**, **AC-11**.
8. **M4, crawlers and reference**: `generateMetadata` (titles, description, canonical, Open Graph, `noindex` for a keyword) and `src/app/robots.ts`. Satisfies **AC-12**, **AC-13**.
9. **M4**: the `/dev/ui` section `listing-cards.tsx` with every card and failure state on fake data. Satisfies **AC-16**.
10. **M4**: check 320, 390 and 1280 px, the heading order, the focus ring, a screen reader pass on the heading and the cards, any new contrast pairs, `npm run check` and `npm run build`, a clean console on the four addresses. Satisfies **AC-15**, **AC-16**.

## Consequences

**Positive**:
- The front door is real HTML for search engines and works with JavaScript off. A result address can be shared.
- A hidden, locked or over quota listing leaves the page at once, because nothing is cached.
- The server reader, the card and the photo box are built once, and #9, #13, #14 and #15 reuse them.
- Every failure of the read has a plain Vietnamese message, and the page around it keeps working.
- The address parser is written so #13 adds its fields in one place.

**Negative / tradeoffs**:
- Every visit and every search is one API call, and all server renders share one IP and the limit of 300 a minute. A busy public demo can hit it. Only keyword addresses are blocked for crawlers, so `?page=N` crawling still spends it. If it bites, add a short `use cache` (spec 0001) rather than ask for a higher limit.
- A card opens nothing until #9 ships, so the demo path stops at the list until then.
- A signed in person sees the guest list. The heart waits for #14 and its overlay.
- The keyword matching (partial words, at most 6 words) is the backend's. The page does not highlight the match.
- A just hidden listing can still show its photo for up to a day, because the image optimizer keeps its own copy (spec 0001).
- `useSearchParams` and a keyed boundary add two small client components just to get the skeleton on every change.
- The `/dev/ui` sample listings screen keeps its own copy of the card and can drift from the real one.
- A streamed page still answers 200 for a past last page or a failure, and Googlebot sees streamed metadata in the body, not the head. Bots that cannot run scripts get blocking metadata in the head (spec 0001, Follow-up).

**Neutral**:
- Spec 0001 handed #8 the address state, page metadata, JSON-LD and robots. This spec settles the address state, page metadata and robots, decides no JSON-LD on the list page, and leaves the sitemap and the share cards to #9.
- `src/lib/AGENTS.md` still says the server reader is not built, and `src/components/AGENTS.md` does not list the card or the photo box. That is for `/sync` after this ships.
- The sample screen `/dev/ui/screens/listings` stays as it is, with its ward, price and sort controls that #13 will bring.
- The existing `src/features/listing` folder is the landlord's posting feature. The public search lives in `src/features/listing-search` so the two names do not collide.

## Follow-up

- [ ] #9 turns the card link on by passing the address `/<slug>-<code>` (from the row) as the card's `href`, adds the sitemap and its `robots.txt` line, the share cards, and reuses `ListingPhoto` for the gallery. It also reuses `server.ts` and the guest and overlay pattern of spec 0001.
- [ ] #13 adds `wardCode`, `minPrice`, `maxPrice` and `sort` to `ListingSearch`, `parseListingSearch` and `listingsHref`, and decides which filtered addresses are `noindex` and blocked in `robots.txt` (today only `q` is).
- [ ] #14 adds the heart to the card (a slot keyed by the row `id`) and the overlay that supplies `isFavorite` for a signed in person. #15 links the landlord name on the card.
- [ ] Copy decision for the engineer: the description and the metadata do not name a city, because the contract does not say the site covers one city only (the sample screen says "Thành phố Hồ Chí Minh"). Confirm whether the city belongs in the copy.
- [ ] A default share image for the list page was not made. Open Graph here has text only.
- [ ] After this ships, `/sync` updates `src/lib/AGENTS.md` (the server reader exists) and `src/components/AGENTS.md` (the card and the photo box).
- [ ] If the shared 300 a minute limit bites during a demo, add a short `use cache` to `getListings` (spec 0001) and say so here.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).
