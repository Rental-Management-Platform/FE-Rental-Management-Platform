import type { ApiClient } from "@/lib/api/client";
import type { OwnerListingDetail, Uuid } from "@/lib/api/types";

// The three writes of "Tin của tôi" (api-for-frontend.md, 6.23 and 6.22). Each is one call and
// nothing else: the page decides what to do with the answer.

/** `POST /listings/:id/hide`: `visible` becomes `hidden_by_owner`. No body. */
export const hideListing = (api: ApiClient, id: Uuid) =>
  api.post<OwnerListingDetail>(`/listings/${encodeURIComponent(id)}/hide`);

/**
 * `POST /listings/:id/show`: `hidden_by_owner` becomes `visible`. It can answer 403
 * `MEMBERSHIP_REQUIRED` or `LISTING_QUOTA_REACHED`, and 403 `LISTING_HIDDEN_BY_ADMIN` when an
 * admin hid it. No body.
 */
export const showListing = (api: ApiClient, id: Uuid) =>
  api.post<OwnerListingDetail>(`/listings/${encodeURIComponent(id)}/show`);

/** `DELETE /listings/:id`: 204, in any status. */
export const deleteListing = (api: ApiClient, id: Uuid) =>
  api.delete<void>(`/listings/${encodeURIComponent(id)}`);
