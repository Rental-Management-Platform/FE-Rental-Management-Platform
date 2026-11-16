"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpenIcon, CalendarX2Icon, ReceiptTextIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, type ReactNode } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ListPagination } from "@/components/list-pagination";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { ForbiddenState } from "@/components/states/forbidden-state";
import { LoadingState } from "@/components/states/loading-state";
import { RateLimitNotice } from "@/components/states/rate-limit-notice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { parsePageParam } from "@/features/listing-search/schemas/search-params";
import { ordersHeading } from "@/features/order/order-filter";
import {
  ORDERS_PAGE_EMPTY_TITLE,
  VIEW_LAST_PAGE,
} from "@/features/order/order-text";
import { isApiError } from "@/lib/api/errors";
import { lastPageOf } from "@/lib/pagination";
import { useApi, useSession } from "@/lib/session/auth-provider";
import { can } from "@/lib/session/can";
import { useCountdown } from "@/lib/use-countdown";
import { cn } from "@/lib/utils";
import {
  adminOrdersHref,
  hasFilters,
  parseAdminOrderFilters,
  rangeIsBackwards,
  type AdminOrderFilters,
} from "../admin-order-filter";
import { ADMIN_ORDERS_PATH } from "../admin-orders-path";
import {
  ADMIN_ORDERS_DESCRIPTION,
  ADMIN_ORDERS_FAILED_TITLE,
  ADMIN_ORDERS_FORBIDDEN_MESSAGE,
  ADMIN_ORDERS_TITLE,
  BACKWARDS_DESCRIPTION,
  BACKWARDS_TITLE,
  CLEAR_FILTERS,
  NO_MATCH_TITLE,
  NO_ORDERS_DESCRIPTION,
  NO_ORDERS_TITLE,
} from "../admin-orders-text";
import {
  ADMIN_ORDERS_PAGE_SIZE,
  adminOrdersListQuery,
  type AdminOrdersParams,
} from "../api/admin-orders";
import { AdminOrderCards } from "./admin-order-cards";
import { AdminOrderFilterBar } from "./admin-order-filter-bar";
import { AdminOrderStatusTabs } from "./admin-order-status-tabs";
import { AdminOrderTotals } from "./admin-order-totals";
import { AdminOrdersTable } from "./admin-orders-table";

const HEADING_ID = "admin-orders-title";

/**
 * "Đơn của mọi chủ trọ" (scope #25, `GET /orders/all`): every landlord's orders with the totals of
 * the filtered set, the status tabs, the plan, landlord and day filters, and the page links. It runs
 * in the browser, because the list needs a login, and sits behind the route gate of the admin. The
 * filters and the page are the query of the address, so the page reads `useSearchParams` and its
 * route keeps it inside a `<Suspense>` boundary. The list is read only: an admin changes no order.
 *
 * The first day after the last one makes no call: the page says so under "Đến ngày", which is
 * where the API reports it too. Money is a test payment and the page says so.
 */
