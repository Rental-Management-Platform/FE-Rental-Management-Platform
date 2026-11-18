// What a failed hide or unhide means to the page (scope #21). Pure: no React, no router.

import { isApiError } from "@/lib/api/errors";

/**
 * Sorts a failed hide or unhide:
 * - `state-changed`: 409 `LISTING_STATE_INVALID`, another admin (or the landlord) moved the listing
 *   first, so the button on screen was for a state that is gone;
 * - `gone`: 404 `LISTING_NOT_FOUND`, the landlord deleted the listing;
 * - `other`: anything else, which stays inside the dialog (a 400 on the reason, a 429, a 403, a
 *   5xx, a network error).
 * The first two are not faults of this admin: the list is the truth now, so the page closes the
 * dialog, reads the list again and says what happened. A 401 and a 403 `ACCOUNT_LOCKED` end the
 * session in the session layer, with nothing page specific.
 */
export type ModerationWriteOutcome = "state-changed" | "gone" | "other";

export function classifyModerationError(
  error: unknown,
): ModerationWriteOutcome {
  if (isApiError(error)) {
    if (error.status === 409 && error.code === "LISTING_STATE_INVALID") {
      return "state-changed";
    }
    if (error.status === 404 && error.code === "LISTING_NOT_FOUND") {
      return "gone";
    }
  }
  return "other";
}
