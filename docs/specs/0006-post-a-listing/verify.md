# Verify: post a listing · spec 0006 · updated 2026-10-30

_Steps derived from spec 0006 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones. Needs the backend running and seeded. Test account made by `/develop` on the local database (see spec 0005): `claude.dev.landlord1@example.com`, password `Passw0rd!dev1`. Side effects of the M1 self check on that database: one property "Nhà trọ Hoa Hồng" (12 Lê Lợi, Phường An Đông) and one listing "Phòng đẹp có gác gần chợ Bến Thành" (code `uzsj2ftc`). Later milestones add their own steps under their own tag._

Self checked by `/develop` for M1 against the real backend on 2026-10-30: the empty state, the form with one property, the empty submit, the four bad values, a valid post with its result, "Đăng tin khác", the blocked post, the landlord menu, the tab title and single `h1`, 320 px with a clean console, the `curl`, `npm run check`, `npm run build` and the import search. Not run: the steps marked "not run", plus `22.5` as the area, the trimmed title and `meta[name=robots]`. The boxes stay open until `/check verify` runs them.

Self checked by `/develop` for M2 against the real backend on 2026-10-30: the `DatePicker` in `/dev/ui` (five states, keyboard flow, Escape, "Bỏ chọn", the 2019 date, the year list, 320 px, hover colours), the money previews and their `aria-describedby`, the deposit messages and focus, a post with deposit `0` and no date, a post with deposit 7000000 and a date picked by keyboard, the 403 `LISTING_QUOTA_REACHED` message with the form kept and no retry, 320 px on the post page with a clean console, the date helpers under four device time zones (Vietnam, Los Angeles, UTC+14, UTC), `toListingBody` on typed text, `npm run check` and `npm run build`. Not run: the system time zone change in a real browser, a screen reader pass, and the role checks of M1.

Side effects of the M2 self check on the local database: listing "Phòng thử có gác gần chợ" (code `3x3jh97r`, deposit 0, no date, hidden by the owner through `POST /listings/:id/hide` to free a slot) and listing "Phòng có ban công nhận ngày 15/11" (deposit 7000000, `availableFrom` 2026-11-15, visible). `claude.dev.landlord1@example.com` now holds two visible listings, the trial limit, so the next post answers 403 `LISTING_QUOTA_REACHED` until one is hidden or deleted.

Self checked by `/develop` for M3 against the real backend on 2026-10-31: the edit page for a visible listing (the six fields filled, the date `15/11/2026`, the property as plain text, the status label, the public path text, the tips zone, one `h1`, `noindex, nofollow`), a save with nothing changed (toast, no request), a price only save (`{"price":4300000}`), a title only save right after it (the price was not sent again, and the public path followed the new slug), a cleared deposit (`{"deposit":null}`, confirmed by `GET /me/listings/:id`), a save of area and deposit together (`{"areaM2":22.5,"deposit":5000000}`, the area field back to `22,5` afterwards), a bad title and price (two messages, focus on the title, no request), the not found state for a random UUID and for `not-a-uuid`, the not yours state for another landlord's listing, the error state with "Thử lại" and a working retry, a post followed by "Sửa tin này" into the edit form, 320 px with a clean console, the diff functions under node (`toListingPatch` and `fromOwnerListing` for ten cases), the post page after splitting `ListingForm` (same fields, preselected property, empty submit gives four messages and focus on the title, a real post with a four field body), `npm run check` and `npm run build`. Not run: the notice for a listing hidden by an admin (no admin account at hand, and a mocked `GET` is rejected by CORS because the test tool cannot add headers), the 403 and 404 answers to a save (they need a listing deleted or handed over in another tab), a `VALIDATION_FAILED` answer to a save, the 429 countdown, clearing the date in a real browser, a save of a listing with no deposit and no date, and a screen reader pass. The leave warning belongs to M4.

