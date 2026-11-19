// The landlord reviews, as the hide flow sees them (scope #36, api-for-frontend.md 6.40).

import { authorName } from "@/features/reviews/text";
import type { AdminReview } from "@/lib/api/types";
import {
  GONE_TOAST,
  HIDE_CONFIRM,
  HIDE_PLACEHOLDER,
  HIDE_TITLE,
  STATE_CHANGED_TOAST,
  UNHIDE_CONFIRM,
  UNHIDE_PLACEHOLDER,
  UNHIDE_TITLE,
  hiddenToast,
  landlordHideDescription,
  landlordUnhideDescription,
  unhiddenToast,
} from "./admin-reviews-text";
import { adminLandlordReviewsKey } from "./api/admin-reviews-keys";
import { hideLandlordReview, unhideLandlordReview } from "./api/moderation";
import type { ReviewModerationKind } from "./review-kind";

export const LANDLORD_REVIEW_KIND: ReviewModerationKind<AdminReview> = {
  listKey: adminLandlordReviewsKey,
  hide: hideLandlordReview,
  unhide: unhideLandlordReview,
  codes: { stateInvalid: "REVIEW_STATE_INVALID", notFound: "REVIEW_NOT_FOUND" },
  words: {
    hideDialog: (review) => ({
      title: HIDE_TITLE,
      description: landlordHideDescription(authorName(review.author.name)),
      confirmLabel: HIDE_CONFIRM,
      placeholder: HIDE_PLACEHOLDER,
      tone: "destructive",
    }),
    unhideDialog: (review) => ({
      title: UNHIDE_TITLE,
      description: landlordUnhideDescription(authorName(review.author.name)),
      confirmLabel: UNHIDE_CONFIRM,
      placeholder: UNHIDE_PLACEHOLDER,
      tone: "default",
    }),
    hiddenToast: (review) => hiddenToast(authorName(review.author.name)),
    unhiddenToast: (review) => unhiddenToast(authorName(review.author.name)),
    stateChangedToast: STATE_CHANGED_TOAST,
    goneToast: GONE_TOAST,
  },
};
