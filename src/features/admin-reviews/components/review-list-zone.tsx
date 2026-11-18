"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { BookOpenIcon, LockIcon, StarIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ListPagination } from "@/components/list-pagination";
import { EmptyState } from "@/components/states/empty-state";
import { LoadingState } from "@/components/states/loading-state";
import { Button } from "@/components/ui/button";
import { ListFailure } from "@/features/admin-catalog/components/list-failure";
import { isApiError } from "@/lib/api/errors";
import type { Page } from "@/lib/api/types";
import { lastPageOf } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import { RESULTS_HEADING_ID } from "../admin-reviews-path";
import {
  ADMIN_REVIEWS_FORBIDDEN_MESSAGE,
  CLEAR_FILTERS,
  NO_MATCH_TITLE,
  NO_REVIEWS_TITLE,
  PAGE_EMPTY_TITLE,
  PAGINATION_ITEM_LABEL,
  VIEW_LAST_PAGE,
} from "../admin-reviews-text";

/** The words that differ between the lists of the two kinds of review. */
export interface ReviewListWords {
  /** The title row: "12 đánh giá". */
  heading: (total: number) => string;
  /** The title of the error when the first read fails. */
  failedTitle: string;
  /** The line of the empty state when nothing is filtered and there is no review at all. */
  noneDescription: string;
}

/**
 * The body of one list of reviews inside its zone (scope #36), the same for both kinds: loading,
 * the failed first read with "Thử lại", a read the backend refused, the count as a heading that is
 * read out again when it changes, the two empty states, a page past the last one, the table from
 * `md` and the blocks below it, and the page links. It draws no row itself: the kind of list
 * hands in `renderTable` and `renderCards`, and the zone around it is the caller's `Card`.
 *
 * A page past the last one (typed by hand) goes to the last page that has rows, never while the rows
 * on screen are the ones of the page before.
 */
export function ReviewListZone<Row extends { id: string }>({
  query,
  page,
  pageSize,
  filtered,
  clearHref,
  pageHref,
  words,
  renderTable,
  renderCards,
}: {
  query: UseQueryResult<Page<Row>>;
  page: number;
  pageSize: number;
  /** True when a filter is set, which turns the empty state into "nothing matched". */
  filtered: boolean;
  /** The clean address, for "Xóa bộ lọc". */
  clearHref: string;
  /** The address of a page of the filters now on screen. */
  pageHref: (page: number) => string;
  words: ReviewListWords;
  renderTable: (rows: readonly Row[]) => ReactNode;
  renderCards: (rows: readonly Row[]) => ReactNode;
}) {
  const router = useRouter();
  const { data } = query;

  const lastPage = data === undefined ? 1 : lastPageOf(data.total, pageSize);
  const lastHref = pageHref(lastPage);
  const pastTheEnd =
    data !== undefined &&
    !query.isPlaceholderData &&
    data.total > 0 &&
    data.items.length === 0 &&
    page > lastPage;
  useEffect(() => {
    if (pastTheEnd) router.replace(lastHref);
  }, [pastTheEnd, router, lastHref]);

  if (data === undefined) {
    if (
      isApiError(query.error) &&
      query.error.status === 403 &&
      query.error.code === "PERMISSION_DENIED"
    ) {
      return (
        <EmptyState icon={LockIcon} title={ADMIN_REVIEWS_FORBIDDEN_MESSAGE} />
      );
    }
    return query.isError ? (
      <ListFailure
        error={query.error}
        title={words.failedTitle}
        onRetry={() => void query.refetch()}
      />
    ) : (
      <LoadingState variant="table" />
    );
  }

  return (
    <section aria-labelledby={RESULTS_HEADING_ID} className="flex flex-col">
      {/* The count is read out again when it changes. With no rows the empty state below says it,
          so the heading is for a screen reader only. `tabIndex` lets code send focus here when the
          row of a write left the list. */}
      <h2
        id={RESULTS_HEADING_ID}
        tabIndex={-1}
        aria-live="polite"
        className={cn(
          "px-(--card-spacing) pt-4 pb-3 text-base outline-hidden",
          data.total === 0 && "sr-only",
        )}
      >
        {words.heading(data.total)}
      </h2>

      {data.total === 0 ? (
        filtered ? (
          <EmptyState
            icon={StarIcon}
            title={NO_MATCH_TITLE}
            action={
              <Button asChild variant="outline" size="lg">
                <Link href={clearHref}>{CLEAR_FILTERS}</Link>
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={StarIcon}
            title={NO_REVIEWS_TITLE}
            description={words.noneDescription}
          />
        )
      ) : data.items.length === 0 ? (
        pastTheEnd ? (
          <LoadingState variant="table" />
        ) : (
          <EmptyState
            icon={BookOpenIcon}
            title={PAGE_EMPTY_TITLE}
            action={
              <Button asChild variant="outline" size="lg">
                <Link href={lastHref}>{VIEW_LAST_PAGE}</Link>
              </Button>
            }
          />
        )
      ) : (
        <>
          {/* The same rows twice: a table from `md` and stacked blocks below it. The hidden one is
              `display: none`, so a screen reader reads only one. */}
          <div className="hidden md:block">{renderTable(data.items)}</div>
          <div className="md:hidden">{renderCards(data.items)}</div>
        </>
      )}

      {data.total > pageSize && (
        <div className="border-t px-(--card-spacing) py-4">
          <ListPagination
            page={page}
            pageSize={pageSize}
            total={data.total}
            hrefFor={pageHref}
            itemLabel={PAGINATION_ITEM_LABEL}
          />
        </div>
      )}
    </section>
  );
}
