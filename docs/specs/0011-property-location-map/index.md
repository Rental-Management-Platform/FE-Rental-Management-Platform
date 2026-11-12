# 0011. Property location map: pick where a property is on a map

**Date**: 2026-11-05, updated 2026-11-12 (the street field fills itself and a typed address reaches the map only through a button, no `/dev/ui` section, the ward boxes get their own query; see the Follow-up)
**Status**: In Progress

## Summary

A landlord can mark where a property is on a map while creating it. They click the map, drag the pin, type the address and let the pin jump there, or type the latitude and longitude. The address and the pin follow each other by what the landlord does: a click or a drag on the map changes the street field to that place, and a typed address reaches the map only when they press the button "Tìm vị trí trên bản đồ". The map stays closed behind a button, so the form stays light until someone wants it. The listing forms get a small read only map of the saved pin. It uses Leaflet with OpenStreetMap tiles and the public Nominatim address search, so there is no key, no account and no new setting. The backend only checks the pin it receives, so every rule is checked in the browser first.

## Requirements

Seeded from scope item #33 and refined with the engineer. Contract with the backend: `api-for-frontend.md` sections 6.15 (`GET /wards`, the `bounds` box of each ward) and 6.17 (the coordinate rules and the two coordinate errors). Patterns to follow: spec 0001 (stack, two data paths), spec 0003 and 0004 (components, zones, tokens), spec 0006 (the listing forms), spec 0010 (its Follow-up about old points).

**User stories**:
- As a landlord, I want to put a pin on a map for my property, so that the place is recorded exactly.
- As a landlord, I want to type my address and see the pin jump there, then fix it by dragging, so that I do not have to hunt for my street on the map.
- As a landlord, I want the street field to fill itself when I click or drag the pin, so that I do not have to type the street I just pointed at.
- As a landlord on a phone, I want to scroll the form without the map grabbing my finger.
- As a landlord who uses the keyboard or a screen reader, I want to set the pin by typing the latitude and longitude.
- As a landlord posting a listing, I want to see the saved pin of the property I chose, so that I can be sure it is right.

