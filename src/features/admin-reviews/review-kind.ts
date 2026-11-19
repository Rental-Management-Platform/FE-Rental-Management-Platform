// What differs between the two kinds of review when an admin hides or unhides one (scope #36). The
// flow of a hide is the same for both, so it is written once (`useReviewModeration`), and each kind
// hands it this: its own two routes, its own error codes, the key of its own list and its own
// words. Pure data and functions: no React, no session.

import type { ApiClient } from "@/lib/api/client";
import type { Uuid } from "@/lib/api/types";
import type { ReviewErrorCodes } from "./review-failure";
import type { ReviewRow } from "./review-row";

/** The words of the reason dialog for one row and one action. */
export interface ReviewDialogWords {
  title: string;
  description: string;
  confirmLabel: string;
  /** An example of a reason. It goes in the field, never under it. */
  placeholder: string;
  tone: "default" | "destructive";
}

export interface ReviewModerationKind<Row extends ReviewRow> {
  /**
   * The key every page of this kind's list starts with. A write edits and marks only these, never
   * the list of the other kind: the ids of the two kinds come from different tables.
   */
  listKey: readonly unknown[];
  /** The two routes. `:id` is the id of the review, whichever kind it is. */
  hide: (api: ApiClient, id: Uuid, reason: string) => Promise<Row>;
  unhide: (api: ApiClient, id: Uuid, reason: string) => Promise<Row>;
  codes: ReviewErrorCodes;
  words: {
    hideDialog: (review: Row) => ReviewDialogWords;
    unhideDialog: (review: Row) => ReviewDialogWords;
    hiddenToast: (review: Row) => string;
    unhiddenToast: (review: Row) => string;
    /** Another admin moved the review first (409). */
    stateChangedToast: string;
    /** The writer deleted the review (404). */
    goneToast: string;
  };
}
