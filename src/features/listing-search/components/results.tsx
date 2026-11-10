import { BookOpenIcon, HouseIcon, SearchXIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ListPagination } from "@/components/list-pagination";
import { ListingCard } from "@/components/listing-card";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { ListFavorites } from "@/features/favorites/components/list-favorites";
import { ListingHeart } from "@/features/favorites/components/listing-heart";
import { isApiError } from "@/lib/api/errors";
import type { Page, PublicListingSummary } from "@/lib/api/types";
import { formatCount } from "@/lib/format";
import { listingPath } from "@/lib/listing-path";
import { getListings, listingsQuery } from "../api/get-listings";
import {
  LISTING_PAGE_SIZE,
  parseListingSearch,
} from "../schemas/search-params";
import { listingsHref, withoutFilters, withoutKeyword } from "../search-href";
import { hasFilters, hasKeyword, isReversedRange } from "../search-state";
import { noMatchHint, shortKeyword } from "../text";
import { ListingsFailure } from "./listings-failure";
import { PriceRangeNotice } from "./price-range-notice";
import { ResultsHeading } from "./results-heading";
import { SortLinks } from "./sort-links";

// What Next.js hands a page as `searchParams`.
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// The frame of every state of the results area, with the heading that takes focus (spec 0016,
// AC-15). A state with no count (a failure, a reversed range) has the plain heading.
function ResultsSection({ children }: { children: ReactNode }) {
  return (
    <section aria-labelledby="results-title" className="flex flex-col gap-4">
      {children}
    </section>
  );
}

// The list itself, read on the server as a guest. It reads `searchParams`, so the page keeps it
// inside a <Suspense> boundary and the header and the search card stay in the static shell.
export async function Results({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const search = parseListingSearch(await searchParams);
  const { q } = search;

  // The one state the API would answer 400 to: it is not sent, the person is told (AC-4).
  if (isReversedRange(search)) {
    return (
      <ResultsSection>
        <ResultsHeading id="results-title" className="text-lg">
          Kết quả tìm kiếm
        </ResultsHeading>
        <PriceRangeNotice search={search} />
      </ResultsSection>
    );
  }

  let result: Page<PublicListingSummary>;
  try {
    result = await getListings(search);
  } catch (error) {
    // Anything that is not an `ApiError` is a bug: the route's `error.tsx` shows it.
    if (!isApiError(error)) throw error;
    return (
      <ResultsSection>
        <ResultsHeading id="results-title" className="text-lg">
          Kết quả tìm kiếm
        </ResultsHeading>
        <ListingsFailure
          status={error.status}
          code={error.code}
          message={error.message}
          requestId={error.requestId}
          retryAfterSeconds={error.retryAfterSeconds}
          retryAfterExact={error.retryAfterExact}
        />
      </ResultsSection>
    );
  }

  const keyword = hasKeyword(search);
  const filters = hasFilters(search);
  const lastPage = Math.max(1, Math.ceil(result.total / LISTING_PAGE_SIZE));
  const pagination = (
    <ListPagination
      page={result.page}
      pageSize={LISTING_PAGE_SIZE}
      total={result.total}
      hrefFor={(to) => listingsHref({ ...search, page: to })}
      itemLabel="tin"
      size="lg"
      className="mt-2"
    />
  );

  return (
    <ResultsSection>
      {/* The heading and the order links share a row, and the links drop under it when narrow. */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <ResultsHeading
          id="results-title"
          aria-live="polite"
          className="text-lg"
        >
          {formatCount(result.total)} tin phù hợp
          {keyword && ` với “${shortKeyword(q)}”`}
        </ResultsHeading>
        {result.items.length > 0 && <SortLinks search={search} />}
      </div>

      {result.items.length > 0 ? (
        <>
          {/* The hearts (scope #14) colour in from a second read with the token, made in the
              browser by the wrapper. The cards stay what the server drew. */}
          <ListFavorites path="/listings" query={listingsQuery(search)}>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {result.items.map((listing, index) => (
                // `grid` lets the card fill the cell, so cards of one row are equally high.
                <li key={listing.id} className="grid">
                  <ListingCard
                    listing={listing}
                    href={listingPath(listing.slug, listing.code)}
                    eagerPhoto={index === 0}
                    heart={
                      <ListingHeart id={listing.id} title={listing.title} />
                    }
                  />
                </li>
              ))}
            </ul>
          </ListFavorites>
          {pagination}
        </>
      ) : result.total === 0 && (keyword || filters) ? (
        <EmptyState
          icon={SearchXIcon}
          title="Không có tin nào phù hợp"
          description={noMatchHint(keyword, filters)}
          action={
            <>
              {filters && (
                <Button asChild variant="outline" size="lg">
                  <Link href={listingsHref(withoutFilters(search))}>
                    Xóa bộ lọc
                  </Link>
                </Button>
              )}
              {keyword && (
                <Button asChild variant="outline" size="lg">
                  <Link href={listingsHref(withoutKeyword(search))}>
                    Xóa tìm kiếm
                  </Link>
                </Button>
              )}
            </>
          }
        />
      ) : result.total === 0 ? (
        <EmptyState
          icon={HouseIcon}
          title="Chưa có tin nào được đăng"
          description="Hãy quay lại sau, chủ trọ sẽ sớm đăng tin mới."
        />
      ) : (
        <>
          <EmptyState
            icon={BookOpenIcon}
            title="Trang này không có tin"
            action={
              <Button asChild variant="outline" size="lg">
                <Link href={listingsHref({ ...search, page: lastPage })}>
                  Xem trang cuối
                </Link>
              </Button>
            }
          />
          {pagination}
        </>
      )}
    </ResultsSection>
  );
}
