// The room reviews, as the hide flow sees them (scope #36, api-for-frontend.md 6.41). Its codes,
// its two routes and its list key are its own: the id of a room review is never the id of a landlord
// review, and a route of one kind answers 404 to an id of the other.

import { listingLabel } from "@/features/admin-listings/admin-listings-text";
import { authorName } from "@/features/reviews/text";
import type { AdminListingReview } from "@/lib/api/types";
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
  listingHideDescription,
  listingUnhideDescription,
  unhiddenToast,
} from "./admin-reviews-text";
import { adminListingReviewsKey } from "./api/admin-reviews-keys";
import { hideListingReview, unhideListingReview } from "./api/moderation";
import type { ReviewModerationKind } from "./review-kind";

export const LISTING_REVIEW_KIND: ReviewModerationKind<AdminListingReview> = {
  listKey: adminListingReviewsKey,
  hide: hideListingReview,
  unhide: unhideListingReview,
  codes: {
    stateInvalid: "LISTING_REVIEW_STATE_INVALID",
    notFound: "LISTING_REVIEW_NOT_FOUND",
  },
  words: {
    hideDialog: (review) => ({
      title: HIDE_TITLE,
      description: listingHideDescription(
        authorName(review.author.name),
        listingLabel(review.listing),
      ),
      confirmLabel: HIDE_CONFIRM,
      placeholder: HIDE_PLACEHOLDER,
      tone: "destructive",
    }),
    unhideDialog: (review) => ({
      title: UNHIDE_TITLE,
      description: listingUnhideDescription(
        authorName(review.author.name),
        listingLabel(review.listing),
      ),
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
