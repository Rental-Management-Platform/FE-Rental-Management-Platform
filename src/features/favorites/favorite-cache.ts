import type { QueryClient } from "@tanstack/react-query";
import { listingDetailRoot } from "@/features/listing-detail/api/listing-detail-query";
import type {
  FavoriteResult,
  ListingDetail,
  Page,
  SavedListing,
} from "@/lib/api/types";
import { favoriteKeys } from "./api/favorite-keys";
import { withFlag, withoutListing, type FlagMap } from "./favorite-flags";

/**
 * Writes the answer of a save or an unsave into everything the browser keeps about that listing,
 * found by its `id`, so a heart never disagrees with another place that shows the same listing:
 * - every flag map of a public list that holds it (the cards of the search page and of a landlord);
 * - every browser read of a listing detail for it (`isFavorite`, the heart of the detail page);
 * - every page of the saved list: an unsave takes the row out and lowers `total` at once.
 * Then the saved pages are marked stale. A page on screen is read again, so an unsave pulls the
 * next saved listing up to fill the gap. A save only marks the pages: the row joins the top of
 * the saved list the next time that page opens.
 *
 * The answer of the server is the source (`isFavorite` is fixed by the action, api-for-frontend.md
 * 6.33), so there is no second read for the flag itself.
 */
export function syncFavorite(client: QueryClient, result: FavoriteResult) {
  const { listingId, isFavorite } = result;

  client.setQueriesData<FlagMap>({ queryKey: favoriteKeys.flags() }, (map) =>
    withFlag(map, listingId, isFavorite),
  );
  client.setQueriesData<ListingDetail>(
    { queryKey: listingDetailRoot },
    (detail) => (detail?.id === listingId ? { ...detail, isFavorite } : detail),
  );
  if (!isFavorite) {
    client.setQueriesData<Page<SavedListing>>(
      { queryKey: favoriteKeys.saved() },
      (page) => (page === undefined ? page : withoutListing(page, listingId)),
    );
  }
  void client.invalidateQueries({ queryKey: favoriteKeys.saved() });
}
