# Verify: listing photos · spec 0007 · updated 2026-11-02

_Steps derived from spec 0007 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones. This file holds the steps of M2 (the queue and its errors), M3 (delete, and photos that do not load) and M4 (the result view, the `/dev/ui` tiles and the clean build)._

_The dev backend gives access tokens that last 60 seconds, so a long manual run refreshes through the cookie on its own. Use a listing of a landlord who is not at quota, with free photo slots. Steps marked "self check passed" were run against the real backend on 2026-11-02 while building M2._

## UI / manual

- [ ] Sign in as a landlord, open `/landlord/listings/<id>/edit`, pick 3 PNGs at once → tiles read "Đang chờ" (with "Bỏ"), then "Đang tải", then three saved tiles, the first labelled "Ảnh bìa", the count "3 trên 5 ảnh", and `GET /me/listings/:id` lists 3 images at positions 0, 1, 2 in the order picked → AC-4 (value sourcing: upload body, token, photo order) (self check passed)
- [ ] Pick a PDF and a 6 MiB PNG together → both are listed under the button with their reason ("không phải ảnh JPEG, PNG hoặc WebP", "lớn hơn 5 MiB") and the Network tab shows no request to `/images` → AC-3 (value sourcing: type and size limits) (self check passed)
- [ ] With 4 photos saved, pick 3 files → the first fills the free slot and the other two are listed as skipped for lack of room, nothing extra is sent → AC-2, AC-3 (not run)
- [ ] Pick a text file renamed `x.png`, then a real PNG → the first tile reads "Không tải được" with the backend message and offers only "Bỏ"; the second photo uploads and the queue is not stopped → AC-7 (value sourcing: words of a failed tile) (self check passed)
- [ ] Pick a file that is over the backend limit (shrink `MAX_UPLOAD_BYTES` in the backend) → the tile shows the backend message plus "Hãy chọn ảnh nhỏ hơn." and only "Bỏ" → AC-7 (not run: needs a backend setting changed)
- [ ] Open the listing with 3 photos, add 2 photos from another tab (or `POST /listings/:id/images`), then pick 2 files here → the first fails with the backend message, the second reads "Chưa tải", both offer "Thử lại" and "Bỏ", and the tiles then show 5 saved photos → AC-8 (409 `LISTING_IMAGE_LIMIT`) (self check passed)
- [ ] After 60 uploads in one hour, pick files → `RateLimitNotice` shows at the top with its countdown, the unsent tiles read "Chưa tải", and "Thử lại" and "Thêm ảnh" stay disabled until it ends → AC-2, AC-8 (not run: needs 60 uploads, which locks the account for up to an hour)
- [ ] Delete the listing from another tab, then pick a file here → the page is replaced by "Không tìm thấy tin", the photo zone is gone and focus is on that state → AC-8 (404 `LISTING_NOT_FOUND`, `onBlocked`) (self check passed)
- [ ] Make the upload end in a 403 `PERMISSION_DENIED` (a tenant token) and in a 500 → that tile fails with the text (the support code only for the 500), later files read "Chưa tải", "Thử lại" and "Bỏ" show → AC-8 (not run: needs those answers)
- [ ] Block the upload request (DevTools, "Block request URL" on `/images`) and pick a file → the tile is not called failed until `GET /me/listings/:id` has run, then it reads "Không tải được" with the network message, "Thử lại" and "Bỏ"; unblock and "Thử lại" → one request, one saved photo, the server has one copy → AC-9 (self check passed)
- [ ] Add a photo from another tab, then block the upload request and pick a file → the tile becomes a saved tile and no failed tile appears; the server holds no duplicate → AC-9 (value sourcing: which image is the new one) (self check passed)
- [ ] Block both the upload and `GET /me/listings/:id`, pick a file, then click "Thử lại" while the read is still blocked → only the read goes out, never a POST; unblock both and "Thử lại" → the read, then the POST, one saved photo → AC-9 ("a retry never sends until that read has finished") (self check passed)
- [ ] Throttle the network so one upload passes 60 seconds → it ends as a timeout and is checked as above → AC-4, AC-9 (value sourcing: the 60 second limit) (not run: the same path was driven with a blocked request, not with a real slow upload)
- [ ] While a photo is waiting or on its way, close or reload the tab → the browser asks first; with nothing waiting it does not → AC-11 (self check passed, by a `beforeunload` event: guarded while active, not guarded when idle)
- [ ] Click "Thử lại" twice quickly on one failed tile → one request → AC-11 (not run)
- [ ] At 320 px: no sideways scroll, every button 44 px high; Tab through the zone with the keyboard; with a screen reader the progress ("Đang tải ảnh 2 trên 3", "Đã tải xong 3 ảnh") and each failure are read out → AC-14 (320 px and 44 px self check passed, the screen reader part not run)

