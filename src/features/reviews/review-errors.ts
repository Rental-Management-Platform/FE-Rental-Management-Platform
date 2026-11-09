// What a failed write means for a reviews area (spec 0013, AC-14, and spec 0014, AC-17). Pure: no
// React. The shared part knows the meaning of each code; a subject (a landlord, a room) hands in its
// own vocabulary: the five codes that differ and the two sentences that name the subject.

import { isApiError } from "@/lib/api/errors";

/** Which of the three writes failed. Some codes mean something different for each. */
export type ReviewAction = "create" | "update" | "delete";

/** What to read again so the area shows what is true now. */
export interface ReloadPlan {
  /** `GET /review`: whether I have a review and whether I may write one. */
  mine: boolean;
  /** Every page of the public list of this subject. */
  lists: boolean;
  /** The count and the average of the subject: the profile query, or the listing summary. */
  summary: boolean;
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
   * so the caller runs the steps of a delete that worked and says `message`.
   */
  alreadyDone: boolean;
  /**
   * The subject itself is gone (the landlord was locked, the listing was hidden): the error carries
   * the subject gone code. The subject decides what that means for the page (`onGone`).
   */
  gone: boolean;
}

/** The meaning of one failed write, bound to a subject's vocabulary. */
export type ReviewClassifier = (
  error: unknown,
  action: ReviewAction,
) => ReviewFailure;

/**
 * What differs between two subjects: the API codes of the five cases, and the two sentences that
 * name the subject. `PERMISSION_DENIED` and `CANNOT_REVIEW_SELF` are the same code for both, so they
 * are not here.
 */
export interface ReviewVocabulary {
  codes: {
    /** 403: the renter may not review yet. */
    notEligible: string;
    /** 409: a review of this subject exists already. */
    alreadyExists: string;
    /** 409: an edit of a review an admin hid. */
    hidden: string;
    /** 404: there is no review of mine to edit or delete. */
    notFound: string;
    /** 404: the subject is locked, deleted or hidden since the page opened. */
    subjectGone: string;
  };
  /** "Bạn đã đánh giá chủ trọ này rồi." */
  alreadyReviewedMessage: string;
  /** "Chủ trọ này không còn." */
  goneMessage: string;
}

const NOTHING: ReloadPlan = { mine: false, lists: false, summary: false };
const KEEP: ReviewFailure = {
  message: null,
  reload: NOTHING,
  alreadyDone: false,
  gone: false,
};

export const HIDDEN_MESSAGE =
  "Đánh giá này đang bị quản trị viên ẩn nên không sửa được. Bạn có thể xóa rồi viết lại.";
export const REVIEW_GONE_MESSAGE =
  "Không tìm thấy đánh giá của bạn. Có thể bạn đã xóa nó ở nơi khác.";
export const ALREADY_DELETED_MESSAGE = "Đánh giá đã được xóa trước đó.";
export const NO_PERMISSION_MESSAGE = "Bạn không có quyền đánh giá.";

/**
 * The meaning of one failed create, edit or delete, in the words of one subject. The draft is kept
 * in every case, and nothing is sent again by itself: a write is not safe to repeat. A 401 and
 * `ACCOUNT_LOCKED` are not here: the session layer ends the session (spec 0002).
 */
export function classifyReviewFailure(
  error: unknown,
  action: ReviewAction,
  vocabulary: ReviewVocabulary,
): ReviewFailure {
  if (!isApiError(error)) return KEEP;
  const { codes } = vocabulary;

  switch (error.code) {
    // The server's own sentence says why. `mine` is read again, so the form gives way to the hint.
    case codes.notEligible:
      return { ...KEEP, reload: { ...NOTHING, mine: true } };

    // Written already, perhaps in another tab: the pinned row appears. The summary is read again
    // too (the contract names `mine` and the lists), because that review is also in the count and
    // the average at the top, which would otherwise disagree with the list under them.
    case codes.alreadyExists:
      return {
        ...KEEP,
        message: vocabulary.alreadyReviewedMessage,
        reload: { mine: true, lists: true, summary: true },
      };

    // An admin hid it meanwhile: the editor closes and the hidden row shows.
    case codes.hidden:
      return {
        ...KEEP,
        message: HIDDEN_MESSAGE,
        reload: { ...NOTHING, mine: true },
      };

    case codes.notFound:
      if (action === "delete") {
        return { ...KEEP, message: ALREADY_DELETED_MESSAGE, alreadyDone: true };
      }
      return action === "update"
        ? {
            ...KEEP,
            message: REVIEW_GONE_MESSAGE,
            reload: { mine: true, lists: true, summary: true },
          }
        : KEEP;

    // The subject was locked, deleted or hidden since the page opened. Nothing is read again here:
    // the subject says what the page does about it (`onGone`).
    case codes.subjectGone:
      return { ...KEEP, message: vocabulary.goneMessage, gone: true };

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
