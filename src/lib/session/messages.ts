// What the person reads when the session is not a plain signed in one (spec 0005, AC-10 and
// AC-11). Fixed sentences, written here once so the login page, the gate and the account area
// say the same thing.

import type { EndedReason } from "./create-session";

/** The title of every "cannot check your account" view. */
export const UNAVAILABLE_TITLE = "Không kiểm tra được tài khoản";

export const UNAVAILABLE_MESSAGE =
  "Hệ thống chưa trả lời. Bạn có thể vẫn đang đăng nhập, hãy thử lại.";

export const RETRY_LABEL = "Thử lại";

const ENDED_MESSAGES: Record<Exclude<EndedReason, "unavailable">, string> = {
  expired: "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.",
  revoked:
    "Phiên đăng nhập đã bị đóng ở nơi khác hoặc bởi quản trị viên. Hãy đăng nhập lại.",
  locked: "Tài khoản của bạn đã bị khóa. Hãy liên hệ quản trị viên.",
};

/** Why the person was signed out, or `null` when there is nothing to say. */
export function endedMessage(reason: EndedReason | null): string | null {
  return reason === null || reason === "unavailable"
    ? null
    : ENDED_MESSAGES[reason];
}
