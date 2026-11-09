"use client";

import { reviewRole } from "@/features/reviews/access";
import { RatingLine } from "@/features/reviews/components/rating-line";
import { ReviewsZoneView } from "@/features/reviews/components/reviews-zone-view";
import { useReviewPage } from "@/features/reviews/hooks/use-review-page";
import type { ReviewSubject } from "@/features/reviews/types";
import { isUuid } from "@/lib/is-uuid";
import { useSession } from "@/lib/session/auth-provider";
import { useListingSummary } from "../hooks/use-listing-summary";
import { useMyListingReview } from "../hooks/use-my-review";
import { useListingReviewActions } from "../hooks/use-review-actions";
import { useListingReviewList } from "../hooks/use-review-list";
import { classifyListingReview } from "../review-errors";
import {
  LISTING_GUEST_LABEL,
  LISTING_REVIEWS_ANCHOR,
  LISTING_REVIEWS_HEADING,
} from "../texts";

type ListingReviewsProps = {
  /** The UUID `id` of the listing detail: the review calls take it, never the slug or the code. */
  id: string;
  /** The 8 character code, for the summary read (`GET /listings/:code`). */
  code: string;
  /** For the hint's message button (spec 0014, AC-9). */
  title: string;
  landlord: { id: string; name: string | null };
  /** The two numbers the server read: the first values of the score line. */
  reviewCount: number;
  ratingAverage: number | null;
};

/**
 * The "Đánh giá phòng" block at the bottom of the listing page (spec 0014, AC-1). It reads in the
 * browser only: the server HTML holds the skeleton with the heading and the score, and no review
 * text. It reads `reviewPage` from the address, so the page keeps it inside a `<Suspense>`
 * boundary. An `id` that is not a UUID makes no request and draws nothing.
 */
export function ListingReviews(props: ListingReviewsProps) {
  if (!isUuid(props.id)) return null;
  return <Block {...props} />;
}

function Block({ id, code, reviewCount, ratingAverage }: ListingReviewsProps) {
  const session = useSession();
  const role = reviewRole(session);
  const summary = useListingSummary(id, code, { reviewCount, ratingAverage });
  // The page of reviews changes the address with the native History API, so the server renders
  // nothing for it (AC-14).
  const { page, setPage } = useReviewPage("history");
  const list = useListingReviewList(id, page);
  const mine = useMyListingReview(id, role === "writer");
  const actions = useListingReviewActions(id);

  const subject: ReviewSubject = {
    list,
    mine,
    actions,
    classify: classifyListingReview,
    heading: LISTING_REVIEWS_HEADING,
    // The numbers of the summary read: never the length of the list, never reduced for my own.
    summary: (
      <p className="text-sm text-muted-foreground">
        <RatingLine
          reviewCount={summary.data.reviewCount}
          ratingAverage={summary.data.ratingAverage}
        />
      </p>
    ),
    guestLabel: LISTING_GUEST_LABEL,
    // The hint (AC-9) and the rule for a vanished listing (AC-16) come with milestone 3.
    hint: null,
    onGone: () => undefined,
  };

  return (
    <ReviewsZoneView
      id={LISTING_REVIEWS_ANCHOR}
      role={role}
      page={page}
      setPage={setPage}
      subject={subject}
    />
  );
}
