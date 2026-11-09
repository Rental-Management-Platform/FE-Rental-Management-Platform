// What a failed send means for the message box (spec 0012, AC-5 and AC-16). Pure: no React.

import { isApiError } from "@/lib/api/errors";

/** Why the box cannot send for now, beyond what the text in it says. */
export type ComposerLock =
  /** The other person cannot receive messages (locked or deleted). The history still reads. */
  | "peer-unavailable"
  /** The listing was hidden or deleted while the dialog was open: nothing can be sent to it. */
  | "listing-gone";

/** `open` is the first message of a renter in the dialog, `send` is a message in a conversation. */
export type SendKind = "open" | "send";

export interface SendFailure {
  /**
   * Replaces the message of the error, or `null` to keep it. Only for failures that are not about
   * one input: a 400 about the text keeps its own message under the box.
   */
  message: string | null;
  lock: ComposerLock | null;
  /**
   * No answer came back (network, time out), so the message may have arrived all the same. The
   * conversation page then reads once at once, and keeps its button locked until that read ends.
   */
  maybeDelivered: boolean;
  /** The conversation does not exist for this person (any more): the whole page says so. */
  conversationGone: boolean;
}

const KEEP: SendFailure = {
  message: null,
  lock: null,
  maybeDelivered: false,
  conversationGone: false,
};

export const LISTING_GONE_MESSAGE = "Tin này vừa được ẩn hoặc xóa.";
export const NO_PERMISSION_MESSAGE = "Bạn không có quyền nhắn tin.";

export function classifySendError(error: unknown, kind: SendKind): SendFailure {
  if (!isApiError(error)) return KEEP;

  switch (error.code) {
    // Keep the server's sentence ("Người kia hiện không nhận được tin nhắn.").
    case "CHAT_PEER_UNAVAILABLE":
      return { ...KEEP, lock: "peer-unavailable" };
    case "LISTING_NOT_FOUND":
      return kind === "open"
        ? { ...KEEP, message: LISTING_GONE_MESSAGE, lock: "listing-gone" }
        : KEEP;
    case "CONVERSATION_NOT_FOUND":
      return { ...KEEP, conversationGone: true };
    // `ACCOUNT_LOCKED` is not here: the session layer ends the session (spec 0002).
    case "PERMISSION_DENIED":
      return { ...KEEP, message: NO_PERMISSION_MESSAGE };
    case "NETWORK_ERROR":
    case "TIMEOUT":
      return { ...KEEP, maybeDelivered: true };
    default:
      return KEEP;
  }
}
