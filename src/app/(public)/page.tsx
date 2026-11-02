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
  LISTING_LIST_DESCRIPTION,
  shortKeyword,
} from "@/features/listing-search/text";
import { SITE_NAME } from "@/lib/site";

// Metadata from the cleaned address only, with no API call (spec 0009, AC-12). A plain list page
// is indexed and has its own canonical address, so `?page=abc` canonicalises to `/`. A page with
// a keyword is `noindex, follow`: each one costs an API call, and `robots.txt` blocks them too.
export async function generateMetadata({
  searchParams,
}: PageProps<"/">): Promise<Metadata> {
  const search = parseListingSearch(await searchParams);
  const hasKeyword = search.q !== "";
  const pageSuffix = search.page > 1 ? `, trang ${search.page}` : "";
  const shown = shortKeyword(search.q);

  const title = hasKeyword
    ? `Kết quả cho “${shown}”${pageSuffix}`
    : `Tìm phòng trọ${pageSuffix}`;
  const description = hasKeyword
    ? `Các tin cho thuê phù hợp với “${shown}” trên ${SITE_NAME}.`
    : LISTING_LIST_DESCRIPTION;
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
    ...(hasKeyword && { robots: { index: false, follow: true } }),
  };
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
            <SearchBox />
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
