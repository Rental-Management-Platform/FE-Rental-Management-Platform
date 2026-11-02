# 0007. Rationale: photo block for listings in the landlord area

This is the decision record for [spec 0007](index.md). The build spec is `index.md`. Builds skip this file.

## Context

> ⚠️ Premise note: scope item #10 is built after #8 (find listings) and #9 (listing detail), and both of those must already show photos, because the demo data holds more than 200 and a card with an empty frame would look broken. Leaving the cover photo and the gallery to #10 means going back to edit two finished pages. This spec therefore keeps #10 on the landlord side and moves the public photos to #8 and #9, which share one small helper (`mediaUrl`). The scope text needs the matching change (spec Follow up).

The backend is finished and lets a landlord attach up to five photos to a listing. Four facts shape the design. A photo needs the id of the listing, so it can only be sent after the listing exists; there is no call that creates both. The backend takes exactly one file per request, and sending the same file twice makes two photos, so a repeated upload is never safe. The client gives every attempt 20 seconds, which a 5 MiB photo on a weak connection can pass while the file still reaches the backend. And the public photo address answers 404 for any listing that is not public now, while an image request carries no token, so the landlord cannot see the photos of a hidden listing through that address.

Spec 0006 built the post and edit forms and left photos out on purpose, with a follow up to add a photo block to the edit page. Without this decision a landlord can post a listing but cannot give it a photo, and every public page shows an empty frame for new listings.

## Options considered

### Option 1: One shared photo zone, under the post result and on the edit page, with a one at a time queue (chosen)

After the post succeeds, the result view shows a photo zone. The edit page shows the same zone. Each photo is saved the moment it is uploaded, outside the form.

**Pros**:
- One component and one hook serve both places, and the form of spec 0006 is not touched.
- The listing id exists from the start, so there is no half done state: a failed photo is one failed tile, never a failed listing.
- Fits the backend as it is (one file per request, saved at once).

**Cons**:
- Posting becomes two steps for the landlord, and the listing is public for a moment without photos.
- The edit page has two saving models: the form needs Save, the photos do not.

### Option 2: Pick the photos inside the post form, upload them after the listing is created

The landlord chooses photos while filling the form. Pressing Post creates the listing and then uploads each photo.

**Pros**:
- Feels like one step, and matches how people think about "posting a listing with photos".

**Cons**:
- The form must hold `File` objects and previews, and its dirty state and leave warning get more complex.
- The listing can exist while some photos failed, so a result view with retry is needed anyway, which is most of Option 1 plus more.
- The edit page still needs the zone of Option 1, so the work is done twice.

### Option 3: Photos only on the edit page

The result view shows a button "Thêm ảnh" that opens the edit page.

**Pros**:
- The least work.

**Cons**:
- One more click right after posting, and nothing on the result view hints that photos matter.
- The edit page then carries the whole flow, including the first photo, which is the busiest moment.

## Rationale

Option 1 follows the backend's grain: the listing is created first, then each photo is a small independent call. Option 2 hides that seam from the landlord but pays for it with a form that must manage files and partial failure, and it still needs the zone of Option 1 for the edit page. Option 3 saves the most work but gives up the moment when a landlord is most willing to add photos. For a demo with a deadline, Option 1 gives the best use of one component for the least risk.

Other calls made in this spec, each with its reason:
- **Sequential uploads, not parallel.** The backend gives each photo the smallest free position and two uploads racing for the last slot give one a 409. One at a time keeps the cover predictable and is gentler on a weak connection.
- **Read the listing again after a timeout.** A timeout does not say whether the file arrived, and a repeat creates a copy. One read is cheaper than a duplicate.
- **60 seconds for uploads only.** A 5 MiB photo at 1 Mbps needs about 42 seconds. The runner up was to keep 20 seconds for everything, which is simpler but fails on slow networks.
- **FE checks type and size, the backend stays the real validator.** It saves a failed request on mobile data. The size is a hint, so the backend message still wins.
- **Confirm before delete.** A delete cannot be undone and may change the cover; it matches how #12 will delete listings. The runner up was to confirm only for the cover.
- **Public photos belong to #8 and #9.** They need the photos at build time, so retrofitting them from #10 would mean editing finished pages.
- **Local preview kept as a fallback.** Without it a landlord who uploads to a hidden listing sees no photo at all and thinks it failed.
- **A one line note about EXIF, no stripping.** Stripping means redrawing the image in the browser, which costs quality and code. The address of the property is public already, so the added risk is low.
- **No drag and drop.** The file button already takes many files; drag and drop adds states and keyboard equivalents for little gain in a demo.
