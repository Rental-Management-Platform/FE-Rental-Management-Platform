# 0007. Photo block for listings in the landlord area of the web frontend

**Date**: 2026-11-02
**Status**: Proposed

## Summary

This feature lets a landlord add and remove up to five photos on a listing. One photo zone appears under the result view right after posting and again on the edit page, and it saves each photo the moment it is uploaded, apart from the form's own Save button. The landlord can pick several files at once, and the page sends them one at a time because the backend takes one file per request. It adds one small client option (a longer time limit for uploads), and no backend change, table, package or environment variable. The cover photo on cards and the gallery on the detail page stay with #8 and #9.

## Requirements

Seeded from scope item #10 and refined with the engineer. Contract with the backend: `api-for-frontend.md` sections 6.21, 6.28, 7 (step 8), 8 and Appendix C. Pattern to follow: spec 0006 (`src/features/listing`). Spec 0006 left "Photos: #10" out of its scope and listed "#10: add the photo block to the edit page" as follow up; this spec closes it.

**User stories**:
- As a landlord who just posted a listing, I want to add photos right away, so that renters see the room and not an empty frame.
- As a landlord, I want to pick several photos at once and see each one's progress, so that I do not open the file dialog five times.
- As a landlord, I want to remove a wrong photo, and to know that removing the cover makes the next photo the cover.
- As a landlord on a weak connection, I want a photo that timed out to be checked before it is sent again, so that I never get the same photo twice.
- As a landlord whose listing is hidden, I want to manage its photos anyway, and to understand why I cannot see some of them.
- As someone using a keyboard or a screen reader, I want labelled controls, and progress and errors announced.

