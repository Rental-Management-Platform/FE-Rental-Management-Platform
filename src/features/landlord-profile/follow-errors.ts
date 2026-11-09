import { describeError, isApiError } from "@/lib/api/errors";

export const LANDLORD_GONE_MESSAGE = "Chủ trọ này không còn.";
export const NO_FOLLOW_PERMISSION_MESSAGE =
  "Bạn không có quyền theo dõi chủ trọ.";
export const FOLLOW_SELF_MESSAGE = "Bạn không thể theo dõi chính mình.";

export type FollowFailure =
  /** A 429: the countdown notice shows the wait and the button stays locked until it ends. */
  | { kind: "rate-limited" }
  | {
      kind: "message";
      message: string;
      /** The profile must be read again, so the page shows what is true now. */
      reload: boolean;
    };

/**
 * What a failed follow or unfollow means for the button (api-for-frontend.md, 6.32). Pure: no
 * React. A 401 and `ACCOUNT_LOCKED` are not here: the session layer ends the session (spec 0002).
 * Nothing is sent again by itself: both calls are safe to repeat, but the person decides.
 */
export function classifyFollowError(error: unknown): FollowFailure {
  if (isApiError(error)) {
    if (error.status === 429) return { kind: "rate-limited" };
    switch (error.code) {
      // The landlord was locked or deleted since the page opened. Read again, so the page says so.
      case "LANDLORD_NOT_FOUND":
        return {
          kind: "message",
          message: LANDLORD_GONE_MESSAGE,
          reload: true,
        };
      case "CANNOT_FOLLOW_SELF":
        return {
          kind: "message",
          message: error.message || FOLLOW_SELF_MESSAGE,
          reload: false,
        };
      case "PERMISSION_DENIED":
        return {
          kind: "message",
          message: NO_FOLLOW_PERMISSION_MESSAGE,
          reload: false,
        };
    }
  }
  return {
    kind: "message",
    message: describeError(error).message,
    reload: false,
  };
}
