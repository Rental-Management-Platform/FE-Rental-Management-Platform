import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import type { OwnerListingDetail, Uuid } from "@/lib/api/types";
import type { ListingPatch } from "../schemas/listing-schema";

/** A failure that takes the whole page, not the form: the listing is gone, or is not mine. */
export type ListingBlock = "not-found" | "forbidden";

/**
 * Which page level state a failed read or save of one listing calls for, or `null` for an
 * ordinary failure (a field message, a form message, a retry). A malformed id answers 400
 * `INVALID_ID`, which for the person is the same as a listing that does not exist.
 */
export const listingBlock = (error: unknown): ListingBlock | null => {
  if (!isApiError(error)) return null;
  if (error.code === "LISTING_NOT_FOUND" || error.code === "INVALID_ID") {
    return "not-found";
  }
  return error.code === "NOT_RESOURCE_OWNER" ? "forbidden" : null;
};

/** The cache entry of one listing of mine. A save writes its answer here. */
export const ownerListingKey = (id: string) => ["listing", "mine", id] as const;

/**
 * `GET /me/listings/:id` (api-for-frontend.md, 6.21): the listing in every status, with the
 * property and the admin's reason. It opens the edit form once, so the two refetches that
 * happen by themselves are off: the form is never rebuilt under the person's typing.
 */
export const ownerListingQuery = (api: ApiClient, id: string) =>
  queryOptions({
    queryKey: ownerListingKey(id),
    queryFn: ({ signal }) =>
      api.get<OwnerListingDetail>(`/me/listings/${encodeURIComponent(id)}`, {
        signal,
      }),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

/**
 * `PATCH /listings/:id` (api-for-frontend.md, 6.22): the listing after the change, in any
 * status. The body holds changed fields only, and never `propertyId`, `status` or `code`.
 */
export const updateListing = (api: ApiClient, id: Uuid, body: ListingPatch) =>
  api.patch<OwnerListingDetail>(`/listings/${encodeURIComponent(id)}`, body);
