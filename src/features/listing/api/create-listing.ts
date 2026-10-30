import type { ApiClient } from "@/lib/api/client";
import type { ListingBody, OwnerListingDetail, Uuid } from "@/lib/api/types";

/**
 * `POST /properties/:propertyId/listings` (api-for-frontend.md, 6.18): the new listing, shown
 * at once. The property goes in the path and never in the body.
 */
export const createListing = (
  api: ApiClient,
  propertyId: Uuid,
  body: ListingBody,
) =>
  api.post<OwnerListingDetail>(
    `/properties/${encodeURIComponent(propertyId)}/listings`,
    body,
  );
