import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingState } from "@/components/states/loading-state";
import { isApiError, type ApiError } from "@/lib/api/errors";
import type { LandlordProfile as LandlordProfileData } from "@/lib/api/types";
import { ReviewsZone } from "@/features/landlord-reviews/components/reviews-zone";
import { ListingsFailure } from "@/features/listing-search/components/listings-failure";
import { ReviewsZoneSkeleton } from "@/features/reviews/components/reviews-zone-skeleton";
import { getLandlordProfile } from "../api/get-landlord-profile";
import { isLandlordId } from "../landlord-id";
import { FAILED_TITLE } from "../text";
import { LandlordListings } from "./landlord-listings";
import { LandlordProfileView } from "./landlord-profile-view";
import { ListingsBoundary } from "./listings-boundary";

// What Next.js hands a page as `params` and `searchParams`.
type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * The profile page body, read on the server as a guest (api-for-frontend.md, 6.31). It reads
 * `params`, so the page keeps it inside a <Suspense> boundary and the site header stays in the
 * static shell. The page reads no cookie, header or token: everyone gets the same HTML, and what
 * depends on the viewer (the follow state) is added in the browser by `LandlordProfileView`.
 */
export async function LandlordProfileScreen({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;

  // Not an id: answer "not found" before any API call, so a bot probe spends none of the shared
  // 300 reads a minute.
  if (!isLandlordId(id)) notFound();

  let profile: LandlordProfileData;
  try {
    profile = await getLandlordProfile(id);
  } catch (error) {
    // Anything that is not an `ApiError` is a bug: the route's `error.tsx` shows it.
    if (!isApiError(error)) throw error;
    // Not a landlord any more: never was one, a renter or admin id, locked or deleted. Called from
    // the catch clause, so nothing around it can swallow the interrupt.
    if (error.code === "LANDLORD_NOT_FOUND") notFound();
    return <ReadFailure error={error} />;
  }

  // The listings stream in on their own, so the name and the numbers show first and a slow list
  // never holds them back. The list reads `searchParams`, which is why it has its own boundary.
  return (
    <LandlordProfileView profile={profile}>
      <Suspense fallback={<LoadingState variant="cards" />}>
        <ListingsBoundary>
          <LandlordListings landlordId={id} searchParams={searchParams} />
        </ListingsBoundary>
      </Suspense>
      {/* The reviews zone (spec 0013) reads `reviewPage` in the browser and never touches `page`.
          It reads the address and the session, so it has its own boundary, and the server HTML
          holds only its skeleton. */}
      <Suspense fallback={<ReviewsZoneSkeleton />}>
        <ReviewsZone landlordId={id} />
      </Suspense>
    </LandlordProfileView>
  );
}

// Any failure of the profile read other than "not found": a 429, a 5xx, a timeout, no network.
// `ListingsFailure` carries the countdown of a 429, the support code of a 5xx, and a "Thử lại" that
// asks the server to render the page again.
function ReadFailure({ error }: { error: ApiError }) {
  return (
    <>
      <PageHeader title={FAILED_TITLE} />
      <ListingsFailure
        status={error.status}
        code={error.code}
        message={error.message}
        requestId={error.requestId}
        retryAfterSeconds={error.retryAfterSeconds}
        retryAfterExact={error.retryAfterExact}
        title="Không tải được hồ sơ chủ trọ"
      />
    </>
  );
}
