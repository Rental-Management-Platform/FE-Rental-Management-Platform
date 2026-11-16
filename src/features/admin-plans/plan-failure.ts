// What went wrong with a delete or a sale switch, as the page needs to tell it (scope #22). Pure:
// no React, no router.

import { describeError, isApiError, type ApiError } from "@/lib/api/errors";

export type PlanFailure =
  /** 429: the wait counts down and the buttons stay off until it ends. */
  | { kind: "rate-limited"; error: ApiError }
  /** 409 `PLAN_IN_USE`: the plan has an order, so it can only be turned off. */
  | { kind: "in-use" }
  /** 404 `PLAN_NOT_FOUND`: another admin deleted it first. */
  | { kind: "gone" }
  /** Anything else: the message of the answer, and the support code for a 5xx. */
  | { kind: "message"; message: string; requestId: string | null };

/** Sorts a failed delete or switch into what the page does about it. */
export function classifyPlanError(error: unknown): PlanFailure {
  if (isApiError(error)) {
    if (error.status === 429) return { kind: "rate-limited", error };
    if (error.code === "PLAN_IN_USE") return { kind: "in-use" };
    if (error.code === "PLAN_NOT_FOUND") return { kind: "gone" };
  }
  const { message, requestId } = describeError(error);
  return { kind: "message", message, requestId };
}
