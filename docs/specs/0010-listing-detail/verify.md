# Verify: listing detail · spec 0010 · updated 2026-11-05

_Steps derived from spec 0010 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones. A ticked step was run by `/develop` as a self check on 2026-11-05 (dev server, Edge through agent-browser, a seeded API); an empty box was not run yet._

Test data from the seeded API (`api-for-frontend.md`, demo accounts share one password): a listing with 5 photos `/phong-co-ban-cong-nhan-ngay-15-11-4qdbazm7`, one with 2 photos `/phong-thu-xoa-anh-m3-vmabetyp`, a listing of the landlord `khoa.tran@demo.example.com` `/can-ho-mini-hai-nguoi-o-thang-may-ham-xe-rong-8stw54dg`, and the tenant `lananh.nguyen@demo.example.com`. No seeded listing has 0 or 1 photo (the backend requires one), so those states are on `/dev/ui`.

## UI / manual

### The page, the address and the read (AC-1 to AC-5, AC-12, AC-13, AC-18)

- [x] Open a listing as a guest and view the source → the title, the price with "mỗi tháng", the address, the description and the property are in the HTML, and there is no phone number anywhere in it (`grep` for `0` plus nine digits) → AC-1, AC-4, AC-5
- [x] Open `/hello`, `/PHONG-VMABETYP` (capital letters) and a 250 character segment → the screen "Không tìm thấy tin này" with a button "Xem các tin khác", and `noindex` in the head → AC-3, AC-12
- [ ] Watch the API's own request log while opening `/hello` → no `GET /listings/hello` arrives (the junk check runs before the read) → AC-3
- [x] Open `/abcdefgh` (a valid looking code that has no listing) → the same not found screen → AC-12
- [x] Open `/<code>` with no slug → the page opens and the address bar becomes the canonical address → AC-2, AC-11
- [x] On `/`, the cards are links: each card's title links to `/<slug>-<code>` → AC-18
- [ ] On `/`, click the first card → `/<slug>-<code>` opens, and the back button returns to the list → AC-18
- [x] Stop the API and open a listing in a production build (`next start` with `API_URL` pointing at a closed port) → `h1` "Không mở được tin này" and a notice with "Thử lại"; `/sitemap.xml` answers 500 → AC-13, AC-17
- [ ] With the API running again, press "Thử lại" on that notice → the page comes back → AC-13
- [ ] Make the API answer 429 to the listing read (burst more than 300 reads a minute) → the notice shows the wait counting down and "Thử lại" is disabled until it ends → AC-13

### Photos (AC-6)

- [x] A listing with 5 photos: five thumbnails, the counter "Ảnh 1/5", the first photo loads at once, alt "<title>, ảnh 1 trên 5" → AC-6
- [x] Click thumbnail 3 → the slide scrolls to it (`scrollLeft` is two slide widths), the counter reads "Ảnh 3/5", `aria-current` follows → AC-6
- [x] Focus the photo area and press the right arrow → one slide moves and the counter follows; Tab walks the thumbnails with a visible ring → AC-6
- [x] Block one photo (`network route "**/_next/image**<uuid>**" --abort`) and reload → that photo leaves the slides and the strip, the counter reads "Ảnh 1/4", no error is shown → AC-6
- [x] Block every photo and reload → the whole photo section is gone, including its hidden heading, with no gap → AC-6
- [x] `/dev/ui`, section "Trang chi tiết tin: thư viện ảnh": 0 photos (placeholder and "Tin này chưa có ảnh."), 1 photo (no strip, no counter), 3, 5, one that fails, all fail → AC-6
- [ ] A listing whose photo path is not a public photo path is dropped by the server, not drawn → AC-6

### The contact card (AC-7 to AC-11)

