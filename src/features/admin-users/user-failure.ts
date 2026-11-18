// What a failed write on an account means to the page (scope #20, spec 0023, AC-8). Pure: no
// React, no router.

import { isApiError } from "@/lib/api/errors";

/**
 * Sorts a failed lock, unlock or revoke:
 * - `already-locked`: 409 `ACCOUNT_ALREADY_LOCKED`, another admin locked it first;
 * - `already-active`: 409 `ACCOUNT_NOT_LOCKED`, another admin unlocked it first;
 * - `gone`: 404 `USER_NOT_FOUND`, the account no longer exists;
 * - `other`: anything else, which stays inside the dialog (a 400 on the reason, a 429, a 403, a
 *   5xx, a network error, and the 409 `CANNOT_LOCK_SELF` that only a stale screen can reach).
 * The first three are not faults of this admin: the list is the truth now, so the page closes the
 * dialog, reads the list again and says what happened.
 */
export type UserWriteOutcome =
  "already-locked" | "already-active" | "gone" | "other";

export function classifyUserError(error: unknown): UserWriteOutcome {
  if (isApiError(error)) {
    if (error.status === 409 && error.code === "ACCOUNT_ALREADY_LOCKED") {
      return "already-locked";
    }
    if (error.status === 409 && error.code === "ACCOUNT_NOT_LOCKED") {
      return "already-active";
    }
    if (error.status === 404 && error.code === "USER_NOT_FOUND") {
      return "gone";
    }
  }
  return "other";
}
