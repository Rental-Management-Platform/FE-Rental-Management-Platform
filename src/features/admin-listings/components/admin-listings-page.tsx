"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpenIcon, ShieldAlertIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, type ReactNode } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ListPagination } from "@/components/list-pagination";
import { EmptyState } from "@/components/states/empty-state";
import { ForbiddenState } from "@/components/states/forbidden-state";
import { LoadingState } from "@/components/states/loading-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ListFailure } from "@/features/admin-catalog/components/list-failure";
import { parsePageParam } from "@/features/listing-search/schemas/search-params";
import { isApiError } from "@/lib/api/errors";
import { lastPageOf } from "@/lib/pagination";
import { useApi, useSession } from "@/lib/session/auth-provider";
import { can } from "@/lib/session/can";
import { cn } from "@/lib/utils";
import {
  ADMIN_LISTINGS_PATH,
  RESULTS_HEADING_ID,
} from "../admin-listings-path";
import {
  ADMIN_LISTINGS_DESCRIPTION,
  ADMIN_LISTINGS_FAILED_TITLE,
  ADMIN_LISTINGS_FORBIDDEN_MESSAGE,
  ADMIN_LISTINGS_TITLE,
  CLEAR_FILTERS,
  NO_LISTINGS_DESCRIPTION,
  NO_LISTINGS_TITLE,
  NO_MATCH_TITLE,
  PAGE_EMPTY_TITLE,
  VIEW_LAST_PAGE,
  listingsHeading,
} from "../admin-listings-text";
import {
  ADMIN_LISTINGS_PAGE_SIZE,
  adminListingsListQuery,
  type AdminListingsParams,
} from "../api/moderation";
import {
  adminListingsHref,
  hasFilters,
  parseModerationFilters,
  type ModerationFilters,
} from "../moderation-filter";
import { ModerationCards } from "./moderation-cards";
import { ModerationTable } from "./moderation-table";

const HEADING_ID = RESULTS_HEADING_ID;

/**
 * "Kiểm duyệt tin" (scope #21, `GET /moderation/listings`): the listings of every landlord in every
 * state, with the status, the reason of an admin hide and the page links. It runs in the browser,
 * because the list needs a login, and sits behind the route gate of the admin. The filters, the
 * search text and the page are the query of the address, so the page reads `useSearchParams` and
 * its route keeps it inside a `<Suspense>` boundary.
 */
export function AdminListingsPage() {
  const searchParams = useSearchParams();
  const filters = useMemo(
    () => parseModerationFilters((name) => searchParams.get(name)),
    [searchParams],
  );
  const page = parsePageParam(searchParams.get("page"));
  const params: AdminListingsParams = { ...filters, page };

  const api = useApi();
  const router = useRouter();
  const session = useSession();
  const mayModerate = can(session, "listing:moderate");
  const query = useQuery({
    ...adminListingsListQuery(api, params),
    enabled: mayModerate,
  });
  const { data } = query;

  // A page past the last one (typed by hand) goes to the last page that has rows. Never while the
  // rows on screen are the ones of the page before.
  const lastPage =
    data === undefined ? 1 : lastPageOf(data.total, ADMIN_LISTINGS_PAGE_SIZE);
  const pastTheEnd =
    data !== undefined &&
    !query.isPlaceholderData &&
    data.total > 0 &&
    data.items.length === 0 &&
    page > lastPage;
  useEffect(() => {
    if (pastTheEnd) router.replace(adminListingsHref(filters, lastPage));
  }, [pastTheEnd, router, filters, lastPage]);

  if (
    !mayModerate ||
    (data === undefined &&
      isApiError(query.error) &&
      query.error.status === 403 &&
      query.error.code === "PERMISSION_DENIED")
  ) {
    return <ForbiddenState message={ADMIN_LISTINGS_FORBIDDEN_MESSAGE} />;
  }

  const landlordHref = (landlordId: string) =>
    adminListingsHref({ ...filters, landlordId }, 1);

  const renderBody = (): ReactNode => {
    if (data === undefined) {
      return query.isError ? (
        <ListFailure
          error={query.error}
          title={ADMIN_LISTINGS_FAILED_TITLE}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <LoadingState variant="table" />
      );
    }
    return (
      <section aria-labelledby={HEADING_ID} className="flex flex-col">
        {/* The count is read out again when it changes. With no rows the empty state below says
            it, so the heading is for a screen reader only. */}
        {/* `tabIndex` lets code send focus here when the row of a write left the list. */}
        <h2
          id={HEADING_ID}
          tabIndex={-1}
          aria-live="polite"
          className={cn(
            "px-(--card-spacing) pt-4 pb-3 text-base outline-hidden",
            data.total === 0 && "sr-only",
          )}
        >
          {listingsHeading(data.total)}
        </h2>

        {data.total === 0 ? (
          <NoListings filters={filters} />
        ) : data.items.length === 0 ? (
          pastTheEnd ? (
            <LoadingState variant="table" />
          ) : (
            <EmptyState
              icon={BookOpenIcon}
              title={PAGE_EMPTY_TITLE}
              action={
                <Button asChild variant="outline" size="lg">
                  <Link href={adminListingsHref(filters, lastPage)}>
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
              <ModerationTable rows={data.items} landlordHref={landlordHref} />
            </div>
            <div className="md:hidden">
              <ModerationCards rows={data.items} landlordHref={landlordHref} />
            </div>
          </>
        )}

        {data.total > ADMIN_LISTINGS_PAGE_SIZE && (
          <div className="border-t px-(--card-spacing) py-4">
            <ListPagination
              page={page}
              pageSize={ADMIN_LISTINGS_PAGE_SIZE}
              total={data.total}
              hrefFor={(next) => adminListingsHref(filters, next)}
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
        title={ADMIN_LISTINGS_TITLE}
        description={ADMIN_LISTINGS_DESCRIPTION}
      />
      <Card>{renderBody()}</Card>
    </div>
  );
}

/** The skeleton for the route's `Suspense` fallback, drawn until the address is known. */
export function AdminListingsSkeleton() {
  return (
    <Card>
      <LoadingState variant="table" />
    </Card>
  );
}

// No rows. With nothing set it says there is no listing at all; with a filter or a search set it
// says nothing matched and offers the way back.
function NoListings({ filters }: { filters: ModerationFilters }) {
  if (!hasFilters(filters)) {
    return (
      <EmptyState
        icon={ShieldAlertIcon}
        title={NO_LISTINGS_TITLE}
        description={NO_LISTINGS_DESCRIPTION}
      />
    );
  }
  return (
    <EmptyState
      icon={ShieldAlertIcon}
      title={NO_MATCH_TITLE}
      action={
        <Button asChild variant="outline" size="lg">
          <Link href={ADMIN_LISTINGS_PATH}>{CLEAR_FILTERS}</Link>
        </Button>
      }
    />
  );
}
