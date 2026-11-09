// What a failed write means for the reviews zone (spec 0013, AC-14). Pure: no React.

import { isApiError } from "@/lib/api/errors";

/** Which of the three writes failed. Some codes mean something different for each. */
export type ReviewAction = "create" | "update" | "delete";

/** What to read again so the zone shows what is true now. */
export interface ReloadPlan {
  /** `GET /review`: whether I have a review and whether I may write one. */
  mine: boolean;
  /** Every page of the public list of this landlord. */
  lists: boolean;
  /** The shared profile query: the count and the average at the top of the page. */
  profile: boolean;
}

export interface ReviewFailure {
  /**
   * The sentence to show in place of the message of the error, or `null` to keep the message the
   * error brings. A 400 about a field, a 429 and a network or server failure return `null`: they
   * are shown by `useFormFailure` (field messages, the countdown, `describeError`).
   */
  message: string | null;
  reload: ReloadPlan;
  /**
   * A delete that found no review to delete. The review is gone, which is what the person wanted,
   * so the caller runs the steps of a delete that worked and says `message` (AC-14).
   */
  alreadyDone: boolean;
}

const NOTHING: ReloadPlan = { mine: false, lists: false, profile: false };
const KEEP: ReviewFailure = {
  message: null,
  reload: NOTHING,
  alreadyDone: false,
};

export const ALREADY_REVIEWED_MESSAGE = "Bạn đã đánh giá chủ trọ này rồi.";
export const HIDDEN_MESSAGE =
  "Đánh giá này đang bị quản trị viên ẩn nên không sửa được. Bạn có thể xóa rồi viết lại.";
export const REVIEW_GONE_MESSAGE =
  "Không tìm thấy đánh giá của bạn. Có thể bạn đã xóa nó ở nơi khác.";
export const ALREADY_DELETED_MESSAGE = "Đánh giá đã được xóa trước đó.";
export const LANDLORD_GONE_MESSAGE = "Chủ trọ này không còn.";
export const NO_PERMISSION_MESSAGE = "Bạn không có quyền đánh giá.";

/**
 * The meaning of one failed create, edit or delete. The draft is kept in every case, and nothing is
 * sent again by itself: a write is not safe to repeat. A 401 and `ACCOUNT_LOCKED` are not here: the
 * session layer ends the session (spec 0002).
 */
export function classifyReviewError(
  error: unknown,
  action: ReviewAction,
): ReviewFailure {
  if (!isApiError(error)) return KEEP;

  switch (error.code) {
    // The server's own sentence says why. `mine` is read again, so the form gives way to the hint.
    case "REVIEW_NOT_ELIGIBLE":
      return { ...KEEP, reload: { ...NOTHING, mine: true } };

    // Written already, perhaps in another tab: the pinned row appears. The profile is read again
    // too (AC-14 names `mine` and the lists), because that review is also in the count and the
    // average at the top, which would otherwise disagree with the list under them.
    case "REVIEW_ALREADY_EXISTS":
      return {
        ...KEEP,
        message: ALREADY_REVIEWED_MESSAGE,
        reload: { mine: true, lists: true, profile: true },
      };

    // An admin hid it meanwhile: the editor closes and the hidden row shows.
    case "REVIEW_HIDDEN":
      return {
        ...KEEP,
        message: HIDDEN_MESSAGE,
        reload: { ...NOTHING, mine: true },
      };

    case "REVIEW_NOT_FOUND":
      if (action === "delete") {
        return { ...KEEP, message: ALREADY_DELETED_MESSAGE, alreadyDone: true };
      }
      return action === "update"
        ? {
            ...KEEP,
            message: REVIEW_GONE_MESSAGE,
            reload: { mine: true, lists: true, profile: true },
          }
        : KEEP;

    // The landlord was locked or deleted since the page opened: the profile is read again, so the
    // page says so in its own words.
    case "LANDLORD_NOT_FOUND":
      return {
        ...KEEP,
        message: LANDLORD_GONE_MESSAGE,
        reload: { ...NOTHING, profile: true },
      };

    case "PERMISSION_DENIED":
    case "CANNOT_REVIEW_SELF":
      return {
        ...KEEP,
        message: error.message.trim() === "" ? NO_PERMISSION_MESSAGE : null,
        reload: { ...NOTHING, mine: true },
      };

    default:
      return KEEP;
  }
}
