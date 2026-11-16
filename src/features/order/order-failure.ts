// What a failed pay or cancel means for the page (spec 0022, AC-9 to AC-12). Pure: no React, no
// router.

import { isApiError, type ApiError } from "@/lib/api/errors";

/**
 * The seven things a failed `POST /orders/:id/pay` or `/cancel` can be, by what the page does next:
 * - `plan-gone`: 409 `PLAN_INACTIVE` on a pay. The plan was turned off, the order stays pending. A
 *   warning with the backend sentence and two ways out.
 * - `conflict`: 409 `ORDER_STATE_INVALID`. The order was paid or cancelled in another tab. A warning
 *   with the backend sentence, and the order is read again so the view shows its real status.
 * - `rate-limited`: 429. The shared notice counts the wait down and the buttons stay locked.
 * - `denied`: 403 `PERMISSION_DENIED`. A warning, and both buttons are hidden for the visit.
 * - `not-found`: 404 `ORDER_NOT_FOUND` or 403 `NOT_RESOURCE_OWNER`. The page switches to the not
 *   found state, which says nothing about whether the order exists.
 * - `session`: 401 or `ACCOUNT_LOCKED`. The session layer ends the session (spec 0002), so the
 *   page draws no notice of its own.
 * - `other`: network, timeout, 5xx, 400, anything else. A red alert, and the buttons stay.
 */
export type OrderFailure =
  | { kind: "plan-gone"; message: string }
  | { kind: "conflict"; message: string }
  | { kind: "rate-limited"; error: ApiError }
  | { kind: "denied"; message: string }
  | { kind: "not-found" }
  | { kind: "session" }
  | { kind: "other"; error: unknown };

/**
 * Sorts a failed pay or cancel by its status and code. A message is kept only when the backend's
 * own sentence is shown as it is. Anything that is not an `ApiError` is `other`, which
 * `describeError` turns into a plain sentence. Pay and cancel share every rule, so there is one
 * function for both.
 */
export function classifyOrderError(error: unknown): OrderFailure {
  if (!isApiError(error)) return { kind: "other", error };

  const { status, code, message } = error;
  if (status === 429) return { kind: "rate-limited", error };
  if (status === 401 || code === "ACCOUNT_LOCKED") return { kind: "session" };
  if (status === 409 && code === "PLAN_INACTIVE") {
    return { kind: "plan-gone", message };
  }
  if (status === 409 && code === "ORDER_STATE_INVALID") {
    return { kind: "conflict", message };
  }
  if (
    (status === 404 && code === "ORDER_NOT_FOUND") ||
    (status === 403 && code === "NOT_RESOURCE_OWNER")
  ) {
    return { kind: "not-found" };
  }
  if (status === 403 && code === "PERMISSION_DENIED") {
    return { kind: "denied", message };
  }
  return { kind: "other", error };
}
