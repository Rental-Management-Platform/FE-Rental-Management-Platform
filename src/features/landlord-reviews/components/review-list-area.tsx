"use client";

import { ListPagination } from "@/components/list-pagination";
import type { Page, PublicReview } from "@/lib/api/types";
import { listView, pageCount, REVIEWS_PAGE_SIZE } from "../review-list";
import {
  ListFailure,
  NoReviews,
  OnlyMyReview,
  PastLastPage,
} from "./list-states";
import { ReviewList } from "./review-list";
import { ReviewRowsSkeleton } from "./reviews-zone-skeleton";

type ReviewListAreaProps = {
  /** Nothing to show yet: the session is still loading, or the first read is pending. */
  loading: boolean;
  /** The answer of the list, or `undefined` when it failed. */
  list: Page<PublicReview> | undefined;
  /** What the failed read threw. */
  error: unknown;
  /** The rows are the old page, kept while the next one loads: the list is marked busy. */
  busy: boolean;
  /** The page of the address (`reviewPage`). */
  page: number;
  /**
   * The `total` of the list, or the last one that came back when this read failed, or `null`
   * before any answer. The pagination is built from it (AC-11).
   */
  total: number | null;
  onPageChange: (page: number) => void;
  onRetry: () => void;
};

/**
 * Everything under the write block (spec 0013, AC-3, AC-4, AC-11, AC-12 and AC-13): the rows, the
 * odd page lines, the failure notice, and the pagination. It only draws, so `/dev/ui` can show the
 * zone on fake data (25 reviews over three pages) with the same logic. The pure `listView` decides
 * what the answer means.
 *
 * The pagination stays whenever there is more than one page: also under a page that holds only
 * the viewer's own review, under a page past the last, and under a page that failed to load.
 */
export function ReviewListArea({
  loading,
  list,
  error,
  busy,
  page,
  total,
  onPageChange,
  onRetry,
}: ReviewListAreaProps) {
  return (
    <>
      {loading ? (
        <ReviewRowsSkeleton />
      ) : list === undefined ? (
        <ListFailure error={error} onRetry={onRetry} />
      ) : (
        <ListView list={list} busy={busy} onFirstPage={() => onPageChange(1)} />
      )}

      {total !== null && pageCount(total) > 1 && (
        <ListPagination
          page={page}
          pageSize={REVIEWS_PAGE_SIZE}
          total={total}
          itemLabel="đánh giá"
          size="lg"
          onPageChange={onPageChange}
        />
      )}
    </>
  );
}

// What one answer of the list draws (AC-12), decided by the pure `listView`.
function ListView({
  list,
  busy,
  onFirstPage,
}: {
  list: Page<PublicReview>;
  busy: boolean;
  onFirstPage: () => void;
}) {
  const view = listView(list);

  switch (view.kind) {
    case "empty":
      return <NoReviews />;
    case "rows":
      return <ReviewList rows={view.rows} busy={busy} />;
    case "only-mine":
      return <OnlyMyReview />;
    case "past-end":
      return <PastLastPage onFirstPage={onFirstPage} />;
  }
}
