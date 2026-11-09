import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { isApiError, type ApiError } from "@/lib/api/errors";
import type { LandlordProfile as LandlordProfileData } from "@/lib/api/types";
import { ListingsFailure } from "@/features/listing-search/components/listings-failure";
import { getLandlordProfile } from "../api/get-landlord-profile";
import { isLandlordId } from "../landlord-id";
import { FAILED_TITLE, landlordName } from "../text";
import { ProfileStats } from "./profile-stats";
import { RatingLine } from "./rating-line";

// What Next.js hands a page as `params`.
type Params = Promise<{ id: string }>;

/**
 * The profile page body, read on the server as a guest (api-for-frontend.md, 6.31). It reads
 * `params`, so the page keeps it inside a <Suspense> boundary and the site header stays in the
 * static shell. The page reads no cookie, header or token: everyone gets the same HTML, and what
 * depends on the viewer (the follow state) is added in the browser.
 */
export async function LandlordProfileScreen({ params }: { params: Params }) {
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

  const name = landlordName(profile.name);

  return (
    <>
      <PageHeader
        breadcrumb={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Tìm trọ</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="truncate">{name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
        title={<span className="break-words">{name}</span>}
        description={<RatingLine {...profile} />}
      />
      <ProfileStats {...profile} />
    </>
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