## Commands

- [ ] `npm run check` → lint, typecheck, format and contrast pass → AC-15 (self check passed)
- [ ] `npm run build` → builds with the API running → AC-15 (self check passed)

## Acceptance-criteria coverage

- AC-2 … covered by step 3 and step 7 · AC-3 … steps 2, 3 · AC-4 … steps 1, 13 · AC-7 … steps 4, 5 · AC-8 … steps 6, 7, 8, 9 · AC-9 … steps 10, 11, 12, 13 · AC-11 … steps 14, 15 · AC-14 … step 16 · AC-15 … both commands.
- Not covered here (later milestones): AC-1 on the result view, AC-5 labels beyond the cover, AC-6, AC-10, AC-12 and the `/dev/ui` states of AC-15.

---

# M3: delete and photos that do not load · updated 2026-11-02

_Steps 1 to 11 below were run against the real backend on 2026-11-02 while building M3 (a throwaway landlord with one listing; a second "tab" was played by calls to the API). Keys were real key presses (`press Enter`, `press Tab`, `press Escape`) on a focused button._

## UI / manual

- [ ] Open `/landlord/listings/<id>/edit` of a listing with 2 or more photos → every saved tile has a delete button named "Xóa ảnh bìa" (the first) or "Xóa ảnh N", 44 px high; at 320 px there is no sideways scroll and the dialog of the next step fits the screen → AC-6, AC-14 (self check passed)
- [ ] Press the delete button of the cover → the dialog "Xóa ảnh này?" reads "Ảnh sẽ bị xóa khỏi tin và không khôi phục được. Đây là ảnh bìa, ảnh kế tiếp sẽ thành ảnh bìa." with "Giữ lại" focused; Escape or "Giữ lại" closes it, nothing is sent, and focus is back on that tile's delete button → AC-6 (value sourcing: is this photo the cover, the first in `position` order) (self check passed)
- [ ] Confirm the delete of the cover → the dialog closes, the toast "Đã xóa ảnh" shows, the tile leaves, the next photo is labelled "Ảnh bìa", the count drops by one, `GET /me/listings/:id` holds one photo fewer, and focus is on the delete button of the tile now at that place → AC-5, AC-6 (self check passed)
- [ ] Press the delete button of a photo that is not the cover → the dialog has only the first sentence, no cover line → AC-6 (self check passed)
- [ ] With 3 photos delete the middle one → focus goes to the delete button of the tile now in its place; delete the last tile of the row → focus goes to the tile before it → AC-6 (self check passed for the middle photo, and for the tile before through the 404 step)
- [ ] With exactly one saved photo → its delete button has `aria-disabled="true"` (not `disabled`), is in the tab order, looks off, and `aria-describedby` names the line "Tin cần giữ ít nhất 1 ảnh. Muốn thay ảnh này, hãy thêm ảnh mới trước rồi xóa ảnh cũ."; Enter on it opens no dialog; the cover line is not shown → AC-5, AC-6 (value sourcing: delete on or off from the saved count, which help line shows) (self check passed)
- [ ] Add a photo to that listing → two saved photos, both delete buttons are on, the line under the grid now reads "Muốn đổi ảnh bìa, hãy xóa ảnh bìa hiện tại: ảnh kế tiếp sẽ thành ảnh bìa." → AC-5, AC-6 (self check passed; note that the backend gave the new photo `position` 0, so it became the cover)
- [ ] With 2 photos open the dialog on one, delete the other photo from another tab (or `DELETE /listings/:id/images/:imageId`), then confirm → the dialog closes, a red `Alert` at the top of the zone shows the backend `message` (409 `LISTING_IMAGE_REQUIRED`), the zone reads the listing again so one tile is left with its delete button off, and focus is on the button that was pressed → AC-6 (self check passed)
- [ ] Open the dialog on a photo, delete the same photo from another tab, then confirm → the toast "Ảnh đã được xóa trước đó" shows, the tile leaves, no `Alert`, focus goes to a neighbour tile → AC-6 (404 `NOT_FOUND`) (self check passed)
- [ ] Block the delete request (`network route "**/listings/*/images/*" --abort`) and confirm a delete → the dialog closes, the `Alert` shows the network message, both tiles stay, focus is on the delete button that was pressed, and the server still holds both photos; the next pick of a file clears the `Alert` → AC-6 (self check passed)
- [ ] Block `**/_next/image**` and reload → each saved tile shows the framed placeholder (`role="img"`) with "Ảnh chỉ xem được khi tin đang công khai", no toast, and its delete button still works; then add a photo → its tile shows the local preview from the file just added → AC-10 (value sourcing: a local preview for a photo, the map of image `id` to preview) (self check passed; a really hidden listing was not used, because `next/image` keeps its optimized copy of a photo that was public once)
- [ ] While the delete request is in flight (throttle the network) → "Xóa ảnh" shows a spinner and "Đang xóa" and is off, "Giữ lại" is off, Escape and a click on the backdrop do not close the dialog, and a second click sends no second request; with a screen reader the dialog title and text are read, and the off delete button reads its reason → AC-6, AC-14 (not run: local calls finish in milliseconds and no screen reader was used)

