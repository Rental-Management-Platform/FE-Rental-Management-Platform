"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Property } from "@/lib/api/types";

// What the page shows once the property exists. `fullAddress` is joined by the backend, so it
// is shown as it came and never put together here (api-for-frontend.md, 6.17). #12 replaces
// this view with a trip to the list of properties.
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
        <div>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onAddAnother}
          >
            Thêm nhà trọ khác
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
