"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldAlertIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/states/error-state";
import { ForbiddenState } from "@/components/states/forbidden-state";
import { LoadingState } from "@/components/states/loading-state";
import { NotFoundState } from "@/components/states/not-found-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { OwnerListingDetail } from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import {
  listingBlock,
  ownerListingKey,
  ownerListingQuery,
  type ListingBlock,
} from "../api/owner-listing";
import { EditListingForm } from "./edit-listing-form";
import { ListingStatusBadge } from "./listing-status-badge";
import { ListingTips } from "./listing-tips";

// Text until #9 ships the public page: the path a guest will open, from the latest answer.
const publicPath = ({ slug, code }: OwnerListingDetail) => `/${slug}-${code}`;

// The edit listing page. It reads the listing first and shows one of four things: the loading
// skeleton, a page level state (not found, not mine), the error, or the form. It draws its own
// `PageHeader` because the status label needs the loaded listing; `NotFoundState` and
// `ForbiddenState` carry their own `h1`, so they stand alone and the page keeps one heading.
// The form shows whenever there is data: a refetch that fails later never replaces typed text.
export function EditListing() {
  const api = useApi();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const listing = useQuery(ownerListingQuery(api, id));
  // Set by a save that was answered "gone" or "not yours": it replaces the form.
  const [blocked, setBlocked] = useState<ListingBlock | null>(null);

  const data = listing.data;
  const block =
    blocked ??
    (data === undefined && listing.isError
      ? listingBlock(listing.error)
      : null);

  if (block === "not-found")
    return <NotFoundState title="Không tìm thấy tin" />;
  if (block === "forbidden") {
    return <ForbiddenState message="Bạn không có quyền sửa tin này" />;
  }

  const renderMain = () => {
    if (data !== undefined) {
      return (
        <EditListingForm
          // A different listing starts a different form.
          key={data.id}
          listing={data}
          onSaved={(saved) =>
            queryClient.setQueryData(ownerListingKey(id), saved)
          }
          onBlocked={setBlocked}
        />
      );
    }
    return listing.isError ? (
      <ErrorState
        error={listing.error}
        onRetry={() => void listing.refetch()}
      />
    ) : (
      <LoadingState variant="form" fields={5} />
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sửa tin"
        description={
          <>
            <p>Chỉ những ô bạn đổi sẽ được lưu.</p>
            {data && (
              <p className="mt-1 text-sm break-all">
                Đường dẫn công khai:{" "}
                <span className="font-medium text-foreground">
                  {publicPath(data)}
                </span>
              </p>
            )}
          </>
        }
        actions={
          data && (
            <ListingStatusBadge status={data.status} isPublic={data.isPublic} />
          )
        }
      />
      {data?.status === "hidden_by_admin" && (
        <Alert variant="warning">
          <ShieldAlertIcon />
          <AlertTitle>Admin đã ẩn tin này</AlertTitle>
          <AlertDescription>
            {data.moderationReason && <p>Lý do: {data.moderationReason}</p>}
            <p>Bạn vẫn sửa được tin này để khắc phục.</p>
          </AlertDescription>
        </Alert>
      )}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        {renderMain()}
        <ListingTips />
      </div>
    </div>
  );
}
