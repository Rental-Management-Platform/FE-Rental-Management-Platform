"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { membershipKey } from "@/features/membership/api/membership-query";
import { isAbortError } from "@/lib/api/abort";
import type {
  OwnerListingDetail,
  OwnerListingSummary,
  Page,
} from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import { hideListing, showListing } from "../api/listing-actions";
import { myListingsPageKey, type MyListingsParams } from "../api/my-listings";
import { fetchOwnerListing, ownerListingKey } from "../api/owner-listing";
import { refreshAfterListingWrite } from "../api/refresh-after-write";
import { matchesFilter } from "../listing-filter";
import { withAnswer, withoutListing } from "../my-listings-cache";
import {
  classifyToggleError,
  conflictMessage,
  LISTING_GONE_MESSAGE,
  STATE_CHANGED_MESSAGE,
  type ToggleAction,
  type ToggleFailure,
} from "../row-failure";
import { IDLE_ROW, type RowNotice, type RowUi } from "../row-ui";

const without = (rows: Readonly<Record<string, RowUi>>, id: string) =>
  Object.fromEntries(Object.entries(rows).filter(([key]) => key !== id));

// What the row says about a failure that stays at the row. `gone` takes the row away, so it is
// handled before this. A `conflict` only gets here from the read that follows a conflict, which
// cannot answer one, so it has the plain sentence.
const noticeOf = (
  failure: Exclude<ToggleFailure, { kind: "gone" }>,
): RowNotice => {
  switch (failure.kind) {
    case "conflict":
      return { kind: "warning", message: STATE_CHANGED_MESSAGE };
    case "blocked":
      return { kind: "blocked", code: failure.code, message: failure.message };
    case "rate-limited":
      return { kind: "rate-limited", error: failure.error };
    case "message":
      return { kind: "error", message: failure.message };
  }
};

/**
 * Hide and show for the rows of one page of "Tin của tôi" (spec 0019, AC-5 to AC-7). There is no
 * optimistic change: a row changes only when the server has answered, and then from the answer.
 * Each row has its own state, so a slow row never locks another one. One write runs at a time
 * per row, guarded by a ref because state is a render behind a fast double click.
 *
 * `onRowLeft` is called when the row that had focus is gone from the page (it no longer matches
 * the filter, or it was deleted elsewhere): the page moves focus to the list heading.
 */
export function useListingActions(
  params: MyListingsParams,
  onRowLeft: () => void,
) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<Readonly<Record<string, RowUi>>>({});
  const inFlight = useRef(new Set<string>());

  const setRow = (id: string, ui: RowUi | null) =>
    setRows((current) =>
      ui === null ? without(current, id) : { ...current, [id]: ui },
    );

  const editPage = (
    edit: (page: Page<OwnerListingSummary>) => Page<OwnerListingSummary>,
  ) =>
    queryClient.setQueryData(
      myListingsPageKey(params),
      (page: Page<OwnerListingSummary> | undefined) => page && edit(page),
    );

  // The row takes the state the server just gave. Says whether it left the page because of it.
  const applyCurrent = (current: OwnerListingDetail): boolean => {
    editPage((page) => withAnswer(page, current, params.filter));
    queryClient.setQueryData(ownerListingKey(current.id), current);
    return !matchesFilter(params.filter, current.status);
  };

  // Another tab deleted the listing: the row goes, and the person is told why.
  const dropGone = (id: string) => {
    editPage((page) => withoutListing(page, id));
    queryClient.removeQueries({ queryKey: ownerListingKey(id) });
    setRow(id, null);
    toast(LISTING_GONE_MESSAGE);
    onRowLeft();
    void refreshAfterListingWrite(queryClient);
  };

  // The state moved under the page (an admin hid it, or it changed in another tab): read the real
  // state, show it, and say why the press did nothing (AC-7).
  const reread = async (id: string, action: ToggleAction) => {
    try {
      const current = await fetchOwnerListing(api, id);
      const left = applyCurrent(current);
      const message = conflictMessage(action, current);
      if (left) {
        setRow(id, null);
        toast(message);
        onRowLeft();
      } else {
        setRow(id, { pending: false, notice: { kind: "warning", message } });
      }
      void refreshAfterListingWrite(queryClient);
    } catch (error) {
      if (isAbortError(error)) {
        setRow(id, null);
        return;
      }
      const failure = classifyToggleError(error);
      if (failure.kind === "gone") dropGone(id);
      else setRow(id, { pending: false, notice: noticeOf(failure) });
    }
  };

  const toggle = async (listing: OwnerListingSummary) => {
    if (listing.status === "hidden_by_admin") return;
    if (inFlight.current.has(listing.id)) return;
    const hiding = listing.status === "visible";
    const action: ToggleAction = hiding ? "hide" : "show";

    inFlight.current.add(listing.id);
    setRow(listing.id, { pending: true, notice: null });
    try {
      const answer = await (hiding ? hideListing : showListing)(
        api,
        listing.id,
      );
      const left = applyCurrent(answer);
      setRow(listing.id, null);
      toast.success(hiding ? "Đã ẩn tin" : "Đã hiện tin", {
        description: listing.title,
      });
      // The row that had focus is gone from this filter, so focus goes to the heading.
      if (left) onRowLeft();
      // Hiding one listing can make another one public, so the page is read again.
      void refreshAfterListingWrite(queryClient);
    } catch (error) {
      // The session changed under the request (a sign out in this tab): nothing to show.
      if (isAbortError(error)) {
        setRow(listing.id, null);
        return;
      }
      const failure = classifyToggleError(error);
      if (failure.kind === "gone") dropGone(listing.id);
      else if (failure.kind === "conflict") await reread(listing.id, action);
      else {
        setRow(listing.id, { pending: false, notice: noticeOf(failure) });
        // A refusal proves the strip was out of date, so the limit is read again. Nothing is sent
        // again by itself (spec 0020, AC-8).
        if (failure.kind === "blocked") {
          void queryClient.invalidateQueries({ queryKey: membershipKey });
        }
      }
    } finally {
      inFlight.current.delete(listing.id);
    }
  };

  return { rowOf: (id: string): RowUi => rows[id] ?? IDLE_ROW, toggle };
}
