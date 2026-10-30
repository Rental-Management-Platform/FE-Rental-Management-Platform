# Verify: post a listing · spec 0006 · updated 2026-10-30

_Steps derived from spec 0006 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones. Needs the backend running and seeded. Test account made by `/develop` on the local database (see spec 0005): `claude.dev.landlord1@example.com`, password `Passw0rd!dev1`. Side effects of the M1 self check on that database: one property "Nhà trọ Hoa Hồng" (12 Lê Lợi, Phường An Đông) and one listing "Phòng đẹp có gác gần chợ Bến Thành" (code `uzsj2ftc`). Later milestones add their own steps under their own tag._

Self checked by `/develop` for M1 against the real backend on 2026-10-30: the empty state, the form with one property, the empty submit, the four bad values, a valid post with its result, "Đăng tin khác", the blocked post, the landlord menu, the tab title and single `h1`, 320 px with a clean console, the `curl`, `npm run check`, `npm run build` and the import search. Not run: the steps marked "not run", plus `22.5` as the area, the trimmed title and `meta[name=robots]`. The boxes stay open until `/check verify` runs them.

Self checked by `/develop` for M2 against the real backend on 2026-10-30: the `DatePicker` in `/dev/ui` (five states, keyboard flow, Escape, "Bỏ chọn", the 2019 date, the year list, 320 px, hover colours), the money previews and their `aria-describedby`, the deposit messages and focus, a post with deposit `0` and no date, a post with deposit 7000000 and a date picked by keyboard, the 403 `LISTING_QUOTA_REACHED` message with the form kept and no retry, 320 px on the post page with a clean console, the date helpers under four device time zones (Vietnam, Los Angeles, UTC+14, UTC), `toListingBody` on typed text, `npm run check` and `npm run build`. Not run: the system time zone change in a real browser, a screen reader pass, and the role checks of M1.

Side effects of the M2 self check on the local database: listing "Phòng thử có gác gần chợ" (code `3x3jh97r`, deposit 0, no date, hidden by the owner through `POST /listings/:id/hide` to free a slot) and listing "Phòng có ban công nhận ngày 15/11" (deposit 7000000, `availableFrom` 2026-11-15, visible). `claude.dev.landlord1@example.com` now holds two visible listings, the trial limit, so the next post answers 403 `LISTING_QUOTA_REACHED` until one is hidden or deleted.

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

**M2: the whole form**