export function AdminOrdersPage() {
  const searchParams = useSearchParams();
  const filters = useMemo(
    () => parseAdminOrderFilters((name) => searchParams.get(name)),
    [searchParams],
  );
  const page = parsePageParam(searchParams.get("page"));
  const params: AdminOrdersParams = { ...filters, page };
  const backwards = rangeIsBackwards(filters);

  const api = useApi();
  const router = useRouter();
  const session = useSession();
  const mayRead = can(session, "order:report");
  const query = useQuery({
    ...adminOrdersListQuery(api, params),
    enabled: mayRead && !backwards,
  });
  const { data } = query;

  // A page past the last one (typed by hand) goes to the last page that has rows. Never while the
  // rows on screen are the ones of the page before.
  const lastPage =
    data === undefined ? 1 : lastPageOf(data.total, ADMIN_ORDERS_PAGE_SIZE);
  const pastTheEnd =
    data !== undefined &&
    !query.isPlaceholderData &&
    data.total > 0 &&
    data.items.length === 0 &&
    page > lastPage;
  useEffect(() => {
    if (pastTheEnd) router.replace(adminOrdersHref(filters, lastPage));
  }, [pastTheEnd, router, filters, lastPage]);

  if (
    !mayRead ||
    (data === undefined &&
      isApiError(query.error) &&
      query.error.status === 403 &&
      query.error.code === "PERMISSION_DENIED")
  ) {
    return <ForbiddenState message={ADMIN_ORDERS_FORBIDDEN_MESSAGE} />;
  }

  const landlordHref = (landlordId: string) =>
    adminOrdersHref({ ...filters, landlordId }, 1);

  const renderBody = (): ReactNode => {
    if (backwards) {
      return (
        <EmptyState
          icon={CalendarX2Icon}
          title={BACKWARDS_TITLE}
          description={BACKWARDS_DESCRIPTION}
        />
      );
    }
    if (data === undefined) {
      return query.isError ? (
        <ListFailure error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <LoadingState variant="table" />
      );
    }
    return (
      <section aria-labelledby={HEADING_ID} className="flex flex-col">
        {/* The count is read out again when it changes. With no rows the empty state below says
            it, so the heading is for a screen reader only. */}
        <h2
          id={HEADING_ID}
          aria-live="polite"
          className={cn(
            "px-(--card-spacing) pt-4 pb-3 text-base",
            data.total === 0 && "sr-only",
          )}
        >
          {ordersHeading(filters.status, data.total)}
        </h2>

        {data.total === 0 ? (
          <NoOrders filters={filters} />
        ) : data.items.length === 0 ? (
          pastTheEnd ? (
            <LoadingState variant="table" />
          ) : (
            <EmptyState
              icon={BookOpenIcon}
              title={ORDERS_PAGE_EMPTY_TITLE}
              action={
                <Button asChild variant="outline" size="lg">
                  <Link href={adminOrdersHref(filters, lastPage)}>
                    {VIEW_LAST_PAGE}
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
              <AdminOrdersTable rows={data.items} landlordHref={landlordHref} />
            </div>
            <div className="md:hidden">
              <AdminOrderCards rows={data.items} landlordHref={landlordHref} />
            </div>
          </>
        )}

        {data.total > ADMIN_ORDERS_PAGE_SIZE && (
          <div className="border-t px-(--card-spacing) py-4">
            <ListPagination
              page={page}
              pageSize={ADMIN_ORDERS_PAGE_SIZE}
              total={data.total}
              hrefFor={(next) => adminOrdersHref(filters, next)}
              itemLabel="đơn"
            />
          </div>
        )}
      </section>
    );
  };

  // The totals come with the rows in one answer, so they wait and fail with it: while the list
  // loads they draw their shape, and when it fails the list zone carries the error alone.
  const showTotals = !backwards && (data !== undefined || !query.isError);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={ADMIN_ORDERS_TITLE}
        description={ADMIN_ORDERS_DESCRIPTION}
      />

      <AdminOrderFilterBar filters={filters} backwards={backwards} />

      {showTotals && <AdminOrderTotals summary={data?.summary} />}

      {/* One zone: the status links are its title row, the rows run edge to edge under them. */}
      <Card>
        <AdminOrderStatusTabs filters={filters} />
        {renderBody()}
      </Card>
    </div>
  );
}

/** The skeleton for the route's `Suspense` fallback, drawn until the address is known. */
export function AdminOrdersSkeleton() {
  return (
    <Card>
      <LoadingState variant="table" />
    </Card>
  );
}

// No rows. With no filter it says there are no orders at all; with a filter it says nothing
// matched and offers the way back to every order.
function NoOrders({ filters }: { filters: AdminOrderFilters }) {
  if (!hasFilters(filters)) {
    return (
      <EmptyState
        icon={ReceiptTextIcon}
        title={NO_ORDERS_TITLE}
        description={NO_ORDERS_DESCRIPTION}
      />
    );
  }
  return (
    <EmptyState
      icon={ReceiptTextIcon}
      title={NO_MATCH_TITLE}
      action={
        <Button asChild variant="outline" size="lg">
          <Link href={ADMIN_ORDERS_PATH}>{CLEAR_FILTERS}</Link>
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
      title={ADMIN_ORDERS_FAILED_TITLE}
      onRetry={onRetry}
    />
  );
}
