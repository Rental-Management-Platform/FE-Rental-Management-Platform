"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { propertiesKey } from "@/features/property/api/properties-key";
import { isAbortError } from "@/lib/api/abort";
import type { OwnerListingSummary, Page } from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import { deleteListing } from "../api/listing-actions";
import { myListingsPageKey, type MyListingsParams } from "../api/my-listings";
import { ownerListingKey } from "../api/owner-listing";
import { refreshAfterListingWrite } from "../api/refresh-after-write";
import { withoutListing } from "../my-listings-cache";
import { classifyDeleteError, type DeleteFailure } from "../row-failure";

/**
 * The one delete dialog of "Tin của tôi" (spec 0019, AC-8). A single dialog serves every row, so
 * it is driven by state and has no trigger: the page remembers the opener with `useReturnFocus`.
 *
 * It waits for the server and never removes the row first. A success (and a 404, which is the
 * same outcome) closes the dialog, takes the row out of the page, and marks the lists that show
 * it out of date. Any other failure stays in the dialog and the dialog stays open.
 */
export function useDeleteListing(params: MyListingsParams) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<OwnerListingSummary | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<DeleteFailure | null>(null);
  // State is a render behind a fast double click, so a ref guards the request itself.
  const inFlight = useRef(false);

  const ask = (listing: OwnerListingSummary) => {
    setTarget(listing);
    setFailure(null);
    setOpen(true);
  };

  // Escape and the backdrop must not close it while the request runs.
  const onOpenChange = (next: boolean) => {
    if (pending && !next) return;
    setOpen(next);
  };

  const removed = (listing: OwnerListingSummary) => {
    setOpen(false);
    queryClient.setQueryData(
      myListingsPageKey(params),
      (page: Page<OwnerListingSummary> | undefined) =>
        page && withoutListing(page, listing.id),
    );
    queryClient.removeQueries({ queryKey: ownerListingKey(listing.id) });
    toast.success("Đã xóa tin", { description: listing.title });
    // The `listingCount` of its property moved, and the limit may have: both are read again.
    void queryClient.invalidateQueries({ queryKey: propertiesKey });
    void refreshAfterListingWrite(queryClient);
  };

  const confirm = async () => {
    if (target === null || inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setFailure(null);
    try {
      await deleteListing(api, target.id);
      removed(target);
    } catch (error) {
      // The session changed under the request (a sign out in this tab): nothing to show.
      if (isAbortError(error)) {
        setOpen(false);
        return;
      }
      const next = classifyDeleteError(error);
      if (next.kind === "gone") removed(target);
      else setFailure(next);
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  };

  return { target, open, pending, failure, ask, onOpenChange, confirm };
}
