import { BookOpenIcon, HouseIcon, SearchXIcon } from "lucide-react";
import Link from "next/link";
import { ListPagination } from "@/components/list-pagination";
import { ListingCard } from "@/components/listing-card";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { isApiError } from "@/lib/api/errors";
import type { Page, PublicListingSummary } from "@/lib/api/types";
import { formatCount } from "@/lib/format";
import { getListings } from "../api/get-listings";
import {
  LISTING_PAGE_SIZE,
  parseListingSearch,
} from "../schemas/search-params";
import { listingsHref } from "../search-href";
import { ListingsFailure } from "./listings-failure";

// What Next.js hands a page as `searchParams`.
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// The keyword in the heading is cut so a long one cannot push the count off the screen.
const HEADING_KEYWORD_LENGTH = 60;

const headingKeyword = (q: string) =>
  q.length > HEADING_KEYWORD_LENGTH
    ? `${q.slice(0, HEADING_KEYWORD_LENGTH)}…`
    : q;

// The list itself, read on the server as a guest. It reads `searchParams`, so the page keeps it
// inside a <Suspense> boundary and the header and the search card stay in the static shell.
export async function Results({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q, page } = parseListingSearch(await searchParams);

  let result: Page<PublicListingSummary>;
  try {
    result = await getListings(q, page);
  } catch (error) {
    // Anything that is not an `ApiError` is a bug: the route's `error.tsx` shows it.
    if (!isApiError(error)) throw error;
    return (
      <section aria-labelledby="results-title" className="flex flex-col gap-4">
        <h2 id="results-title" className="text-lg">
          Kết quả tìm kiếm
        </h2>
        <ListingsFailure
          status={error.status}
          code={error.code}
          message={error.message}
          requestId={error.requestId}
          retryAfterSeconds={error.retryAfterSeconds}
          retryAfterExact={error.retryAfterExact}
        />
      </section>
    );
  }

  const lastPage = Math.max(1, Math.ceil(result.total / LISTING_PAGE_SIZE));
  const pagination = (
    <ListPagination
      page={result.page}
      pageSize={LISTING_PAGE_SIZE}
      total={result.total}
      hrefFor={(to) => listingsHref({ q, page: to })}
      itemLabel="tin"
      size="lg"
      className="mt-2"
    />
  );

  return (
    <section aria-labelledby="results-title" className="flex flex-col gap-4">
      <h2 id="results-title" aria-live="polite" className="text-lg">
        {formatCount(result.total)} tin phù hợp
        {q !== "" && ` với “${headingKeyword(q)}”`}
      </h2>

      {result.items.length > 0 ? (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((listing, index) => (
              // `grid` lets the card fill the cell, so cards of one row are equally high.
              <li key={listing.id} className="grid">
                <ListingCard listing={listing} eagerPhoto={index === 0} />
              </li>
            ))}
          </ul>
          {pagination}
        </>
      ) : result.total === 0 && q !== "" ? (
        <EmptyState
          icon={SearchXIcon}
          title="Không có tin nào phù hợp"
          description="Thử đổi từ khóa để xem thêm phòng."
          action={
            <Button asChild variant="outline" size="lg">
              <Link href="/">Xóa tìm kiếm</Link>
            </Button>
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
                <Link href={listingsHref({ q, page: lastPage })}>
                  Xem trang cuối
                </Link>
              </Button>
            }
          />
          {pagination}
        </>
      )}
    </section>
  );
}
