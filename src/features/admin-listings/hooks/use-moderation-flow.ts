"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { adminStatsKey } from "@/features/admin-stats/api/admin-stats";
import type { ModerationListing, Page } from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import { useReturnFocus } from "@/lib/use-return-focus";
import {
  GONE_TOAST,
  HIDE_CONFIRM,
  HIDE_PLACEHOLDER,
  HIDE_TITLE,
  STATE_CHANGED_TOAST,
  UNHIDE_CONFIRM,
  UNHIDE_PLACEHOLDER,
  UNHIDE_TITLE,
  hiddenToast,
  hideDescription,
  listingLabel,
  unhiddenToast,
  unhideDescription,
} from "../admin-listings-text";
import { adminListingsKey } from "../api/admin-listings-keys";
import { hideListing, unhideListing } from "../api/moderation";
import { withAnswer } from "../moderation-cache";
import { classifyModerationError } from "../moderation-failure";
import { moderationActionOf } from "../moderation-rule";
import { rowFocusTarget } from "../row-focus";

/** The words of the dialog for the row it was opened on. Empty while no row was asked about. */
const dialogWords = (listing: ModerationListing | null) => {
  if (listing === null) {
    return {
      title: "",
      description: "",
      confirmLabel: "",
      placeholder: "",
      tone: "default" as const,
    };
  }
  const label = listingLabel(listing);
  return moderationActionOf(listing.status) === "hide"
    ? {
        title: HIDE_TITLE,
        description: hideDescription(label),
        confirmLabel: HIDE_CONFIRM,
        placeholder: HIDE_PLACEHOLDER,
        tone: "destructive" as const,
      }
    : {
        title: UNHIDE_TITLE,
        description: unhideDescription(label),
        confirmLabel: UNHIDE_CONFIRM,
        placeholder: UNHIDE_PLACEHOLDER,
        tone: "default" as const,
      };
};

/**
 * The reason dialog of the moderation table (scope #21), shared by every row: which row it asks
 * about, whether it is open, and what sending does. It uses the shared `ReasonDialog` of spec 0023.
 *
 * A hide and an unhide write, then the row takes the answer (the whole moderation row after the
 * change) and the list is read again before the dialog closes, so a status filter drops a row that
 * no longer fits and the total is the server's. The `adminStatsKey` entries are marked out of date
 * too (read again when the admin opens `/admin`, not now), so the "Cần xử lý" strip and the hidden
 * by admin row of the overview stay right. Another admin or the
 * landlord who was first (409 `LISTING_STATE_INVALID`) or a listing that is gone (404
 * `LISTING_NOT_FOUND`) closes the dialog and says so in a toast, because the list is the truth
 * now. Every other failure is thrown to `ReasonDialog`, which shows it inside and keeps what was
 * typed.
 *
 * The button that opened the dialog may be gone when it closes (a hidden row swaps "Ẩn" for "Gỡ
 * ẩn"), so focus goes to a button of the same row, and to the heading of the results when the row
 * left the list.
 */
export function useModerationFlow() {
  const api = useApi();
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<ModerationListing | null>(null);
  const [open, setOpen] = useState(false);
  const { remember, onCloseAutoFocus } = useReturnFocus(() =>
    rowFocusTarget(target?.id),
  );

  const write = useMutation({
    mutationFn: ({
      listing,
      reason,
    }: {
      listing: ModerationListing;
      reason: string;
    }) =>
      moderationActionOf(listing.status) === "hide"
        ? hideListing(api, listing.id, reason)
        : unhideListing(api, listing.id, reason),
  });

  // The list is the truth after a write: read it again and wait for it, so the dialog closes on
  // rows that already show the new state.
  const refresh = async () => {
    void queryClient.invalidateQueries({ queryKey: adminStatsKey });
    await queryClient.invalidateQueries({ queryKey: adminListingsKey });
  };

  const ask = (listing: ModerationListing) => {
    remember();
    setTarget(listing);
    setOpen(true);
  };

  const submit = async (reason: string) => {
    if (target === null) return;
    const hiding = moderationActionOf(target.status) === "hide";
    let answer: ModerationListing;
    try {
      answer = await write.mutateAsync({ listing: target, reason });
    } catch (error) {
      const outcome = classifyModerationError(error);
      if (outcome === "other") throw error;
      await refresh();
      toast(outcome === "state-changed" ? STATE_CHANGED_TOAST : GONE_TOAST);
      setOpen(false);
      return;
    }
    queryClient.setQueriesData<Page<ModerationListing>>(
      { queryKey: adminListingsKey },
      (page) => (page === undefined ? page : withAnswer(page, answer)),
    );
    await refresh();
    const label = listingLabel(target);
    toast.success(hiding ? hiddenToast(label) : unhiddenToast(label));
    setOpen(false);
  };

  return {
    ...dialogWords(target),
    open,
    ask,
    submit,
    onOpenChange: setOpen,
    onCloseAutoFocus,
  };
}
