"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MY_LISTINGS_PATH } from "@/features/listing/listing-filter";
import type { Property } from "@/lib/api/types";
import { MY_PROPERTIES_PATH, postListingHref } from "../property-list";
import { AmenityList } from "./amenity-list";
import { FeeList } from "./fee-list";

// What the page shows once the property exists. `fullAddress` is joined by the backend, so it
// is shown as it came and never put together here (api-for-frontend.md, 6.17). "Đăng tin cho
// nhà trọ này" opens the listing form with this property chosen (spec 0006, AC-14). Under the
// buttons are the links on to the two lists (spec 0019, AC-17), so the result is no longer a
// dead end.
export function PropertyCreated({
  property,
  onAddAnother,
}: {
  property: Property;
  onAddAnother: () => void;
}) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  // The form and its focused button are gone, so focus would fall to the page. It goes to the
  // result instead, and a screen reader reads it.
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <Card role="group" aria-labelledby="property-created-title">
      <CardHeader className="border-b">
        <CardTitle>
          <h2
            ref={titleRef}
            id="property-created-title"
            tabIndex={-1}
            className="text-base outline-none"
          >
            Đã tạo nhà trọ
          </h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <dl className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <dt className="text-sm text-muted-foreground">Tên nhà trọ</dt>
            <dd className="text-base font-medium">{property.name}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-sm text-muted-foreground">Địa chỉ đầy đủ</dt>
            <dd className="text-base font-medium">{property.fullAddress}</dd>
          </div>
        </dl>
        {/* What the backend saved, in the order it sorted it (spec 0017, AC-12). The title above
            is an `h2`, so these are `h3`. A part with nothing in it draws nothing. */}
        <FeeList fees={property.fees} headingLevel="h3" />
        <AmenityList amenities={property.amenities} headingLevel="h3" />
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href={postListingHref(property.id)}>
              Đăng tin cho nhà trọ này
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onAddAnother}
          >
            Thêm nhà trọ khác
          </Button>
        </div>
        {/* The way on from here: the two lists (spec 0019, AC-17). */}
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="ghost" size="lg">
            <Link href={MY_PROPERTIES_PATH}>Nhà trọ của tôi</Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href={MY_LISTINGS_PATH}>Tin của tôi</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
