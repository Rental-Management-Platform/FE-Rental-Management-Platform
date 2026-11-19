// What a failed hide or unhide means to the page (scope #36). Pure: no React, no router.

import { isApiError, type ErrorCode } from "@/lib/api/errors";

/**
 * The two error codes that differ between the two kinds of review (api-for-frontend.md 6.40 and
 * 6.41): the codes of a landlord review and the ones of a room review (`LISTING_REVIEW_*`).
 */
export interface ReviewErrorCodes {
  /** 409: the review was already hidden, or is not hidden, by the time the request got there. */
  stateInvalid: ErrorCode;
  /** 404: no such review, because the writer deleted it. */
  notFound: ErrorCode;
}

/**
 * Sorts a failed hide or unhide:
 * - `state-changed`: 409, another admin moved the review first, so the button on screen was for a
 *   state that is gone;
 * - `gone`: 404, the writer deleted the review (a delete wins over a hide);
 * - `other`: anything else, which stays inside the dialog (a 400 on the reason, a 429, a 403, a
 *   5xx, a network error).
 * The first two are not faults of this admin: the list is the truth now, so the page closes the
 * dialog, reads the list again and says what happened. A 401 and a 403 `ACCOUNT_LOCKED` end the
 * session in the session layer, with nothing page specific.
 */
export type ReviewWriteOutcome = "state-changed" | "gone" | "other";

export function classifyReviewWriteError(
  error: unknown,
  codes: ReviewErrorCodes,
): ReviewWriteOutcome {
  if (isApiError(error)) {
    if (error.status === 409 && error.code === codes.stateInvalid) {
      return "state-changed";
    }
    if (error.status === 404 && error.code === codes.notFound) return "gone";
  }
  return "other";
}
