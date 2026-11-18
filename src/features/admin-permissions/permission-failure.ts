// What went wrong with a save of one account type, as the page needs to tell it (scope #24). Pure:
// no React, no router.

import { describeError, isApiError, type ApiError } from "@/lib/api/errors";

export type SaveFailure =
  /** 429: the wait counts down and the save button stays off until it ends. */
  | { kind: "rate-limited"; error: ApiError }
  /**
   * Anything else. `details` are the lines the backend put in `errors[]` (for the two 400 answers
   * `PERMISSION_UNKNOWN` and `PERMISSION_ADMIN_ONLY` they name the keys that caused it), and
   * `requestId` is the support code of a 5xx.
   */
  | {
      kind: "message";
      message: string;
      details: string[];
      requestId: string | null;
    };

/** Sorts a failed save into what the page shows for that type. */
export function classifySaveError(error: unknown): SaveFailure {
  if (isApiError(error) && error.status === 429) {
    return { kind: "rate-limited", error };
  }
  const { message, requestId } = describeError(error);
  const details = isApiError(error)
    ? error.errors.map((entry) => entry.message)
    : [];
  return { kind: "message", message, details, requestId };
}
