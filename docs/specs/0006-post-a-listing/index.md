# 0006. Post and edit a listing form for the landlord area of the web frontend

**Date**: 2026-10-30
**Status**: In Progress

## Summary

This feature gives a landlord one form to post a room listing and to edit it later. The form has six fields (title, description, price, area, deposit and move in date) and, when posting, a picker for which property the room belongs to. It lives at two flat addresses under `/landlord/listings`. After posting, the page shows the new listing in place, with its public path as plain text. Editing sends only the fields that changed. It adds one new control, a calendar for the move in date, and no backend change, table or environment variable.

## Requirements

Seeded from scope item #7 and refined with the engineer. Contract with the backend: `api-for-frontend.md` sections 6.17, 6.18, 6.21, 6.22 and Appendix C. Contract for forms, states, shells and zones: specs 0002 to 0005. The code of #6 (`src/features/property`) is the pattern to follow.

**User stories**:
- As a landlord, I want to post a room under one of my properties, so that renters can find it at once.
- As a landlord with no property yet, I want to be led to create one first, so that I am never stuck on an empty form.
- As a landlord, I want to correct a listing after posting, even when an admin hid it, so that I can fix what is wrong.
- As a landlord, I want a mistake in a price or a date caught before I send, and a server message shown under the right field.
- As someone using a keyboard or a screen reader, I want labelled fields, a calendar I can drive with the keys, and announced errors.