Side effects of the M3 self check on the local database: the listing `4qdbazm7` was edited several times (price, title, deposit) and put back through the API, so its values are the original ones, but its `updatedAt` moved. One restore sent through `curl -d` stored a damaged title (the Windows shell changed the Vietnamese letters); it was repaired by sending the body from a UTF8 file with `--data-binary @file`, and the slug is again `phong-co-ban-cong-nhan-ngay-15-11`. The listing `uzsj2ftc` was hidden and shown again, and one throwaway listing "Phòng thử sửa tin M3" (code `e4q6jgbr`) was posted, edited and deleted (soft delete). `claude.dev.landlord1@example.com` again holds two visible listings, the trial limit.

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

**M3: edit a listing** (test listings of `claude.dev.landlord1@example.com`: `4qdbazm7` is `01a18d9b-7d19-7a01-9382-a9497e447494`, visible, deposit 7000000, date 2026-11-15; `3x3jh97r` is `01a18d99-9b0e-7ed7-9150-c8c511aa19b2`, hidden by its owner, deposit 0, no date)

- [ ] Open `/landlord/listings/<id of 4qdbazm7>/edit` → the tab title is "Sửa tin", there is one `h1` "Sửa tin", `meta[name=robots]` says `noindex, nofollow`, a form skeleton shows while loading, then the form is filled: title, description, price `4200000`, area `25`, deposit `7000000` and the date trigger `15/11/2026` → AC-1, AC-8 (value sourcing: the form's first values, page titles)
- [ ] On the same page → the first zone starts with "Nhà trọ" as plain text (the name, then the address as the backend joined it), not a select, and the form has no property field → AC-8 (value sourcing: property name and address)
- [ ] The page header shows the status label "Đang hiện với khách" and the public path `/<slug>-<code>` as plain text (no link), and the tips zone sits at the side from `xl` → AC-8, AC-12 (value sourcing: status label, public path)
- [ ] Open `3x3jh97r` → the label "Bạn đã ẩn", the deposit field shows `0`, and the date trigger shows "Chọn ngày" → AC-8 (value sourcing: the form's first values, status label) (not run)
- [ ] Open a listing hidden by an admin → a warning notice "Admin đã ẩn tin này" with "Lý do:" and the backend reason as plain text (a `<b>` in the reason stays text), the line "Bạn vẫn sửa được tin này để khắc phục.", the label "Admin đã ẩn", and the form still saves → AC-8, AC-9 (value sourcing: status label and admin reason) (not run: needs an admin to hide a listing)
- [ ] Press "Lưu thay đổi" with nothing changed → the toast "Chưa có thay đổi nào" and no request in the Network tab → AC-9
- [ ] Change only the price and save → the PATCH body is exactly `{"price":…}` and the toast "Đã lưu tin" shows. Then change only the title and save → that body holds the title only, not the price again (the server copy moved on after the first save) → AC-9 (value sourcing: which fields go in the PATCH)
- [ ] After a save with a new title → the public path text in the header follows the new slug from the answer → AC-9 (value sourcing: public path)
- [ ] Type `22.5` over a loaded `22,5` and change nothing else, save → the toast "Chưa có thay đổi nào" and no request. After a real change the area field shows `22,5` again → AC-9, AC-8
- [ ] Clear the deposit and save → the body is `{"deposit":null}` and `GET /me/listings/:id` has `deposit` null. Clear the date with "Bỏ chọn" and save → `{"availableFrom":null}` → AC-9 (value sourcing: `null` for deposit or date) (the date part is not run in a browser)
- [ ] On a listing with no deposit and no date, change only the title and save → the body holds neither `deposit` nor `availableFrom` → AC-9 (value sourcing: blank before and now is left out) (not run in a browser)
- [ ] Set the title to `ab` and the price to `abc`, then save → both messages under their inputs, both `aria-invalid`, focus on the title, no request → AC-9, AC-7
- [ ] Make the backend answer 400 `VALIDATION_FAILED` to a save for a field of the form → the message shows under that input and focus moves there. A message for a field the form lacks shows as the form message → AC-9 (not run)
- [ ] Open `/landlord/listings/00000000-0000-4000-8000-000000000000/edit` and `/landlord/listings/not-a-uuid/edit` → both show "Không tìm thấy tin" as the one heading, with a link to `/` and no form → AC-8
- [ ] Open the edit address of another landlord's listing → "Bạn không có quyền truy cập" as the one heading, the sentence "Bạn không có quyền sửa tin này", no form → AC-8
- [ ] Delete the listing in another tab, then save → "Không tìm thấy tin" replaces the form. Hand a listing to another landlord in the database, then save → the not yours state replaces the form → AC-9 (not run)
- [ ] Block `GET **/me/listings/*` and open the edit page → the error state with the network message and "Thử lại", the header stays. Unblock and press "Thử lại" → the form loads → AC-8
- [ ] With the form shown, switch to another window and back, then go offline and online → the form is not refilled and typed text stays → AC-8 (not run)
- [ ] Post a listing and press "Sửa tin này" in the result → the link points to `/landlord/listings/<id>/edit` and the form shows that listing (area with a comma, blank deposit, "Chọn ngày") → AC-6, AC-8
- [ ] Press save more than the 60 writes an hour limit allows → `RateLimitNotice` with the countdown, save disabled until it ends → AC-11 (not run: 60 writes)
- [ ] At 320 px on the edit page → no sideways scroll, the console has no error and no hydration warning → AC-12, AC-16

## Commands

- [ ] `curl "http://localhost:3000/api/v1/listings?pageSize=50"` → the new listing is in `items` with `price` 3500000 (a number), `areaM2` 22.5, `deposit` null and `availableFrom` null → AC-6 (value sourcing: price and area as numbers, blank deposit and date left out)
- [ ] `npm run check` → lint, typecheck, format and contrast pass → AC-13, AC-16
- [ ] `npm run build` (API running) → passes, and `/landlord/listings/new` is listed as static (the Suspense boundary around `?propertyId=` works with Cache Components) → AC-1, AC-16
- [ ] Search `src/app/dev/ui/screens` for `from "../sample-format"` and `from "./sample-format"` → none of them imports `formatMoney`, `formatArea`, `formatDateOnly` or `formatDateTime`; they come from `@/lib/format` → AC-13
- [ ] `grep -rn 'type="date"' src` → nothing is found: no native date input is left → AC-15
- [ ] `npm run contrast -- --verbose` → `foreground` on `popover` is listed and passes, next to `muted-foreground`, `primary-foreground` on `primary`, `accent-foreground` on `accent` and `ring` on `popover`, the pairs of the calendar → AC-15
- [ ] `npm run check` and `npm run build` pass with M2 in place, and `/landlord/listings/new` is still listed as static → AC-1, AC-15, AC-16
- [ ] `npm run check` and `npm run build` pass with M3 in place, `/landlord/listings/[id]/edit` is listed as Partial Prerender (a static shell with the skeleton, so the `useParams` Suspense boundary works) and `/landlord/listings/new` is still static → AC-1, AC-16

## Acceptance-criteria coverage

Built and covered by M1: AC-1 (menu, page, titles) · AC-2 (property read, states, preselect) · AC-3 (title, description, price, area; deposit waits for M2) · AC-6 (post and result; "Sửa tin này" waits for M3) · AC-7 · AC-11 · AC-12 · AC-13 · AC-16 (partly, until M4 checks both pages).

Built and covered by M2: AC-3 (deposit and the move in date join the schema) · AC-4 (money preview) · AC-5 (the date picker) · AC-6 (deposit and `availableFrom` in the body, blank ones left out) · AC-15 (`popover` and `calendar` edited as spec 0003 says, the `foreground` on `popover` pair, `/dev/ui` section, sample screen) · AC-12 and AC-16 (320 px and console, still to be checked on both pages in M4).

Built and covered by M3: AC-6 ("Sửa tin này" on the result view) · AC-8 (load states, the property as plain text, status label and public path, the admin notice, not found and not yours, the retry) · AC-9 (a save of changed fields only, the no change toast, `null` for a cleared deposit or date, the form reset to the answer, the block states) · AC-1, AC-7, AC-11 and AC-12 on the edit page · AC-16 (partly, until M4 checks both pages). `ListingForm` was split into the shared form and two callers (`PostListingForm`, `EditListingForm`), so the M1 and M2 steps above also cover the refactor.

Not built yet, steps arrive with their milestone: AC-10, AC-14 (M4).
