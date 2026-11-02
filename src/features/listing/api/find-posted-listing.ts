import type { ApiClient } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import type {
  OwnerListingDetail,
  OwnerListingSummary,
  Page,
} from "@/lib/api/types";
import { matchPosted, type PostAttempt } from "../schemas/picked-photos";
import { fetchOwnerListing } from "./owner-listing";

/**
 * The listing a post whose answer was lost may have created (spec 0006, AC-18), or `null` when
 * there is none. The backend has no key against duplicates, so before a second post the form
 * reads the landlord's newest listings (`GET /me/listings`, newest first) and looks for the same
 * title, price and area made around the attempt. A match is then read whole
 * (`GET /me/listings/:id`) and accepted only when its property is the attempt's and it holds as
 * many photos as were sent. A 404 on that read counts as not found.
 *
 * Throws when a read fails: the caller must then not post, because it is still unknown whether
 * the first post landed. A one off call with no query key and no cache entry.
 */
export async function findPostedListing(
  api: ApiClient,
  attempt: PostAttempt,
): Promise<OwnerListingDetail | null> {
  const page = await api.get<Page<OwnerListingSummary>>("/me/listings", {
    query: { page: 1, pageSize: 10 },
  });
  const match = matchPosted(attempt, page.items);
  if (match === undefined) return null;

  let listing: OwnerListingDetail;
  try {
    listing = await fetchOwnerListing(api, match.id);
  } catch (error) {
    if (isApiError(error) && error.status === 404) return null;
    throw error;
  }
  const samePlace = listing.property.id === attempt.propertyId;
  const samePhotos = listing.images.length === attempt.sentPhotoIds.length;
  return samePlace && samePhotos ? listing : null;
}
