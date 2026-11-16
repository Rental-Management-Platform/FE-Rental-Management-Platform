import {
  quotaRefusalOf,
  type QuotaRefusal,
} from "@/features/membership/refusal";
import { describeError, isApiError, type ApiError } from "@/lib/api/errors";
import type { OwnerListingDetail } from "@/lib/api/types";

// What a failed hide, show or delete means for the row or the dialog that asked (spec 0019,
// AC-6, AC-7 and AC-8). Pure: no React. A 401 and `ACCOUNT_LOCKED` are not here: the session
// layer ends the session (spec 0002). Nothing is sent again by itself: the person decides.

export const LISTING_GONE_MESSAGE = "Tin này không còn.";
export const STATE_CHANGED_MESSAGE =
  "Trạng thái của tin vừa thay đổi. Hãy thử lại.";

export type ToggleAction = "hide" | "show";

export type ToggleFailure =
  /**
   * `MEMBERSHIP_REQUIRED` or `LISTING_QUOTA_REACHED`: the backend's own sentence at the row, with
   * the code, so the row can show the way out of it (spec 0020, AC-8).
   */
  | ({ kind: "blocked" } & QuotaRefusal)
  /** The state moved under the page (409 `LISTING_STATE_INVALID`, 403 `LISTING_HIDDEN_BY_ADMIN`): read it again. */
  | { kind: "conflict" }
  /** 404 `LISTING_NOT_FOUND`: another tab deleted it. */
  | { kind: "gone" }
  | { kind: "rate-limited"; error: ApiError }
  /** Not yours, not allowed, the network, anything else. */
  | { kind: "message"; message: string };

export function classifyToggleError(error: unknown): ToggleFailure {
  const refusal = quotaRefusalOf(error);
  if (refusal !== null) return { kind: "blocked", ...refusal };
  if (isApiError(error)) {
    if (error.status === 429) return { kind: "rate-limited", error };
    switch (error.code) {
      case "LISTING_STATE_INVALID":
      case "LISTING_HIDDEN_BY_ADMIN":
        return { kind: "conflict" };
      case "LISTING_NOT_FOUND":
        return { kind: "gone" };
    }
  }
  return { kind: "message", message: describeError(error).message };
}

export type DeleteFailure =
  /** 404: it is already gone, which is what the person wanted. */
  | { kind: "gone" }
  | { kind: "rate-limited"; error: ApiError }
  | { kind: "message"; message: string };

export function classifyDeleteError(error: unknown): DeleteFailure {
  if (isApiError(error)) {
    if (error.status === 429) return { kind: "rate-limited", error };
    if (error.code === "LISTING_NOT_FOUND") return { kind: "gone" };
  }
  return { kind: "message", message: describeError(error).message };
}

/**
 * The sentence for a row whose state moved, from the state the server holds now. An admin's hide
 * names the reason the admin gave, as it came.
 */
export function conflictMessage(
  action: ToggleAction,
  current: Pick<OwnerListingDetail, "status" | "moderationReason">,
): string {
  if (current.status === "hidden_by_admin") {
    const reason = current.moderationReason?.trim();
    return reason
      ? `Admin vừa ẩn tin này. Lý do: ${reason}`
      : "Admin vừa ẩn tin này.";
  }
  if (action === "hide" && current.status === "hidden_by_owner") {
    return "Tin này đã được ẩn rồi.";
  }
  if (action === "show" && current.status === "visible") {
    return "Tin này đang hiện rồi.";
  }
  return STATE_CHANGED_MESSAGE;
}