**Acceptance criteria** (the contract; each is checkable on its own):
- **AC-1**: Where the zone lives. `ListingPhotos` is one `Card` zone titled "Ảnh của tin" (spec 0004), outside the `<form>` element. It shows (a) under `ListingCreated` after a successful post and (b) on `/landlord/listings/[id]/edit` once the listing is loaded. It reads the saved photos from the query entry `["listing","mine",id]`; the post page writes the 201 answer into that entry before it shows the zone. It works in every status, including `hidden_by_admin`, and the trial and quota never block it. A line under the title says "Ảnh được lưu ngay khi tải lên, bạn không cần bấm Lưu." The zone is never part of the form's dirty state. After a post, a short line invites the landlord to add photos; nothing forces it.
- **AC-2**: Picking. A button "Thêm ảnh" (size `lg`, `outline`) opens a visually hidden file input that stays in the DOM (`multiple`, `accept="image/jpeg,image/png,image/webp"`). Free slots are 5 minus the saved photos minus the items that are queued or uploading. The first files in the picked order fill the free slots and the rest are skipped (AC-3). The input value is reset after each pick, so the same file can be picked again. Under the button a help line says "JPEG, PNG hoặc WebP, mỗi ảnh tối đa 5 MiB, tối đa 5 ảnh. Ảnh được giữ nguyên thông tin kèm theo, như vị trí chụp nếu máy có ghi." When 5 photos are saved the button is replaced by "Đã đủ 5 ảnh. Hãy xóa bớt một ảnh trước nếu muốn thêm." While a 429 countdown runs the button is disabled.
- **AC-3**: Checks before sending. A file passes when its `type` is `image/jpeg`, `image/png` or `image/webp` (an empty `type` passes, because the backend judges by content), and its `size` is above 0 and at most 5 MiB (5242880 bytes, the backend default). Each skipped file is listed with its name and the reason (type, size, or no free slot) in one message under the button, inside a polite live region. Nothing is sent for a skipped file. The 5 MiB is a hint: if the backend limit differs, its `message` is shown (AC-7).
- **AC-4**: Upload. Items are sent one at a time in the picked order. Each sends `POST /listings/:id/images` as `multipart/form-data` with one field `file`, through the client's `FormData` path (no manual `Content-Type`), with a 60 second limit for this call only (AC-13). Each item is a tile with a local preview and the words "Đang chờ" or "Đang tải". On 201 the new image is added to `images` in the query entry, sorted by `position`, and the tile becomes a saved tile. The local preview is kept under the image `id` as a fallback (AC-10).
- **AC-5**: Saved tiles and cover. Saved tiles are in `position` order. The first carries the label "Ảnh bìa", the others "Ảnh 2", "Ảnh 3" and so on. The zone header shows "N trên 5 ảnh". A help line says "Muốn đổi ảnh bìa, hãy xóa ảnh bìa hiện tại: ảnh kế tiếp sẽ thành ảnh bìa." because the backend has no reorder.
- **AC-6**: Delete. Each saved tile has an icon button with `aria-label` "Xóa ảnh N" (the cover: "Xóa ảnh bìa"). It opens an `AlertDialog` titled "Xóa ảnh này?" with the line "Ảnh sẽ bị xóa khỏi tin và không khôi phục được." and, for the cover, "Đây là ảnh bìa, ảnh kế tiếp sẽ thành ảnh bìa." On confirm it sends `DELETE /listings/:id/images/:imageId`; the confirm button shows a spinner and is disabled while sending. On 204 the image leaves the query entry, the toast "Đã xóa ảnh" shows, and focus moves to the delete button of the tile now at that place, else of the previous tile, else the add button. A 404 `NOT_FOUND` counts as removed (same cache change, toast "Ảnh đã được xóa trước đó"). Any other error closes the dialog and shows the `describeError` text in the zone notice. The dialog uses `useReturnFocus`.
- **AC-7**: Errors that belong to one photo. 400 `IMAGE_INVALID` and 413 `PAYLOAD_TOO_LARGE` mark that item failed. The tile shows the backend `message` (for 413 plus "Hãy chọn ảnh nhỏ hơn.") and one button "Bỏ", because the same file would fail again. The queue goes on with the next item.
- **AC-8**: Errors that stop the queue. 409 `LISTING_IMAGE_LIMIT`: the backend message shows, the queue stops, the items not yet sent become failed with "Chưa tải", and the query entry is read again so the tiles match the server. 429: `RateLimitNotice` with its countdown shows at the top of the zone, the queue stops, the unsent items become failed with "Chưa tải", and "Thử lại" is disabled until the countdown ends. 404 `LISTING_NOT_FOUND`, 400 `INVALID_ID` and 403 `NOT_RESOURCE_OWNER`: on the edit page the page level state of spec 0006 (through `onBlocked`), on the result view an inline `Alert` with the backend message and the zone's controls hidden. 403 `PERMISSION_DENIED` and a 5xx: that item fails with the `describeError` text (the support code only for a 5xx) and the queue stops. Failed tiles of this kind have "Thử lại" and "Bỏ".
- **AC-9**: After a timeout or a network error on an upload. Before the item is called failed, the block reads the listing again. If the answer holds an image `id` that the block did not know before, that image is this item and the tile becomes saved. If not, the item fails with the standard message, "Thử lại" and "Bỏ", and the queue stops. A retry never sends until that read has finished. (A repeated upload makes a second copy, section 8 of the contract.)
- **AC-10**: Photos that do not load. When the address of a saved photo answers an error (the backend serves only photos of listings that are public now, so a hidden, over quota or admin hidden listing answers 404, and an `img` request carries no token), the tile shows the local preview if the file was added while this zone was open, otherwise a framed placeholder (`role="img"`) with the words "Ảnh chỉ xem được khi tin đang công khai". No toast and no error state. The tile keeps its delete button and its place in the count.
- **AC-11**: Guards. While any item is queued or uploading, closing or reloading the tab asks for confirmation (`useLeaveWarning`). Delete and retry buttons disable themselves while their request is in flight. A link click inside the site is not guarded: items not yet sent are dropped when the zone unmounts, and the request in flight finishes and still updates the cache (a known limit, the same as spec 0006).
- **AC-12**: Photo address. `mediaUrl(path)` in `src/lib/media.ts` returns the origin of `NEXT_PUBLIC_API_URL` plus `path` when that value is absolute, and `path` itself when it is a path such as `/api/v1` (proxy mode). It accepts only a path that starts with `/api/v1/media/public/` and returns `null` for anything else (shown as no photo). It matches the `remotePatterns` or `localPatterns` already in `next.config.ts`. Server photos show through `next/image`; local previews show through `next/image` with `unoptimized`.
- **AC-13**: Client time limit. `RequestOptions` in `src/lib/api/client.ts` gets an optional `timeoutMs`, and `attempt` uses it in place of the default 20 seconds when it is given. Only the upload sets it (60000). Every other call is unchanged. This amends spec 0002.
- **AC-14**: Accessibility and layout (WCAG AA). The tiles are a list. Every tile states its state in words, never by colour alone. A visually hidden polite live region says "Đang tải ảnh 2 trên 3", "Đã tải xong 3 ảnh" and the skipped file message. Each photo has `alt` "Ảnh N của tin" (local previews too). Icon buttons have an `aria-label`, controls are 44 px (`lg`), focus rings come from `FOCUS_RING`, and the grid works at 320 px with no sideways scroll. Only semantic tokens are used; any new text or control colour pair is added to `PAIRS` in `scripts/check-contrast.mjs`. The label "Ảnh bìa" sits on a solid token background, never directly on the photo.
- **AC-15**: Reference and clean build. `/dev/ui` shows the tile in each state (queued, uploading, failed, saved, cover, placeholder) on fake data with no network call. `npm run check` and `npm run build` pass, with no hydration warning and no console error on both pages, no `any`, and no link to a page that does not exist.

