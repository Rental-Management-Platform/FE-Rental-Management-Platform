"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpenIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { Can } from "@/components/can";
import { PageHeader } from "@/components/layout/page-header";
import { ListPagination } from "@/components/list-pagination";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { ForbiddenState } from "@/components/states/forbidden-state";
import { LoadingState } from "@/components/states/loading-state";
import { RateLimitNotice } from "@/components/states/rate-limit-notice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MembershipStrip } from "@/features/membership/components/membership-strip";
import { parsePageParam } from "@/features/listing-search/schemas/search-params";
import { isApiError } from "@/lib/api/errors";
import type { OwnerListingSummary } from "@/lib/api/types";
import { lastPageOf } from "@/lib/pagination";
import { useApi, useSession } from "@/lib/session/auth-provider";
import { can } from "@/lib/session/can";
import { useCountdown } from "@/lib/use-countdown";
import { useReturnFocus } from "@/lib/use-return-focus";
import { cn } from "@/lib/utils";
import {
  MY_LISTINGS_PAGE_SIZE,
  myListingsQuery,
  type MyListingsParams,
} from "../api/my-listings";
import { useDeleteListing } from "../hooks/use-delete-listing";
import { useListingActions } from "../hooks/use-listing-actions";
import {
  listHeading,
  myListingsHref,
  NEW_LISTING_PATH,
  parseListingFilter,
  type ListingFilter,
} from "../listing-filter";
import { DeleteListingDialog } from "./delete-listing-dialog";
import { ListingRowCards } from "./listing-row-card";
import { ListingsTable } from "./listings-table";
import { StatusFilter } from "./status-filter";

const HEADING_ID = "my-listings-title";

/**
 * "Tin của tôi" (scope #12, spec 0019): the landlord's own listings with their real status, the
 * four filter links, the page links, and hide, show, edit and delete. It runs in the browser,
 * because the list needs a login, and sits behind the route gate of the landlord. The filter and
 * the page are the `?status=` and `?page=` of the address, so the page reads `useSearchParams`
 * and its route keeps it inside a `<Suspense>` boundary.
 *
 * When a row leaves the list (hidden out of the filter, deleted), the button that had focus is
 * gone, so focus moves to the list heading, and the count in it is read out.
 */
