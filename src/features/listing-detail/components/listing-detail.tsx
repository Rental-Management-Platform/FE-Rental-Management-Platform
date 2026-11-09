import { MapPinIcon } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isApiError, type ApiError } from "@/lib/api/errors";
import type { ListingDetail as ListingDetailData } from "@/lib/api/types";
import {
  formatArea,
  formatCount,
  formatDateOnly,
  formatMoney,
} from "@/lib/format";
import { env } from "@/lib/env";
import { listingPath, parseListingPath } from "@/lib/listing-path";
import { mediaUrl } from "@/lib/media";
import { ListingsFailure } from "@/features/listing-search/components/listings-failure";
import { getListing } from "../api/get-listing";
import { breadcrumbJsonLd, serializeJsonLd } from "../json-ld";
import { ListingAddressFix } from "./address-fix";
import { GuestViewCounter } from "./guest-view-counter";
import { ListingContact } from "./listing-contact";
import { ListingGallery, type GalleryPhoto } from "./listing-gallery";

// What Next.js hands a page as `params`.
type Params = Promise<{ slugCode: string }>;

const NOT_SET = "Chưa ghi";

// The photos in the order of `position`, each with its address. A path that is not a public photo
// path gives `null` and is dropped here, so the gallery never gets an address it must not draw.
const galleryPhotos = (listing: ListingDetailData): GalleryPhoto[] =>
  [...listing.images]
    .sort((a, b) => a.position - b.position)
    .flatMap((image) => {
      const src = mediaUrl(image.url);
      return src === null ? [] : [{ id: image.id, src }];
    });

// The listing page body, read on the server as a guest (spec 0010, AC-1 to AC-5, AC-12 and
// AC-13). It reads `params`, so the page keeps it inside a <Suspense> boundary and the site
// header stays in the static shell. The page reads no cookie, header or token: everyone gets the
// same HTML.
export async function ListingDetail({ params }: { params: Params }) {
  const { slugCode } = await params;

  // Not a listing address: answer "not found" before any API call, so a bot probe spends none of
  // the shared 300 reads a minute.
  const path = parseListingPath(slugCode);
  if (path === null) notFound();

  let listing: ListingDetailData;
  try {
    listing = await getListing(path.code);
  } catch (error) {
    // Anything that is not an `ApiError` is a bug: the route's `error.tsx` shows it.
    if (!isApiError(error)) throw error;
    // A listing that is hidden, deleted or never existed. Called from the catch clause, so
    // nothing around it can swallow the interrupt.
    if (error.code === "LISTING_NOT_FOUND") notFound();
    return <ReadFailure error={error} />;
  }

  const { landlord, property } = listing;
  const hasDescription = listing.description.trim() !== "";
  // The address from the answer, never the one in the address bar: the sign in links and the fix
  // of the address bar both go to it.
  const canonicalPath = listingPath(listing.slug, listing.code);

  return (
    <>
      {/* These two draw nothing. One makes the backend count a guest's visit (AC-10), the other
          corrects the address bar when the slug is wrong (AC-11). */}
      <GuestViewCounter code={listing.code} />
      <ListingAddressFix path={canonicalPath} />

      {/* Structured data for search engines (AC-16): one breadcrumb, no phone number. The text
          has every `<` escaped, so a title can never close the script tag. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            breadcrumbJsonLd({
              siteUrl: env.NEXT_PUBLIC_SITE_URL,
              title: listing.title,
              path: canonicalPath,
            }),
          ),
        }}
      />

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
                <BreadcrumbPage className="truncate">
                  {listing.title}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
        title={listing.title}
        description={
          <span className="flex items-start gap-1.5">
            <MapPinIcon aria-hidden="true" className="mt-1 size-4 shrink-0" />
            {listing.fullAddress}
          </span>
        }
      />

      {/* One column on a phone, in this order: photos, price and facts, contact, description,
          property. From `lg` the contact zone moves to a sticky column on the right. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="lg:col-start-1">
          <ListingGallery
            title={listing.title}
            photos={galleryPhotos(listing)}
          />
        </div>

        <Card className="lg:col-start-1">
          <CardContent className="gap-4">
            <h2 className="sr-only">Giá và thông tin chính</h2>
            <p className="text-2xl font-semibold text-primary">
              {formatMoney(listing.price)}
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                mỗi tháng
              </span>
            </p>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Fact label="Diện tích" value={formatArea(listing.areaM2)} />
              <Fact
                label="Tiền cọc"
                value={
                  listing.deposit === null
                    ? NOT_SET
                    : formatMoney(listing.deposit)
                }
              />
              <Fact
                label="Vào ở từ"
                value={
                  listing.availableFrom === null
                    ? NOT_SET
                    : formatDateOnly(listing.availableFrom)
                }
              />
              <Fact label="Lượt xem" value={formatCount(listing.viewCount)} />
            </dl>
          </CardContent>
        </Card>

        {/* The contact zone reads the session in the browser (AC-7 to AC-9). The server HTML has no
            phone number: a guest read answers `landlord.phone` as null. */}
        <aside
          aria-label="Liên hệ chủ trọ"
          className={
            hasDescription
              ? "lg:sticky lg:top-24 lg:col-start-2 lg:row-span-4 lg:row-start-1 lg:self-start"
              : "lg:sticky lg:top-24 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:self-start"
          }
        >
          <ListingContact
            id={listing.id}
            title={listing.title}
            code={listing.code}
            path={canonicalPath}
            landlord={{ id: landlord.id, name: landlord.name }}
            createdAt={listing.createdAt}
          />
        </aside>

        {hasDescription && (
          <Card className="lg:col-start-1">
            <CardHeader>
              <CardTitle>
                <h2 className="text-base">Mô tả</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Plain text from the API: shown as text, with its line breaks and long words
                  wrapped, never as HTML. */}
              <p className="max-w-prose break-words whitespace-pre-line">
                {listing.description}
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="lg:col-start-1">
          <CardHeader>
            <CardTitle>
              <h2 className="text-base">Nhà trọ</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <p className="font-medium">{property.name}</p>
              <p className="text-sm text-muted-foreground">
                {property.fullAddress}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

// Any failure of the main read other than "not found" (spec 0010, AC-13): a 429, a 5xx, a
// timeout, no network, an answer that could not be read. `ListingsFailure` carries the countdown
// of a 429, the support code of a 5xx, and a "Thử lại" that asks the server to render again.
function ReadFailure({ error }: { error: ApiError }) {
  return (
    <>
      <PageHeader title="Không mở được tin này" />
      <ListingsFailure
        status={error.status}
        code={error.code}
        message={error.message}
        requestId={error.requestId}
        retryAfterSeconds={error.retryAfterSeconds}
        retryAfterExact={error.retryAfterExact}
        title="Không tải được tin này"
      />
    </>
  );
}
