"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpenIcon, ReceiptTextIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, type ReactNode } from "react";
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
import { canBuyPlans } from "@/features/pricing/access";
import { isApiError } from "@/lib/api/errors";
import { lastPageOf } from "@/lib/pagination";
import { PRICING_PATH } from "@/lib/pricing-path";
import { useApi, useSession } from "@/lib/session/auth-provider";
import { can } from "@/lib/session/can";
import { useCountdown } from "@/lib/use-countdown";
import { cn } from "@/lib/utils";
import {
  ORDERS_PAGE_SIZE,
  ordersListQuery,
  type OrdersListParams,
} from "../api/orders";
import {
  ordersHeading,
  ordersHref,
  parseOrderFilter,
  type OrderFilter,
} from "../order-filter";
import {
  BUY_PLAN,
  NO_ORDERS_DESCRIPTION,
  NO_ORDERS_IN_FILTER_TITLE,
  NO_ORDERS_TITLE,
  ORDERS_CRUMB,
  ORDERS_DESCRIPTION,
  ORDERS_FAILED_TITLE,
  ORDERS_FORBIDDEN_MESSAGE,
  ORDERS_PAGE_EMPTY_TITLE,
  PRICING_LINK,
  VIEW_ALL_ORDERS,
  VIEW_LAST_PAGE,
} from "../order-text";
import { OrderFilterTabs } from "./order-filter-tabs";
import { OrderRowCards } from "./order-row-cards";
import { OrdersTable } from "./orders-table";

const HEADING_ID = "orders-title";

/**
 * "Gói và đơn của tôi" (scope #19, spec 0022): the landlord's own orders with their status, the
 * four filter links, the page links, and "Tiếp tục thanh toán" on an unpaid one. It runs in the
 * browser, because the list needs a login, and sits behind the route gate of the landlord. The
 * filter and the page are the `?status=` and `?page=` of the address, so the page reads
 * `useSearchParams` and its route keeps it inside a `<Suspense>` boundary.
 *
 * The status strip above the list reads the shared membership and keeps its own states, so it never
 * blocks the list. It has no buy button here: "Mua gói" is in the header of the page.
 */
export function OrdersPage() {
  const searchParams = useSearchParams();
  const params: OrdersListParams = {
    filter: parseOrderFilter(searchParams.get("status")),
    page: parsePageParam(searchParams.get("page")),
  };

  const api = useApi();
  const router = useRouter();
  const session = useSession();
  const mayRead = can(session, "order:read");
  const query = useQuery({ ...ordersListQuery(api, params), enabled: mayRead });
  const { data } = query;

  // A page past the last one (typed by hand) goes to the last page that has rows (AC-17). Never
  // while the rows on screen are the ones of the page before.
  const lastPage =
    data === undefined ? 1 : lastPageOf(data.total, ORDERS_PAGE_SIZE);
  const pastTheEnd =
    data !== undefined &&
    !query.isPlaceholderData &&
    data.total > 0 &&
    data.items.length === 0 &&
    params.page > lastPage;
  useEffect(() => {
    if (pastTheEnd) router.replace(ordersHref(params.filter, lastPage));
  }, [pastTheEnd, router, params.filter, lastPage]);

  if (
    !mayRead ||
    (data === undefined &&
      isApiError(query.error) &&
      query.error.status === 403 &&
      query.error.code === "PERMISSION_DENIED")
  ) {
    return <ForbiddenState message={ORDERS_FORBIDDEN_MESSAGE} />;
  }

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
          {ordersHeading(params.filter, data.total)}
        </h2>

        {data.total === 0 ? (
          <NoOrders filter={params.filter} />
        ) : data.items.length === 0 ? (
          pastTheEnd ? (
            <LoadingState variant="table" />
          ) : (
            <EmptyState
              icon={BookOpenIcon}
              title={ORDERS_PAGE_EMPTY_TITLE}
              action={
                <Button asChild variant="outline" size="lg">
                  <Link href={ordersHref(params.filter, lastPage)}>
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
              <OrdersTable rows={data.items} />
            </div>
            <div className="md:hidden">
              <OrderRowCards rows={data.items} />
            </div>
          </>
        )}

        {data.total > ORDERS_PAGE_SIZE && (
          <div className="border-t px-(--card-spacing) py-4">
            <ListPagination
              page={params.page}
              pageSize={ORDERS_PAGE_SIZE}
              total={data.total}
              hrefFor={(page) => ordersHref(params.filter, page)}
              itemLabel="đơn"
            />
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={ORDERS_CRUMB}
        description={ORDERS_DESCRIPTION}
        actions={
          canBuyPlans(session) ? (
            <Button asChild size="lg">
              <Link href={PRICING_PATH}>{BUY_PLAN}</Link>
            </Button>
          ) : null
        }
      />

      <MembershipStrip showAction={false} />

      {/* One zone: the filter links are its title row, the rows run edge to edge under them. */}
      <Card>
        <OrderFilterTabs filter={params.filter} />
        {renderBody()}
      </Card>
    </div>
  );
}

/** The skeleton for the route's `Suspense` fallback, drawn until the address is known. */
export function OrdersSkeleton() {
  return (
    <Card>
      <LoadingState variant="table" />
    </Card>
  );
}

// No rows for this filter. With no filter it points at the pricing page; with a filter it says so
// and offers the way back to every order (AC-17).
function NoOrders({ filter }: { filter: OrderFilter }) {
  if (filter === "all") {
    return (
      <EmptyState
        icon={ReceiptTextIcon}
        title={NO_ORDERS_TITLE}
        description={NO_ORDERS_DESCRIPTION}
        action={
          <Button asChild size="lg">
            <Link href={PRICING_PATH}>{PRICING_LINK}</Link>
          </Button>
        }
      />
    );
  }
  return (
    <EmptyState
      icon={ReceiptTextIcon}
      title={NO_ORDERS_IN_FILTER_TITLE}
      action={
        <Button asChild variant="outline" size="lg">
          <Link href={ordersHref("all", 1)}>{VIEW_ALL_ORDERS}</Link>
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
    <ErrorState error={error} title={ORDERS_FAILED_TITLE} onRetry={onRetry} />
  );
}
