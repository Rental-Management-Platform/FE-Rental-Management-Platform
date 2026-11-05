import type { Metadata } from "next";
import { Suspense } from "react";
import { getListing } from "@/features/listing-detail/api/get-listing";
import { ListingDetail } from "@/features/listing-detail/components/listing-detail";
import { ListingDetailSkeleton } from "@/features/listing-detail/components/listing-detail-skeleton";
import {
  FAILED_METADATA,
  GONE_METADATA,
  listingMetadata,
} from "@/features/listing-detail/metadata";
import { isApiError } from "@/lib/api/errors";
import { parseListingPath } from "@/lib/listing-path";

// The head of the page (spec 0010, AC-14). It uses the same cached read as the page body, so one
// request serves both. A junk address gets its metadata with no API call, like the page. It never
// throws: a listing that is gone and one that could not be read each get their own plain title,
// kept out of search.
export async function generateMetadata({
  params,
}: PageProps<"/[slugCode]">): Promise<Metadata> {
  const { slugCode } = await params;
  const path = parseListingPath(slugCode);
  if (path === null) return GONE_METADATA;

  try {
    return listingMetadata(await getListing(path.code));
  } catch (error) {
    return isApiError(error) && error.code === "LISTING_NOT_FOUND"
      ? GONE_METADATA
      : FAILED_METADATA;
  }
}

// One listing at `/<slug>-<code>` or `/<code>` (spec 0010). The wrapper and the site header are
// the static shell. `params` is passed down as a promise and read only inside the <Suspense>
// boundary, so the shell can be prerendered. The page reads no cookie, header or token.
export default function ListingPage({ params }: PageProps<"/[slugCode]">) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <Suspense fallback={<ListingDetailSkeleton />}>
        <ListingDetail params={params} />
      </Suspense>
    </div>
  );
}