## Decision

**Chosen option**: Option 1: One shared photo zone, under the post result and on the edit page, with a one at a time upload queue

Build a `ListingPhotos` zone in `src/features/listing` that saves each photo at once and sits outside the form. Photos are added after the listing exists, so the form of spec 0006 is not touched.

**Implementation skills**: `tanstack-query-best-practices` (`deckardger/tanstack-agent-skills`, `.agents/skills/tanstack-query-best-practices/`) · `shadcn` (`shadcn-ui/ui`, `.agents/skills/shadcn/`) · `tailwind-design-system` (`wshobson/agents`, `.agents/skills/tailwind-design-system/`) · `next-dev-loop` (`vercel/next.js`, `.agents/skills/next-dev-loop/`)

The Next.js docs in `node_modules/next/dist/docs/` win over these skills where they disagree (project rule in `AGENTS.md`). Read the page on the `Image` component (`unoptimized`, `onError`, `sizes`, `fill`) before writing. No new skill or MCP server was searched for, because no new tool is chosen.

## Feature design

**Data model and API surface**: no new table, endpoint or stored data. `ListingImage` and `OwnerListingDetail` are in `src/lib/api/types.ts` already.

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/listings/:id/images` | POST | `file` (multipart, exactly one) | `ListingImage` (201) | bearer, `listing:update`, owner | 413 `PAYLOAD_TOO_LARGE`, 404 `LISTING_NOT_FOUND`, 403 `NOT_RESOURCE_OWNER`, 400 `IMAGE_INVALID`, 409 `LISTING_IMAGE_LIMIT`, 400 `INVALID_ID`, 403 `PERMISSION_DENIED`, 429 |
| `/listings/:id/images/:imageId` | DELETE | ids in the path | 204 | bearer, `listing:update`, owner | 404 `LISTING_NOT_FOUND`, 404 `NOT_FOUND`, 403 `NOT_RESOURCE_OWNER`, 400 `INVALID_ID` |
| `/me/listings/:id` | GET | `id` in the path | `OwnerListingDetail` with `images` | bearer, `listing:read` | as in spec 0006 |
| `/api/v1/media/public/<uuid>.<ext>` | GET | none (an image request) | the file | none | 404 `NOT_FOUND` when the listing is not public now |

**Client model** (lives in the zone, nothing is stored in the browser):

| Thing | Fields | Rule |
|---|---|---|
| Saved photo | `ListingImage`: `id`, `position` (0 to 4), `url` | Read from the query entry `["listing","mine",id]`. The cover is the smallest `position`. |
| `UploadItem` | `localId`, `file`, `previewUrl`, `status` (`queued`, `uploading`, `failed`), `message` (backend text or null), `retryable` | Lives in the hook `usePhotoUploads`. Failed items do not use a backend slot. |
| Previews | map of image `id` to `previewUrl` | Filled on a 201, used only as the fallback of AC-10, revoked when the zone unmounts. |
| Free slots | `5 - saved - (queued + uploading)` | Computed, never stored. |

**State transitions** of one item: `queued` to `uploading`; `uploading` to saved (leaves the queue) or `failed`; `failed` to `queued` (Thử lại) or removed (Bỏ); `queued` to removed (Bỏ). A saved photo ends by delete (AC-6).

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| All | The listing `id` | The route param on the edit page; the 201 answer on the result view (decided here) |
| Upload | The body | `FormData` with one field `file`, the picked `File` |
| Upload | The token | The session through `useApi()`, mode `required` (spec 0002) |
| Upload | The 60 second limit | `UPLOAD_TIMEOUT_MS` in `photo-rules.ts`, passed as `timeoutMs` (decided here) |
| Pick | Free slots | The saved count from the query entry and the queue (computed) |
| Pick | The type and size limits | `ACCEPTED_TYPES` and `MAX_PHOTO_BYTES` (5242880) in `photo-rules.ts`, a hint of the backend default (decided here) |
| Show | Photo address | `mediaUrl(image.url)` (AC-12) |
| Show | Cover label, order | `position` of each saved photo, smallest first |
| Show | "N trên 5 ảnh" | The saved count |
| Show | The words of a failed tile | The backend `message` of the `ApiError`, or `describeError` |
| Show | 429 countdown | `RateLimitNotice` and `useCountdown` (spec 0002) |
| Timeout recovery | Which image is the new one | The ids from `GET /me/listings/:id` that were not known before the send |
| Dialog | Is this photo the cover | It is first in `position` order |
| Fallback | A local preview for a photo | The map of image `id` to `previewUrl` (AC-10) |

**Key invariants**:
- The token stays in the session closure. Every call is made from the browser, behind the gate.
- One upload at a time. The queue never sends a second request while one is in flight.
- An upload is never repeated without reading the listing again first (AC-9).
- The cache entry is the one list of saved photos. A 201 adds, a 204 removes, and a read after an error corrects it.
- The zone sits outside the form and never changes its dirty state.
- No `any`; photo text and file names are rendered as text, never as HTML (spec 0001).
- A photo address is built only by `mediaUrl`.

### Files

```
src/
  lib/media.ts                                  mediaUrl (AC-12)
  lib/api/client.ts                             RequestOptions.timeoutMs (AC-13)
  features/listing/
    api/listing-images.ts                       uploadListingImage, deleteListingImage, cache helpers
    schemas/photo-rules.ts                      constants, checkPhotoFile, freeSlots (pure functions)
    hooks/use-photo-uploads.ts                  the queue (AC-4, AC-7, AC-8, AC-9, AC-11)
    components/listing-photos.tsx               the zone (AC-1, AC-2, AC-5, AC-14)
    components/photo-tile.tsx                   one tile, shows its state, no data calls (AC-10, AC-15)
    components/delete-photo-dialog.tsx          AlertDialog (AC-6)
  app/dev/ui/...                                tile states on fake data (AC-15)
