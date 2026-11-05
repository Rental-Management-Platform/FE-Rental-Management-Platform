import { Suspense } from "react";
import { ListingDetail } from "@/features/listing-detail/components/listing-detail";
import { ListingDetailSkeleton } from "@/features/listing-detail/components/listing-detail-skeleton";

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
