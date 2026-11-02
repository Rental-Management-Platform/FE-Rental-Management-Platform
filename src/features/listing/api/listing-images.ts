import type { QueryClient } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/client";
import type { ListingImage, OwnerListingDetail, Uuid } from "@/lib/api/types";
import { UPLOAD_TIMEOUT_MS } from "../schemas/photo-rules";
import { ownerListingKey } from "./owner-listing";

/**
 * `POST /listings/:id/images` (api-for-frontend.md, 6.28): one photo, the new `ListingImage`.
 * The body is `FormData` with the single field `file`, and the client sets the `Content-Type`
 * with its boundary. A photo may take longer than the usual 20 seconds, so this call has its own
 * limit (spec 0007, AC-4 and AC-13).
 */
export const uploadListingImage = (api: ApiClient, id: Uuid, file: File) => {
  const body = new FormData();
  body.append("file", file);
  return api.post<ListingImage>(
    `/listings/${encodeURIComponent(id)}/images`,
    body,
    { timeoutMs: UPLOAD_TIMEOUT_MS },
  );
};

/**
 * `DELETE /listings/:id/images/:imageId` (api-for-frontend.md, 6.28): 204 with no body. The next
 * photo becomes the cover. The last photo of a listing cannot be deleted (409
 * `LISTING_IMAGE_REQUIRED`).
 */
export const deleteListingImage = (api: ApiClient, id: Uuid, imageId: Uuid) =>
  api.delete<void>(
    `/listings/${encodeURIComponent(id)}/images/${encodeURIComponent(imageId)}`,
  );

/** The photos in `position` order, the cover first. Never changes its input. */
export const byPosition = (images: readonly ListingImage[]) =>
  images.toSorted((a, b) => a.position - b.position);

/** The saved photos of a listing, for `useQuery`'s `select`. */
export const savedImages = (listing: OwnerListingDetail) =>
  byPosition(listing.images);

// The listing with another set of photos. The cover address follows the first photo, so the two
// fields of the answer never disagree.
const withImages = (
  listing: OwnerListingDetail,
  images: readonly ListingImage[],
): OwnerListingDetail => {
  const sorted = byPosition(images);
  return { ...listing, images: sorted, coverImageUrl: sorted[0]?.url ?? null };
};

/** The listing with `image` added (or replaced, when the same `id` is already there). */
export const withImage = (listing: OwnerListingDetail, image: ListingImage) =>
  withImages(listing, [
    ...listing.images.filter((item) => item.id !== image.id),
    image,
  ]);

/** The listing without the photo `imageId`. */
export const withoutImage = (listing: OwnerListingDetail, imageId: Uuid) =>
  withImages(
    listing,
    listing.images.filter((item) => item.id !== imageId),
  );

// The cache entry is the one list of saved photos (spec 0007, key invariants): a 201 adds, a
// 204 removes. An entry that is not loaded stays as it is.

/** Writes a new photo into the cache entry of the listing. */
export const cacheAddImage = (
  queryClient: QueryClient,
  id: Uuid,
  image: ListingImage,
) =>
  queryClient.setQueryData<OwnerListingDetail>(
    ownerListingKey(id),
    (listing) =>
      listing === undefined ? undefined : withImage(listing, image),
  );

/** Removes a deleted photo from the cache entry of the listing. */
export const cacheRemoveImage = (
  queryClient: QueryClient,
  id: Uuid,
  imageId: Uuid,
) =>
  queryClient.setQueryData<OwnerListingDetail>(
    ownerListingKey(id),
    (listing) =>
      listing === undefined ? undefined : withoutImage(listing, imageId),
  );
