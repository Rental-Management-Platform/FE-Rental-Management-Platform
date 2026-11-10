"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpenIcon, HeartIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ListPagination } from "@/components/list-pagination";
import { ListingCard } from "@/components/listing-card";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import { RateLimitNotice } from "@/components/states/rate-limit-notice";
import { Button } from "@/components/ui/button";
import { parsePageParam } from "@/features/listing-search/schemas/search-params";
import { isApiError } from "@/lib/api/errors";
import type { Page, SavedListing } from "@/lib/api/types";
import { formatCount } from "@/lib/format";
import { listingPath } from "@/lib/listing-path";
import { useApi } from "@/lib/session/auth-provider";
import { useCountdown } from "@/lib/use-countdown";
import { FAVORITES_PAGE_SIZE } from "../api/favorite-api";
import { savedListingsQuery } from "../api/favorite-queries";
import { lastSavedPage, savedHref } from "../saved-href";
import { SavedHeart } from "./saved-heart";

/**
 * The page "Tin đã lưu" (scope #14, api-for-frontend.md 6.33 and section 7). It runs in the
 * browser, because the list needs a login, and sits behind the route gate of the renter. The
 * page number is the `?page=` of the address. It reads `useSearchParams`, so the page keeps it
 * inside a `<Suspense>` boundary.
 *
 * The cards are the ones of the search page, with the date of the save. A press on a heart
 * unsaves, and the card leaves the page at once. The count in the heading changes with it and is
 * read out, and focus moves to the heading because the button that had it is gone.
 */
export function SavedScreen() {
  const page = parsePageParam(useSearchParams().get("page"));
  const api = useApi();
  const query = useQuery(savedListingsQuery(api, page));
  const heading = useRef<HTMLHeadingElement>(null);

  const { data } = query;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tin đã lưu"
        description="Những tin bạn đã lưu, tin lưu gần đây nhất nằm trên cùng."
      />

      {data === undefined && query.isError && (
        <SavedFailure
          error={query.error}
          onRetry={() => void query.refetch()}
        />
      )}
      {data === undefined && !query.isError && <SavedSkeleton />}

      {data !== undefined && (
        <SavedList
          data={data}
          headingRef={heading}
          onUnsaved={() => heading.current?.focus()}
        />
      )}
    </div>
  );
}

/**
 * One page of saved listings, whatever its answer is: rows, nothing saved, or a page past the
 * end. It only draws, so `/dev/ui` can show every case on fake rows.
 */
export function SavedList({
  data,
  headingRef,
  onUnsaved,
}: {
  data: Page<SavedListing>;
  headingRef?: React.Ref<HTMLHeadingElement>;
  onUnsaved: () => void;
}) {
  if (data.total === 0) return <SavedEmpty />;

  const lastPage = lastSavedPage(data.total, FAVORITES_PAGE_SIZE);
  const pagination = (
    <ListPagination
      page={data.page}
      pageSize={FAVORITES_PAGE_SIZE}
      total={data.total}
      hrefFor={savedHref}
      itemLabel="tin"
      size="lg"
      className="mt-2"
    />
  );

  return (
    <section aria-labelledby="saved-title" className="flex flex-col gap-4">
      {/* Focus lands here after an unsave, so the heading is focusable and has no ring of its
          own: the person did not tab to it. */}
      <h2
        id="saved-title"
        ref={headingRef}
        tabIndex={-1}
        aria-live="polite"
        className="text-lg outline-hidden"
      >
        {formatCount(data.total)} tin đã lưu
      </h2>

      {data.items.length > 0 ? (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((listing, index) => (
              // `grid` lets the card fill the cell, so cards of one row are equally high.
              <li key={listing.id} className="grid">
                <ListingCard
                  listing={listing}
                  href={listingPath(listing.slug, listing.code)}
                  eagerPhoto={index === 0}
                  savedAt={listing.favoritedAt}
                  heart={<SavedHeart listing={listing} onUnsaved={onUnsaved} />}
                />
              </li>
            ))}
          </ul>
          {pagination}
        </>
      ) : (
        <>
          <EmptyState
            icon={BookOpenIcon}
            title="Trang này không có tin"
            action={
              <Button asChild variant="outline" size="lg">
                <Link href={savedHref(lastPage)}>Xem trang cuối</Link>
              </Button>
            }
          />
          {pagination}
        </>
      )}
    </section>
  );
}

/** Nothing saved yet: the way to find a listing is the next step. */
export function SavedEmpty() {
  return (
    <EmptyState
      icon={HeartIcon}
      title="Bạn chưa lưu tin nào"
      description="Bấm hình trái tim ở một tin để lưu lại, rồi xem lại ở đây."
      action={
        <Button asChild size="lg">
          <Link href="/">Tìm trọ</Link>
        </Button>
      }
    />
  );
}

export function SavedSkeleton() {
  return (
    <div aria-busy="true">
      <span role="status" className="sr-only">
        Đang tải tin đã lưu
      </span>
      <LoadingState variant="cards" />
    </div>
  );
}

// A failed first read: a 429 shows the wait counting down, anything else the error. "Thử lại"
// stays off while the wait runs.
export function SavedFailure({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  const secondsLeft = useCountdown(error);
  if (isApiError(error) && error.status === 429) {
    return (
      <div className="flex flex-col gap-4">
        <RateLimitNotice error={error} />
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="self-start"
          onClick={onRetry}
          disabled={secondsLeft > 0}
        >
          Thử lại
        </Button>
      </div>
    );
  }
  return (
    <ErrorState
      error={error}
      title="Không tải được tin đã lưu"
      onRetry={onRetry}
    />
  );
}
