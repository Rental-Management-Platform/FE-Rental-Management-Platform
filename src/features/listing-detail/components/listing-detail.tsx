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
import { isApiError } from "@/lib/api/errors";
import type { ListingDetail as ListingDetailData } from "@/lib/api/types";
import { formatMoney } from "@/lib/format";
import { parseListingPath } from "@/lib/listing-path";
import { getListing } from "../api/get-listing";

// What Next.js hands a page as `params`.
type Params = Promise<{ slugCode: string }>;

// The listing page body, read on the server as a guest (spec 0010, AC-1 to AC-4 and AC-12). It
// reads `params`, so the page keeps it inside a <Suspense> boundary and the site header stays in
// the static shell. The page reads no cookie, header or token: everyone gets the same HTML.
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
    // A listing that is hidden, deleted or never existed. Called from the catch clause, so
    // nothing around it can swallow the interrupt.
    if (isApiError(error) && error.code === "LISTING_NOT_FOUND") notFound();
    // Any other failure goes to the route's `error.tsx` until the read failure block is built.
    throw error;
  }

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

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-base">Mô tả</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="gap-4">
          <p className="text-2xl font-semibold text-primary">
            {formatMoney(listing.price)}
            <span className="text-base font-normal text-muted-foreground">
              {" "}
              mỗi tháng
            </span>
          </p>
          {/* Plain text from the API: shown as text, with its line breaks, never as HTML. */}
          <p className="max-w-prose whitespace-pre-line">
            {listing.description}
          </p>
        </CardContent>
      </Card>
    </>
  );
}