changed:
  features/listing/components/edit-listing.tsx   renders the zone, passes onBlocked
  features/listing/components/new-listing.tsx    writes the 201 into the cache, renders the zone under the result
```

### Edge cases and failure handling

| Case | Handling |
|---|---|
| Pick more files than free slots | The first files fill the slots, the rest are listed as skipped (AC-3) |
| iPhone HEIC photo | Rejected by type with the same message as any other type |
| Empty `type` from the system | Sent, the backend judges by content |
| Same file picked twice | Allowed, it is two photos |
| Slow network, 5 MiB photo | 60 second limit, then the read of AC-9 |
| Lost connection mid upload | AC-9 |
| Another tab filled the listing (409) | AC-8, the entry is read again |
| 429 on upload (60 per hour) | `RateLimitNotice`, queue stops (AC-8) |
| Token expires during the queue | The client refreshes and resends once; `FormData` can be sent again |
| Listing hidden, over quota or hidden by admin | Upload and delete still work; photos that cannot load show AC-10 |
| Listing deleted in another tab | 404 `LISTING_NOT_FOUND`, page level state or inline alert (AC-8) |
| Delete of a photo already gone | 404 `NOT_FOUND`, treated as removed (AC-6) |
| Delete the cover | The dialog says the next photo becomes the cover; the order comes from the cache |
| Leave the page by a link while items wait | Unsent items are dropped, the one in flight finishes (AC-11) |
| Close the tab during upload | Browser confirmation (AC-11) |
| Session ends | The gate of spec 0005 sends the person to `/login?next=...`; queued files are lost (accepted) |

### Security model

- Everything needs a landlord session: the gate (spec 0005), then `listing:update` for upload and delete and `listing:read` for the read. The backend decides ownership: a photo call on someone else's listing answers 403 `NOT_RESOURCE_OWNER`.
- Photos are public once the listing is public, and the backend keeps their EXIF data (it may hold the GPS position and the camera model). The FE does not change the file; AC-2 tells the landlord in one line. The property address is public already, so the extra risk is low.
- The backend checks the file by content, so the FE type check is a convenience and never a security control. A photo address is built only from a path the backend returned, and only for `/api/v1/media/public/` (AC-12).
- No regulated standard applies. Nothing is stored in the browser except object URLs that live in memory.

### Configuration required

No environment variable, no package and no shadcn component to add (`alert-dialog`, `badge`, `spinner` and `alert` are installed). `UPLOAD_TIMEOUT_MS` (60000) and `MAX_PHOTO_BYTES` (5242880) are constants in `photo-rules.ts`. If the backend `MAX_UPLOAD_BYTES` changes, change the constant.

### Amendments to earlier specs

| Where | Was | Now |
|---|---|---|
| Spec 0002, the client | One fixed 20 second limit for every attempt | An optional `timeoutMs` per call (AC-13) |
| Spec 0006, Follow up | "#10: add the photo block to the edit page" | Done here, and the same block is also on the result view |
| Spec 0006, `ListingCreated` and the edit page | No photo block | Both render `ListingPhotos` (AC-1) |
| Scope row #10 | Also covers the cover photo on cards and the gallery on the detail page | Landlord side only; #8 and #9 draw the public photos (see Follow up) |

### Critical test scenarios

- Happy path: sign in as a seeded landlord, post a listing, add three photos at once on the result view, see "Đang chờ" then "Đang tải" then three saved tiles with the first labelled "Ảnh bìa", and check `GET /me/listings/:id` lists three images in `position` order, verifies **AC-1**, **AC-2**, **AC-4**, **AC-5**.
- Edit page: open the edit page of that listing, see the same tiles, add two more, see "Đã đủ 5 ảnh" and no add button, verifies **AC-1**, **AC-2**, **AC-5**.
- File checks: pick a PDF, a 6 MiB image and a HEIC photo, see each listed with its reason and nothing sent (Network tab), verifies **AC-3**.
- Backend errors: shrink `MAX_UPLOAD_BYTES` in the backend to get 413 and the hint; send a renamed text file to get `IMAGE_INVALID`; fill the listing from another tab to get 409; verifies **AC-7**, **AC-8**.
- Rate limit and stop: after a 429 the countdown shows, the unsent items read "Chưa tải", and "Thử lại" works when the countdown ends, verifies **AC-8**.
- Timeout: throttle the network so the upload passes 60 seconds or drop it mid send, check the block reads the listing before offering "Thử lại" and never makes a second copy, verifies **AC-9**.
- Delete: delete the cover and a middle photo, check the dialog text, the toast, the focus, and that the next photo became the cover, verifies **AC-5**, **AC-6**.
- Hidden listing: hide the listing (or use the seeded `bao.pham` over quota listings), reload the edit page, see the placeholder tiles with the explanation and a working delete; upload a photo and see its local preview, verifies **AC-10**.
- Guards: start an upload and close the tab (the browser asks), click Thử lại twice (one request), verifies **AC-11**.
- Address: with `NEXT_PUBLIC_API_URL` absolute and as `/api/v1`, check `mediaUrl` output and that images load through `next/image`, verifies **AC-12**.
- Keyboard and layout: Tab through the zone, use the dialog with the keys, listen to the live region, 320 px, verifies **AC-14**.
- Cleanup: `/dev/ui` tiles, `npm run check`, `npm run build`, console clean, verifies **AC-13**, **AC-15**.

## Build plan

Tracer Bullet (your project default, tier Alpha): the first thread is one real photo uploaded to a real listing and shown on the edit page, then each milestone thickens it. Each milestone is one `/develop` pass. No Figma step: layout comes from `design.md` and spec 0004.

**M1. Thin thread: one photo uploaded and shown on the edit page**
1. Add `src/lib/media.ts` (`mediaUrl`) and `photo-rules.ts` (constants, `checkPhotoFile`, `freeSlots`), satisfies **AC-3**, **AC-12**
2. Add `timeoutMs` to `RequestOptions` and `attempt`, then `uploadListingImage`, `deleteListingImage` and the cache helpers in `listing-images.ts`, satisfies **AC-4**, **AC-13**
3. Add a first `ListingPhotos` on the edit page: the add button, saved tiles through `next/image`, the count line and the cover label, with a single file path through the same hook. Run it against the backend as a seeded landlord, upload a PNG, check `GET /me/listings/:id`, satisfies **AC-1**, **AC-2**, **AC-4**, **AC-5**

**M2. The whole upload flow: queue and errors**
4. Build `usePhotoUploads`: several files, one at a time, states, retry and remove, the stop rules, the read after a timeout, the leave warning, satisfies **AC-4**, **AC-7**, **AC-8**, **AC-9**, **AC-11**
5. Add the tiles for queued, uploading and failed, the message under the button, the live region and `RateLimitNotice`, satisfies **AC-3**, **AC-7**, **AC-8**, **AC-14**

**M3. Delete and photos that do not load**
6. Add `DeletePhotoDialog` with `useReturnFocus`, the focus move after a delete and the 404 `NOT_FOUND` case, satisfies **AC-6**, **AC-14**
7. Add the load error fallback of a tile: local preview, else the placeholder with its words, satisfies **AC-10**

**M4. Join the post result and finish**
8. In `NewListing` write the 201 into the cache and render the zone under `ListingCreated` with its invitation line, with the inline alert for a blocked listing, satisfies **AC-1**, **AC-8**
9. Show the tile states in `/dev/ui`, add any contrast pair, run `npm run check` and `npm run build`, check the console on both pages, then `/check verify` with the backend running, satisfies **AC-14**, **AC-15**

Every AC appears in at least one task and every task names an AC.

## Consequences

**Positive**:
- One zone serves the result view and the edit page, and a photo is never lost to a half done form.
- Each photo is saved at once, so a failure touches one tile and never the listing.
- The timeout read prevents duplicate photos, which the backend would otherwise keep.
- `mediaUrl` and the tile give #8, #9 and #12 a ready way to show photos.

**Negative / tradeoffs**:
- Posting is two steps for the landlord: post, then add photos. The listing is public for a moment without photos.
- Photos save at once while the rest of the edit page needs Save, so the page has two saving models (the line in AC-1 explains it).
- A landlord cannot preview server photos of a hidden listing after a reload (the backend limit), only a placeholder.
- The queue lives in the page: leaving by a link drops the files not yet sent (a known limit).
- The 5 MiB limit and the 60 second limit are guesses of the backend default and of a weak network; both are constants to tune.
- The photo files keep their EXIF data, and the FE only warns about it.

**Neutral**:
- `src/features/listing` grows by about six files; no new feature folder.
- Spec 0002 gains one optional field.
- No backend change, table, package or environment variable.

## Follow-up

- [ ] `/scope`: align the rows. #10 now covers the landlord side only. #8 shows the cover photo on its cards and #9 the gallery, both through `mediaUrl`, and the sentence in row #9 "Ảnh ... được thêm ở Slice 2" is out of date.
- [ ] #8 and #9 are built before this item and need `mediaUrl`. Whichever ships first creates `src/lib/media.ts` exactly as AC-12 describes; this item then reuses it.
- [ ] #12: the list of my listings shows the cover photo; it should read or refresh the `["listing","mine"]` entries after photo changes.
- [ ] `/sync`: add `src/lib/media.ts` and the `timeoutMs` option to `src/lib/AGENTS.md`.
- [ ] Reorder of photos and a chosen cover wait for the backend (listed under "Chờ backend" in the scope).
- [ ] Drag and drop of files was left out on purpose; add it only if landlords ask.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).
