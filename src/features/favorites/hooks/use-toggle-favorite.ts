"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Uuid } from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import { saveListing, unsaveListing } from "../api/favorite-api";
import { syncFavorite } from "../favorite-cache";

/**
 * Saves (`true`) or unsaves (`false`) one listing. There is no optimistic change: the heart
 * changes when the server has answered, and the answer (`{ listingId, isFavorite }`) is written
 * into every place that shows the listing (`syncFavorite`), with no second read. It never
 * retries by itself. The write into the cache is on the hook and not on the call, so it still
 * happens when the card that was pressed has already left the screen.
 */
export function useToggleFavorite(listingId: Uuid) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (save: boolean) =>
      save ? saveListing(api, listingId) : unsaveListing(api, listingId),
    onSuccess: (result) => syncFavorite(queryClient, result),
  });
}
