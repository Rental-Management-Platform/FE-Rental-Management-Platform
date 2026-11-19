"use client";

import { useQuery } from "@tanstack/react-query";
import { ReasonDialog } from "@/components/form/reason-dialog";
import { Card } from "@/components/ui/card";
import { authorName } from "@/features/reviews/text";
import type { AdminReview, Uuid } from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import {
  COLUMN_LANDLORD,
  LANDLORD_NO_REVIEWS_DESCRIPTION,
  LANDLORD_ZONE_FAILED_TITLE,
  LANDLORD_ZONE_TABLE_CAPTION,
  NO_NAME,
  reviewAbout,
  reviewsHeading,
} from "../admin-reviews-text";
import {
  ADMIN_REVIEWS_PAGE_SIZE,
  adminLandlordReviewsQuery,
} from "../api/moderation";
import { useReviewModeration } from "../hooks/use-review-moderation";
import { LANDLORD_REVIEW_KIND } from "../landlord-kind";
import {
  adminReviewsHref,
  clearFilters,
  hasFilters,
  type LandlordFilters,
} from "../review-filter";
import { filteredAuthorLabel } from "../review-row";
import { AuthorCell } from "./author-cell";
import { LandlordCell } from "./landlord-cell";
import { LandlordSelect } from "./landlord-select";
import { ReviewCards } from "./review-cards";
import { ReviewFilterBar } from "./review-filter-bar";
import { ReviewListZone, type ReviewListWords } from "./review-list-zone";
import { ReviewRowActions } from "./review-row-actions";
import { ReviewTable } from "./review-table";

const WORDS: ReviewListWords = {
  heading: reviewsHeading,
  failedTitle: LANDLORD_ZONE_FAILED_TITLE,
  noneDescription: LANDLORD_NO_REVIEWS_DESCRIPTION,
};

/**
 * The reviews of landlords (scope #36, `GET /moderation/reviews`): the first tab of the page. It
 * reads its own list, under its own keys, and draws it in the shared list zone, under its own
 * filters (the status, the landlord and the writer). Each row has a "Ẩn" or "Gỡ ẩn" button that opens
 * the one reason dialog of the zone.
 */
export function LandlordReviewsZone({
  filters,
  page,
}: {
  filters: LandlordFilters;
  page: number;
}) {
  const api = useApi();
  const query = useQuery(adminLandlordReviewsQuery(api, { ...filters, page }));
  const moderation = useReviewModeration(LANDLORD_REVIEW_KIND);

  const authorHref = (authorId: Uuid) =>
    adminReviewsHref({ ...filters, authorId }, 1);
  const authorOf = (review: AdminReview) => (
    <AuthorCell name={review.author.name} href={authorHref(review.author.id)} />
  );
  const landlordOf = (review: AdminReview) => (
    <LandlordCell landlord={review.landlord} />
  );
  const rowActions = (review: AdminReview, size: "sm" | "lg") => (
    <ReviewRowActions
      review={review}
      about={reviewAbout(
        authorName(review.author.name),
        review.landlord.name?.trim() || NO_NAME,
      )}
      size={size}
      onHide={moderation.ask}
      onUnhide={moderation.ask}
    />
  );

  return (
    <>
      <ReviewFilterBar
        filters={filters}
        authorLabel={
          filters.authorId === null
            ? ""
            : filteredAuthorLabel(query.data?.items, filters.authorId)
        }
      >
        <LandlordSelect filters={filters} />
      </ReviewFilterBar>
      <Card>
        <ReviewListZone
          query={query}
          page={page}
          pageSize={ADMIN_REVIEWS_PAGE_SIZE}
          filtered={hasFilters(filters)}
          clearHref={adminReviewsHref(clearFilters(filters), 1)}
          pageHref={(next) => adminReviewsHref(filters, next)}
          words={WORDS}
          renderTable={(rows) => (
            <ReviewTable
              rows={rows}
              caption={LANDLORD_ZONE_TABLE_CAPTION}
              subjectHeader={COLUMN_LANDLORD}
              subject={landlordOf}
              author={authorOf}
              actions={(review) => rowActions(review, "sm")}
            />
          )}
          renderCards={(rows) => (
            <ReviewCards
              rows={rows}
              subjectHeader={COLUMN_LANDLORD}
              subject={landlordOf}
              author={authorOf}
              actions={(review) => rowActions(review, "lg")}
            />
          )}
        />
      </Card>
      <ReasonDialog
        open={moderation.open}
        onOpenChange={moderation.onOpenChange}
        title={moderation.title}
        description={moderation.description}
        confirmLabel={moderation.confirmLabel}
        tone={moderation.tone}
        placeholder={moderation.placeholder}
        onSubmit={moderation.submit}
        onCloseAutoFocus={moderation.onCloseAutoFocus}
      />
    </>
  );
}
