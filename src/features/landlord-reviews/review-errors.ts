// The words and codes of the landlord reviews area for the shared classifier (spec 0013, AC-14, and
// spec 0014, AC-22). The meaning of each failure is in `reviews/review-errors.ts`.

import {
  classifyReviewFailure,
  type ReviewClassifier,
  type ReviewVocabulary,
} from "@/features/reviews/review-errors";

export const ALREADY_REVIEWED_MESSAGE = "Bạn đã đánh giá chủ trọ này rồi.";
export const LANDLORD_GONE_MESSAGE = "Chủ trọ này không còn.";

export const LANDLORD_VOCABULARY: ReviewVocabulary = {
  codes: {
    notEligible: "REVIEW_NOT_ELIGIBLE",
    alreadyExists: "REVIEW_ALREADY_EXISTS",
    hidden: "REVIEW_HIDDEN",
    notFound: "REVIEW_NOT_FOUND",
    subjectGone: "LANDLORD_NOT_FOUND",
  },
  alreadyReviewedMessage: ALREADY_REVIEWED_MESSAGE,
  goneMessage: LANDLORD_GONE_MESSAGE,
};

/** The shared classifier, in the words of a landlord. */
export const classifyLandlordReview: ReviewClassifier = (error, action) =>
  classifyReviewFailure(error, action, LANDLORD_VOCABULARY);
