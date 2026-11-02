"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleAlertIcon, HousePlusIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { OwnerListingDetail, PropertyListItem } from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import { propertiesQuery } from "../api/properties";
import { ownerListingKey } from "../api/owner-listing";
import { previewsByImageId, type PickedPhoto } from "../schemas/picked-photos";
import { ListingCreated } from "./listing-created";
import { ListingPhotos } from "./listing-photos";
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

interface Posted {
  listing: OwnerListingDetail;
  /** The photos the listing was posted with, in the order sent. This view owns their previews. */
  previews: readonly PickedPhoto[];
}

// The post listing page below its `PageHeader`. It reads the landlord's properties first and
// shows one of four things: the loading skeleton, the error, the empty state that leads to
// "Thêm nhà trọ", or the form, which a successful post replaces with the result and the photo
// zone under it. The first three apply only while the read has no data yet: once the list is
// loaded the form stays mounted, so a failed refetch later never replaces what was typed.
export function NewListing() {
  const api = useApi();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const properties = useQuery(propertiesQuery(api));
  const [posted, setPosted] = useState<Posted | null>(null);
  // Set when the photo zone found the listing gone or not mine: the zone gives way to this.
  const [photosBlocked, setPhotosBlocked] = useState<string | null>(null);
  // Set by "Đăng tin khác": the property of the last post stays chosen in the blank form.
  const [again, setAgain] = useState<{ propertyId: string } | null>(null);
  // The previews handed over by the post form. This view is their one owner: it frees them on
  // "Đăng tin khác" and when it unmounts, and the photo zone only shows them (spec 0006, AC-17).
  const ownedPreviews = useRef<readonly string[]>([]);

  const releasePreviews = () => {
    for (const url of ownedPreviews.current) URL.revokeObjectURL(url);
    ownedPreviews.current = [];
  };

  // Leaving the page frees what is still owned. It reads the ref when it runs, not before.
  useEffect(() => {
    const owned = ownedPreviews;
    return () => {
      for (const url of owned.current) URL.revokeObjectURL(url);
    };
  }, []);

  const items = properties.data?.items;
  const wantedId = again?.propertyId ?? searchParams.get("propertyId");

  const refreshProperties = () =>
    properties.refetch().then((result) => result.data?.items);

  // The photo zone reads the listing from the cache, so the answer goes there before it shows.
  const handlePosted = (
    listing: OwnerListingDetail,
    previews: readonly PickedPhoto[],
  ) => {
    queryClient.setQueryData(ownerListingKey(listing.id), listing);
    ownedPreviews.current = previews.map((photo) => photo.previewUrl);
    setPhotosBlocked(null);
    setPosted({ listing, previews });
  };

  // The result comes first: a later read of the list must never replace a listing just posted.
  const renderMain = () => {
    if (posted) {
      return (
        <div className="flex min-w-0 flex-col gap-6">
          <ListingCreated
            listing={posted.listing}
            onPostAnother={() => {
              releasePreviews();
              setAgain({ propertyId: posted.listing.property.id });
              setPosted(null);
            }}
          />
          {photosBlocked === null ? (
            <ListingPhotos
              listingId={posted.listing.id}
              seedPreviews={previewsByImageId(
                posted.listing.images,
                posted.previews,
              )}
              onBlocked={(_block, message) => setPhotosBlocked(message)}
            />
          ) : (
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertTitle>{photosBlocked}</AlertTitle>
            </Alert>
          )}
        </div>
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
        onPosted={handlePosted}
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
