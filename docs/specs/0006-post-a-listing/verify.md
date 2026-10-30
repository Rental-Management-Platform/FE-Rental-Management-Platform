# Verify: post a listing · spec 0006 · updated 2026-10-30

_Steps derived from spec 0006 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones. Needs the backend running and seeded. Test account made by `/develop` on the local database (see spec 0005): `claude.dev.landlord1@example.com`, password `Passw0rd!dev1`. Side effects of the M1 self check on that database: one property "Nhà trọ Hoa Hồng" (12 Lê Lợi, Phường An Đông) and one listing "Phòng đẹp có gác gần chợ Bến Thành" (code `uzsj2ftc`). Later milestones add their own steps under their own tag._

Self checked by `/develop` for M1 against the real backend on 2026-10-30: the empty state, the form with one property, the empty submit, the four bad values, a valid post with its result, "Đăng tin khác", the blocked post, the landlord menu, the tab title and single `h1`, 320 px with a clean console, the `curl`, `npm run check`, `npm run build` and the import search. Not run: the steps marked "not run", plus `22.5` as the area, the trimmed title and `meta[name=robots]`. The boxes stay open until `/check verify` runs them.

## UI / manual

**M1: post a listing**

- [ ] As a landlord with no property open `/landlord/listings/new` → the state "Bạn chưa có nhà trọ" with a button "Thêm nhà trọ" to `/landlord/properties/new`, no form → AC-2
- [ ] Create a property, then use the menu item "Đăng tin" → the form shows, the only property is already chosen, its `fullAddress` is the help text under the select → AC-2 (value sourcing: only property, options and help line)
- [ ] With two properties open `/landlord/listings/new?propertyId=<id of the second>` → the second is chosen. Open it with `?propertyId=abc` and with a UUID that is not listed → ignored, no message, no property chosen → AC-2 (not run: needs a landlord with two properties)
- [ ] Choose the second property in the select, post → the result shows the second property's address, and `GET /me/listings/:id` has its `property.id` → AC-2, AC-6 (value sourcing: path `:propertyId`) (not run: same reason)
- [ ] Submit the empty form → "Nhập tiêu đề.", "Nhập mô tả.", "Nhập giá thuê." and "Nhập diện tích." under their fields, focus on "Tiêu đề" → AC-3, AC-12
- [ ] Type `abc`, `ngắn`, `3.500.000` and `22,55` → the four messages of the Copy table. Then `22,5` and `22.5` are both accepted for the area → AC-3
- [ ] Type `  Phòng thử  ` as the title (outer spaces) and post → the result title has no outer spaces → AC-3 (value sourcing: title and description trimmed)
- [ ] Post a valid listing (`3500000`, `22,5`) → while sending the button is disabled with a spinner and `aria-busy`, then the form is replaced in place by the result zone, the toast "Đã đăng tin" shows, focus is on the listing title, the label "Đang hiện với khách", the address as the backend joined it, "3.500.000 ₫ mỗi tháng", "22,5 m²", and the public path `/<slug>-<code>` as plain text (no link, no "Sửa tin này" yet) → AC-6, AC-11 (value sourcing: result values, price and area text, public path)
- [ ] Press "Đăng tin khác" → a blank form, the same property chosen, focus in "Tiêu đề" → AC-6
- [ ] Block `POST **/properties/*/listings` in the browser and submit → the standard network message in the form alert, everything typed kept, the submit button enabled again → AC-7, AC-11 (value sourcing: errors)
- [ ] As a landlord over the listing limit or with no trial and no plan, post → the backend message in the form alert, everything typed kept, no retry in the Network tab → AC-7 (not run: needs such a landlord)
- [ ] Delete the chosen property in another tab, then post → the backend message of `PROPERTY_NOT_FOUND`, the list is read again, the choice is cleared, the typed text stays → AC-7 (not run)
- [ ] Press submit more than the 60 writes an hour limit allows → `RateLimitNotice` with the countdown, submit disabled until it ends → AC-11 (not run: 60 writes)
- [ ] Sign in as a landlord → the side menu holds "Thêm nhà trọ" then "Đăng tin". Sign in as a tenant or an admin → no "Đăng tin" item → AC-1 (value sourcing: menu) (role check not run)
- [ ] On `/landlord/listings/new` → the tab title is "Đăng tin mới", the page has one `h1`, and `meta[name=robots]` says `noindex, nofollow` → AC-1 (value sourcing: page titles)
- [ ] At 320 px wide → no sideways scroll (`scrollWidth` equals `clientWidth`), labels visible, the console has no error and no hydration warning → AC-12, AC-16

## Commands

- [ ] `curl "http://localhost:3000/api/v1/listings?pageSize=50"` → the new listing is in `items` with `price` 3500000 (a number), `areaM2` 22.5, `deposit` null and `availableFrom` null → AC-6 (value sourcing: price and area as numbers, blank deposit and date left out)
- [ ] `npm run check` → lint, typecheck, format and contrast pass → AC-13, AC-16
- [ ] `npm run build` (API running) → passes, and `/landlord/listings/new` is listed as static (the Suspense boundary around `?propertyId=` works with Cache Components) → AC-1, AC-16
- [ ] Search `src/app/dev/ui/screens` for `from "../sample-format"` and `from "./sample-format"` → none of them imports `formatMoney`, `formatArea`, `formatDateOnly` or `formatDateTime`; they come from `@/lib/format` → AC-13

## Acceptance-criteria coverage

Built and covered by M1: AC-1 (menu, page, titles) · AC-2 (property read, states, preselect) · AC-3 (title, description, price, area; deposit waits for M2) · AC-6 (post and result; "Sửa tin này" waits for M3) · AC-7 · AC-11 · AC-12 · AC-13 · AC-16 (partly, until M4 checks both pages).

Not built yet, steps arrive with their milestone: AC-3 deposit, AC-4, AC-5, AC-15 (M2) · AC-8, AC-9 (M3) · AC-10, AC-14 (M4).
