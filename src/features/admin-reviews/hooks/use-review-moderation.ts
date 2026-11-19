"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { dashboardKey } from "@/features/dashboard/api/stats";
import type { Page } from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import { useReturnFocus } from "@/lib/use-return-focus";
import { withAnswer, withoutRow } from "../review-cache";
import { classifyReviewWriteError } from "../review-failure";
import type { ReviewDialogWords, ReviewModerationKind } from "../review-kind";
import type { ReviewRow } from "../review-row";
import { reviewActionOf } from "../review-rule";
import { rowFocusTarget } from "../row-focus";

/** The words of the dialog before any row was asked about: nothing is on screen, so nothing is read. */
const NO_WORDS: ReviewDialogWords = {
  title: "",
  description: "",
  confirmLabel: "",
  placeholder: "",
  tone: "default",
};

/**
 * The reason dialog of a review table (scope #36), shared by every row of one kind of review: which
 * row it asks about, whether it is open, and what sending does. It uses the shared `ReasonDialog`
 * of spec 0023, and the kind (landlord or room) says which routes, codes, key and words are its own.
 *
 * A hide and an unhide write, then the row takes the answer (the whole moderation row after the
 * change) and the list is read again before the dialog closes, so a status filter drops a row that
 * no longer fits and the total is the server's. The `dashboardKey` entries are marked out of date
 * too, because the numbers of the hidden reviews that the dashboard shows are the totals of these
 * lists under the filter "Admin đã ẩn". Another admin who was first (409) closes the dialog and says
 * so in a toast, because the list is the truth now. A writer who deleted the review (404) does the
 * same, and the row leaves the page at once. Every other failure is thrown to `ReasonDialog`, which
 * shows it inside and keeps what was typed.
 *
 * The button that opened the dialog may be gone when it closes, so focus goes to a button of the
 * same row, and to the heading of the results when the row left the list.
 */
export function useReviewModeration<Row extends ReviewRow>(
  kind: ReviewModerationKind<Row>,
) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<Row | null>(null);
  const [open, setOpen] = useState(false);
  const { remember, onCloseAutoFocus } = useReturnFocus(() =>
    rowFocusTarget(target?.id),
  );

  const write = useMutation({
    mutationFn: ({ review, reason }: { review: Row; reason: string }) =>
      reviewActionOf(review.status) === "hide"
        ? kind.hide(api, review.id, reason)
        : kind.unhide(api, review.id, reason),
  });

  // The list is the truth after a write: read it again and wait for it, so the dialog closes on
  // rows that already show the new state.
  const refresh = async () => {
    void queryClient.invalidateQueries({ queryKey: dashboardKey });
    await queryClient.invalidateQueries({ queryKey: kind.listKey });
  };

  const ask = (review: Row) => {
    remember();
    setTarget(review);
    setOpen(true);
  };

  const submit = async (reason: string) => {
    if (target === null) return;
    const hiding = reviewActionOf(target.status) === "hide";
    let answer: Row;
    try {
      answer = await write.mutateAsync({ review: target, reason });
    } catch (error) {
      const outcome = classifyReviewWriteError(error, kind.codes);
      if (outcome === "other") throw error;
      if (outcome === "gone") {
        queryClient.setQueriesData<Page<Row>>(
          { queryKey: kind.listKey },
          (page) => (page === undefined ? page : withoutRow(page, target.id)),
        );
      }
      await refresh();
      toast(
        outcome === "state-changed"
          ? kind.words.stateChangedToast
          : kind.words.goneToast,
      );
      setOpen(false);
      return;
    }
    queryClient.setQueriesData<Page<Row>>({ queryKey: kind.listKey }, (page) =>
      page === undefined ? page : withAnswer(page, answer),
    );
    await refresh();
    toast.success(
      hiding
        ? kind.words.hiddenToast(target)
        : kind.words.unhiddenToast(target),
    );
    setOpen(false);
  };

  const words =
    target === null
      ? NO_WORDS
      : reviewActionOf(target.status) === "hide"
        ? kind.words.hideDialog(target)
        : kind.words.unhideDialog(target);

  return {
    ...words,
    open,
    ask,
    submit,
    onOpenChange: setOpen,
    onCloseAutoFocus,
  };
}
