// The landlord reviews, as the hide flow sees them (scope #36, api-for-frontend.md 6.40).

import { authorName } from "@/features/reviews/text";
import type { AdminReview } from "@/lib/api/types";
import {
  LANDLORD_GONE_TOAST,
  LANDLORD_HIDE_CONFIRM,
  LANDLORD_HIDE_PLACEHOLDER,
  LANDLORD_HIDE_TITLE,
  LANDLORD_UNHIDE_CONFIRM,
  LANDLORD_UNHIDE_PLACEHOLDER,
  LANDLORD_UNHIDE_TITLE,
  STATE_CHANGED_TOAST,
  landlordHiddenToast,
  landlordHideDescription,
  landlordUnhiddenToast,
  landlordUnhideDescription,
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
      title: LANDLORD_HIDE_TITLE,
      description: landlordHideDescription(authorName(review.author.name)),
      confirmLabel: LANDLORD_HIDE_CONFIRM,
      placeholder: LANDLORD_HIDE_PLACEHOLDER,
      tone: "destructive",
    }),
    unhideDialog: (review) => ({
      title: LANDLORD_UNHIDE_TITLE,
      description: landlordUnhideDescription(authorName(review.author.name)),
      confirmLabel: LANDLORD_UNHIDE_CONFIRM,
      placeholder: LANDLORD_UNHIDE_PLACEHOLDER,
      tone: "default",
    }),
    hiddenToast: (review) =>
      landlordHiddenToast(authorName(review.author.name)),
    unhiddenToast: (review) =>
      landlordUnhiddenToast(authorName(review.author.name)),
    stateChangedToast: STATE_CHANGED_TOAST,
    goneToast: LANDLORD_GONE_TOAST,
  },
};
