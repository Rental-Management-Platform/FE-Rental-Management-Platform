"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { isAbortError } from "@/lib/api/abort";
import { describeError } from "@/lib/api/errors";
import type { OwnerListingSummary, Page } from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import { hideListing, showListing } from "../api/listing-actions";
import { myListingsPageKey, type MyListingsParams } from "../api/my-listings";
import { ownerListingKey } from "../api/owner-listing";
import { refreshAfterListingWrite } from "../api/refresh-after-write";
import { withAnswer } from "../my-listings-cache";
import { IDLE_ROW, type RowUi } from "../row-ui";

const without = (rows: Readonly<Record<string, RowUi>>, id: string) =>
  Object.fromEntries(Object.entries(rows).filter(([key]) => key !== id));

/**
 * Hide and show for the rows of one page of "Tin của tôi" (spec 0019, AC-5). There is no
 * optimistic change: a row changes only when the server has answered, and then from the answer.
 * Each row has its own state, so a slow row never locks another one. One write runs at a time
 * per row, guarded by a ref because state is a render behind a fast double click.
 */
export function useListingActions(params: MyListingsParams) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<Readonly<Record<string, RowUi>>>({});
  const inFlight = useRef(new Set<string>());

  const setRow = (id: string, ui: RowUi | null) =>
    setRows((current) =>
      ui === null ? without(current, id) : { ...current, [id]: ui },
    );

  const toggle = async (listing: OwnerListingSummary) => {
    if (listing.status === "hidden_by_admin") return;
    if (inFlight.current.has(listing.id)) return;
    const hiding = listing.status === "visible";

    inFlight.current.add(listing.id);
    setRow(listing.id, { pending: true, notice: null });
    try {
      const answer = await (hiding ? hideListing : showListing)(
        api,
        listing.id,
      );
      queryClient.setQueryData(
        myListingsPageKey(params),
        (page: Page<OwnerListingSummary> | undefined) =>
          page && withAnswer(page, answer, params.filter),
      );
      queryClient.setQueryData(ownerListingKey(answer.id), answer);
      setRow(listing.id, null);
      toast.success(hiding ? "Đã ẩn tin" : "Đã hiện tin", {
        description: listing.title,
      });
      // Hiding one listing can make another one public, so the page is read again.
      void refreshAfterListingWrite(queryClient);
    } catch (error) {
      // The session changed under the request (a sign out in this tab): nothing to show.
      if (isAbortError(error)) {
        setRow(listing.id, null);
        return;
      }
      setRow(listing.id, {
        pending: false,
        notice: { kind: "error", message: describeError(error).message },
      });
    } finally {
      inFlight.current.delete(listing.id);
    }
  };

  return { rowOf: (id: string): RowUi => rows[id] ?? IDLE_ROW, toggle };
}
