import type { QueryClient } from "@tanstack/react-query";
import { isAbortError } from "@/lib/api/abort";
import type { ApiClient } from "@/lib/api/client";
import { describeError, isApiError, type ApiError } from "@/lib/api/errors";
import type { ListingImage, OwnerListingDetail, Uuid } from "@/lib/api/types";
import { UPLOAD_TIMEOUT_MS } from "../schemas/photo-rules";
import {
  fetchOwnerListing,
  listingBlock,
  ownerListingKey,
  type ListingBlock,
} from "./owner-listing";

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

/** Puts the photos the server holds into the cache entry. Only the photos: the rest stays. */
export const cacheSetImages = (
  queryClient: QueryClient,
  id: Uuid,
  images: readonly ListingImage[],
) =>
  queryClient.setQueryData<OwnerListingDetail>(
    ownerListingKey(id),
    (listing) =>
      listing === undefined ? undefined : withImages(listing, images),
  );

/** The ids of the saved photos the cache holds now. Read right before a send (AC-9). */
export const knownImageIds = (
  queryClient: QueryClient,
  id: Uuid,
): readonly Uuid[] =>
  queryClient
    .getQueryData<OwnerListingDetail>(ownerListingKey(id))
    ?.images.map((image) => image.id) ?? [];

/**
 * Reads the listing again and writes its photos into the cache entry (spec 0007, AC-8 and
 * AC-9). It does not touch the other fields of the entry: the edit form keeps its own copy, and
 * what the person typed is theirs. Returns the photos the server holds.
 */
export const refreshImages = async (
  api: ApiClient,
  queryClient: QueryClient,
  id: Uuid,
): Promise<readonly ListingImage[]> => {
  const { images } = await fetchOwnerListing(api, id);
  cacheSetImages(queryClient, id, images);
  return images;
};

/**
 * The photo the server holds that was not known before a send, which is the photo of that send
 * (AC-9). `undefined` when the server holds nothing new.
 */
export const findNewImage = (
  known: readonly Uuid[],
  images: readonly ListingImage[],
): ListingImage | undefined =>
  byPosition(images).find((image) => !known.includes(image.id));

/**
 * What a failed upload means for the queue (spec 0007, AC-7, AC-8 and AC-9):
 * - `file`: this photo is wrong and would fail again, the queue goes on.
 * - `full`: the listing already holds five, the queue stops.
 * - `rate-limit`: too many uploads, the queue stops and the countdown shows.
 * - `blocked`: the listing is gone or not mine, the page takes over.
 * - `unknown-outcome`: no answer came (timeout, no network), the photo may be saved already.
 * - `stop`: anything else, the queue stops and the photo can be tried again.
 * - `aborted`: the session changed under the request, there is nothing to show.
 */
export type UploadFailure =
  | { kind: "file"; message: string }
  | { kind: "full"; message: string }
  | { kind: "rate-limit"; error: ApiError }
  | { kind: "blocked"; block: ListingBlock; message: string }
  | { kind: "unknown-outcome"; message: string }
  | { kind: "stop"; message: string }
  | { kind: "aborted" };

// The words of a failure: the backend text, plus the support code for a 5xx answer only.
const failureText = (error: unknown) => {
  const { message, requestId } = describeError(error);
  return requestId === null ? message : `${message} Mã hỗ trợ: ${requestId}`;
};

/** Sorts a failed upload (or the read after it) into the case the queue acts on. */
export function classifyUploadError(error: unknown): UploadFailure {
  if (isAbortError(error)) return { kind: "aborted" };
  const message = failureText(error);
  if (!isApiError(error)) return { kind: "stop", message };
  if (error.status === 429) return { kind: "rate-limit", error };
  const block = listingBlock(error);
  if (block !== null) return { kind: "blocked", block, message };
  switch (error.code) {
    case "IMAGE_INVALID":
      return { kind: "file", message };
    case "PAYLOAD_TOO_LARGE":
      return { kind: "file", message: `${message} Hãy chọn ảnh nhỏ hơn.` };
    case "LISTING_IMAGE_LIMIT":
      return { kind: "full", message };
    case "TIMEOUT":
    case "NETWORK_ERROR":
      return { kind: "unknown-outcome", message };
    default:
      return { kind: "stop", message };
  }
}
