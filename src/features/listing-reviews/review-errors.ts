// The words and codes of the room reviews block for the shared classifier (spec 0014, AC-17). The
// meaning of each failure is in `reviews/review-errors.ts`.

import {
  classifyReviewFailure,
  type ReviewClassifier,
  type ReviewVocabulary,
} from "@/features/reviews/review-errors";

export const ALREADY_REVIEWED_MESSAGE = "Bạn đã đánh giá phòng này rồi.";
export const LISTING_GONE_MESSAGE = "Tin này không còn.";

export const LISTING_VOCABULARY: ReviewVocabulary = {
  codes: {
    notEligible: "LISTING_REVIEW_NOT_ELIGIBLE",
    alreadyExists: "LISTING_REVIEW_ALREADY_EXISTS",
    hidden: "LISTING_REVIEW_HIDDEN",
    notFound: "LISTING_REVIEW_NOT_FOUND",
    subjectGone: "LISTING_NOT_FOUND",
  },
  alreadyReviewedMessage: ALREADY_REVIEWED_MESSAGE,
  goneMessage: LISTING_GONE_MESSAGE,
};

/** The shared classifier, in the words of a room. */
export const classifyListingReview: ReviewClassifier = (error, action) =>
  classifyReviewFailure(error, action, LISTING_VOCABULARY);
