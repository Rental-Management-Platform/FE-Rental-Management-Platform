"use client";

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import type { AdminReview } from "@/lib/api/types";
import { authorName } from "@/features/reviews/text";
import { useApi } from "@/lib/session/auth-provider";
import { ADMIN_REVIEWS_PATH } from "../admin-reviews-path";
import {
  COLUMN_LANDLORD,
  LANDLORD_NO_REVIEWS_DESCRIPTION,
  LANDLORD_ZONE_FAILED_TITLE,
  LANDLORD_ZONE_TABLE_CAPTION,
  NO_NAME,
  reviewsHeading,
} from "../admin-reviews-text";
import {
  ADMIN_REVIEWS_PAGE_SIZE,
  adminLandlordReviewsQuery,
} from "../api/moderation";
import { ReviewCards } from "./review-cards";
import { ReviewListZone, type ReviewListWords } from "./review-list-zone";
import { ReviewTable } from "./review-table";

const WORDS: ReviewListWords = {
  heading: reviewsHeading,
  failedTitle: LANDLORD_ZONE_FAILED_TITLE,
  noneDescription: LANDLORD_NO_REVIEWS_DESCRIPTION,
};

const pageHref = (page: number) =>
  page > 1 ? `${ADMIN_REVIEWS_PATH}?page=${page}` : ADMIN_REVIEWS_PATH;

const authorOf = (review: AdminReview) => (
  <span className="block truncate" title={authorName(review.author.name)}>
    {authorName(review.author.name)}
  </span>
);

const landlordOf = (review: AdminReview) => {
  const name = review.landlord.name?.trim()
    ? review.landlord.name.trim()
    : NO_NAME;
  return (
    <span className="block truncate" title={name}>
      {name}
    </span>
  );
};

/**
 * The reviews of landlords (scope #36, `GET /moderation/reviews`): the first tab of the page. It
 * reads its own list, under its own keys, and draws it in the shared list zone.
 */
export function LandlordReviewsZone({ page }: { page: number }) {
  const api = useApi();
  const query = useQuery(adminLandlordReviewsQuery(api, { page }));

  return (
    <Card>
      <ReviewListZone
        query={query}
        page={page}
        pageSize={ADMIN_REVIEWS_PAGE_SIZE}
        filtered={false}
        clearHref={ADMIN_REVIEWS_PATH}
        pageHref={pageHref}
        words={WORDS}
        renderTable={(rows) => (
          <ReviewTable
            rows={rows}
            caption={LANDLORD_ZONE_TABLE_CAPTION}
            subjectHeader={COLUMN_LANDLORD}
            subject={landlordOf}
            author={authorOf}
          />
        )}
        renderCards={(rows) => (
          <ReviewCards
            rows={rows}
            subjectHeader={COLUMN_LANDLORD}
            subject={landlordOf}
            author={authorOf}
          />
        )}
      />
    </Card>
  );
}
