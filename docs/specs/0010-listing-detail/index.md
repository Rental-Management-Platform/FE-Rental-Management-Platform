# 0010. Listing detail: the public page of one listing

**Date**: 2026-11-03
**Status**: In Progress

## Summary

This feature builds the page a guest lands on when they open a card from the list: `/<slug>-<code>`. It shows the photos, price, size, address, description and property, and a contact card. A guest sees a "sign in to see the phone number" button. A signed in person sees the number as a tap to call button, filled in by the browser after the page loads, so the number is never in the server HTML. It also finishes what the list page left open: the card becomes a link, and the site gets a sitemap, share cards and page metadata. No package, table, endpoint or environment variable is added.

## Requirements

Seeded from scope item #9 and refined with the engineer. Contract with the backend: `api-for-frontend.md` sections 2 (optional login reads), 3 (rate limits), 4.1 (Next.js with the token in memory), 6.19, 6.20 (`GET /listings/:slugCode`) and 7 ("Tìm trọ"). Patterns to follow: spec 0001 (two data paths, overlay pattern, guest view count, junk paths), spec 0002 and 0005 (session, `authHref`), spec 0003 and 0004 (components, zones, canvas, type), spec 0007 (`mediaUrl`, AC-12), spec 0009 (server reader, card, failure notice, metadata, `robots.ts`).

**User stories**:
- As a guest on a phone, I want to open a listing and see its photos, price, size, address and description, so that I can decide whether to call.
- As a guest, I want a clear way to sign in or register and come back to the same listing to see the phone number.
- As a signed in person, I want the landlord's number as a button I can tap to call.
- As someone who sends a listing link on Zalo or Facebook, I want a share card with the title, a short description and the first photo.
- As the site owner, I want each listing to be real HTML with a title, description, canonical address and a place in the sitemap, and I want no phone number in that HTML.
- As someone using a screen reader or a keyboard, I want a clear heading order, a labelled photo gallery and a contact area that announces when the number appears.