export function MyListings() {
  const searchParams = useSearchParams();
  const params: MyListingsParams = {
    filter: parseListingFilter(searchParams.get("status")),
    page: parsePageParam(searchParams.get("page")),
  };

  const api = useApi();
  const router = useRouter();
  const session = useSession();
  const mayRead = can(session, "listing:read");
  const query = useQuery({ ...myListingsQuery(api, params), enabled: mayRead });
  const { data } = query;

  const heading = useRef<HTMLHeadingElement>(null);
  const focusHeading = useCallback(() => heading.current?.focus(), []);
  const actions = useListingActions(params, focusHeading);
  const deletion = useDeleteListing(params);
  // One dialog serves every row, so it has no trigger of its own. After a delete the row is
  // gone, so focus goes to the heading just above the rows.
  const { remember, onCloseAutoFocus } = useReturnFocus(() => heading.current);

  // A page past the last one (typed by hand, or the last row of the last page was just removed)
  // goes to the last page that has rows (AC-4). Never while the rows on screen are the ones of
  // the page before.
  const lastPage =
    data === undefined ? 1 : lastPageOf(data.total, MY_LISTINGS_PAGE_SIZE);
  const pastTheEnd =
    data !== undefined &&
    !query.isPlaceholderData &&
    data.total > 0 &&
    data.items.length === 0 &&
    params.page > lastPage;
  useEffect(() => {
    if (pastTheEnd) router.replace(myListingsHref(params.filter, lastPage));
  }, [pastTheEnd, router, params.filter, lastPage]);

  if (
    !mayRead ||
    (data === undefined &&
      isApiError(query.error) &&
      query.error.code === "PERMISSION_DENIED")
  ) {
    return <ForbiddenState message="Bạn không có quyền xem tin của mình." />;
  }

  const askDelete = (listing: OwnerListingSummary) => {
    remember();
    deletion.ask(listing);
  };

  const renderBody = (): ReactNode => {
    if (data === undefined) {
      return query.isError ? (
        <ListFailure error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <LoadingState variant="table" />
      );
    }
    return (
      <section aria-labelledby={HEADING_ID} className="flex flex-col">
        {/* Focus lands here when a row leaves, so the heading takes focus by code and has no
            ring of its own: the person did not tab to it. With no rows the empty state below
            says it, so the heading is for a screen reader only. */}
        <h2
          id={HEADING_ID}
          ref={heading}
          tabIndex={-1}
          aria-live="polite"
          className={cn(
            "px-(--card-spacing) pt-4 pb-3 text-base outline-hidden",
            data.total === 0 && "sr-only",
          )}
        >
          {listHeading(params.filter, data.total)}
        </h2>

        {data.total === 0 ? (
          <NoListings filter={params.filter} />
        ) : data.items.length === 0 ? (
          pastTheEnd ? (
            <LoadingState variant="table" />
          ) : (
            <EmptyState
              icon={BookOpenIcon}
              title="Trang này không có tin"
              action={
                <Button asChild variant="outline" size="lg">
                  <Link href={myListingsHref(params.filter, lastPage)}>
                    Xem trang cuối
                  </Link>
                </Button>
              }
            />
          )
        ) : (
          <>
            {/* The same rows twice: a table from `md` and stacked blocks below it. The hidden
                one is `display: none`, so a screen reader reads only one. */}
            <div className="hidden md:block">
              <ListingsTable
                rows={data.items}
                rowOf={actions.rowOf}
                onToggle={(listing) => void actions.toggle(listing)}
                onDelete={askDelete}
              />
            </div>
            <div className="md:hidden">
              <ListingRowCards
                rows={data.items}
                rowOf={actions.rowOf}
                onToggle={(listing) => void actions.toggle(listing)}
                onDelete={askDelete}
              />
            </div>
          </>
        )}

        {data.total > MY_LISTINGS_PAGE_SIZE && (
          <div className="border-t px-(--card-spacing) py-4">
            <ListPagination
              page={params.page}
              pageSize={MY_LISTINGS_PAGE_SIZE}
              total={data.total}
              hrefFor={(page) => myListingsHref(params.filter, page)}
              itemLabel="tin"
            />
          </div>
        )}
      </section>
    );
  };

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

      <MembershipStrip />

      {/* One zone: the filter links are its title row, the rows run edge to edge under them. */}
      <Card>
        <StatusFilter filter={params.filter} />
        {renderBody()}
      </Card>

      <DeleteListingDialog
        title={deletion.target?.title ?? null}
        open={deletion.open}
        onOpenChange={deletion.onOpenChange}
        pending={deletion.pending}
        failure={deletion.failure}
        onConfirm={() => void deletion.confirm()}
        onCloseAutoFocus={onCloseAutoFocus}
      />
    </div>
  );
}

/** The skeleton for the route's `Suspense` fallback, drawn until the address is known. */
export function MyListingsSkeleton() {
  return (
    <Card>
      <LoadingState variant="table" />
    </Card>
  );
}

// No rows for this filter. With no filter it invites the first listing; with a filter it says so
// and offers the way back to every listing (AC-3, AC-4).
function NoListings({ filter }: { filter: ListingFilter }) {
  if (filter === "all") {
    return (
      <EmptyState
        title="Bạn chưa có tin nào"
        description="Đăng tin đầu tiên để khách tìm trọ thấy phòng của bạn."
        action={
          <Can permission="listing:create">
            <Button asChild size="lg">
              <Link href={NEW_LISTING_PATH}>Đăng tin</Link>
            </Button>
          </Can>
        }
      />
    );
  }
  return (
    <EmptyState
      title="Chưa có tin nào ở mục này"
      action={
        <Button asChild variant="outline" size="lg">
          <Link href={myListingsHref("all", 1)}>Xem tất cả tin</Link>
        </Button>
      }
    />
  );
}

// A failed first read: a 429 shows the wait counting down, anything else the error. "Thử lại"
// stays off while the wait runs.
function ListFailure({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  const secondsLeft = useCountdown(error);
  if (isApiError(error) && error.status === 429) {
    return (
      <div className="flex flex-col items-start gap-4 px-(--card-spacing)">
        <RateLimitNotice error={error} className="w-full" />
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onRetry}
          disabled={secondsLeft > 0}
        >
          Thử lại
        </Button>
      </div>
    );
  }
  return (
    <ErrorState
      error={error}
      title="Không tải được danh sách tin"
      onRetry={onRetry}
    />
  );
}
