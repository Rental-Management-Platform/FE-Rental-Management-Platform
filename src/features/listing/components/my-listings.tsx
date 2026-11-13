"use client";

import { useQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { Can } from "@/components/can";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useApi } from "@/lib/session/auth-provider";
import { myListingsQuery, type MyListingsParams } from "../api/my-listings";
import { useListingActions } from "../hooks/use-listing-actions";
import { NEW_LISTING_PATH } from "../listing-filter";
import { ListingsTable } from "./listings-table";

// Milestone 1 of spec 0019: the first page of every status. The filter, the page links and the
// phone layout come in milestone 2.
const PARAMS: MyListingsParams = { filter: "all", page: 1 };

/** "Tin của tôi": the landlord's own listings with their real status, and hide and show. */
export function MyListings() {
  const api = useApi();
  const query = useQuery(myListingsQuery(api, PARAMS));
  const actions = useListingActions(PARAMS);
  const { data } = query;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tin của tôi"
        description="Quản lý các tin đã đăng: ẩn khi hết phòng, hiện lại khi còn phòng."
        actions={
          <Can permission="listing:create">
            <Button asChild size="lg">
              <Link href={NEW_LISTING_PATH}>
                <PlusIcon data-icon="inline-start" aria-hidden="true" />
                Đăng tin mới
              </Link>
            </Button>
          </Can>
        }
      />

      {data === undefined && query.isError && (
        <ErrorState
          error={query.error}
          title="Không tải được danh sách tin"
          onRetry={() => void query.refetch()}
        />
      )}
      {data === undefined && !query.isError && <LoadingState variant="table" />}
      {data !== undefined &&
        (data.total === 0 ? (
          <EmptyState
            title="Bạn chưa có tin nào"
            description="Đăng tin đầu tiên để khách tìm trọ thấy phòng của bạn."
            action={
              <Button asChild size="lg">
                <Link href={NEW_LISTING_PATH}>Đăng tin</Link>
              </Button>
            }
          />
        ) : (
          <Card>
            <ListingsTable
              rows={data.items}
              rowOf={actions.rowOf}
              onToggle={(listing) => void actions.toggle(listing)}
            />
          </Card>
        ))}
    </div>
  );
}