- [x] As a guest: the button "Đăng nhập để xem số điện thoại" goes to `/login?next=<the listing path>`, the link "Chưa có tài khoản? Đăng ký" goes to `/register?next=…`, and the line "Số điện thoại của chủ trọ chỉ hiện với người đã đăng nhập." shows → AC-7
- [x] As a guest in `next dev`, the network tab shows exactly one browser `GET /listings/<code>` (React StrictMode does not send a second) → AC-10
- [x] The server HTML has a `noscript` block with the sign in button and link → AC-7
- [ ] With scripts off, the skeleton of the contact card is hidden (`noscript:hidden`) and only the sign in block shows → AC-7
- [ ] Open a listing with scripts turned off → the content, the swipeable photos and the sign in button inside `noscript` work → AC-6, AC-7
- [x] Sign in as the tenant from that button → back on the same listing, the number shows as a call button `tel:0974084225` reading "0974 084 225" with the line "Khi gọi, bạn hãy nói đã thấy tin này trên Mái Hiên." → AC-8
- [x] Reload while signed in → exactly one browser read of the listing (the phone read) and no guest read → AC-8, AC-10
- [x] As the landlord, open the landlord's own listing → "Đây là tin của bạn.", no call button, no sign in button, and no browser read at all → AC-8
- [x] As a landlord, open another landlord's listing → the number shows → AC-8
- [ ] As an admin, open a listing → the number shows → AC-8
- [x] Sign out from the account menu (open it with a real key) → the card goes back to the guest view and the number is not left anywhere on the page → AC-8
- [x] Signed in, block the browser read of `/listings/<code>` and reload → inside the card, "Không lấy được số điện thoại" with the network message and "Thử lại"; the rest of the page stays. Unblock and press "Thử lại" → the number shows → AC-9
- [x] `/dev/ui`, section "thẻ liên hệ": checking, guest, ready, own, no-phone ("Chưa lấy được số điện thoại."), gone ("Tin này vừa được ẩn hoặc xóa." with "Xem các tin khác"), 429 with the countdown, 500 with a support code → AC-7, AC-8, AC-9
- [ ] With a token that has just expired, open a listing → the session renews before the read, and the number is not `null` → AC-8
- [ ] Hide the listing from another tab between page load and sign in → the card shows "Tin này vừa được ẩn hoặc xóa." → AC-9
- [x] Open the wrong slug `/sai-slug-<code>?x=1#frag` → the address bar becomes `/<right-slug>-<code>?x=1#frag` with no reload → AC-11
- [x] Each navigation to a wrong address adds one history entry, and the fix adds none (the length grows by 1 per navigation, not 2) → AC-11

### Search engines and sharing (AC-14 to AC-17)

- [x] Page head of a listing: title "<title> | Mái Hiên", a description of at most 160 characters starting with the price, the area and the address, the canonical address, Open Graph (`website`, `vi_VN`, title, description, url, image), Twitter card `summary_large_image` → AC-14, AC-15
- [x] A wrong slug canonicalises to the right address (the canonical link is the same for `/sai-slug-<code>`) → AC-14
- [x] The listing with the longest description (591 characters): the meta description is 159 characters and ends with "…" → AC-14
- [x] `/hello` and `/abcdefgh` have the title "Không tìm thấy tin | Mái Hiên" and a `robots` tag with `noindex` → AC-14
- [ ] A listing that failed to read (API down) has the title "Tin cho thuê" and `noindex` → AC-14
- [x] The share image address answers 200 with an image (`/_next/image?url=…&w=1200&q=75`) → AC-15
- [ ] A listing with no photo has a card with text only (`summary`, no image tag) → AC-15
- [x] The JSON-LD is one `BreadcrumbList` with absolute addresses and no phone number → AC-16
- [ ] A listing title that contains `</script><b>` is written with `<` in the JSON-LD and cannot close the tag → AC-16
- [x] `/sitemap.xml` lists the home page and every public listing (37 addresses for 36 listings), with no `lastmod`, `changefreq` or `priority` → AC-17
- [ ] Hide a listing, fetch `/sitemap.xml` again → it is gone at once (nothing is cached) → AC-17
- [x] `/robots.txt` has the line `Sitemap: <site>/sitemap.xml` and keeps every old rule → AC-17
- [x] Link preview bots `facebookexternalhit`, `Twitterbot` and `TelegramBot` get the share tags inside `<head>`; the user agent `Zalo` does not (on the Deferred list until hosting is chosen) → AC-14

### Loading, phone and a clean build (AC-19, AC-20)

- [x] `/dev/ui`, section "khung chờ, lỗi và tin không còn": the skeleton has the 4:3 photo box, the title row, the facts zone and, from `lg`, the contact card on the right → AC-19
- [ ] Throttle the network and open a listing from the list → the skeleton shows first and the page does not jump when the content arrives → AC-19
- [x] At 320 and 390 px on a real listing and on `/dev/ui`: no sideways scroll → AC-20
- [x] At 390 px the order is photos, price and facts, contact, description, property; the thumbnails are 64 px high → AC-20
- [x] Heading order on a real listing: `h1`, then `h2` for "Ảnh của tin", "Giá và thông tin chính", the landlord name, "Mô tả" and "Nhà trọ" → AC-5, AC-20
- [x] The console is clean (no error and no hydration warning) on a valid address, a wrong slug address and a junk address, and on `/dev/ui` → AC-20