**Out of scope** (decided with the engineer, do not build): a map on the public listing page (#29 stays dropped), a "use my location" button, a list of address suggestions, more than one pin, drawing the ward outline from real borders, and the edit property form itself (that is #12).

**Acceptance criteria** (the contract; each is checkable on its own):
- **AC-1**: The zone. `PropertyForm` gets a third `Card` zone after "Địa chỉ", titled "Vị trí trên bản đồ" with the line "Không bắt buộc. Ghim vị trí nhà trọ trên bản đồ, hoặc bỏ qua bước này." It is a labelled group (`role="group"` and `aria-labelledby`, like the other two). It is closed by default and holds one disclosure button, "Chọn vị trí trên bản đồ" (`aria-expanded`, `aria-controls`), which reads "Thu gọn bản đồ" while open. With no ward chosen the button is disabled and the line "Chọn phường, xã hoặc đặc khu trước để mở bản đồ." is tied to it with `aria-describedby`. While the zone is closed, no request for Leaflet, its stylesheet or a tile is sent (the network tab shows none).
- **AC-2**: Loading on demand. Pressing the button runs a dynamic `import()` of the map module from the click handler (a Client Component, as the Next.js lazy loading guide shows for libraries), kept in a small hook with the states `idle`, `loading`, `ready` and `failed`. While `loading`, a skeleton of the same height as the map (20 rem on a phone, 25 rem from `md`) has `aria-busy` and the text "Đang tải bản đồ" for screen readers, so the page does not jump. On `failed`, the zone shows "Không tải được bản đồ" with "Bạn vẫn có thể nhập vĩ độ và kinh độ." and a "Thử lại" button, and the two number fields (AC-6) are shown anyway. The stylesheet `leaflet/dist/leaflet.css` is imported inside the lazy module, so it also loads only on demand. Closing and opening again does not download again.
- **AC-3**: The pin. `LocationMap` (react-leaflet, OpenStreetMap tiles `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, `maxZoom` 19) shows at most one marker. A click or tap on the map places the pin there, or moves it. The marker can be dragged with a mouse or one finger. The marker is a `divIcon` with an inline SVG (no image file, so the default icon path problem of bundlers cannot happen), drawn with the `primary` token and an outline in the `card` token. It has the title and alt "Ghim vị trí nhà trọ" and is reachable with Tab. Every change of the pin writes the two form fields (AC-6) at once. Double click zoom is turned off, so a double click never places a surprise pin.
- **AC-4**: The allowed area. A pin is allowed only inside the mainland box (latitude 10.2 to 11.7, longitude 106.2 to 107.7) or the Côn Đảo box (8.4 to 8.9, 105.9 to 106.9), and, when the chosen ward's catalog entry has `bounds`, also inside that raw box (edges count as inside). A click outside does not place or move the pin and says, in a polite live region under the map, "Chỉ ghim được trong {tên phường}." (or "Chỉ ghim được trong khu vực Thành phố Hồ Chí Minh." when the ward has `bounds: null`). A drag that ends outside puts the pin back where it was. The ward box is drawn on the map as a light outline (decorative, `aria-hidden`, not clickable) so the refusal makes sense. The checks are pure functions in `src/features/location-map/area.ts`. The 500 m margin the backend adds is not used, so a point the browser accepts is always accepted by the backend.
- **AC-5**: The opening view. With a pin: centred on it at zoom 17. With no pin and a ward with `bounds`: fitted to that box. With no pin and `bounds: null`: the city view (latitude 10.7769, longitude 106.7009, zoom 11). When the ward changes while the map is open, the view fits the new ward. Panning is never limited (no `maxBounds`), so the landlord can still look at the streets around the ward.
- **AC-6**: The number fields. Under the map, "Vĩ độ" and "Kinh độ" are two text inputs (`inputMode="decimal"`, `autoComplete="off"`, `size="lg"`) with the help text "Ví dụ 10.7721. Có thể dùng dấu chấm hoặc dấu phẩy." They show the pin with up to 6 decimals. Typing and then leaving a field (blur) or pressing Enter in it moves the pin when both fields hold a valid pair inside the allowed area; it never moves on a single keystroke. Enter in these two fields applies the pair and does not submit the form (the submit button does that). A comma is read as a dot. The checks give these messages on the field, marking both fields invalid together for the area messages (as the backend does): one filled and one empty "Nhập cả vĩ độ và kinh độ, hoặc để trống cả hai."; not a number "Vĩ độ phải là một số." and "Kinh độ phải là một số."; out of range "Vĩ độ từ -90 đến 90." and "Kinh độ từ -180 đến 180."; outside the city boxes "Điểm này nằm ngoài khu vực Thành phố Hồ Chí Minh."; outside the ward "Điểm này nằm ngoài {tên phường}. Hãy ghim trong phường đã chọn." A button "Xóa ghim" (enabled when either field has text or a pin exists) clears both fields and the marker.
- **AC-7**: What is sent. `toPropertyBody` adds `latitude` and `longitude` as numbers rounded to 6 decimals (about 0.1 m), and only when both fields hold a valid pair; with no pin both keys are left out of the create body. One coordinate is never sent alone. The area check runs again on the rounded numbers. The schema becomes a pure function of the ward list, `createPropertySchema(wards)`, because the ward box is data; the form builds its resolver from `wards.data`. A property saved with a pin returns the same `latitude` and `longitude` in the answer. For the edit form of #12: send the two numbers only when the person changed them, and send `null` for both to remove the pin.
- **AC-8**: Address to pin. Lookups run only while the map is open and a ward is chosen. The one trigger is the button "Tìm vị trí trên bản đồ" (changed 2026-11-12: a typed address no longer moves the pin by itself). Leaving the address field and opening the map never start a lookup, so typing an address changes nothing on the map until the button is pressed. The button is enabled only with a non empty address and the ward boxes read, and it may move a pin the landlord placed before, because they asked for it. One lookup is one `GET https://nominatim.openstreetmap.org/search` with `q` = "{addressText}, {tên phường}, {tên tỉnh}", `format=jsonv2`, `limit=5`, `countrycodes=vn`, `accept-language=vi`, and, when the ward has `bounds`, `viewbox` of that box with `bounded=1`. The first result whose point passes AC-4 becomes the pin (the map moves there at zoom 18, and "Đã ghim theo địa chỉ" is announced). No such result: the pin stays as it was and the text "Không tìm thấy địa chỉ này trong {tên phường}. Hãy bấm lên bản đồ để ghim." shows. Search is never run on a keystroke, never on a timer.
- **AC-9**: Pin to address. After a click or the end of a drag (not after typed numbers, a lookup result or opening the map), one `GET https://nominatim.openstreetmap.org/reverse` runs with `lat`, `lon`, `zoom=18`, `addressdetails=1`, `format=jsonv2`, `accept-language=vi`. The answer fills the field "Số nhà và tên đường" by itself (changed 2026-11-12, it was a hint with a button "Dùng địa chỉ này"), with `setValue(..., { shouldValidate: true, shouldDirty: true })`. The text is only the street part, built from `address.house_number` and `address.road` ("{số nhà} {tên đường}", or the road alone when the answer has no number), and it must be 5 to 200 characters. Wherever the landlord picks, the address becomes that place (changed 2026-11-12), replacing what the field held, with the house number when the answer has one and the road alone when it has none. Two cases leave the field alone: (1) no road in the answer, or a text shorter than 5 characters: nothing is filled, and under the map "Chưa có tên đường gần điểm này." shows. (2) The person edited the field while the request was running (its value now differs from the value when the click or drag happened): the answer is dropped and their text stays. After a fill, under the map "Địa chỉ đã đổi theo điểm ghim: {text}. Theo dữ liệu OpenStreetMap, có thể chưa đúng, hãy kiểm tra lại." shows in the polite live region, so the landlord is told the field changed. The fill is a write from code and starts no lookup. The landlord may edit the filled text freely; it never moves the pin, and the button "Tìm vị trí trên bản đồ" does. The ward is never changed. If a newer click arrives, the older request is aborted and its answer is ignored.
- **AC-10**: Changing the ward. When the ward changes while a pin exists and the pin is inside the new ward's allowed area, nothing happens. Otherwise the pin and both fields are cleared and the text "Đã bỏ ghim vì nằm ngoài {tên phường mới}. Hãy ghim lại." shows (and is announced) until the next pin. If the map is open, it fits the new ward. This holds with the map closed too (the form values are checked, the text shows in the zone). The ward is never changed by any lookup.
- **AC-11**: Backend coordinate errors. `COORDINATE_OUT_OF_AREA` and `COORDINATE_FAR_FROM_WARD` are added to `ERROR_CODES` in `src/lib/api/types.ts`. `latitude` and `longitude` join the `FIELDS` list of the form, so the two `errors` rows of the answer appear under the two number fields with the backend message, both fields invalid, focus on "Vĩ độ". If the zone is closed it opens first. The pin stays. The form can be corrected and sent again; nothing was saved by the failed call. `WARD_UNKNOWN` keeps working as it does now.
- **AC-12**: A saved point that is out of place. The picker takes its starting values from the form and the ward from the catalog. When the starting pin is outside the allowed area of the ward (a property saved before 2026-11-05 can hold one), it is drawn in the warning style, the text "Vị trí đã lưu nằm ngoài {tên phường}. Hãy ghim lại." shows, and the values are not changed or sent unless the person changes them (the edit form of #12 uses the form's dirty state for this). The create form never starts with a pin, so this state can only be seen once #12 wires the edit form; until then the pure check `checkPin` is its proof.
- **AC-13**: The listing forms. In the post form (`post-listing-form.tsx`, the chosen property from `PropertyListItem`) and in the edit form (`edit-listing-form.tsx`, `listing.property`), under the property, a property with both `latitude` and `longitude` not null gets a button "Xem vị trí trên bản đồ" (it reads "Thu gọn bản đồ" while open) that opens a read only map 15 rem high with the saved pin, loaded on demand like AC-2. The pin cannot be placed or dragged, there is no ward box, no number fields and no lookup, and the saved point is shown as stored with no area check. Zoom with the + and − buttons or the keyboard; the mouse wheel does not zoom. A property without a pin shows nothing. The map has the label "Vị trí nhà trọ trên bản đồ".
- **AC-14**: Failures that do not block saving. A lookup that fails (a 429, a 403, a 5xx, a timeout of 8 seconds, no network, an answer that does not match the schema) shows "Chưa tìm được địa chỉ lúc này. Bạn vẫn có thể bấm lên bản đồ." with "Thử lại" (for the reverse lookup: "Chưa lấy được địa chỉ gần điểm này."). Lookups use `useMutation`, so they never retry on their own. At most one lookup is in flight, a new one aborts the older, and two lookups start at least 1.1 seconds apart. When the first tiles fail to load (no `tileload` before three `tileerror` events), the zone shows "Không tải được hình bản đồ. Bạn vẫn có thể nhập vĩ độ và kinh độ." Placing a pin by number and saving still work in every one of these cases. Submitting the form aborts any lookup in flight.
- **AC-15**: Touch and motion. On a screen with a coarse pointer, one finger scrolls the page and two fingers move and zoom the map, while a tap still places the pin and one finger still drags the pin (the map's own one finger drag is off, touch zoom is on). The line "Dùng hai ngón tay để di chuyển bản đồ." shows there. The mouse wheel does not zoom the map (it scrolls the page); zoom is by the + and − buttons, pinch, or the keyboard. With `prefers-reduced-motion: reduce`, the zoom, fade and marker animations are off and moves use `setView` with no animation instead of `flyTo`.
- **AC-16**: Credit, privacy and the Referer. The OpenStreetMap credit "© OpenStreetMap contributors", linked to `https://www.openstreetmap.org/copyright`, is always visible in the map's attribution corner and never covered. Under the map: "Bản đồ và tìm địa chỉ do OpenStreetMap cung cấp. Địa chỉ bạn nhập và điểm bạn ghim được gửi tới OpenStreetMap khi bạn tìm." Calls to Nominatim are a plain `fetch` with `credentials: "omit"`, no `Authorization` header and no custom header (so no CORS preflight), and the site's `Referrer-Policy` stays `strict-origin-when-cross-origin`, because both OpenStreetMap policies need the page address as the Referer. The app's access token never leaves for any of these hosts.
- **AC-17**: Names and announcements. The map has `aria-label` "Bản đồ chọn vị trí nhà trọ". A visually hidden polite region announces "Đã ghim tại vĩ độ {x}, kinh độ {y}.", "Đã xóa ghim.", the refusals of AC-4, the results of AC-8 to AC-10 and the failures of AC-14. Controls inside the zone are `size="lg"`, and on a coarse pointer the zoom buttons are enlarged to 40 px. The focus ring on the map, the marker and the buttons comes from the project's focus ring (`FOCUS_RING`). Dragging is never the only way: the number fields (AC-6) and the click set the pin too.
- **AC-18**: Phone first and a clean build. Fine at 320 px with no sideways scroll; the two number fields stack on a phone and sit side by side from `sm`. Only semantic tokens are used, and any new text or control colour pair (the pin against its outline, the warning pin) is added to `PAIRS` in `scripts/check-contrast.mjs` in the same change. There is no `/dev/ui` section for this feature (changed 2026-11-12: the engineer decided new UI is written as the real form, not drawn on `/dev/ui` first). The states are checked on the real form, forcing each failure: a blocked host, an aborted route, a throttled network. The existing `/dev/ui` property form sample only keeps compiling (two empty coordinate fields in its samples and `createPropertySchema([])`). `npm run check` and `npm run build` pass, with no hydration warning and no console error, and no `any`.

## Decision

**Chosen option**: Option 1: Leaflet and react-leaflet loaded on demand, OpenStreetMap tiles, the public Nominatim search, all from the browser with no key

The property form gets an optional, closed by default map zone. The map module is downloaded only when the landlord presses the button. The pin is held inside the same rules the backend checks (the two city boxes and the ward's box), the address and the pin talk to each other through two user triggered Nominatim calls, and the number fields keep everything usable when the map or the search fails. A click or a drag changes the street field to the picked place by itself (changed 2026-11-12), except when the answer has no street or the landlord edited the field while it was on its way. A typed address reaches the map only through the button "Tìm vị trí trên bản đồ".

**Design source**: the existing `design.md` and the current property form (the scope header says Figma stopped at the end of M2 of #4; inferred, not asked).

**Implementation skills**: `react-hook-form` (`pproenca/dot-skills`, `.agents/skills/react-hook-form/`) · `zod` (`pproenca/dot-skills`, `.agents/skills/zod/`) · `tanstack-query-best-practices` (`deckardger/tanstack-agent-skills`, `.agents/skills/tanstack-query-best-practices/`) · `tailwind-design-system` (`wshobson/agents`, `.agents/skills/tailwind-design-system/`) · `shadcn` (`shadcn-ui/ui`, `.agents/skills/shadcn/`) · `next-dev-loop` (`vercel/next.js`, `.agents/skills/next-dev-loop/`)

The Next.js docs in `node_modules/next/dist/docs/` win over these skills where they disagree (project rule in `AGENTS.md`). Read `01-app/02-guides/lazy-loading.md` (the part "Loading External Libraries" and the note that `ssr: false` works only in Client Components) and the CSS pages before writing code. Three Leaflet skills were offered and declined (see Follow-up).

**New packages**: `leaflet@1.9.4`, `react-leaflet@5.0.0` (its peers are React `^19` and Leaflet `^1.9`, which this project meets), and `@types/leaflet` as a dev dependency (Leaflet ships no types).

## Feature design

**Data model sketch**: nothing is stored on the frontend and the backend changes nothing. The only new data is the ward box, which the catalog already sends.

```ts
// src/lib/api/types.ts (changed)
export interface WardBounds {
  minLatitude: number; maxLatitude: number;
  minLongitude: number; maxLongitude: number;
}
// The entry of GET /wards. The ward nested in a property or a listing has no bounds.
export interface CatalogWard extends Ward { bounds: WardBounds | null }
// ERROR_CODES gets "COORDINATE_OUT_OF_AREA" and "COORDINATE_FAR_FROM_WARD".
// Property and PropertyBody already carry latitude and longitude.

// src/features/location-map/pin.ts
export type Pin = { latitude: number; longitude: number }; // 6 decimals
export type PinSource = "click" | "drag" | "typed" | "lookup";

// PropertyInput (the form) gains two text fields; "" in both means no pin.
//   latitude: string;  longitude: string;
```

Relations: `CatalogWard` 1 to many `Property` (by `ward.code`), unchanged. The browser holds the pin only as the two form fields; `PinSource` and the lookup states are component state.

**Where the ward boxes come from (changed 2026-11-12, found while building)**: not from the shared `["wards"]` query. The home page seeds that entry from `getWards()`, which leaves `bounds` out on purpose (spec 0016, AC-10), and a seeded entry never goes stale, so a landlord who visited the home page first would find no boxes in it. The boxes come from their own query, `wardBoundsQuery` under the key `["wards", "bounds"]` (`useWardBounds`), which is read when the zone first opens and stays in the cache after that. `wardsQuery` stays typed `Ward[]`. When this read fails, no ward has a box: only the two city boxes are checked, and the backend still checks the ward.

**States** (browser only):
- Zone: `closed` goes to `loading` on the button, then `ready` or `failed`. `failed` goes to `loading` on "Thử lại". `ready` and `closed` swap on the toggle, and a pin and its fields survive both.
- Pin: `none` and `set(source)`. A click or drag sets `click` or `drag`, typing sets `typed`, a lookup sets `lookup`. "Xóa ghim", a refusal at a ward change, or an empty pair gives `none`. A click or a drag also changes the address field (AC-9); the other two only move the pin.
- Forward lookup: `idle`, `searching`, then `found`, `notFound` or `failed`. Reverse lookup: `idle`, `searching`, then `filled(text)`, `noRoad` or `failed`; an answer dropped because the person edited the field meanwhile ends in `idle` with no message. A newer start aborts an older one.

**API surface**:

| Endpoint | Method | Where | Key inputs | Key outputs used | Auth | Key errors |
|---|---|---|---|---|---|---|
| `/wards` | GET | browser (`useWardBounds`, key `["wards", "bounds"]`, read when the zone first opens) | none | `code`, `name`, `provinceName`, `bounds` | none | as today; a failed read leaves only the two city boxes |
| `/properties` | POST | browser (existing) | the form plus `latitude`, `longitude` (numbers, both or none) | the saved property | bearer | 400 `COORDINATE_OUT_OF_AREA`, 400 `COORDINATE_FAR_FROM_WARD` (two `errors` rows: `latitude`, `longitude`), 400 `WARD_UNKNOWN`, 429 |
| `/properties/:id` | PATCH | #12, not built here | `latitude`, `longitude` or `null`, `null` | the saved property | bearer | the same two codes; a ward change with the stored point failing |
| `https://nominatim.openstreetmap.org/search` | GET | browser, user triggered | `q`, `format`, `limit`, `countrycodes`, `accept-language`, `viewbox`, `bounded` | `lat`, `lon` (text), `display_name` | none | 429, 403, 5xx, timeout, network, a body that fails the schema |
| `https://nominatim.openstreetmap.org/reverse` | GET | browser, user triggered | `lat`, `lon`, `zoom`, `addressdetails`, `format`, `accept-language` | `address.house_number`, `address.road` | none | the same; a body without `address` means no result |
| `https://tile.openstreetmap.org/{z}/{x}/{y}.png` | GET | browser, by Leaflet | tile address | pictures | none | tile errors (AC-14) |

The answers of Nominatim are parsed with Zod; anything that does not fit is a failed lookup. Parameter names for `viewbox` and `bounded` are checked against the Nominatim documentation on the day of the build (task 6).

**Value sourcing** (every value names its source):

| Action | Value produced or displayed | Source |
|---|---|---|
| Open the zone | the ward entry with its box | `useWardBounds` data (`["wards", "bounds"]`), found by the form's `wardCode`; the name alone from `wardsQuery` while the boxes are on their way or failed |
| Check a point | the two city boxes | constants from contract 6.17 in `src/features/location-map/config.ts` |
| Check a point | the ward box | `CatalogWard.bounds`, raw, no margin |
| Open the map | the starting view | the pin if any, else the ward box, else the city view constants (AC-5) |
| Place a pin | the coordinates | the Leaflet event point, rounded to 6 decimals |
| Type numbers | the coordinates | the two fields, parsed with dot or comma |
| Search an address | the text | form `addressText`, plus `ward.name` and `ward.provinceName` of the catalog entry |
| Search an address | the area to prefer | the ward box as `viewbox`, with `bounded=1` |
| Click or drag | the street text | `address.house_number` and `address.road` of the reverse answer, 5 to 200 characters |
| Fill the address field | whether to write the text | the form value of `addressText` when the answer arrives, compared with its value when the click or drag happened (AC-9, case 2) |
| Fill the address field | the note under the map | the filled text, or the fixed sentence of AC-9 |
| Refusal texts | the ward name | the catalog entry, not the typed text |
| Send | `latitude`, `longitude` | the parsed fields, rounded, both or none |
| Backend errors | the message and the fields | `errors[]` and `message` of the `ApiError` through `useFormFailure` |
| Tiles | the address and credit | constants in `config.ts` |
| Listing forms | the saved pin | `property.latitude` and `property.longitude` of `PropertyListItem` (post) and `listing.property` (edit) |

**Key invariants**:
- One coordinate is never sent alone, and a pair is sent only after the browser check passed on the rounded numbers.
- The ward is always the landlord's choice. No lookup changes it.
- An answer never overwrites an address the landlord edited while the answer was on its way.
- Editing or leaving the address field never moves the pin and never starts a lookup. Only the button "Tìm vị trí trên bản đồ" does.
- A fill of the address field is a write from code. It starts no lookup, so a click cannot loop into a search and back.
- A lookup result is always shown on the map and in the fields before it can be saved, and it only moves the pin if it passes the allowed area.
- A saved point is never corrected or sent by the app on its own. Only the person changes it.
- Leaflet, its stylesheet and every tile stay unrequested until the person opens the map.
- At most one lookup is in flight, lookups start at least 1.1 seconds apart, and none runs on a keystroke or a timer.
- Nothing from the app's session (token, cookie) goes to any OpenStreetMap host.
- A failure of the map, the tiles or the search never blocks typing the numbers or saving the property.
- Submitting, closing the map or leaving the page aborts lookups in flight.

**Security model**: only a signed in landlord reaches the property form (route group and the `property:create` permission); the backend decides, and the hidden button is a convenience. No secret exists: no key, no account. The address a landlord types and the point they pin go to a third party (OpenStreetMap) only when they trigger a lookup, and the page says so (AC-16). The property address is the landlord's business place, shown to the public later; it is not tenant data. No regulated data.

**Configuration required**: none. No environment variable is added. The tile address, the credit text, the Nominatim address, the city boxes, the default view, the 1.1 second spacing and the 8 second timeout are constants in `src/features/location-map/config.ts`, so changing provider later touches that file and `api/nominatim.ts`.

**Where the code goes** (names are binding for the shared parts, free for the rest):

| Path | What |
|---|---|
| `package.json` | add `leaflet`, `react-leaflet`, `@types/leaflet` (dev) |
| `src/lib/api/types.ts` | `WardBounds`, `CatalogWard`, the two error codes |
| `src/features/location-map/config.ts` | constants listed above |
| `src/features/location-map/area.ts` | `CITY_BOXES`, `isInsideBox`, `allowedArea(wardBounds)`, `checkPin(pin, wardBounds)` (pure) |
| `src/features/location-map/pin.ts` | `Pin`, `PinSource`, `parseCoordinate`, `roundPin`, `formatCoordinate` (pure) |
| `src/features/location-map/api/nominatim.ts` | URL builders, Zod schemas, the two fetch functions with a `signal` and a timeout |
| `src/features/location-map/hooks/use-map-module.ts` | the `import()` state machine of AC-2 |
| `src/features/location-map/hooks/use-address-lookup.ts` | forward and reverse `useMutation`, pacing, abort |
| `src/features/property/components/location-field.tsx` | the zone: button, skeleton or map, number fields, notes (client). It lives with the property form because it needs the form's types (changed 2026-11-12) |
| `src/features/location-map/hooks/use-location-pin.ts` | the pin state of one zone: marker, source, notes, announcements, view moves, and the one place that writes the two fields |
| `src/features/location-map/fields.ts`, `texts.ts` | the pure checks of the two number fields and every sentence a rule produces |
| `src/features/location-map/components/location-map.tsx` | the Leaflet piece, default export, loaded by `import()` only |
| `src/features/location-map/components/read-only-location.tsx` | the button and read only map of the listing forms |
| `src/features/location-map/components/map-skeleton.tsx` | the fixed height skeleton |
| `src/features/property/schemas/property-schema.ts` | `createPropertySchema(wards)`, two text fields, `toPropertyBody` |
| `src/features/property/components/property-form.tsx` | the new zone, `FIELDS` with the two paths, ward change rule |
| `src/features/wards/api/wards-query.ts`, `src/features/wards/hooks/use-ward-bounds.ts` | `wardBoundsQuery` and `useWardBounds`: the list with the boxes under its own key. `wardsQuery` stays `Ward[]` (the old path `property/api/wards.ts` moved to `wards/` with #32) |
| `src/features/listing/components/post-listing-form.tsx`, `edit-listing-form.tsx` | `ReadOnlyLocation` under the property |
| `src/app/dev/ui/property-form.tsx`, `property-form-sample.ts` | only keep compiling: two empty coordinate fields in the samples and `createPropertySchema([])`. No new section (AC-18) |
| `scripts/check-contrast.mjs` | new pairs if the pin colours are not covered |

**Critical test scenarios** (each maps to an acceptance criterion):
- Happy path by clicking: choose a ward, open the map (it fits the ward), click a spot, see the two numbers fill, press "Tạo nhà trọ". The saved property returns the same numbers, verifies **AC-1**, **AC-3**, **AC-5**, **AC-6**, **AC-7**.
- Happy path by address: type "12 Lê Lợi", press "Tìm vị trí trên bản đồ", the pin jumps; drag it a little (the address changes to the dragged place); save, verifies **AC-8**, **AC-3**, **AC-7**.
- Address fill: click a spot, the address field changes to the nearest street and the note under the map says so, the ward stays, verifies **AC-9**. A spot whose answer has a road but no house number fills the road alone. Edit the field while the request runs (throttle the host to slow it): the answer is dropped and the edit stays, verifies **AC-9**.
- Typed address: with the map open, type an address and leave the field, nothing is sent and the pin does not move; open the map with an address typed and no pin, nothing is sent; press "Tìm vị trí trên bản đồ" and the pin jumps, verifies **AC-8**.
- Closed map: load the form, the network tab shows no Leaflet, stylesheet or tile request until the button is pressed; save a property with no pin and the body has no coordinates, verifies **AC-1**, **AC-2**, **AC-7**.
- Refusals: click far outside the ward, the pin does not move and the reason is announced. Drag out, it returns. Type a point in Hà Nội, the number message shows, verifies **AC-4**, **AC-6**.
- Ward change: pin in ward A, switch to ward B, the pin and numbers clear with the note. Switch to a neighbour that still contains the pin, it stays, verifies **AC-10**.
- Backend errors: force `COORDINATE_FAR_FROM_WARD` (a point just outside the padded box, or a mock), the two number fields show the backend message with focus on "Vĩ độ" and the zone opens if it was closed, verifies **AC-11**.
- Lookup failures: block `nominatim.openstreetmap.org` and click, the address fill shows its failure (the field keeps its text) and the property still saves; search by address shows the failure with "Thử lại", verifies **AC-14**.
- Tile failure: block `tile.openstreetmap.org`, the tile message shows and the numbers still work, verifies **AC-14**.
- Chunk failure: make the map module fail to load, "Không tải được bản đồ" shows with "Thử lại", verifies **AC-2**.
- Phone: at 320 and 390 px, one finger scrolls the page over the map, two fingers move it, a tap pins, the pin drags; no sideways scroll, verifies **AC-15**, **AC-18**.
- Keyboard: open the map with Enter, Tab to the number fields, type a pair, leave the field, the pin moves; Tab to "Xóa ghim", verifies **AC-6**, **AC-17**.
- Old point: once #12 wires the edit form, a saved point outside the ward shows the warning and is not changed, verifies **AC-12**. Until then `checkPin` on a point outside the ward box is the proof.
- Listing forms: post form with a property that has a pin shows "Xem vị trí trên bản đồ" and a read only map; with no pin shows nothing; edit form the same, verifies **AC-13**.
- Credit: the attribution corner shows the OpenStreetMap credit at every zoom, and the privacy line is under the map, verifies **AC-16**.

## Build plan

Tracer Bullet (the project default, `AGENTS.md`): first one thin real thread through every layer (the ward box, a map that opens on a button, a pin, two numbers, a real property saved with coordinates), then the two address lookups, then the rules and failure states, then the read only map and the reference page. Each milestone runs end to end. There is no migration: the backend does not change.

1. **M1, types and pure rules**: install `leaflet@1.9.4`, `react-leaflet@5.0.0`, `@types/leaflet`. Add `WardBounds`, `CatalogWard` and the two error codes; type `wardsQuery` as `CatalogWard[]`. Write `config.ts`, `area.ts` and `pin.ts` as pure functions. Satisfies **AC-4**, **AC-6**, **AC-11** (the codes).
2. **M1, schema and body**: `createPropertySchema(wards)` with the two text fields and all the messages of AC-6, `toPropertyBody` with rounding, the resolver rebuilt from `wards.data`, `FIELDS` with the two paths. Satisfies **AC-6**, **AC-7**.
3. **M1, the thin thread**: `use-map-module`, `map-skeleton`, `location-map` (tiles, click to place, drag, the ward box outline, the opening views), `location-field` with the button and ward gating and the number fields, mounted as the third zone of `PropertyForm`. Check that `leaflet/dist/leaflet.css` loads under the `"*.css"` Turbopack rule of `next.config.ts` (it sends every stylesheet through the Tailwind loader) and that its image references resolve; if it breaks, copy the needed rules into a project stylesheet. The ward boxes come from `useWardBounds`, read when the zone first opens. Save a real property with a pin in `next dev`. Satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**.
4. **M1, touch and credit**: the touch gesture setup, reduced motion, the wheel off, double click zoom off, the attribution and the privacy line, the `Referrer-Policy` kept. Verify on a phone sized screen that one finger scrolls the page and two fingers move the map, and fix the setup if Leaflet behaves differently. Satisfies **AC-15**, **AC-16**.
5. **M2, address to pin**: `api/nominatim.ts` (builders, schemas, fetch with timeout and `signal`, no credentials), `use-address-lookup` (forward `useMutation`, pacing, abort), the button "Tìm vị trí trên bản đồ" as the one trigger, the found and not found texts. Satisfies **AC-8**, **AC-14** (the lookup part).
6. **M2, pin to address**: the reverse lookup after a click or drag, the automatic fill of the street field (it replaces the address; nothing is filled when there is no road or when the person edited the field meanwhile), the note under the map, and the stale answer rule. On the day, check the parameter names against the Nominatim documentation and try five real Vietnamese addresses; note the result in `verify.md`. Satisfies **AC-9**.
7. **M3, ward change and backend errors**: the ward change rule with the note, the two backend codes landing on the number fields with the zone opening and focus on "Vĩ độ". Satisfies **AC-10**, **AC-11**.
8. **M3, failure states and access**: the tile failure message, the chunk failure with retry, the polite live region with every announcement, the target sizes, the focus rings, the saved point warning state. Satisfies **AC-12**, **AC-14**, **AC-17**.
9. **M4, listing forms**: `ReadOnlyLocation` in the post form and the edit form. Satisfies **AC-13**.
10. **M4, polish**: new contrast pairs, a check at 320, 390 and 1280 px, `npm run check`, `npm run build`, and a clean console. No `/dev/ui` section (AC-18). Satisfies **AC-18**.

## Consequences

**Positive**:
- A landlord can record the exact place with no key, no account and no cost, and the pin respects the same rules the backend enforces, so the two coordinate errors become rare.
- The form stays light: Leaflet, its stylesheet and the tiles load only for someone who opens the map.
- The map, the search and the tiles can all fail and the property still saves, because the number fields always work.
- `LocationMap` is a reusable piece: #12 uses it in the edit form, and a revived #29 can use it read only.
- Both OpenStreetMap policies are met by design: no search as you type, one lookup at a time, the credit shown, the Referer kept.

**Negative / tradeoffs**:
- OpenStreetMap tiles are best effort with no guarantee and can be blocked under heavy use, and the public Nominatim allows 1 request per second for the whole app. This suits a demo, not real traffic. Before real traffic, swap the tile source and the search provider (one `config.ts` and one `nominatim.ts`).
- House number and street data for Vietnam in OpenStreetMap can be thin, and new 2025 ward names may be missing, so a lookup can miss or place the pin on the street, not on the building. That is why the street text that fills the field is marked "có thể chưa đúng", never replaces a typed address with a street that has no number, and the landlord can always click or type.
- The ward `bounds` is a rough rectangle. A point in a corner that is not really in the ward is accepted, and a small ward is easy to leave by accident. The Côn Đảo box is mostly sea, so the map fits a wide view there.
- `react-leaflet` has the Hippocratic License 2.1, which is not an OSI open source license. Fine for coursework, but check it before any commercial use.
- Two extra number fields and several messages add length to the form, and the browser holds a copy of the area rules that the backend also holds. If the backend changes the boxes, the constants must change too.
- The map is one more thing to test on a real phone, because the gesture setup of AC-15 depends on how Leaflet handles touch.
- The public listing page still shows no map (#29 stays dropped), so the pin is only used by the landlord for now.

**Neutral**:
- No backend change and no new environment variable. `package.json` gains three packages.
- The scope index still says the one point map "is not in the contract and was dropped" (its "Điều đã chốt" list). That line is stale since the contract of 2026-11-05 and is for `/scope` or `/sync` to fix.
- `src/lib/api/types.ts` splits the ward type: the nested `Ward` has no `bounds`, the catalog entry `CatalogWard` has.
- `GET /wards` is read a second time (about 41 KB) when the zone first opens, because the shared `["wards"]` cache can be seeded without the boxes. A landlord who never opens the map never pays for it.
- Every click or drag on the map now costs one reverse lookup and can change the address field, so the public Nominatim limit of one request a second is reached faster than with a button. The 1.1 second spacing and the one in flight rule still hold, and a click that arrives while a lookup waits for its turn replaces it.
- #32 (the searchable ward picker) is not a dependency: this spec reads `wardCode` and the catalog entry, which any picker gives. #32 must keep giving both.

## Follow-up

- [ ] #12 wires the picker in the edit property form: start open when a pin exists, send coordinates only when changed, send `null` for both to remove the pin, and on a ward change send new coordinates inside the new ward or `null` for both (AC-7, AC-10, AC-12).
- [ ] #32 replaces the ward select: it must still give the form a `wardCode` and let the picker find the catalog entry with `bounds`.
- [ ] Spec 0010 left a question for #33: what to do with a stored point that may be outside the city or far from its ward. This spec answers it for the landlord side: the editable picker warns (AC-12) and the read only map shows the point as stored (AC-13). A revived #29 on the public page must decide for itself whether to check the point against the catalog box.
- [ ] Check the license of `react-leaflet` (Hippocratic License 2.1) is acceptable for this project.
- [ ] Before real traffic, replace the OpenStreetMap tiles and the public Nominatim with a provider whose terms allow it (MapTiler and Goong were weighed, see the rationale).
- [ ] Declined Agent Skills, for the `Declined:` line of the root `AGENTS.md` (owned by `/audit` and `/sync`): `zenobi-us/dotfiles@leaflet-mapping`, `agents-inc/skills@web-maps-leaflet`, `terminalskills/skills@leaflet`. No MCP server was searched for.
- [ ] The engineer decided on 2026-11-12 that new UI is no longer drawn on `/dev/ui` first. `src/app/dev/AGENTS.md` ("A feature that ships a page also adds a section to `ui/`") and other specs still ask for a `/dev/ui` section; this spec no longer does (AC-18). `/sync` fixes the context file, `/architect` the other specs.
- [ ] A click or drag while a lookup is waiting for its 1.1 second turn replaces it. Check on the day that the address does not flicker through an older street (the stale answer rule of AC-9 should cover it).
- [ ] After this ships, `/sync` adds the `location-map` feature to the context files (`src/lib/AGENTS.md` or a nested one) and fixes the stale line in the scope index.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).