- [ ] Open `/landlord/listings/new` → the second zone is titled "Giá, diện tích và ngày vào ở" and holds price, area, deposit and "Ngày vào ở" in a 2 by 2 grid (one column at 320 px) → AC-12
- [ ] Type `3500000` in price and `7000000` in deposit → "3.500.000 ₫ mỗi tháng" and "7.000.000 ₫" show under them. `3.500.000`, `abc` or a blank hides the line. The line's id is in `aria-describedby` after the help text id, it is not inside a live region, and the input keeps plain digits → AC-4 (value sourcing: money preview)
- [ ] Deposit `7.000.000` or `-5` and submit → "Chỉ nhập chữ số, không dùng dấu chấm hay dấu phẩy.". Deposit `2000000000` → "Tiền cọc từ 0 đến 1.000.000.000 đồng.". Focus lands on the deposit field → AC-3
- [ ] Post with deposit `0` and no date → `GET /listings` shows `deposit` 0 (not null). Post with deposit and date both blank → both stay null and the body holds neither → AC-3, AC-6 (value sourcing: blank deposit or date in the body)
- [ ] Tab to "Ngày vào ở" and press Enter → a Vietnamese calendar opens, the week starts on Monday, month and year dropdowns are there, the years run from last year to three years ahead, today (in Vietnam) is marked, and focus is on the selected day or today. Arrows move the day, Enter picks it, the popover closes and focus returns to the trigger, which shows `dd/MM/yyyy` → AC-5
- [ ] Press Escape in the open calendar → it closes and focus returns to the trigger. "Bỏ chọn" is disabled with no date, and with a date it clears the value, closes and returns focus. The arrows are named "Tháng trước" and "Tháng sau", the dropdowns "Chọn tháng" and "Chọn năm" → AC-5
- [ ] Open a listing form whose date is outside the allowed years (a saved 2019 date) → the trigger still shows it, the calendar opens at the nearest month it can show, and closing without a pick keeps the value. In `/dev/ui` the section "Chọn ngày" has this case → AC-5
- [ ] Pick 15/11/2026 and post → `GET /listings` has `availableFrom` "2026-11-15" and `deposit` 7000000 → AC-5, AC-6 (value sourcing: `availableFrom` from the local day, never UTC)
- [ ] Change the system time zone (for example to America/Los_Angeles) and repeat the pick → the value is still the day picked, and the "today" mark is the day in Vietnam → AC-5 (value sourcing: which day is today) (not run in a real browser)
- [ ] At 320 px open the calendar → no sideways scroll, the popover keeps an 8 px margin on both sides, day cells and arrows are at least 40 px → AC-5, AC-12
- [ ] Open `/dev/ui` → the section "Chọn ngày" shows five states (empty, chosen, outside the years, `aria-invalid`, disabled) with the value that would be sent. Open `/dev/ui/screens/post-listing` → its "Ngày vào ở" is the same picker, not a native date input → AC-15
- [ ] As a landlord at the limit, fill every field including a date and post → the backend message in the form alert, everything typed and the date kept, the submit enabled again, one request in the Network tab → AC-7

## Commands

- [ ] `curl "http://localhost:3000/api/v1/listings?pageSize=50"` → the new listing is in `items` with `price` 3500000 (a number), `areaM2` 22.5, `deposit` null and `availableFrom` null → AC-6 (value sourcing: price and area as numbers, blank deposit and date left out)
- [ ] `npm run check` → lint, typecheck, format and contrast pass → AC-13, AC-16
- [ ] `npm run build` (API running) → passes, and `/landlord/listings/new` is listed as static (the Suspense boundary around `?propertyId=` works with Cache Components) → AC-1, AC-16
- [ ] Search `src/app/dev/ui/screens` for `from "../sample-format"` and `from "./sample-format"` → none of them imports `formatMoney`, `formatArea`, `formatDateOnly` or `formatDateTime`; they come from `@/lib/format` → AC-13
- [ ] `grep -rn 'type="date"' src` → nothing is found: no native date input is left → AC-15
- [ ] `npm run contrast -- --verbose` → `foreground` on `popover` is listed and passes, next to `muted-foreground`, `primary-foreground` on `primary`, `accent-foreground` on `accent` and `ring` on `popover`, the pairs of the calendar → AC-15
- [ ] `npm run check` and `npm run build` pass with M2 in place, and `/landlord/listings/new` is still listed as static → AC-1, AC-15, AC-16

## Acceptance-criteria coverage

Built and covered by M1: AC-1 (menu, page, titles) · AC-2 (property read, states, preselect) · AC-3 (title, description, price, area; deposit waits for M2) · AC-6 (post and result; "Sửa tin này" waits for M3) · AC-7 · AC-11 · AC-12 · AC-13 · AC-16 (partly, until M4 checks both pages).

Built and covered by M2: AC-3 (deposit and the move in date join the schema) · AC-4 (money preview) · AC-5 (the date picker) · AC-6 (deposit and `availableFrom` in the body, blank ones left out) · AC-15 (`popover` and `calendar` edited as spec 0003 says, the `foreground` on `popover` pair, `/dev/ui` section, sample screen) · AC-12 and AC-16 (320 px and console, still to be checked on both pages in M4).

Not built yet, steps arrive with their milestone: AC-8, AC-9 (M3) · AC-10, AC-14 (M4) · AC-6 "Sửa tin này" (M3).
