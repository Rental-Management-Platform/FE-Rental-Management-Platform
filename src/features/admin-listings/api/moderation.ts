import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/client";
import type { ModerationListing, Page, Uuid } from "@/lib/api/types";
import { sameFilters, type ModerationFilters } from "../moderation-filter";
import { adminListingsListKey } from "./admin-listings-keys";

/** Twenty rows a page: the API default (it allows 50 at most). */
export const ADMIN_LISTINGS_PAGE_SIZE = 20;

/** Which page of which filters the address asks for. */
export interface AdminListingsParams extends ModerationFilters {
  page: number;
}

/**
 * `GET /moderation/listings` (`listing:moderate`, api-for-frontend.md 6.29): the listings of every
 * landlord in every state, the hidden ones and those of a landlord whose trial ended included,
 * newest first. Only a filter that is set is sent: the API refuses a value outside its list. The
 * rows keep the order the API gave.
 */
export const fetchModerationListings = (
  api: ApiClient,
  params: AdminListingsParams,
  signal?: AbortSignal,
) =>
  api.get<Page<ModerationListing>>("/moderation/listings", {
    query: {
      page: params.page,
      pageSize: ADMIN_LISTINGS_PAGE_SIZE,
      ...(params.status === "all" ? {} : { status: params.status }),
      ...(params.landlordId === null ? {} : { landlordId: params.landlordId }),
      ...(params.q === "" ? {} : { q: params.q }),
    },
    signal,
  });

/**
 * One page of the list. The previous page stays on screen while the next one loads, but only when
 * the filters are the same: rows of other filters under a changed filter would be a lie. The
 * default `staleTime` of 0 is on purpose: a listing posted or hidden since shows up when the page
 * opens or the window gets focus.
 */
export const adminListingsListQuery = (
  api: ApiClient,
  params: AdminListingsParams,
) =>
  queryOptions({
    queryKey: adminListingsListKey({
      ...params,
      pageSize: ADMIN_LISTINGS_PAGE_SIZE,
    }),
    queryFn: ({ signal }) => fetchModerationListings(api, params, signal),
    placeholderData: (previous, previousQuery) =>
      previousQuery !== undefined &&
      sameFilters(previousQuery.queryKey[3], params)
        ? previous
        : undefined,
  });

/**
 * `POST /moderation/listings/:id/hide` (`listing:moderate`, 6.29): a `visible` or `hidden_by_owner`
 * listing becomes `hidden_by_admin` and leaves every public page at once. The body is only the
 * reason (1 to 500 characters). The answer is the whole moderation row after the change.
 */
export const hideListing = (api: ApiClient, id: Uuid, reason: string) =>
  api.post<ModerationListing>(
    `/moderation/listings/${encodeURIComponent(id)}/hide`,
    { reason },
  );

/**
 * `POST /moderation/listings/:id/unhide` (`listing:moderate`, 6.29): a `hidden_by_admin` listing
 * becomes `hidden_by_owner`, not `visible`: the landlord presses "Hiện" to put it back. Same body
 * and same answer as a hide.
 */
export const unhideListing = (api: ApiClient, id: Uuid, reason: string) =>
  api.post<ModerationListing>(
    `/moderation/listings/${encodeURIComponent(id)}/unhide`,
    { reason },
  );
