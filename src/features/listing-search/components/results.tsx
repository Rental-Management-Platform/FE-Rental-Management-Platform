import { ListPagination } from "@/components/list-pagination";
import { ListingCard } from "@/components/listing-card";
import { formatCount } from "@/lib/format";
import { getListings } from "../api/get-listings";
import {
  LISTING_PAGE_SIZE,
  parseListingSearch,
} from "../schemas/search-params";
import { listingsHref } from "../search-href";

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
  const result = await getListings(q, page);

  return (
    <section aria-labelledby="results-title" className="flex flex-col gap-4">
      <h2 id="results-title" aria-live="polite" className="text-lg">
        {formatCount(result.total)} tin phù hợp
        {q !== "" && ` với “${headingKeyword(q)}”`}
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {result.items.map((listing, index) => (
          // `grid` lets the card fill the cell, so cards of one row are equally high.
          <li key={listing.id} className="grid">
            <ListingCard listing={listing} eagerPhoto={index === 0} />
          </li>
        ))}
      </ul>
      <ListPagination
        page={result.page}
        pageSize={LISTING_PAGE_SIZE}
        total={result.total}
        hrefFor={(to) => listingsHref({ q, page: to })}
        itemLabel="tin"
        size="lg"
        className="mt-2"
      />
    </section>
  );
}
