import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingState } from "@/components/states/loading-state";
import { Card, CardContent } from "@/components/ui/card";
import { Results } from "@/features/listing-search/components/results";
import { ResultsBoundary } from "@/features/listing-search/components/results-boundary";
import {
  SearchBox,
  SearchBoxFallback,
} from "@/features/listing-search/components/search-box";
import { parseListingSearch } from "@/features/listing-search/schemas/search-params";
import { listingsHref } from "@/features/listing-search/search-href";
import {
  hasKeyword,
  isPlainList,
} from "@/features/listing-search/search-state";
import {
  FILTERED_LIST_TITLE,
  filteredListDescription,
  LISTING_LIST_DESCRIPTION,
  shortKeyword,
} from "@/features/listing-search/text";
import { getWards } from "@/features/wards/api/get-wards";
import { SITE_NAME } from "@/lib/site";

// Metadata from the cleaned address only, with no API call (spec 0009, AC-12, and spec 0016,
// AC-16). The plain list page is indexed, `?page=N` included, and has its own canonical address,
// so `?page=abc` canonicalises to `/`. Every other address (a keyword, a ward, a price, an order
// other than the newest first) is `noindex, follow` with itself as the canonical: each one costs
// an API call, and `robots.txt` blocks them too. The ward name is not used here, because reading
// it would need the catalog in the metadata.
export async function generateMetadata({
  searchParams,
}: PageProps<"/">): Promise<Metadata> {
  const search = parseListingSearch(await searchParams);
  const plain = isPlainList(search);
  const pageSuffix = search.page > 1 ? `, trang ${search.page}` : "";
  const shown = shortKeyword(search.q);

  const title = hasKeyword(search)
    ? `Kết quả cho “${shown}”${pageSuffix}`
    : plain
      ? `Tìm phòng trọ${pageSuffix}`
      : `${FILTERED_LIST_TITLE}${pageSuffix}`;
  const description = hasKeyword(search)
    ? `Các tin cho thuê phù hợp với “${shown}” trên ${SITE_NAME}.`
    : plain
      ? LISTING_LIST_DESCRIPTION
      : filteredListDescription(SITE_NAME);
  const canonical = listingsHref(search);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "vi_VN",
      title,
      description,
      url: canonical,
    },
    ...(!plain && { robots: { index: false, follow: true } }),
  };
}

// Reads the ward catalog on the server, then draws the live search bar with it as a prop, so a
// ward in the address shows its name on the first render (spec 0016, AC-10). `getWards` keeps the
// catalog for an hour and decides what a failed read means: `null` on a live page (the bar gets no
// catalog and its ward box reads it in the browser), a thrown error while `next build` renders
// the page or when it is a bug.
async function SearchBar() {
  const wards = await getWards();
  return <SearchBox initialWards={wards ?? undefined} />;
}

// The front door of the site (spec 0009). The header is the static shell. `searchParams` is
// passed down as a promise and read only inside the <Suspense> boundary, so the shell can be
// prerendered. The page reads no cookie, header or token: everyone sees the same list.
export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <PageHeader
        title="Tìm phòng trọ"
        description={LISTING_LIST_DESCRIPTION}
      />
      <Card>
        <CardContent>
          <Suspense fallback={<SearchBoxFallback />}>
            <SearchBar />
          </Suspense>
        </CardContent>
      </Card>
      <Suspense fallback={<LoadingState variant="cards" />}>
        <ResultsBoundary>
          <Results searchParams={searchParams} />
        </ResultsBoundary>
      </Suspense>
    </div>
  );
}
