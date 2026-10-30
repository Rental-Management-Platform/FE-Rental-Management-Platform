"use client";

import { useQuery } from "@tanstack/react-query";
import { HousePlusIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import { Button } from "@/components/ui/button";
import type { OwnerListingDetail, PropertyListItem } from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import { propertiesQuery } from "../api/properties";
import { ListingCreated } from "./listing-created";
import { ListingTips } from "./listing-tips";
import { PostListingForm } from "./post-listing-form";

// The property to start with: the wanted one when it is in the list, else the only one there
// is, else none (the person chooses). A junk or unknown `?propertyId=` is ignored, no message.
const pickPropertyId = (
  properties: readonly PropertyListItem[],
  wanted: string | null,
) => {
  if (
    wanted !== null &&
    properties.some((property) => property.id === wanted)
  ) {
    return wanted;
  }
  return properties.length === 1 ? properties[0].id : "";
};

// The post listing page below its `PageHeader`. It reads the landlord's properties first and
// shows one of four things: the loading skeleton, the error, the empty state that leads to
// "Thêm nhà trọ", or the form, which a successful post replaces with the result. The first
// three apply only while the read has no data yet: once the list is loaded the form stays
// mounted, so a failed refetch later never replaces what was typed.
export function NewListing() {
  const api = useApi();
  const searchParams = useSearchParams();
  const properties = useQuery(propertiesQuery(api));
  const [posted, setPosted] = useState<OwnerListingDetail | null>(null);
  // Set by "Đăng tin khác": the property of the last post stays chosen in the blank form.
  const [again, setAgain] = useState<{ propertyId: string } | null>(null);

  const items = properties.data?.items;
  const wantedId = again?.propertyId ?? searchParams.get("propertyId");

  const refreshProperties = () =>
    properties.refetch().then((result) => result.data?.items);

  // The result comes first: a later read of the list must never replace a listing just posted.
  const renderMain = () => {
    if (posted) {
      return (
        <ListingCreated
          listing={posted}
          onPostAnother={() => {
            setAgain({ propertyId: posted.property.id });
            setPosted(null);
          }}
        />
      );
    }
    if (items === undefined) {
      return properties.isError ? (
        <ErrorState
          error={properties.error}
          onRetry={() => void properties.refetch()}
        />
      ) : (
        <LoadingState variant="form" fields={5} />
      );
    }
    if (items.length === 0) {
      return (
        <EmptyState
          icon={HousePlusIcon}
          title="Bạn chưa có nhà trọ"
          description="Hãy tạo nhà trọ trước, rồi đăng tin vào đó."
          action={
            <Button asChild size="lg">
              <Link href="/landlord/properties/new">Thêm nhà trọ</Link>
            </Button>
          }
        />
      );
    }
    return (
      <PostListingForm
        properties={items}
        initialPropertyId={pickPropertyId(items, wantedId)}
        focusTitleOnMount={again !== null}
        onRefreshProperties={refreshProperties}
        onPosted={setPosted}
      />
    );
  };

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      {renderMain()}
      <ListingTips />
    </div>
  );
}