**Acceptance criteria** (the contract; each is checkable on its own):
- **AC-1**: The route. `src/app/(public)/[slugCode]/page.tsx` serves `/<slug>-<code>` and `/<code>`. The default export is a plain function: the only thing this page adds to the static shell (next to the site header from the `(public)` layout) is the `<Suspense>` fallback `ListingDetailSkeleton`. `params` is passed down as a promise and read only inside the boundary. The page does not export `instant = false` and reads no cookie, header or token, so the server HTML is the same for everyone.
- **AC-2**: The address. Two pure functions in `src/lib/listing-path.ts` own it. `parseListingPath(segment)` returns `{ code, slug }` or `null`: the code is the last 8 characters matched by `/(?:^|-)([a-hjkmnp-z2-9]{8})$/` (spec 0001), the slug is the text before `-code` or `null` when the segment is only the code, and a segment longer than 200 characters is `null`. `listingPath(slug, code)` returns `/<slug>-<code>`, or `/<code>` when the slug is `null` or empty (so it never makes `/-<code>`). Parsing then building gives the same path back for any clean segment. A capital letter in the code gives `null` (the API answers 404 to it too).
- **AC-3**: The junk check. When `parseListingPath` returns `null`, the page calls `notFound()` before any API request, so a bot probe spends none of the shared 300 a minute. `generateMetadata` runs the same check first (it awaits `params` and parses it), so a junk address gets no API call from the metadata either (AC-14).
- **AC-4**: The read. One server read per visit: `getListing(code)` calls `serverGet<ListingDetail>("/listings/" + code)` as a guest, uncached. It sends the 8 character code only, never the slug from the address. It is wrapped in React `cache()` with the primitive `code`, so `generateMetadata` and the page share one request. Nothing is sent from the browser by the page itself (the browser reads of AC-8 and AC-10 come from the contact card and the view counter).
- **AC-5**: The content. In this order in the source: `PageHeader` with a `Breadcrumb` ("Tìm trọ" linking to `/`, then the title as the current page), `h1` the title, and a description line with a pin icon and `fullAddress`. Then the gallery (AC-6), a "price and facts" zone (the price with "mỗi tháng", then a list of Diện tích, Tiền cọc, Vào ở từ, Lượt xem; Tiền cọc and Vào ở từ show "Chưa ghi" when `null`; money, area, dates and counts use `src/lib/format.ts`; `availableFrom` is shown as written, with no time zone shift), the contact zone (AC-7 to AC-11), a "Mô tả" zone, and a "Nhà trọ" zone (`property.name` and `property.fullAddress`). The description is plain text with its line breaks and long words wrapped, never HTML, and its zone is left out when it is empty. Fees, amenities, the map and the ward crumb are not shown (they belong to #11, #33 and #13). Heading order is `h1`, then `h2` for each zone, with no skipped level. The landlord name is plain text (no link until #15) and there is no heart (until #14).
- **AC-6**: The gallery. `src/features/listing-detail/components/listing-gallery.tsx` (a client component) takes the photos already mapped by the server: `images` sorted by `position`, each address from `mediaUrl(image.url)`. It sits on the canvas, not inside a card, in a labelled `section` with an `sr-only` `h2` "Ảnh của tin".
  - No photo to show: `images` is empty, or every `mediaUrl` gave `null` (the server drops those addresses before it hands the photos over). Then `ImagePlaceholder ratio="4:3"` with the line "Tin này chưa có ảnh."
  - One photo: the photo only, with no thumbnail strip and no counter.
  - Two to five photos: a row of slides in a scroll container with CSS scroll snap, so a phone swipes with no script. Under it a strip of thumbnail buttons (`aria-label` "Xem ảnh 2 trên 5", `aria-current="true"` on the active one, at least 44 px high) and a counter "Ảnh 2/5". A thumbnail scrolls its slide into view, smoothly unless `prefers-reduced-motion`. The active slide follows the scroll. The counter is hidden from screen readers (`aria-hidden`), because the thumbnail labels and `aria-current` already say which photo is shown, and a live region would speak on every swipe.
  - Each slide is a 4:3 box on `bg-muted` holding the whole photo (`object-contain`, never cropped), `next/image` with `fill`, `alt` "<title>, ảnh 2 trên 5", and `sizes` `(min-width: 1152px) 728px, (min-width: 1024px) calc(100vw - 424px), (min-width: 768px) calc(100vw - 48px), calc(100vw - 32px)`. The first photo loads at once (`loading="eager"`, `fetchPriority="high"`), the others lazily. It does not use the deprecated `priority` property. Each thumbnail is a `next/image` with `fill`, `sizes="64px"`, `loading="lazy"`, `alt=""` (its button carries the label) and `object-cover`, so a thumbnail never downloads a full width file.
  - A photo whose load fails is dropped from the slides and the strip, and the counter and `aria-current` follow. A photo that failed before the page became interactive is caught too: on mount, the gallery checks each `img` and treats `complete` with a `naturalWidth` of 0 as failed, because `onError` can miss an error that happened before hydration. If every photo fails, the whole `section` (including its `sr-only` `h2`) draws nothing, with no error and no gap in the layout.
- **AC-7**: The contact card for a guest. `ListingContact` (client) holds the landlord name (or "Chủ trọ" when `null`), "Đăng tin ngày" and `formatDateTime(createdAt)`. When the session status is `guest` (this includes a failed session restore, `endedReason: "unavailable"`, where the person may still have a session, and sign in still works), it shows a button "Đăng nhập để xem số điện thoại" to `authHref("/login", path)`, a small link "Chưa có tài khoản? Đăng ký" to `authHref("/register", path)`, and the line "Số điện thoại của chủ trọ chỉ hiện với người đã đăng nhập." `path` is `listingPath(listing.slug, listing.code)` from the answer, never the address bar. With JavaScript off, a `noscript` block shows the same sign in button and link. The server HTML contains no phone number.
- **AC-8**: The contact card for a signed in person. When the status is `user`, the browser runs `GET /listings/<code>` through `useApi()` with `auth: "optional"`, the query key `["listing-detail", code]`, `enabled` only for a `user` who is not the landlord of this listing, `staleTime` 5 minutes and no refetch on window focus. `ListingContact` turns the session and the query into one `ContactView` by the rule in Feature design. When `user.id` equals `listing.landlord.id`, the read is skipped and the card shows "Đây là tin của bạn." in place of the call button and its line. With a number it shows a button `a[href="tel:<phone>"]` with a phone icon and `formatPhone(phone)`, and the line "Khi gọi, bạn hãy nói đã thấy tin này trên Mái Hiên." It works for tenant, landlord and admin. While the status is `loading`, or the read is pending, it shows a skeleton button with `aria-busy`, and the sign in button never flashes for a person who has a session. The contact area is a polite live region, so a screen reader hears the number appear. After sign out the cache is cleared (`AuthProvider`) and the card returns to the guest view.
- **AC-9**: Contact failures. For a signed in person only, the card shows, in place of the button and with the rest of the page untouched: an answer with `phone: null` shows "Chưa lấy được số điện thoại." and "Thử lại"; a 404 shows "Tin này vừa được ẩn hoặc xóa." and a link "Xem các tin khác" to `/`; a 429 shows `RateLimitNotice` with the countdown and "Thử lại" disabled until it ends; any other failure shows `ErrorState` titled "Không lấy được số điện thoại" as a notice inside the card (not a page level alert), with the backend or client message (support code for a 5xx only) and "Thử lại". "Thử lại" runs the query's `refetch`, and while that retry runs the card shows the checking state again.
- **AC-10**: The guest view count. When the session status is `guest` (not `loading`), `GuestViewCounter` (client, draws nothing) sends `GET /listings/<code>` with `auth: "none"` once per mount and ignores the answer and every error. A `useRef` is set before the send, so the second effect run of React StrictMode in development does not send again, and the cleanup never aborts the request. It also runs for a `guest` whose session restore failed (`endedReason: "unavailable"`). It never runs while `loading` and never for `user`, whose count comes from AC-8.
- **AC-11**: The slug fix. `ListingAddressFix` (client, draws nothing) compares the address bar path with `listingPath(listing.slug, listing.code)` after mount. When they differ (an old slug, a wrong slug, or only the code), it calls `history.replaceState` with the canonical path, keeping the query string and the hash. It makes no navigation, no request and no new history entry, so the back button does not loop, and running it twice (React StrictMode) changes nothing the second time. It acts only when the canonical path matches `/^\/[a-z0-9]+(?:-[a-z0-9]+)*$/`.
- **AC-12**: A listing that is gone. A 404 `LISTING_NOT_FOUND` from the read calls `notFound()` (outside any `try` that could swallow it). `src/app/(public)/[slugCode]/not-found.tsx` shows `NotFoundState title="Không tìm thấy tin này" backHref="/" backLabel="Xem các tin khác"`. The status can already be 200 because the page streams, and Next adds `<meta name="robots" content="noindex">` itself. The junk address of AC-3 gets the same screen, and so does a landlord who opens their own hidden listing (the contract answers 404 even to the owner on this public route).
- **AC-13**: Other read failures. Any other `ApiError` from the server read (429, 5xx, `TIMEOUT`, `NETWORK_ERROR`, `INVALID_RESPONSE`) shows an `h1` "Không mở được tin này" and `ListingsFailure` (spec 0009, AC-11: the 429 countdown, the support code for a 5xx only, "Thử lại" runs `router.refresh()`). `ListingsFailure` gets an optional `title` prop whose default stays "Không tải được danh sách tin", so the list page does not change, and this page passes "Không tải được tin này". Anything that is not an `ApiError` is rethrown to the route `error.tsx`. The server never retries by itself.
- **AC-14**: Page metadata. `generateMetadata` uses the same cached read. Title: `listing.title` (the layout template adds " | Mái Hiên"). Description: `listingDescription(listing)`, at most 160 characters: price with "mỗi tháng", area, `fullAddress`, then the start of the description with whitespace collapsed, cut at a word and ended with "…". Canonical: `listingPath(listing.slug, listing.code)` (so a wrong slug canonicalises to the right one). Open Graph: type `website`, site name, locale `vi_VN`, title, description, url, and the image of AC-15. Twitter card `summary_large_image` with an image, else `summary`. A junk address (`parseListingPath` gives `null`, no API call) and a 404 both answer title "Không tìm thấy tin" and `robots` `noindex`. Any other failure answers title "Tin cho thuê" and `robots` `noindex`. The function never throws.
- **AC-15**: The share image. `shareImagePath(images)` takes the photo with the lowest `position`, makes its address with `mediaUrl`, and returns `/_next/image?url=<encoded address>&w=1200&q=75` (a path that `metadataBase` turns into an absolute address), or `null` when there is no photo or `mediaUrl` gives `null`. With `null`, the card has text only. Fetching that address returns 200 and an image. Width and height are not written (the original size is unknown).
- **AC-16**: Structured data. The page writes one `<script type="application/ld+json">` with a `BreadcrumbList`: position 1 "Tìm trọ" with the site address, position 2 the title with the canonical absolute address. The text is `JSON.stringify` with every less than sign replaced by the six characters backslash, u, 0, 0, 3, c (the form the Next.js JSON-LD guide shows), so a title can never close the script tag. It holds no phone number and no personal field.
- **AC-17**: Sitemap and robots. `src/app/sitemap.ts` returns the home page and every public listing as an absolute `<NEXT_PUBLIC_SITE_URL>/<slug>-<code>`. It reads `GET /listings?page=N&pageSize=50` as a guest through `serverGet`, one page after another, until a page has fewer than 50 rows, or `page × 50` reaches `total`, or 20 pages were read. That is at most 1,000 listings, which keeps the file far under the 50,000 URL limit and spends at most 20 of the shared 300 reads a minute. A row whose `code` was already seen is skipped, because the newest first order can shift while the walk runs. It is fresh on every request: its first line is `await connection()`, because Next caches a sitemap by default unless it uses a request time API. It has no `lastModified`, `changeFrequency` or `priority`. If a read fails, the error is thrown so the answer is a 500, never a half empty sitemap. `src/app/robots.ts` adds `sitemap: <NEXT_PUBLIC_SITE_URL>/sitemap.xml` and keeps every existing rule.
- **AC-18**: The card link. `Results` (spec 0009) passes `href={listingPath(listing.slug, listing.code)}` to `ListingCard`, so the title is the link and a stretched link covers the whole card. The landlord name on the card stays plain text. No link on either page points to a page that does not exist.
- **AC-19**: The loading skeleton. `ListingDetailSkeleton` mirrors the page (a 4:3 photo box, the title, the facts, the contact card) and reserves the same boxes, so the page does not jump when the content arrives. It shows on the first visit and on a client navigation from the list.
- **AC-20**: Phone first, accessibility and a clean build. Fine at 320 px with no sideways scroll. One column on a phone in the order gallery, price and facts, contact, description, property. From `lg` two columns: the gallery and the zones on the left, the contact zone sticky in a 22 rem column on the right (as the sample screen). Zones are `Card` zones on the `canvas` and the gallery sits on the canvas (spec 0004). Controls are `size="lg"`, focus rings come from `FOCUS_RING`, only semantic tokens are used, and any new text or control colour pair is added to `PAIRS` in `scripts/check-contrast.mjs` in the same change. `/dev/ui` has a `ListingDetailSection` on fake data with no API call: the gallery with 0, 1, 3 and 5 photos and one that fails, and the contact card as checking, guest, signed in with a number, the viewer's own listing, number missing, gone, rate limited, and a general error. `formatPhone` moves into `src/lib/format.ts`. `npm run check` and `npm run build` pass, with no hydration warning and no console error on a valid address, a wrong slug address and a junk address, and no `any`.

## Decision

**Chosen option**: Option 1: The guest page on the server, the phone and the view count added by the browser

The server reads the listing as a guest, uncached, inside `<Suspense>`, and renders everything search engines need. A small client layer reads the session and adds only what depends on the viewer: the phone number for a signed in person, one extra read for a guest so the view is counted, and the quiet fix of the address bar.

**Design source**: the existing `design.md` and the sample screen `/dev/ui/screens/listing-detail` (the engineer's choice). Changes from the sample: the photo area becomes a gallery with a 4:3 box that never crops and a thumbnail strip, the ward crumb and the fees and amenities zone are left out, the guest card gains a small "Đăng ký" link, and the empty photo line no longer speaks to the landlord.

**Implementation skills**: `tanstack-query-best-practices` (`deckardger/tanstack-agent-skills`, `.agents/skills/tanstack-query-best-practices/`) · `tailwind-design-system` (`wshobson/agents`, `.agents/skills/tailwind-design-system/`) · `shadcn` (`shadcn-ui/ui`, `.agents/skills/shadcn/`) · `next-dev-loop` (`vercel/next.js`, `.agents/skills/next-dev-loop/`)

The Next.js docs in `node_modules/next/dist/docs/` win over these skills where they disagree (project rule in `AGENTS.md`). Read these pages before writing code: `dynamic-routes`, `not-found` and `streaming` (the part "The HTTP contract"), `generate-metadata` (the part "With Cache Components"), `sitemap` (it is cached by default), the JSON-LD guide, `linking-and-navigating` (the part on the native History API), and `image` (`sizes`, `loading`, `fetchPriority`, `qualities`). No new skill or MCP server was searched for, because no new tool is chosen.

## Feature design

**Data model sketch**: no table, no stored data, nothing in browser storage. The answer is the existing `ListingDetail` in `src/lib/api/types.ts`. Three small shapes are added:

```ts
// src/lib/listing-path.ts. The only thing the address carries.
export type ListingPath = {
  code: string; // 8 characters, lowercase letters without i, l, o, and digits 2 to 9
  slug: string | null; // null when the address is only the code
};

// src/features/listing-detail/components/listing-gallery.tsx (browser only)
type GalleryPhoto = { id: string; src: string }; // 0 to 5, minus any that failed to load
// plus: activeIndex (number) and failedIds (set of ids) as component state

// src/features/listing-detail/components/contact-panel.tsx (browser only)
export type ContactView =
  | { kind: "checking" } // session is loading, or signed in and the read is pending
  | { kind: "guest" } // includes a failed session restore (`endedReason: "unavailable"`)
  | { kind: "own" } // the viewer is the landlord of this listing: no phone read
  | { kind: "ready"; phone: string }
  | { kind: "failed"; reason: "no-phone" | "gone" | "error"; error?: ApiError };
```

**The contact card rule.** `ListingContact` (client) takes `{ code, path, landlord: { id, name }, createdAt }` from the server and builds one `ContactView`; `ContactPanel` (presentational) takes `{ view, landlordName, postedAt, signInHref, registerHref, onRetry }` and draws it. The mapping, in this order:
1. Session status `loading` gives `checking`.
2. Status `guest` gives `guest`.
3. Status `user` whose `id` equals `landlord.id` gives `own`, and the query stays disabled.
4. Status `user` otherwise runs the query. A pending read gives `checking`. TanStack keeps `status: "error"` while a retry runs, so an error with `isFetching` also gives `checking`.
5. A success with a phone gives `ready`. A success with `phone: null` gives `failed` with reason `no-phone`.
6. An `ApiError` with status 404 gives `failed` with reason `gone`. Any other error gives `failed` with reason `error`, and the panel draws `RateLimitNotice` when `error.status` is 429, else `ErrorState`.

Relations: `images` 1 to many (0 to 5), `property` many to 1, `landlord` many to 1, all inside the one answer. The personal field `landlord.phone` (and later `isFavorite`) lives only in the browser query cache under `["listing-detail", code]`, never in the server HTML.

**State of the contact area** (browser only): `checking` goes to `guest` when the session turns out to be a guest, and to `ready` or `failed` when a signed in person's read ends. `failed` goes to `checking` on "Thử lại". A sign in or sign out changes the session status, which moves the card to `checking` and on.

**API surface** (one listing endpoint read three ways, one list endpoint for the sitemap):

| Endpoint | Method | Where | Key inputs | Key outputs used | Auth | Key errors |
|---|---|---|---|---|---|---|
| `/listings/:code` | GET | server, page and metadata (one `cache()`d read) | `code` (8 characters) | the whole `ListingDetail` (`landlord.phone` is `null`) | none, no `Authorization` | 404 `LISTING_NOT_FOUND`; 429 `RATE_LIMITED`; 5xx; client side `TIMEOUT`, `NETWORK_ERROR`, `INVALID_RESPONSE` |
| `/listings/:code` | GET | browser, signed in | `code` | `landlord.phone` | `optional`, token sent when there is one | 404; 429 (60 a minute per person); 5xx; `TIMEOUT`, `NETWORK_ERROR`; it never answers 401 |
| `/listings/:code` | GET | browser, guest | `code` | nothing, the answer is ignored | `none` | ignored |
| `/listings` | GET | server, sitemap | `page`, `pageSize=50` | `items[].slug`, `items[].code`, `total` | none | 429; 5xx; `TIMEOUT`, `NETWORK_ERROR` |

Routes of the frontend: `/[slugCode]` (`src/app/(public)/[slugCode]/page.tsx`), `/sitemap.xml` (`src/app/sitemap.ts`) and the changed `/robots.txt`. Static routes win over the root `[slugCode]` segment, and the reserved top level names are in spec 0001.

**Value sourcing** (every value names its source):

| Action | Value produced or displayed | Source |
|---|---|---|
| Open the page | the code to read | `parseListingPath(params.slugCode)` (AC-2) |
| Read the listing | API address | `serverEnv.API_URL` (`src/lib/env.server.ts`) in the server read, `NEXT_PUBLIC_API_URL` through `useApi()` in the browser |
| Read the listing | wait after a 429 | `Retry-After` header, carried by the `ApiError` (`retryAfterSeconds`, `retryAfterExact`) |
| Show the header | title, address line | `listing.title`, `listing.fullAddress` |
| Show the facts | price, area, deposit | `formatMoney`, `formatArea` on the answer; "Chưa ghi" for a `null` deposit |
| Show the facts | move in date | `availableFrom` as written (`formatDateOnly`, spec 0001) |
| Show the facts | views | `formatCount(viewCount)` from the server read, which counts the server as one viewer; this visitor's own view is added by AC-8 or AC-10 and shows on the next visit |
| Show the gallery | photo addresses and order | `listing.images` sorted by `position`, each `mediaUrl(image.url)` (spec 0007, AC-12) |
| Show the gallery | which photo is first | the lowest `position`; it loads at once |
| Show the gallery | the counter "n/N" | the active index and the number of photos left after failures |
| Show the contact card | landlord and posted date | `landlord.name` else "Chủ trọ", `formatDateTime(createdAt)` (`Asia/Ho_Chi_Minh`) |
| Show the contact card | who is looking | `useSession().status`: `loading`, `guest` or `user` (`src/lib/session/auth-provider.tsx`) |
| Show the contact card | whether it is the viewer's own listing | `useSession()` user `id` equals `listing.landlord.id` |
| Show the contact card | the token on the signed in read | the session; it renews early (`EARLY_REFRESH_MS`, 30 seconds), so an expiring token does not silently give a `null` phone |
| Show the contact card | the number and the call link | `landlord.phone` of the browser read, stored as `0xxxxxxxxx`; text from `formatPhone`, link `tel:` plus the same digits |
| Show the contact card | sign in and register addresses | `authHref("/login" or "/register", listingPath(listing.slug, listing.code))` |
| Fix the address bar | the target path | `listingPath(listing.slug, listing.code)` from the answer, only if it passes the safe shape check |
| Metadata | title, description, canonical | `listing.title`, `listingDescription(listing)`, `listingPath(...)`, `NEXT_PUBLIC_SITE_URL` through `metadataBase` |
| Metadata | share image | the lowest `position` photo, `mediaUrl`, then the optimizer path with `w=1200` and `q=75` (both allowed: 1200 is a default device size and 75 the default quality) |
| JSON-LD | absolute addresses | `env.NEXT_PUBLIC_SITE_URL` plus the canonical path |
| Sitemap | the listing addresses | `GET /listings?page=N&pageSize=50`, each row `listingPath(slug, code)` under the site address |
| Not found copy | title and button | fixed copy in AC-12 |
| Loading | the skeleton boxes | the same ratios and spacing as the page (AC-19) |

**Key invariants**:
- The server HTML never carries a phone number. The server read is a guest read, so `landlord.phone` is `null`, and the number only ever exists in browser memory and the query cache.
- The server reads no cookie, header or token, so the HTML is the same for everyone and nothing personal can be cached or indexed.
- The API receives only a code that passed the local check. It never receives the slug from the address or an odd path.
- Changing the address bar never navigates, never fetches and never adds a history entry.
- A card or page never shows a broken image icon or an image error. A failed photo leaves the gallery.
- A link exists only when its page exists: the landlord name is plain text until #15, there is no heart until #14.
- The description and title are shown as React text. The only raw HTML is the JSON-LD script, and its `<` is escaped.
- The guest extra read and the signed in read never run while the session is `loading`.

**Security model**: a public page with no sign in. The backend decides who sees the phone (a guest never gets it, a token that is missing, wrong or expired gets `null` with a 200). Hiding or showing the button is a convenience. The token lives only in memory (spec 0002) and the page never writes it anywhere. The `next` value for sign in and register goes through `authHref`, which accepts only a safe local path. The address bar fix only accepts a path of lowercase words joined by dashes. The JSON-LD string escapes `<`. Rate limits: `GET /listings/:slugCode` allows 300 a minute per IP, and every server render shares one IP (spec 0001), so each visit costs one shared call, plus the sitemap's calls (one per 50 listings). A guest adds one browser call from their own IP (when the API is called directly; if it is proxied through Next.js, the backend sees one IP unless `X-Forwarded-For` and `TRUST_PROXY_HOPS` are set, spec 0001), and a signed in person adds one call against 60 a minute per person. No regulated data. The phone number is personal data of the landlord, which is why it is behind a sign in and out of the HTML.

**Configuration required**: none. It uses `API_URL`, `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SITE_URL`, which already exist.

**Where the code goes** (names are binding for the shared parts, free for the rest):

| Path | What |
|---|---|
| `src/lib/listing-path.ts` | `parseListingPath`, `listingPath`, `ListingPath` (pure, shared by the list, the page, the sitemap and later #14 and #15) |
| `src/lib/format.ts` | add `formatPhone` (lifted from `src/app/dev/ui/screens/sample-format.ts`) |
| `src/features/listing-detail/api/get-listing.ts` | `getListing(code)` wrapped in `cache()` |
| `src/features/listing-detail/api/listing-detail-query.ts` | the query key `["listing-detail", code]` and its options, reused by #14 for `isFavorite` |
| `src/features/listing-detail/text.ts` | `listingDescription` and the fixed copy |
| `src/features/listing-detail/json-ld.ts` | the breadcrumb data and the escaped string |
| `src/features/listing-detail/share-image.ts` | `shareImagePath(images)` |
| `src/features/listing-detail/components/listing-detail.tsx` | async server component: reads `params`, the listing, draws the zones, the JSON-LD and the client pieces |
| `src/features/listing-detail/components/listing-gallery.tsx` | client; the gallery (AC-6) |
| `src/features/listing-detail/components/listing-contact.tsx` | client; reads the session and the query, builds a `ContactView` |
| `src/features/listing-detail/components/contact-panel.tsx` | presentational; draws one `ContactView` (so `/dev/ui` can show every state) |
| `src/features/listing-detail/components/guest-view-counter.tsx`, `address-fix.tsx` | client; draw nothing |
| `src/features/listing-detail/components/listing-detail-skeleton.tsx` | the fallback of the static shell |
| `src/app/(public)/[slugCode]/page.tsx`, `not-found.tsx` | the page with `generateMetadata`, and the gone screen |
| `src/app/sitemap.ts`, `src/app/robots.ts` | new sitemap; one added line in robots |
| `src/features/listing-search/components/results.tsx` | pass `href` to `ListingCard` |
| `src/features/listing-search/components/listings-failure.tsx` | add an optional `title` prop, default unchanged |
| `src/app/dev/ui/listing-detail.tsx` | `ListingDetailSection`, mounted in `src/app/dev/ui/page.tsx` |

`ListingPhoto` (spec 0009) is not reused for the gallery: it crops to 16:9 and has an empty alt, and the gallery needs 4:3 uncropped, a real alt and a way to tell the gallery a photo failed. The gallery draws its own `next/image` and shares the `mediaUrl` rule and the "a failed photo disappears" rule.

**Critical test scenarios** (each maps to an acceptance criterion):
- Happy path as a guest: open a card from `/`, the address is `/<slug>-<code>`, the page shows the photos, price, facts, description and property, and the contact card has the sign in button and the register link. View source: no phone digits, a canonical link, the Open Graph tags and the JSON-LD, verifies **AC-1**, **AC-4**, **AC-5**, **AC-7**, **AC-14**, **AC-16**, **AC-18**.
- Signed in: sign in from the button, land back on the same listing, see the number as a call button a moment later. Reload hard: the number comes back with no second sign in. Sign out: the card goes back to the guest view, verifies **AC-7**, **AC-8**.
- Wrong slug: open `/wrong-words-<code>` and `/<code>`. The address bar becomes `/<right-slug>-<code>` with no reload and no extra history entry, verifies **AC-11**.
- Junk and gone: `/hello` and `/PHONG-K7M2XQ9P` show the gone screen with no API call. A hidden listing shows the same screen with `noindex` in the head, verifies **AC-3**, **AC-12**.
- Photos: a listing with 0, 1 and 5 photos. A swipe moves the slide, a thumbnail jumps to it, the counter follows. A photo that answers 404 leaves the gallery with no error, verifies **AC-6**.
- Failures: stop the API and reload, the page shows "Không mở được tin này" with a "Thử lại" button, and the button brings the page back once the API is up. A 429 shows the countdown. For a signed in person, a failed browser read shows the inline notice in the contact card and the rest of the page stays, verifies **AC-9**, **AC-13**.
- Guest view count: as a guest, the network tab shows one extra `GET /listings/<code>` and no visible effect, and `next dev` (StrictMode) still sends only one. As a signed in person, no extra guest read, verifies **AC-10**.
- Own listing: a landlord who opens their own visible listing sees "Đây là tin của bạn." and no call button, and no phone read is sent, verifies **AC-8**.
- Junk metadata: `/hello` has the title "Không tìm thấy tin" and `noindex` in the head, and the server log shows no API call, verifies **AC-3**, **AC-14**.
- No JavaScript: with scripts off, the content, the swipeable photos and the `noscript` sign in button work, verifies **AC-6**, **AC-7**.
- Search engines: `/sitemap.xml` lists the home page and every public listing and drops a hidden one at once. `/robots.txt` has the sitemap line. The share image address returns an image, verifies **AC-15**, **AC-17**.
- Phone: 320 and 390 px, no sideways scroll, controls 44 px high, the contact card right after the facts, verifies **AC-19**, **AC-20**.

## Build plan

Tracer Bullet (the project default, `AGENTS.md`): one thin real thread through every layer first (the address parser, the server read, a plain page, the card link, so a click from the list opens a real listing), then the full page, then the viewer layer, then the search engine side. Each milestone runs end to end.

1. **M1, the thin thread**: `src/lib/listing-path.ts` (`parseListingPath`, `listingPath`), `getListing` with `cache()`, and the route `src/app/(public)/[slugCode]/page.tsx` with `<Suspense>`, a minimal skeleton, and a plain view of the real listing (title, price, description). The junk check and `not-found.tsx`. Satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-12**.
2. **M1**: pass `href` from `Results` to `ListingCard`, so a click on the list opens the listing. Satisfies **AC-18**.
3. **M2, the full page**: `PageHeader` with the breadcrumb, the zones from the sample screen, `formatPhone` into `format.ts`, the two column layout, and the real `ListingDetailSkeleton`. Satisfies **AC-5**, **AC-19**, **AC-20** (layout).
4. **M2**: `ListingGallery` (placeholder, one photo, scroll snap, thumbnails, counter, failed photos, `sizes`, eager first photo). Satisfies **AC-6**.
5. **M2**: the read failure block with `ListingsFailure`, and its new optional `title` prop. Satisfies **AC-13**.
6. **M3, the viewer layer**: `ContactPanel` and `ListingContact` (session, query, the `ContactView` rule, the own listing card, `noscript`), and the failure notices with "Thử lại". Check in `next dev` with a guest, a tenant, a landlord and an admin. Satisfies **AC-7**, **AC-8**, **AC-9**.
7. **M3**: `GuestViewCounter` and `ListingAddressFix`. Satisfies **AC-10**, **AC-11**.
8. **M4, search engines**: `generateMetadata`, `listingDescription`, `shareImagePath`, the JSON-LD script. Satisfies **AC-14**, **AC-15**, **AC-16**.
9. **M4**: `src/app/sitemap.ts` (`await connection()` first, at most 20 pages, repeated codes skipped) and the `sitemap` line in `robots.ts`. Satisfies **AC-17**.
10. **M4, reference and polish**: the `/dev/ui` section `ListingDetailSection` with every gallery and contact state on fake data, any new contrast pair, a check at 320, 390 and 1280 px, the heading order and focus ring, a pass with scripts off, `npm run check`, `npm run build`, and a clean console on a valid, a wrong slug and a junk address. Satisfies **AC-20**.

## Consequences

**Positive**:
- Every listing is real HTML with its own title, description, canonical address, share card and sitemap entry, and no phone number in it.
- A hidden, locked or over quota listing leaves the page and the sitemap at once, because nothing is cached.
- The list and the detail are now one connected path, and the guest sign in and register links bring the person back to the same listing.
- The query `["listing-detail", code]` and `src/lib/listing-path.ts` are ready for #14 and #15 to reuse.
- Every failure of the main read and of the phone read has a plain Vietnamese message, and the rest of the page keeps working.

**Negative / tradeoffs**:
- Every visit costs one call on the shared 300 a minute limit, and every guest visit adds a second call from their own IP so the view is counted. A busy public demo can hit the shared limit. If it bites, add a short `use cache` to `getListing` (spec 0001), accepting that a hidden listing can then linger for that time.
- A gone listing answers 200 with `noindex` instead of a real 404, because the page streams. Search engines still drop it.
- The sitemap lists at most 1,000 listings (20 reads of 50). A larger catalogue needs `generateSitemaps`.
- The phone appears a moment after load for a signed in person, and not at all without JavaScript (the guest sign in button is shown in a `noscript` block, and the thumbnail buttons also need JavaScript, while the swipe does not).
- The share card for Zalo and Telegram is not tested. Their crawlers are not on Next's built in list of bots that wait for the page head, so they may see no tags until `htmlLimitedBots` is set after hosting is chosen.
- The share image address points to our own image optimizer, so a crawler needs our server to be reachable and the card only has a photo when the listing has one. A listing without a photo, and the list page, share text only.
- The gallery does not reuse `ListingPhoto`, so two photo components exist.
- The `/dev/ui` sample screen keeps its own copy of the detail page and can drift from the real one.
- The `views` number shown is the server's count at render time and lags this visitor's own view by one visit.
- Going back and forward remounts the page and sends another guest read. The backend counts one view per 30 minutes, so only the shared IP limit pays for it.

**Neutral**:
- Spec 0009 handed this feature the card link, the sitemap, the share cards and the gallery. This spec does the first three, and replaces "reuse `ListingPhoto`" with its own gallery, for the reasons above. It leaves the default share image deferred.
- `src/lib/AGENTS.md` does not mention `listing-path.ts`, and `src/components/AGENTS.md` does not list the card or the photo box yet. That is for `/sync` after this ships.
- The scope line #11 says fees and amenities are shown on this page. That later work lifts the fee and amenity zone from the sample screen into this page.

## Follow-up

- [ ] #11 adds the fees and amenities zone to this page (lift it from the sample screen), between "Nhà trọ" and the end of the left column.
- [ ] #14 adds the heart to the title row and reads `isFavorite` from the same query `["listing-detail", code]`, then ticks the heart off the invariants here.
- [ ] #15 links the landlord name on the contact card and on the card in the list.
- [ ] #13 adds the ward crumb as a link to the filtered list, and a third level to the JSON-LD breadcrumb.
- [ ] #33 (the map) can use `property.latitude` and `property.longitude`, which this page already receives. Since 2026-11-05 the backend checks new coordinates against the city boxes and the ward `bounds`, but a property saved before that date may still hold a point outside the city or far from its ward, and the read returns it as stored (contract 6.17). `bounds` exists only in the ward catalog (`GET /wards`), not in the `ward` inside a listing. So #33 must not trust the point blindly, and should decide there whether to check it against the catalog `bounds`.
- [ ] If the catalogue grows past 1,000 listings, split the sitemap with `generateSitemaps`. If crawlers spend the shared 300 a minute through the uncached sitemap, add a short `use cache` to it.
- [ ] `ListingPhoto` (spec 0009) uses `onError` only, so a card photo that failed before hydration may keep its box. The gallery checks `complete` and `naturalWidth` on mount (AC-6). Check whether the card needs the same.
- [ ] Zalo and Telegram link previews: when hosting is chosen (the Deferred line), test a pasted listing link and, if no card shows, set `htmlLimitedBots` to a copy of Next's default pattern plus the two names (setting it replaces the default list).
- [ ] The default share image for the list page and for listings without a photo stays on the Deferred list. It needs a designed picture, for example `src/app/opengraph-image.png`.
- [ ] Copy decision for the engineer: the gone screen reads "Không tìm thấy tin này / Địa chỉ có thể đã đổi hoặc không còn nữa." (the second line comes from `NotFoundState`), and the list page copy still does not name a city.
- [ ] When #15 needs `ListingsFailure` too, lift it from `src/features/listing-search/components/` to `src/components/states/`.
- [ ] After this ships, `/sync` updates `src/lib/AGENTS.md` (`listing-path.ts`, `formatPhone`), `src/components/AGENTS.md`, and ticks the #9 line in the follow up of spec 0009.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).
