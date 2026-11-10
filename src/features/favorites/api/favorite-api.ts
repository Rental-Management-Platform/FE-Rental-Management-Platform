import { LISTING_PAGE_SIZE } from "@/features/listing-search/schemas/search-params";
import type { ApiClient } from "@/lib/api/client";
import type { FavoriteResult, Page, SavedListing, Uuid } from "@/lib/api/types";

/** How many cards one page of saved listings holds: the same as the search page. */
export const FAVORITES_PAGE_SIZE = LISTING_PAGE_SIZE;

// Both writes need a login, take no body and answer 200 with `{ listingId, isFavorite }`, where
// `isFavorite` is fixed by the action (api-for-frontend.md, 6.33). Calling twice is safe, so a
// double press cannot save a listing twice. `:id` is the `id` of the listing, never the slug.

/** `POST /listings/:id/favorite` (`favorite:create`). */
export const saveListing = (api: ApiClient, listingId: Uuid) =>
  api.post<FavoriteResult>(`/listings/${listingId}/favorite`);

/** `DELETE /listings/:id/favorite` (`favorite:delete`). It never checks the listing. */
export const unsaveListing = (api: ApiClient, listingId: Uuid) =>
  api.delete<FavoriteResult>(`/listings/${listingId}/favorite`);

/**
 * `GET /me/favorites` (`favorite:read`): the saved listings that are visible now, newest save
 * first. It takes only `page` and `pageSize`: any other parameter is a 400.
 */
export const getSavedListings = (
  api: ApiClient,
  page: number,
  signal?: AbortSignal,
) =>
  api.get<Page<SavedListing>>("/me/favorites", {
    query: { page, pageSize: FAVORITES_PAGE_SIZE },
    signal,
  });