## Value sourcing (one step per row of the spec's table)

- [x] The code to read comes from `parseListingPath(params.slugCode)`: a wrong slug and a code only address both read the same listing → AC-2
- [x] The API address: the server read uses `API_URL`, the browser reads use `NEXT_PUBLIC_API_URL` (the closed port test above changes only the server) → AC-4
- [ ] The wait after a 429 comes from `Retry-After` (the countdown matches the header, not a guess) → AC-13
- [x] Title and address come from `listing.title` and `listing.fullAddress` → AC-5
- [x] Price, area and deposit use `formatMoney` and `formatArea`; a `null` deposit and a `null` move in date show "Chưa ghi" (the listing with `deposit: null`) → AC-5
- [ ] The move in date is shown as written: with the machine time zone set to `America/Los_Angeles`, `2026-11-15` still shows 15/11/2026 → AC-5
- [x] Views come from the server read (`formatCount(viewCount)`) → AC-5
- [x] Photo addresses and order come from `images` sorted by `position`, each through `mediaUrl` → AC-6
- [x] The first photo loads at once, the others lazily → AC-6
- [x] The counter "n/N" follows the active slide and the photos left after failures → AC-6
- [x] Landlord name falls back to "Chủ trọ" when it is `null` (the seeded test listing has no name); the posted date is `formatDateTime(createdAt)` → AC-7
- [ ] The posted date is a day in Vietnam: a listing created at 18:00 UTC shows the next day → AC-7
- [x] Who is looking comes from `useSession().status` (`loading`, `guest`, `user`) → AC-7, AC-8
- [x] Whether it is the viewer's own listing comes from `user.id` against `listing.landlord.id` → AC-8
- [x] The number and the call link come from `landlord.phone` of the browser read, shown by `formatPhone`, linked with the same digits → AC-8
- [x] The sign in and register addresses come from `authHref`, and on the right address `next` is the listing path → AC-7
- [ ] Open a wrong slug and read the sign in link before the address bar fix runs, then after: `next` is always the right slug, never the address bar → AC-7
- [x] The address bar fix target is `listingPath(listing.slug, listing.code)` → AC-11
- [x] Metadata title, description and canonical come from the answer; the share image is the lowest `position` photo through the optimizer → AC-14, AC-15
- [x] JSON-LD addresses are `NEXT_PUBLIC_SITE_URL` plus the canonical path → AC-16
- [x] The sitemap addresses come from `GET /listings?page=N&pageSize=50` → AC-17

## Commands

- [x] `npm run check` → lint, typecheck, format and contrast all pass (63 pairs) → AC-20
- [x] `npm run build` → compiles; `/[slugCode]` is partially prerendered, `/sitemap.xml` is dynamic, `/robots.txt` is static → AC-1, AC-17, AC-20

## Acceptance-criteria coverage

- AC-1 route and static shell: the source of a listing, the production build · AC-2 address: `/<code>` and wrong slug · AC-3 junk check: `/hello`, the API log (open) · AC-4 the read: no phone in the HTML, `API_URL` test · AC-5 content and heading order · AC-6 gallery: all photo steps and `/dev/ui` · AC-7 guest card: sign in links, `noscript` · AC-8 signed in card: tenant, landlord, own listing, sign out · AC-9 phone failures: blocked read, `/dev/ui`, the 404 and expired token steps (open) · AC-10 guest view count: one read in StrictMode, none when signed in · AC-11 slug fix: wrong slug, history · AC-12 gone: not found screens · AC-13 read failure: closed port test, the 429 step (open) · AC-14 metadata: head checks, bots · AC-15 share image: 200 image, no photo step (open) · AC-16 JSON-LD: breadcrumb, escape step (open) · AC-17 sitemap and robots · AC-18 card link: href check, click step (open) · AC-19 skeleton: `/dev/ui`, throttled step (open) · AC-20 phone, accessibility and build: 320 and 390 px, heading order, console, commands
