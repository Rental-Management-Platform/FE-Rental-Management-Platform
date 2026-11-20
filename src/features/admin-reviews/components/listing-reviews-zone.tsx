"use client";

import { useQuery } from "@tanstack/react-query";
import { ReasonDialog } from "@/components/form/reason-dialog";
import { Card } from "@/components/ui/card";
import { listingLabel } from "@/features/admin-listings/admin-listings-text";
import { authorName } from "@/features/reviews/text";
import type { AdminListingReview, Uuid } from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import {
  COLUMN_LISTING,
  LISTING_NO_REVIEWS_DESCRIPTION,
  LISTING_ZONE_FAILED_TITLE,
  LISTING_ZONE_TABLE_CAPTION,
  reviewAbout,
  reviewsHeading,
} from "../admin-reviews-text";
import {
  ADMIN_REVIEWS_PAGE_SIZE,
  adminListingReviewsQuery,
} from "../api/moderation";
import { useReviewModeration } from "../hooks/use-review-moderation";
import { LISTING_REVIEW_KIND } from "../listing-kind";
import {
  adminReviewsHref,
  clearFilters,
  hasFilters,
  type ListingFilters,
} from "../review-filter";
import { filteredAuthorLabel, filteredListingTitle } from "../review-row";
import { AuthorCell } from "./author-cell";
import { ReviewCards } from "./review-cards";
import { ReviewFilterBar } from "./review-filter-bar";
import { ReviewListingCell } from "./review-listing-cell";
import { ReviewListZone, type ReviewListWords } from "./review-list-zone";
import { ReviewRowActions } from "./review-row-actions";
import { ReviewTable } from "./review-table";

const WORDS: ReviewListWords = {
  heading: reviewsHeading,
  failedTitle: LISTING_ZONE_FAILED_TITLE,
  noneDescription: LISTING_NO_REVIEWS_DESCRIPTION,
};

/**
 * The reviews of rooms (scope #36, `GET /moderation/listing-reviews`): the second tab of the page.
 * It reads its own list, under its own keys, and draws it in the same list zone as the landlord
 * tab, under its own filters (the status, the listing and the writer, and never a landlord: the API
 * answers that with 400). Each row has a "Ẩn" or "Gỡ ẩn" button that opens the one reason dialog of
 * the zone, and the id it sends is the id of the review.
 */
export function ListingReviewsZone({
  filters,
  page,
}: {
  filters: ListingFilters;
  page: number;
}) {
  const api = useApi();
  const query = useQuery(adminListingReviewsQuery(api, { ...filters, page }));
  const moderation = useReviewModeration(LISTING_REVIEW_KIND);

  const authorHref = (authorId: Uuid) =>
    adminReviewsHref({ ...filters, authorId }, 1);
  const authorOf = (review: AdminListingReview) => (
    <AuthorCell name={review.author.name} href={authorHref(review.author.id)} />
  );
  const listingOf = (review: AdminListingReview) => (
    <ReviewListingCell
      listing={review.listing}
      filterHref={
        filters.listingId === review.listing.id
          ? null
          : adminReviewsHref({ ...filters, listingId: review.listing.id }, 1)
      }
    />
  );
  const rowActions = (review: AdminListingReview, size: "sm" | "lg") => (
    <ReviewRowActions
      review={review}
      about={reviewAbout(
        authorName(review.author.name),
        listingLabel(review.listing),
      )}
      author={authorName(review.author.name)}
      subjectLabel={COLUMN_LISTING}
      subject={listingLabel(review.listing)}
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
        listingLabel={
          filters.listingId === null
            ? ""
            : filteredListingTitle(query.data?.items, filters.listingId)
        }
      />
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
              caption={LISTING_ZONE_TABLE_CAPTION}
              subjectHeader={COLUMN_LISTING}
              subject={listingOf}
              author={authorOf}
              actions={(review) => rowActions(review, "sm")}
            />
          )}
          renderCards={(rows) => (
            <ReviewCards
              rows={rows}
              subjectHeader={COLUMN_LISTING}
              subject={listingOf}
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
