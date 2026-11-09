import type { Metadata } from "next";
import { Suspense } from "react";
import { getLandlordProfile } from "@/features/landlord-profile/api/get-landlord-profile";
import { LandlordProfileScreen } from "@/features/landlord-profile/components/landlord-profile";
import { LandlordProfileSkeleton } from "@/features/landlord-profile/components/landlord-profile-skeleton";
import { isLandlordId } from "@/features/landlord-profile/landlord-id";
import {
  FAILED_METADATA,
  GONE_METADATA,
  profileMetadata,
} from "@/features/landlord-profile/metadata";
import { isApiError } from "@/lib/api/errors";

// The head of the page. It uses the same cached read as the page body, so one request serves
// both. An address that is not an id gets its metadata with no API call, like the page. It never
// throws: a landlord that is gone and one that could not be read each get their own plain title,
// kept out of search. It reads only `params`, never `searchParams`, so every page of the list
// shares one head.
export async function generateMetadata({
  params,
}: PageProps<"/chu-tro/[id]">): Promise<Metadata> {
  const { id } = await params;
  if (!isLandlordId(id)) return GONE_METADATA;

  try {
    return profileMetadata(await getLandlordProfile(id));
  } catch (error) {
    return isApiError(error) && error.code === "LANDLORD_NOT_FOUND"
      ? GONE_METADATA
      : FAILED_METADATA;
  }
}

// The public profile of a landlord at `/chu-tro/<id>` (scope #15). The wrapper and the site
// header are the static shell. `params` and `searchParams` are passed down as promises and read
// only inside <Suspense> boundaries, so the shell can be prerendered. The page reads no cookie,
// header or token.
export default function LandlordProfilePage({
  params,
  searchParams,
}: PageProps<"/chu-tro/[id]">) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <Suspense fallback={<LandlordProfileSkeleton />}>
        <LandlordProfileScreen params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