## Commands

- [ ] `npm run check` → lint, typecheck, format and contrast pass → AC-15 (self check passed)

## Acceptance-criteria coverage

- AC-5 … steps 3, 6, 7 · AC-6 … steps 1 to 10 and 12 · AC-10 … step 11 · AC-14 … steps 1, 12 · AC-15 … the command above.
- Not covered here (M4): AC-1 on the result view, AC-8 on the result view, AC-10 on the result view, AC-12 beyond what loaded in these runs, and the `/dev/ui` tile states of AC-15. `npm run build` is run in M4.

---

# M4: the result view, the `/dev/ui` tiles and the clean build · updated 2026-11-02

_Steps 1 to 7 below were run against the real backend on 2026-11-02 while building M4 (a throwaway landlord, a throwaway property, PNG files made by a script; the "other tab" was a script that called `DELETE /listings/:id`). Each step ran in a fresh browser session with its console read at the end. Step 1 was not checked in the Network tab._

## UI / manual

- [ ] Open `/dev/ui` and scroll to the four sections "Ảnh của tin: …" → saved (three photos, and one photo with its delete button off), sending (queued, uploading, four failed variants), not loading (local copy, the words "Ảnh chỉ xem được khi tin đang công khai", `src` null) and picked in the post form (cover, rejected, sending); every state has words and none is told by colour alone; at 320 px there is no sideways scroll; no request goes to the API or to `/_next/image` (Network tab) → AC-14, AC-15 (self check passed for the look and the 320 px width; the Network tab was not read)
- [ ] Sign in as a landlord with a free slot and post a listing with 2 photos from `/landlord/listings/new` → under the result card the zone "Ảnh của tin" shows "2 trên 5 ảnh", the line "Ảnh được lưu ngay khi tải lên, bạn không cần bấm Lưu.", the first photo labelled "Ảnh bìa", both delete buttons on, and "Thêm ảnh" with its help line → AC-1, AC-5 (value sourcing: the listing id comes from the 201 answer; cover and order come from `position`) (self check passed)
- [ ] Post again with `network route "**/_next/image**" --abort` set before the post → the saved tiles show the photos chosen in the form (`blob:` addresses), the first one as the cover, matched by `position`, with no toast and no error; then add a third photo in the zone → its tile shows its own local preview → AC-10 (value sourcing: the starting previews come from the post form matched by `position`; a fallback preview is looked up by image id) (self check passed)
- [ ] Remove the block and press "Sửa tin này" → the edit page shows the same photos through `/_next/image`, each one loaded, with "3 trên 5 ảnh", and `GET /me/listings/:id` holds the same three ids at positions 0, 1, 2 → AC-1, AC-12 (self check passed)
- [ ] Post a listing with exactly one photo → its delete button has `aria-disabled="true"` and not `disabled`, stays in the tab order and is described by "Tin cần giữ ít nhất 1 ảnh. Muốn thay ảnh này, hãy thêm ảnh mới trước rồi xóa ảnh cũ."; the cover line is not shown → AC-5, AC-6 (value sourcing: delete on or off, and which help line shows, come from the saved count) (self check passed)
- [ ] On the result view of a listing, delete that listing from another tab (`DELETE /listings/:id`), then press "Thêm ảnh" and pick a file → the zone is replaced by a red `Alert` with the backend words ("Không tìm thấy tin đăng."), and no add button, file input or delete button is left → AC-8 (self check passed)
- [ ] Read the browser console on `/dev/ui`, on the result view and on the edit page → no error, no hydration warning and no issue badge of the Next dev tools → AC-15 (self check passed)

## Commands

- [ ] `npm run check` → lint, typecheck, format and contrast pass → AC-15 (self check passed)
- [ ] `npm run build` → compiles, typechecks and prerenders 24 pages with the API running → AC-15 (self check passed)

## Acceptance-criteria coverage

- AC-1 … steps 2, 4 · AC-5 … steps 2, 5 · AC-6 … step 5 · AC-8 … step 6 · AC-10 … step 3 · AC-12 … step 4 · AC-14 … step 1 · AC-15 … steps 1, 7 and both commands.
- Not run in M4: a real hidden listing on the result view (the optimizer block stood in for it, because `next/image` keeps its copy of a photo that was public once), and a screen reader on the new `/dev/ui` sections.