**Acceptance criteria** (the contract; each is checkable on its own):
- **AC-1**: Pages and menu. Two pages in the `(landlord)` group, so the gate of spec 0005 already wraps them: `/landlord/listings/new` and `/landlord/listings/[id]/edit`. Both run in the browser only, have `robots` `noindex, nofollow`, the titles "Đăng tin mới" and "Sửa tin" through the title template, one `h1` (on the post page from `PageHeader`; on the edit page `EditListing` draws `PageHeader` itself, because the status label needs the loaded listing), and `export const instant = false` (the same reason as the `dev-check` pages). The side menu gets one item, "Đăng tin" (`/landlord/listings/new`, shown only when `can(state, 'listing:create')`), under "Thêm nhà trọ". No breadcrumb, and no link to `/landlord/listings`, until #12 ships that page.
- **AC-2**: Choose a property (post). The page reads `GET /properties?page=1&pageSize=50`. While it loads, `LoadingState` (form) shows. A failed read shows `ErrorState` with the backend message and "Thử lại". No property shows `EmptyState` "Bạn chưa có nhà trọ" with a button "Thêm nhà trọ" to `/landlord/properties/new`, and no form. One or more properties show the form with a "Nhà trọ" select (the names), and the `fullAddress` of the chosen property under it as help text. `?propertyId=<id>` preselects that property when it is in the list, and a missing, malformed or unknown value is ignored with no message. With exactly one property and no valid `propertyId`, that property is preselected. Only the 50 newest properties are offered (a known limit). The loading, error and empty states show only while the read has no data yet. Once the form is shown it stays mounted, so a later failed refetch never replaces typed text. The preselected property goes into the form's starting values and is never set after mount, so the form is not dirty before the person types. If a later read no longer lists the chosen property, the choice is cleared.
- **AC-3**: Fields and light checks (the backend stays the real validator, messages in Vietnamese). Title is trimmed, 5 to 120 characters. Description is trimmed, 10 to 5.000 characters, plain text. Price is digits only, 100.000 to 100.000.000. Area accepts `22,5` or `22.5` (one optional decimal digit, comma or dot, sent as a number with a dot), 1 to 1.000. Deposit is optional, digits only, 0 to 1.000.000.000, blank means none. The move in date is optional (AC-5). `propertyId` is required when posting.
- **AC-4**: Money preview. Under price and deposit, a line shows the typed digits as `vi-VN` money while the text is digits only ("3.500.000 ₫ mỗi tháng" under price, "3.500.000 ₫" under deposit). It is drawn under the input, its id is added to the input's `aria-describedby` after the one `FormField` gives, it is not a live region (so it is not announced on every key press), and it is hidden when the text is empty or not digits only. The input itself stays plain digits.
- **AC-5**: Move in date. The field is a `DatePicker` (shadcn `Calendar` in a `Popover`). The trigger button shows `dd/MM/yyyy` or the placeholder "Chọn ngày", with a visible label. The calendar is Vietnamese (month and weekday names, `labels` for the arrows), starts the week on Monday, offers month and year dropdowns, and allows January 1 of last year to December 31 three years ahead (the year taken in `Asia/Ho_Chi_Minh`). A "Bỏ chọn" button in the popover footer clears the value (it is disabled when there is no value). Picking a day closes the popover and returns focus to the trigger. The years are limited with `startMonth` and `endMonth`, not with a `disabled` matcher. The trigger takes the `ref` and `onBlur` of the form field, so focus on an error lands on it. Arrow keys move the day, Enter picks, Escape closes and returns focus to the trigger. The value is `YYYY-MM-DD` built from the calendar's local year, month and day, never through UTC, so it never moves a day. A date already saved outside the allowed range still shows in the trigger and is kept unless the person changes it.
- **AC-6**: Post. A valid form sends `POST /properties/:propertyId/listings` with the fields of AC-3 (a blank deposit and a blank date are left out). On 201 the form is replaced by a result zone in place: toast "Đã đăng tin", then the title (focus moves to it), the status label from `ListingStatusBadge`, `fullAddress`, the price (`formatMoney` plus " mỗi tháng"), the area (`formatArea`), and the public path `/<slug>-<code>` as plain text (no link, until #9). When `isPublic` is false, the status label carries its reason line (see Copy). Two buttons: "Đăng tin khác" (a blank form, the same property still chosen, and focus on the title input) and "Sửa tin này" (`/landlord/listings/<id>/edit`).
- **AC-7**: Post errors. 400 `VALIDATION_FAILED` puts each `errors[].field` message under its input and moves focus to the first one in screen order. A message for a field the form lacks becomes the form level message. `PROPERTY_NOT_FOUND` and `NOT_RESOURCE_OWNER` (post only) show the backend message as a form level message and read the property list again. The chosen property is cleared only when it is no longer in the fresh list, the form stays mounted, and the one property rule is not applied again. 403 `MEMBERSHIP_REQUIRED` and 403 `LISTING_QUOTA_REACHED` show the backend message as a form level message, keep everything typed, and trigger no retry. They go through `FailureNotice` like any form message (a plain alert, and nothing happens by itself), and the "Mua gói" button belongs to #17. 403 `PERMISSION_DENIED`, a 5xx (with the support code) and a network error show the message of `describeError` (the backend text for a 403, the standard text for a network error) with the form kept.
- **AC-8**: Open for edit. `/landlord/listings/[id]/edit` reads `GET /me/listings/:id`. While it loads, `LoadingState` (form) shows. The form is filled from the answer once: the first answer sets the starting values, and later refetches never touch the form (`refetchOnWindowFocus` and `refetchOnReconnect` are off). Price and deposit are digits, area has a comma (`22,5`), and the date comes from `availableFrom`. The property is shown as plain text (a description list with its name and `fullAddress`) at the top of the first zone, because it cannot change. The zones and the tips zone are the same as on the post page, and the form's field list has no `propertyId`. The page header carries the status label (the words are under Copy) in its `actions` and, as plain text, the public path `/<slug>-<code>` from the latest answer. A listing with `status` `hidden_by_admin` also shows a warning `Alert` with `moderationReason` and the line "Bạn vẫn sửa được tin này để khắc phục." States: 404 `LISTING_NOT_FOUND` and 400 `INVALID_ID` show `NotFoundState` "Không tìm thấy tin"; 403 `NOT_RESOURCE_OWNER` shows `ForbiddenState` "Bạn không có quyền sửa tin này"; any other failure shows `ErrorState` with "Thử lại". `NotFoundState` and `ForbiddenState` carry their own `h1`, so `EditListing` draws `PageHeader` in every other state and these two stand alone. `NotFoundState` keeps its default link back to `/` until #12 ships the list. `ForbiddenState` has no title prop, so its sentence goes in as `message` and its title stays as it is.
- **AC-9**: Save. The save sends `PATCH /listings/:id` with only the fields whose value differs from the last copy the server sent. A cleared deposit or date that had a value is sent as `null`, and a field blank before and now is left out. With nothing changed, no request is sent and the toast "Chưa có thay đổi nào" shows. On 200 the toast "Đã lưu tin" shows, the answer is written to the query cache and kept (in a ref) as the new server copy, the form is reset to it (so it is no longer dirty), and the status label and the public path text follow the answer (a new title gives a new slug). Errors follow AC-7 without the property handling, except that a 403 `NOT_RESOURCE_OWNER` on save shows `ForbiddenState` and a 404 `LISTING_NOT_FOUND` or 400 `INVALID_ID` shows `NotFoundState` (both replace the form). A listing hidden by an admin saves like any other.
- **AC-10**: Leave warning. While the form on either page is dirty (a value differs from the start), the browser's own confirmation shows on closing the tab or reloading (`beforeunload`). It is off when the form is not dirty, after a successful post or save, and when the page unmounts. Moving inside the site by a link is not guarded (a known limit). Typing `22.5` over a loaded `22,5` makes the form dirty although a save then finds no change (also a known limit).
- **AC-11**: Sending. While sending, the submit button is disabled with a spinner and `aria-busy`, so a second click sends nothing. A 429 shows `RateLimitNotice` with the countdown and keeps submit disabled until it ends. The fields stay editable while sending (as in #6).
- **AC-12**: Layout and accessibility baseline (WCAG AA). The form follows the zone map of spec 0004 ("Post listing"): two zones ("Thông tin chính", "Giá, diện tích và ngày vào ở"), a tips zone at the side from `xl`, and the notice and submit row under the zones. Every input has a visible label, the form has `noValidate` and `method="post"`, controls are 44 px (`lg`) and inputs type at 16 px, and the page works at 320 px with no sideways scroll. The first field with an error gets focus. The result zone and the status label use words, never colour alone.
- **AC-13**: Shared formatters. `src/lib/format.ts` gains `formatMoney`, `formatArea`, `formatDateOnly` and `formatDateTime` (the code of `sample-format.ts`, `vi-VN`, `Asia/Ho_Chi_Minh`), and the sample screens import them from there. `formatCount` and the other helpers of `sample-format.ts` stay in that file, which imports `formatMoney` from `src/lib/format.ts`.
- **AC-14**: Joined with #6. The result view of #6 gets a button "Đăng tin cho nhà trọ này" to `/landlord/listings/new?propertyId=<id>`, and both creates (property and listing) tell the query cache that the `["properties"]` data is out of date.
- **AC-15**: The new shared pieces follow the design system. `popover` and `calendar` come from the shadcn CLI, one at a time, and are edited as spec 0003 says ("Edits after adding shadcn files", listed below). Every new text or control colour pair is in `PAIRS` of `scripts/check-contrast.mjs`. `/dev/ui` shows the `DatePicker`, and the sample screen `/dev/ui/screens/post-listing` uses it instead of the native date input.
- **AC-16**: Clean build. `npm run check` and `npm run build` pass, with no hydration warning and no console error on both pages. No link to a page that does not exist is rendered.

## Decision

**Chosen option**: Option 1: One shared listing form in `src/features/listing`, post and edit on flat routes under `/landlord/listings`, the move in date by a shadcn date picker

Build one form that serves both pages. Posting adds a property select and a result view in place. Editing loads the listing, shows the property read only, and sends only what changed.

**Implementation skills**: `react-hook-form` (`pproenca/dot-skills`, `.agents/skills/react-hook-form/`) · `zod` (`pproenca/dot-skills`, `.agents/skills/zod/`) · `tanstack-query-best-practices` (`deckardger/tanstack-agent-skills`, `.agents/skills/tanstack-query-best-practices/`) · `shadcn` (`shadcn-ui/ui`, `.agents/skills/shadcn/`) · `tailwind-design-system` (`wshobson/agents`, `.agents/skills/tailwind-design-system/`) · `next-dev-loop` (`vercel/next.js`, `.agents/skills/next-dev-loop/`)

The Next.js docs in `node_modules/next/dist/docs/` win over these skills where they disagree (project rule in `AGENTS.md`). Read the pages on `useParams`, `useSearchParams` with `<Suspense>` (the project has `cacheComponents` on), and `instant` before writing. The engineer declined a search for skills and MCP servers for `react-day-picker` and `date-fns`.

## Feature design

**Data model and API surface**: no new table, endpoint or stored data. The types are in `src/lib/api/types.ts` already: `ListingBody`, `OwnerListingDetail`, `PropertyListItem` and `Page`.

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/properties?page=1&pageSize=50` | GET | none | `Page<PropertyListItem>` (`id`, `name`, `fullAddress`) | bearer, `property:read` | 403 `PERMISSION_DENIED` |
| `/properties/:propertyId/listings` | POST | `title`, `description`, `price`, `areaM2` (req), `deposit`, `availableFrom` (opt) | `OwnerListingDetail` (201) | bearer, `listing:create` | 400 `VALIDATION_FAILED`, 404 `PROPERTY_NOT_FOUND`, 403 `NOT_RESOURCE_OWNER`, `MEMBERSHIP_REQUIRED`, `LISTING_QUOTA_REACHED`, 429 |
| `/me/listings/:id` | GET | `id` in the path | `OwnerListingDetail` | bearer, `listing:read` | 400 `INVALID_ID`, 404 `LISTING_NOT_FOUND`, 403 `NOT_RESOURCE_OWNER` |
| `/listings/:id` | PATCH | any of the six fields (changed ones only) | `OwnerListingDetail` | bearer, `listing:update` | 400 `VALIDATION_FAILED`, 404, 403 `NOT_RESOURCE_OWNER`, 429 |

Every call goes through `useApi()` with the default `required` mode, and a `queryFn` passes its `signal`. Query keys: `["properties", "mine", { page: 1, pageSize: 50 }]` for the property list (the default `staleTime`, so a property made a minute ago is listed, and a paginated list in #12 gets its own entry) and `["listing", "mine", id]` for the edit page (`refetchOnWindowFocus` and `refetchOnReconnect` off, and the form seeded once, so a refetch never replaces typing). Mutations use `useMutation` and never retry.

### Scope of this spec

| In #7 | Left to another item |
|---|---|
| Post form, edit form, result view, `ListingStatusBadge`, `DatePicker`, formatters, menu item, button in #6 | The list of my listings, hide, show, delete, and the real landing after a save: #12 |
| Plain text public path in the result view | The public listing page and its link ("Xem tin"): #9. Showing in search: #8 |
| Backend messages for `MEMBERSHIP_REQUIRED` and `LISTING_QUOTA_REACHED` as a form message | The trial strip and the "Mua gói" button: #17 |
| `?propertyId=` and the first 50 properties | Photos: #10. Fees, amenities, coordinates: #11 |

### Files

```
src/
  app/(landlord)/landlord/listings/new/page.tsx        title, noindex, instant=false, <Suspense> (reads ?propertyId), renders NewListing
  app/(landlord)/landlord/listings/[id]/edit/page.tsx  title, noindex, instant=false, renders EditListing inside <Suspense> (it reads the id with useParams)
  features/listing/
    api/properties.ts            propertiesQuery (first 50)
    api/create-listing.ts        POST
    api/owner-listing.ts         ownerListingQuery, updateListing (PATCH)
    components/new-listing.tsx   loading, error, empty and form states, then the result
    components/edit-listing.tsx  load states, status label, admin notice, form
    components/listing-form.tsx  the fields and zones, shared by both
    components/listing-created.tsx   the result zone
    components/listing-status-badge.tsx   reused by #12
    hooks/use-leave-warning.ts   beforeunload while dirty
    schemas/listing-schema.ts    listingSchema, toListingBody, toListingPatch, fromOwnerListing
  components/
    form/date-picker.tsx         Popover plus Calendar, label, clear button
    ui/calendar.tsx, ui/popover.tsx   from shadcn, then edited
    shells/nav-config.ts         the "Đăng tin" item (lucide `FilePlus2`)
  lib/format.ts                  formatMoney, formatArea, formatDateOnly, formatDateTime
  features/property/components/property-created.tsx, property-form.tsx   button and cache note (AC-14)
  app/dev/ui/                    DatePicker section; screens/post-listing uses DatePicker and lib/format
scripts/check-contrast.mjs       any missing calendar pair
```

### Pages and states

- **Post page**: the session gate shows first (spec 0005). Then:

| State | Page shows |
|---|---|
| Property list pending | `LoadingState` (form) |
| Property list failed | `ErrorState` with the message and "Thử lại" |
| No property | `EmptyState` and the button to `/landlord/properties/new` |
| One or more | The form. A successful post replaces it with the result zone |

  The first three rows apply only while the read has no data yet. Once the list is loaded, the form stays mounted through any later refetch.

- **Edit page**: loading `LoadingState` (form), `NotFoundState`, `ForbiddenState` and `ErrorState` as in AC-8, otherwise the form. `EditListing` draws `PageHeader` itself in every state except `NotFoundState` and `ForbiddenState` (each has its own `h1`), so the page has one `h1`. Both pages stand on the workspace shell and have no breadcrumb.
- **Form model** (confirmed). The form holds text, and `listingSchema` turns it into the API's types:

| Field | In the form | Required | In the body |
|---|---|---|---|
| `propertyId` | UUID chosen from the list (post), read only (edit) | post only | the path `:propertyId`, never in the body |
| `title` | text, trimmed | yes | string, 5 to 120 |
| `description` | text, trimmed | yes | string, 10 to 5.000 |
| `price` | digits | yes | integer, 100.000 to 100.000.000 |
| `areaM2` | text, comma or dot | yes | number, 1 to 1.000, one decimal at most |
| `deposit` | digits or blank | no | integer 0 to 1.000.000.000, or `null` (edit) or left out (post) |
| `availableFrom` | `YYYY-MM-DD` or blank | no | the string, or `null` (edit) or left out (post) |

  `status`, `code`, `slug` and `propertyId` are never in a body (an extra field is a 400).
- **`DatePicker`** (`src/components/form/date-picker.tsx`): props `value: string` (`YYYY-MM-DD` or `""`), `onChange`, the `ref`, `onBlur`, `id` and `aria-*` of `FormField` (all on the trigger button), `placeholder`, `disabled`. It builds the string from `getFullYear`, `getMonth` and `getDate` of the picked day and reads a value back with `new Date(year, month - 1, day)`. It does not pass `timeZone`: with it the library reads picked dates as dates in that zone, and a `Date` built on a device in another zone could move by a day. Where the installed version has a `today` prop, pass today's day in `Asia/Ho_Chi_Minh` (year, month and day from `Intl.DateTimeFormat` parts); otherwise "today" follows the device.
- **Edits after adding shadcn files** (confirm each against the real file when adding it): remove `dark:hover:text-foreground` and any `dark:` class; replace the `ring-[3px] ring-ring/50` day focus by `FOCUS_RING`; replace `text-[0.8rem]` and any arbitrary size by a `--text-*` step; keep weights at 400, 500 and 600; day cells and arrows at least 40 px; give the arrows and dropdowns Vietnamese names through the `labels` prop ("Tháng trước", "Tháng sau", "Chọn tháng", "Chọn năm"); popover keeps `shadow-md` (menus may); check `PAIRS` for `muted-foreground` on `popover`, `foreground` on `muted` (today), `primary-foreground` on `primary` (picked day) and `ring` on `popover`, and add what is missing.
- **Result zone and edit header**: the status label comes from `ListingStatusBadge`, which owns its words (real code never imports from `/dev`) and uses the badge variants of the sample my listings screen (`success`, `warning`, `secondary`, `destructive`), with the words in Copy. A `visible` listing whose `isPublic` is false gets the label "Đang bị ẩn bớt khỏi khách" and one line of reason, because the backend does not say which of two causes it is (over the limit, or no trial and no plan) until #17 reads the membership.

### Copy (Vietnamese, decided here, `/develop` may polish the wording)

| Where | Text |
|---|---|
| Post page | `h1` "Đăng tin mới", description "Điền thông tin phòng cho thuê. Tin hiện ngay khi đăng, không có bước duyệt." |
| Edit page | `h1` "Sửa tin", description "Chỉ những ô bạn đổi sẽ được lưu." |
| Zones | "Thông tin chính" (property, title, description), "Giá, diện tích và ngày vào ở" |
| Fields | "Nhà trọ" (hint "Địa chỉ, phí và tiện ích lấy từ nhà trọ bạn chọn."), "Tiêu đề" (hint "Từ 5 đến 120 ký tự."), "Mô tả" (hint "Từ 10 đến 5.000 ký tự, văn bản thường."), "Giá thuê (đồng mỗi tháng)" (hint "Từ 100.000 đến 100.000.000."), "Diện tích (m²)" (hint "Tối đa một chữ số sau dấu phẩy."), "Tiền cọc (đồng)" (hint "Để trống nếu không thu cọc."), "Ngày vào ở" (hint "Để trống nếu có thể vào ở ngay.") |
| Buttons | Post: "Đăng tin", while sending "Đang đăng tin". Edit: "Lưu thay đổi", while sending "Đang lưu". Result: "Đăng tin khác", "Sửa tin này". Date: "Chọn ngày", "Bỏ chọn". #6: "Đăng tin cho nhà trọ này" |
| Messages | "Nhập tiêu đề.", "Tiêu đề cần từ 5 đến 120 ký tự.", "Nhập mô tả.", "Mô tả cần từ 10 đến 5.000 ký tự.", "Nhập giá thuê.", "Chỉ nhập chữ số, không dùng dấu chấm hay dấu phẩy.", "Giá thuê từ 100.000 đến 100.000.000 đồng.", "Nhập diện tích.", "Chỉ nhập số, tối đa một chữ số sau dấu phẩy, ví dụ 22,5.", "Diện tích từ 1 đến 1.000 m².", "Tiền cọc từ 0 đến 1.000.000.000 đồng.", "Chọn nhà trọ." |
| Status labels | "Đang hiện với khách", "Đang bị ẩn bớt khỏi khách" (reason line "Tin vẫn tính vào số tin đang hiện nhưng khách chưa thấy, vì vượt hạn mức hoặc hết dùng thử."), "Bạn đã ẩn", "Admin đã ẩn" (the badges of the sample my listings screen, except that the "not public" label names no cause) |
| States | "Bạn chưa có nhà trọ" (line "Hãy tạo nhà trọ trước, rồi đăng tin vào đó."), "Không tìm thấy tin", "Bạn không có quyền sửa tin này" |
| Toasts | "Đã đăng tin", "Đã lưu tin", "Chưa có thay đổi nào" |

Server messages (`VALIDATION_FAILED` fields, `MEMBERSHIP_REQUIRED`, `LISTING_QUOTA_REACHED` and the rest) come from the backend text unchanged.

### Value sourcing

| Action | Value produced or displayed | Source |
|---|---|---|
| Post | Path `:propertyId` | `id` of the chosen item of `GET /properties`, preset by `?propertyId` when valid and listed, or the only property (decided here) |
| Post | The property options and their help line | `items` of `GET /properties?page=1&pageSize=50`, and the chosen item's `fullAddress` |
| Post, edit | `title`, `description` | The typed text, trimmed |
| Post, edit | `price`, `deposit` | The typed digits as an integer, never a formatted string |
| Post, edit | `areaM2` | The typed text, comma turned into a dot, as a number |
| Post, edit | `availableFrom` | The picked day's local year, month and day as `YYYY-MM-DD`, never through UTC (decided here) |
| Post | Blank deposit or date in the body | Left out (decided here) |
| Edit | Which fields go in the PATCH | The parsed form value compared with the last server copy (a ref set at the first load and after each PATCH answer) |
| Edit | `null` for deposit or date | The field had a value in that copy and is blank now |
| Edit | The form's first values (set once, at the first load) | `GET /me/listings/:id`: `price` and `deposit` with `String(n)`, `areaM2` with `String(n)` and the dot turned into a comma, `availableFrom` as it came |
| Edit | Property name and address | `property.name` and `property.fullAddress` of the same answer |
| Edit | The status label and the admin reason | `status`, `isPublic` and `moderationReason` of the answer |
| Result | Title, `fullAddress`, price, area, status | The `OwnerListingDetail` of the 201, shown through `lib/format.ts` |
| Result | Price and area text | `formatMoney(price)` plus " mỗi tháng", and `formatArea(areaM2)` (decided here) |
| Result, edit header | Public path | `` `/${slug}-${code}` `` from the latest answer (the 201, then each GET or PATCH answer), as text (decided here) |
| Money preview | The line under price and deposit | The typed digits through `formatMoney` (`vi-VN`) |
| Date picker | The allowed years | The current year in `Asia/Ho_Chi_Minh` from the device clock, minus one to plus three |
| Date picker | Which day is "today" | The current day in `Asia/Ho_Chi_Minh` from `Intl.DateTimeFormat` parts, if the library has a `today` prop (decided here) |
| Date picker | The shown text | `formatDateOnly(value)`, which reads the string without a time zone shift |
| Menu | Is "Đăng tin" shown | `can(state, 'listing:create')` through `visible-nav-items` |
| Leave warning | Is the form dirty | React Hook Form's `formState.isDirty` |
| Errors | Field messages, form message, support code, 429 wait | `fieldErrors`, `describeError`, `RateLimitNotice` and `useCountdown` (spec 0002) |
| Page titles | "Đăng tin mới", "Sửa tin" | `metadata.title` under the title template |

### Key invariants

- The token stays in the session closure. Every call is made from the browser, behind the gate.
- The body never holds `propertyId`, `status`, `code` or `slug`. A PATCH holds only changed fields.
- `availableFrom` never goes through UTC, so a day never moves.
- A failed post or save keeps everything typed. The two quota errors are shown as messages, never retried.
- The public path is text until #9. No link to a page that does not exist is rendered.
- Listing text is rendered as text, never as HTML (spec 0001).
- Forms use `FormField`, `useFormFailure` and `FailureNotice`. No new error pattern.

### Edge cases and failure handling

| Case | Handling |
|---|---|
| Property deleted in another tab, then a post | `PROPERTY_NOT_FOUND` message, the list is read again, the choice is cleared only if it is gone from the fresh list, and the typed text stays |
| Property of someone else in the path (a hand made request) | `NOT_RESOURCE_OWNER` message, same handling |
| `?propertyId` is junk or not in the first 50 | Ignored, no message |
| Landlord has no `property:read` | The list read fails with 403, so `ErrorState` shows the backend message |
| Trial ended or limit reached | Form level backend message, form kept, no "Mua gói" until #17 |
| Double click on submit | Disabled while sending (a real second click sends nothing) |
| 429 | `RateLimitNotice` counts down, submit stays disabled |
| Network error or timeout | The standard message, the form stays, the person can retry |
| Session ends while the form is open | The gate of spec 0005 sends the person to `/login?next=...`, typed text is lost (accepted) |
| Edit of a listing hidden by an admin | Saves normally, the status label and the reason stay |
| Edit deleted in another tab, then a save | 404 `LISTING_NOT_FOUND`, `NotFoundState` |
| Loaded date outside the picker's years | Shown in the trigger and kept, the calendar opens at the nearest allowed month |
| Title changed on edit | The answer has a new `slug`, the public path text follows it |
| Save with nothing changed | Toast "Chưa có thay đổi nào", no request |
| Close or reload while dirty | The browser's confirmation. A link click inside the site is not guarded |
| More than 50 properties | Only the 50 newest are offered (known limit) |
| `useSearchParams` and Cache Components | Read inside `<Suspense>` with the form skeleton as fallback, confirmed with `npm run build` |
| Device in another time zone | The date text and the value come from calendar parts, so they do not shift. "Today" in the calendar follows `Asia/Ho_Chi_Minh` only if the installed library has a `today` prop |

### Security model

- Everything needs a landlord session: the gate (spec 0005), then the permissions `listing:create`, `listing:read`, `listing:update` and `property:read`. An admin or a seeker never reaches these pages (`ForbiddenState`). The backend decides ownership: someone else's property or listing answers 403 `NOT_RESOURCE_OWNER`.
- Pages hold personal business data (addresses, prices). Nothing is stored in the browser, and no regulated standard applies.
- `noindex, nofollow` on both pages. The backend limits posting and editing to 60 writes per hour (a 429 is shown with its countdown).

### Configuration required

No environment variable. Two new packages arrive with the shadcn `calendar` component: `react-day-picker` and `date-fns` (the registry item also pulls `button`, already installed). Install them through the shadcn CLI and keep the version npm resolves at build time. Check `npm view react-day-picker version` first, and whether the installed version has a `today` prop.

### Amendments to earlier specs

| Where | Was | Now |
|---|---|---|
| Spec 0003: "date picker waits for the item that needs it" (sample screen note) | Native date input in the sample | The sample uses `DatePicker`, and `calendar` and `popover` join the shadcn list |
| Spec 0003 and `sample-format.ts`: money, area and date helpers stay on the sample screens until the first feature that shows a price | Local to `/dev/ui/screens` | Move to `src/lib/format.ts` (AC-13). The rest (`formatPhone`, fees, labels, `foldAccents`) stays in `sample-format.ts` |
| Spec 0004 zone map "Post listing" | Sample only | Now the layout of the real page, without the breadcrumb (AC-1) |
| #6 result view (done) | Only "Thêm nhà trọ khác" | Also "Đăng tin cho nhà trọ này" (AC-14) |

### Critical test scenarios

- Happy path: sign in as a landlord with a property, open `/landlord/listings/new`, fill the six fields with a date from the calendar, post, see the result zone and the toast, and check `GET /listings` (curl, until #8 exists) lists it, verifies **AC-2**, **AC-3**, **AC-5**, **AC-6**.
- No property: a new landlord opens the page, sees the empty state, follows the button, creates a property, then uses "Đăng tin cho nhà trọ này" and lands on the form with that property chosen, verifies **AC-2**, **AC-14**.
- Light checks and previews: empty submit shows each message and focuses the title, `35000000` shows "35.000.000 ₫ mỗi tháng" (`formatMoney` puts a non breaking space before the sign, so a string check must allow it), `22,55` is rejected, `22,5` is accepted, verifies **AC-3**, **AC-4**, **AC-12**.
- Date: pick, clear, pick again with the keyboard only, check the body holds `YYYY-MM-DD` (Network tab), then change the system time zone and repeat, verifies **AC-5**.
- Server errors: a landlord at the limit gets the quota message with the form kept, a deleted property gives `PROPERTY_NOT_FOUND` and a refreshed list, 429 shows the countdown, a stopped backend shows the standard message, verifies **AC-7**, **AC-11**.
- Edit: open the listing, change only the price, check the PATCH body has only `price`, clear the deposit and check `null`, save with no change and see the toast with no request, verifies **AC-8**, **AC-9**.
- Hidden by admin: edit a listing an admin hid, see the reason, save, verifies **AC-8**, **AC-9**.
- Not mine and missing: open the edit address of another landlord's listing (403 state) and of a random UUID (404 state), verifies **AC-8**.
- Leave warning: type, then close the tab and reload (the browser asks), post, then reload (no ask), verifies **AC-10**.
- Keyboard and layout: Tab through both pages, drive the calendar with the keys, 320 px, one `h1`, verifies **AC-12**.
- Cleanup: `npm run check`, `npm run build`, console clean on both pages, verifies **AC-13**, **AC-15**, **AC-16**.

## Build plan

Tracer Bullet (your project default, tier Alpha): the first thread is a real listing posted against the real backend with the four required fields, then each milestone thickens it. Each milestone is one `/develop` pass. No Figma step: layout comes from `design.md`, spec 0004 and the sample screen.

**M1. Thin thread: post one listing for real**
1. Move `formatMoney`, `formatArea`, `formatDateOnly` and `formatDateTime` to `src/lib/format.ts` and make the sample screens import them, satisfies **AC-13**
2. Add `src/features/listing` with `listingSchema` (title, description, price, area), `propertiesQuery`, `createListing`, `ListingForm` (the property select, the first zone and the money and area fields), `NewListing` (loading, error, empty and form states), `ListingCreated`, `ListingStatusBadge`, the `/landlord/listings/new` page with its `<Suspense>` skeleton, and the "Đăng tin" menu item. Run it against the backend: post as a seeded landlord, see the result, check the listing in `GET /listings`, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-6**, **AC-7**, **AC-11**, **AC-12**

**M2. The whole form: money preview, deposit and the date picker**
3. Add `deposit` to the schema and the form, and the money preview lines, satisfies **AC-3**, **AC-4**
4. Add shadcn `popover` and `calendar` with the CLI (one at a time), apply the edits listed above, add the missing contrast pairs, build `DatePicker`, show it on `/dev/ui` and use it in the sample post listing screen, satisfies **AC-5**, **AC-15**
5. Add `availableFrom` to the schema, the form and the body, satisfies **AC-5**, **AC-6**

**M3. Edit**
6. Add `ownerListingQuery`, `updateListing`, `fromOwnerListing` and `toListingPatch`, `EditListing` (load states, the read only property, the admin notice, the save with the no change toast and the reset), the `/landlord/listings/[id]/edit` page, and "Sửa tin này" on the result view, satisfies **AC-6**, **AC-8**, **AC-9**

**M4. Join the threads and finish**
7. In #6 add the "Đăng tin cho nhà trọ này" button, and make both creates invalidate `["properties"]`. Add `useLeaveWarning` to both forms, satisfies **AC-10**, **AC-14**
8. Run `npm run check` and `npm run build`, check the console on both pages, then `/check verify` with the backend running, satisfies **AC-12**, **AC-16**

Every AC appears in at least one task and every task names an AC.

## Consequences

**Positive**:
- One form and one schema serve post and edit, so a rule changes in one place.
- The chain "create a property, then post into it" runs end to end, and #12 gets the form, the status label and the formatters ready.
- The date picker is a shared piece, and a day never moves because of a time zone.

**Negative / tradeoffs**:
- Two new packages (`react-day-picker`, `date-fns`) and two shadcn files to edit, with contrast pairs to add. A native date input would have cost none of that.
- The result view and the edit page have no way back to a list until #12, and the public path is only text until #9.
- Only the 50 newest properties are offered, and a link click inside the site is not guarded against losing typed text.
- A focus ring or colour in the calendar that the generator ships can break the contrast gate, which then blocks `npm run check` until fixed.
- The `isPublic` label cannot say why a listing is hidden from guests until #17 reads the membership.
- Typing `22.5` over a saved `22,5` makes the form dirty, so the leave warning can show although a save finds no change.

**Neutral**:
- `src/features/listing` is the second folder under `src/features`.
- The sample post listing screen stays as a design reference.
- No backend change, table or environment variable.

## Follow-up

- [ ] #8 and #9: check "the listing appears in search" and add the "Xem tin" link to the result view when the public page exists.
- [ ] #12: replace the result view's dead end by the list of my listings, add the breadcrumb, reuse `ListingStatusBadge`, and delete the `dev-check` fixture pages.
- [ ] #17: show the trial strip and a "Mua gói" button for `MEMBERSHIP_REQUIRED` and `LISTING_QUOTA_REACHED`, and the cause behind `isPublic: false`.
- [ ] #10: add the photo block to the edit page.
- [ ] `/sync`: record the declined skill search for `react-day-picker` and `date-fns` in the `Declined:` line of `AGENTS.md`, update the `format.ts` sentence in `src/lib/AGENTS.md` and the `sample-format.ts` sentence in `src/app/dev/AGENTS.md`, and add "listing and property forms follow `src/features/listing` and `src/features/property`" if wanted.
- [ ] If a landlord ever needs more than 50 properties in the picker, load every page (known limit).

## Rationale

Reasoning and options: see [rationale.md](rationale.md).
