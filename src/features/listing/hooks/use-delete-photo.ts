"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import type { Uuid } from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import {
  cacheRemoveImage,
  classifyDeleteError,
  deleteListingImage,
  refreshImages,
} from "../api/listing-images";
import type { ListingBlock } from "../api/owner-listing";

/**
 * How a delete ended, for the zone to show (spec 0007, AC-6). The cache is already corrected when
 * this is returned: the photo left it on `removed` and `already-gone`, and the photos were read
 * again on `required`.
 */
export type DeleteResult =
  | { kind: "removed" }
  | { kind: "already-gone" }
  | { kind: "required"; message: string }
  | { kind: "blocked"; block: ListingBlock; message: string }
  | { kind: "failed"; message: string }
  | { kind: "aborted" };

/**
 * `DELETE /listings/:id/images/:imageId` for the photo zone. It sends the request and corrects
 * the listing's cache entry, and leaves the dialog, the toast, the notice and the focus to the
 * zone. One delete runs at a time; a second call while one is in flight does nothing.
 */
export function useDeletePhoto(listingId: Uuid) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  // State lags a render behind a fast second click, so a ref guards the request itself.
  const inFlight = useRef(false);

  /** Resolves to `null` when a delete is already running. */
  const deletePhoto = async (imageId: Uuid): Promise<DeleteResult | null> => {
    if (inFlight.current) return null;
    inFlight.current = true;
    setIsDeleting(true);
    try {
      await deleteListingImage(api, listingId, imageId);
      cacheRemoveImage(queryClient, listingId, imageId);
      return { kind: "removed" };
    } catch (error) {
      const failure = classifyDeleteError(error);
      switch (failure.kind) {
        case "gone":
          // Someone removed it first: the tile goes, as the person wanted.
          cacheRemoveImage(queryClient, listingId, imageId);
          return { kind: "already-gone" };
        case "required":
          // Another tab removed the other photo, so this one is the last now. The tiles must
          // match the server again.
          await refreshImages(api, queryClient, listingId).catch(
            () => undefined,
          );
          return failure;
        default:
          return failure;
      }
    } finally {
      inFlight.current = false;
      setIsDeleting(false);
    }
  };

  return { isDeleting, deletePhoto };
}
