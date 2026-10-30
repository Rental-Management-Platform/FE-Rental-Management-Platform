"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { OwnerListingDetail } from "@/lib/api/types";
import { formatArea, formatMoney } from "@/lib/format";
import { ListingStatusBadge } from "./listing-status-badge";

// What the page shows once the listing exists, in place of the form. Everything comes from the
// 201 answer; `fullAddress` is joined by the backend, so it is shown as it came. The public path
// is text, not a link, because the public listing page arrives with #9. #12 replaces this view
// with a trip to the list of my listings.
export function ListingCreated({
  listing,
  onPostAnother,
}: {
  listing: OwnerListingDetail;
  onPostAnother: () => void;
}) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  // The form and its focused button are gone, so focus would fall to the page. It goes to the
  // result instead, and a screen reader reads it.
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <Card role="group" aria-labelledby="listing-created-title">
      <CardHeader className="border-b">
        <CardTitle>
          <h2
            ref={titleRef}
            id="listing-created-title"
            tabIndex={-1}
            className="text-base outline-none"
          >
            {listing.title}
          </h2>
        </CardTitle>
        <CardDescription>Tin đã được đăng.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <ListingStatusBadge
          status={listing.status}
          isPublic={listing.isPublic}
        />
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1 sm:col-span-2">
            <dt className="text-sm text-muted-foreground">Địa chỉ</dt>
            <dd className="text-base font-medium">{listing.fullAddress}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-sm text-muted-foreground">Giá thuê</dt>
            <dd className="text-base font-semibold">
              {formatMoney(listing.price)} mỗi tháng
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-sm text-muted-foreground">Diện tích</dt>
            <dd className="text-base font-medium">
              {formatArea(listing.areaM2)}
            </dd>
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <dt className="text-sm text-muted-foreground">
              Đường dẫn công khai
            </dt>
            <dd className="text-base font-medium break-all">
              {`/${listing.slug}-${listing.code}`}
            </dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onPostAnother}
          >
            Đăng tin khác
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
