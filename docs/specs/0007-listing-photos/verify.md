# Verify: listing photos · spec 0007 · updated 2026-11-02

_Steps derived from spec 0007 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones. This file holds the steps of M2 (the queue and its errors). Each later milestone appends its own._

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
