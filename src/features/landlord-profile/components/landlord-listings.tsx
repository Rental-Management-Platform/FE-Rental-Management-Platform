import { BookOpenIcon, HouseIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListPagination } from "@/components/list-pagination";
import { ListingCard } from "@/components/listing-card";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { ListingsFailure } from "@/features/listing-search/components/listings-failure";
import {
  LISTING_PAGE_SIZE,
  parsePageParam,
} from "@/features/listing-search/schemas/search-params";
import { isApiError } from "@/lib/api/errors";
import type { Page, PublicListingSummary } from "@/lib/api/types";
import { formatCount } from "@/lib/format";
import { listingPath } from "@/lib/listing-path";
import { getLandlordListings } from "../api/get-landlord-listings";
import { LISTINGS_ANCHOR, landlordListingsHref } from "../landlord-id";

// What Next.js hands a page as `searchParams`.
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const TITLE_ID = "landlord-listings-title";

// The section that holds the list, with the id the reviews hint links to (spec 0013). The offset
// keeps the heading clear of the sticky site header when a link or a page change scrolls to it.
function ListingsSection({ children }: { children: React.ReactNode }) {
  return (
    <section
      id={LISTINGS_ANCHOR}
      aria-labelledby={TITLE_ID}
      className="flex scroll-mt-24 flex-col gap-4"
    >
      {children}
    </section>
  );
}

/**
 * The listings a landlord has visible, read on the server as a guest (api-for-frontend.md, 6.36).
 * It reads `searchParams` (only `page`), so the page keeps it inside a <Suspense> boundary and the
 * profile above it stays in the shell. The cards are the ones of the search page, standing on the
 * canvas, never inside a zone. This part has no filter and no sort: the contract has none.
 */
export async function LandlordListings({
  landlordId,
  searchParams,
}: {
  landlordId: string;
  searchParams: SearchParams;
}) {
  const page = parsePageParam((await searchParams).page);

  let result: Page<PublicListingSummary>;
  try {
    result = await getLandlordListings(landlordId, page);
  } catch (error) {
    // Anything that is not an `ApiError` is a bug: the route's `error.tsx` shows it.
    if (!isApiError(error)) throw error;
    // The profile read can say "not found" too: both answer the same, and the page says so once.
    if (error.code === "LANDLORD_NOT_FOUND") notFound();
    return (
      <ListingsSection>
        <h2 id={TITLE_ID} className="text-lg">
          Tin đang hiện
        </h2>
        <ListingsFailure
          status={error.status}
          code={error.code}
          message={error.message}
          requestId={error.requestId}
          retryAfterSeconds={error.retryAfterSeconds}
          retryAfterExact={error.retryAfterExact}
          title="Không tải được tin của chủ trọ"
        />
      </ListingsSection>
    );
  }

  const lastPage = Math.max(1, Math.ceil(result.total / LISTING_PAGE_SIZE));
  const pagination = (
    <ListPagination
      page={result.page}
      pageSize={LISTING_PAGE_SIZE}
      total={result.total}
      hrefFor={(to) => landlordListingsHref(landlordId, to)}
      itemLabel="tin"
      size="lg"
      className="mt-2"
    />
  );

  return (
    <ListingsSection>
      <h2 id={TITLE_ID} aria-live="polite" className="text-lg">
        {result.total === 0
          ? "Tin đang hiện"
          : `${formatCount(result.total)} tin đang hiện`}
      </h2>

      {result.items.length > 0 ? (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((listing, index) => (
              // `grid` lets the card fill the cell, so cards of one row are equally high.
              <li key={listing.id} className="grid">
                <ListingCard
                  listing={listing}
                  href={listingPath(listing.slug, listing.code)}
                  eagerPhoto={index === 0}
                />
              </li>
            ))}
          </ul>
          {pagination}
        </>
      ) : result.total === 0 ? (
        <EmptyState
          icon={HouseIcon}
          title="Chủ trọ chưa có tin nào đang hiện"
          description="Hãy quay lại sau, chủ trọ có thể sẽ đăng tin mới."
        />
      ) : (
        <>
          <EmptyState
            icon={BookOpenIcon}
            title="Trang này không có tin"
            action={
              <Button asChild variant="outline" size="lg">
                <Link href={landlordListingsHref(landlordId, lastPage)}>
                  Xem trang cuối
                </Link>
              </Button>
            }
          />
          {pagination}
        </>
      )}
    </ListingsSection>
  );
}
