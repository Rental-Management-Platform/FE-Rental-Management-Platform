// What a failed "Mua" means for the page (spec 0021, AC-8 to AC-11). Pure: no React, no router.

import { isApiError, type ApiError } from "@/lib/api/errors";

/**
 * The five things a failed `POST /orders` can be, by what the page does next:
 * - `plan-gone`: the plan was taken off sale or deleted since the page loaded. A warning with the
 *   backend sentence, and the plans are read again. The older unpaid order is untouched.
 * - `rate-limited`: 429. The shared notice counts the wait down and the buttons stay disabled.
 * - `denied`: 403 `PERMISSION_DENIED`. A warning, and the buttons are hidden for the visit.
 * - `session`: 401 or `ACCOUNT_LOCKED`. The session layer ends the session (spec 0002), so the
 *   page draws no notice of its own.
 * - `other`: network, timeout, 5xx, 400, anything else. A red alert, and the buttons stay.
 */
export type BuyFailure =
  | { kind: "plan-gone"; message: string }
  | { kind: "rate-limited"; error: ApiError }
  | { kind: "denied"; message: string }
  | { kind: "session" }
  | { kind: "other"; error: unknown };

/**
 * Sorts a failed create by its status and code. A message is kept only when the backend's own
 * sentence is shown as it is (the three kinds above that carry one). Anything that is not an
 * `ApiError` is `other`, which `describeError` turns into a plain sentence.
 */
export function classifyBuyError(error: unknown): BuyFailure {
  if (!isApiError(error)) return { kind: "other", error };

  const { status, code, message } = error;
  if (status === 429) return { kind: "rate-limited", error };
  if (status === 401 || code === "ACCOUNT_LOCKED") return { kind: "session" };
  if (
    (status === 409 && code === "PLAN_INACTIVE") ||
    (status === 404 && code === "PLAN_NOT_FOUND")
  ) {
    return { kind: "plan-gone", message };
  }
  if (status === 403 && code === "PERMISSION_DENIED") {
    return { kind: "denied", message };
  }
  return { kind: "other", error };
}
