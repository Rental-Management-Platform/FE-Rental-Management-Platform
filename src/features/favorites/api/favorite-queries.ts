import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/client";
import type { Query } from "@/lib/api/http";
import type { Page, Uuid } from "@/lib/api/types";
import { flagMapOf, type FlaggedRow } from "../favorite-flags";
import { favoriteKeys } from "./favorite-keys";
import { getSavedListings } from "./favorite-api";

/**
 * The browser read of one page of saved listings. It needs a login (`required`), so the page that
 * runs it sits behind the route gate. The previous page stays on screen while the next one loads.
 * Every unsave takes the row out of this cache and asks for the page again (`syncFavorite`), so
 * the page fills up from the next one.
 */
export const savedListingsQuery = (api: ApiClient, page: number) =>
  queryOptions({
    queryKey: favoriteKeys.savedPage(page),
    queryFn: ({ signal }) => getSavedListings(api, page, signal),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

/**
 * The flags of a public list, read again with the token (spec 0001, "Overlay pattern", and
 * api-for-frontend.md section 4.1). The server drew the list as a guest, with `isFavorite` as
 * `null`. This repeats the same call with the same parameters and keeps only `{ id: flag }`, so
 * the cards are never replaced, only coloured in. The caller decides when it runs, with
 * `enabled`, and never while the session is `loading`.
 *
 * Kept a minute and not read again when the window gets focus: a save or an unsave writes its
 * answer straight into every map that holds the listing (`syncFavorite`).
 */
export const listFlagsQuery = (
  api: ApiClient,
  userId: Uuid,
  path: string,
  query: Query,
) =>
  queryOptions({
    queryKey: favoriteKeys.listFlags(userId, path, query),
    queryFn: async ({ signal }) =>
      flagMapOf(
        (
          await api.get<Page<FlaggedRow>>(path, {
            auth: "optional",
            query,
            signal,
          })
        ).items,
      ),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
