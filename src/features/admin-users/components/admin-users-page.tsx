"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpenIcon, UsersRoundIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, type ReactNode } from "react";
import { ReasonDialog } from "@/components/form/reason-dialog";
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
import type { AdminUserListItem } from "@/lib/api/types";
import { lastPageOf } from "@/lib/pagination";
import { useApi, useSession } from "@/lib/session/auth-provider";
import { can } from "@/lib/session/can";
import { cn } from "@/lib/utils";
import { ADMIN_USERS_PATH, RESULTS_HEADING_ID } from "../admin-users-path";
import {
  ADMIN_USERS_DESCRIPTION,
  ADMIN_USERS_FAILED_TITLE,
  ADMIN_USERS_FORBIDDEN_MESSAGE,
  ADMIN_USERS_TITLE,
  CLEAR_FILTERS,
  NO_MATCH_ACCENT,
  NO_MATCH_TITLE,
  NO_USERS_DESCRIPTION,
  NO_USERS_TITLE,
  PAGE_EMPTY_TITLE,
  VIEW_LAST_PAGE,
  usersHeading,
} from "../admin-users-text";
import {
  ADMIN_USERS_PAGE_SIZE,
  adminUsersListQuery,
  type AdminUsersParams,
} from "../api/users";
import { useLockFlow } from "../hooks/use-lock-flow";
import { rowActions } from "../row-actions";
import {
  adminUsersHref,
  hasFilters,
  parseUserFilters,
  type UserFilters,
} from "../user-filter";
import { UserCards } from "./user-cards";
import { UserFilterBar } from "./user-filter-bar";
import { UserRowActions } from "./user-row-actions";
import { UsersTable } from "./users-table";

const HEADING_ID = RESULTS_HEADING_ID;

/**
 * "Người dùng" (scope #20, `GET /users`): every account with its type, its status and, for a
 * locked one, the reason, with a search box, a type filter, a status filter and the page links.
 * It runs in the browser, because the list needs a login, and sits behind the route gate of the
 * admin. The filters, the search text and the page are the query of the address, so the page reads
 * `useSearchParams` and its route keeps it inside a `<Suspense>` boundary.
 */
export function AdminUsersPage() {
  const searchParams = useSearchParams();
  const filters = useMemo(
    () => parseUserFilters((name) => searchParams.get(name)),
    [searchParams],
  );
  const page = parsePageParam(searchParams.get("page"));
  const params: AdminUsersParams = { ...filters, page };

  const api = useApi();
  const router = useRouter();
  const session = useSession();
  const mayRead = can(session, "user:read");
  const mayLock = can(session, "user:lock");
  const mayRevoke = can(session, "user:revoke");
  const viewerId = session.status === "user" ? session.user.id : null;
  const lock = useLockFlow();
  const query = useQuery({
    ...adminUsersListQuery(api, params),
    enabled: mayRead,
  });
  const { data } = query;

  // A page past the last one (typed by hand) goes to the last page that has rows. Never while the
  // rows on screen are the ones of the page before.
  const lastPage =
    data === undefined ? 1 : lastPageOf(data.total, ADMIN_USERS_PAGE_SIZE);
  const pastTheEnd =
    data !== undefined &&
    !query.isPlaceholderData &&
    data.total > 0 &&
    data.items.length === 0 &&
    page > lastPage;
  useEffect(() => {
    if (pastTheEnd) router.replace(adminUsersHref(filters, lastPage));
  }, [pastTheEnd, router, filters, lastPage]);

  if (
    !mayRead ||
    (data === undefined &&
      isApiError(query.error) &&
      query.error.status === 403 &&
      query.error.code === "PERMISSION_DENIED")
  ) {
    return <ForbiddenState message={ADMIN_USERS_FORBIDDEN_MESSAGE} />;
  }

  // An admin with neither permission sees no action column, whatever the row is.
  const showActions = mayLock || mayRevoke;
  const renderActions = (
    user: AdminUserListItem,
    size: "sm" | "lg",
  ): ReactNode => (
    <UserRowActions
      user={user}
      actions={rowActions(user, viewerId, { lock: mayLock, revoke: mayRevoke })}
      size={size}
      onLock={lock.ask}
      onUnlock={lock.ask}
    />
  );

  const renderBody = (): ReactNode => {
    if (data === undefined) {
      return query.isError ? (
        <ListFailure
          error={query.error}
          title={ADMIN_USERS_FAILED_TITLE}
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
          {usersHeading(data.total)}
        </h2>

        {data.total === 0 ? (
          <NoUsers filters={filters} />
        ) : data.items.length === 0 ? (
          pastTheEnd ? (
            <LoadingState variant="table" />
          ) : (
            <EmptyState
              icon={BookOpenIcon}
              title={PAGE_EMPTY_TITLE}
              action={
                <Button asChild variant="outline" size="lg">
                  <Link href={adminUsersHref(filters, lastPage)}>
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
              <UsersTable
                rows={data.items}
                actions={
                  showActions ? (user) => renderActions(user, "sm") : undefined
                }
              />
            </div>
            <div className="md:hidden">
              <UserCards
                rows={data.items}
                actions={
                  showActions ? (user) => renderActions(user, "lg") : undefined
                }
              />
            </div>
          </>
        )}

        {data.total > ADMIN_USERS_PAGE_SIZE && (
          <div className="border-t px-(--card-spacing) py-4">
            <ListPagination
              page={page}
              pageSize={ADMIN_USERS_PAGE_SIZE}
              total={data.total}
              hrefFor={(next) => adminUsersHref(filters, next)}
              itemLabel="người dùng"
            />
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={ADMIN_USERS_TITLE}
        description={ADMIN_USERS_DESCRIPTION}
      />
      <UserFilterBar filters={filters} />
      <Card>{renderBody()}</Card>

      {/* One dialog for every row. It has no trigger of its own, so it takes focus back through
          `useReturnFocus` (inside `useLockFlow`). */}
      <ReasonDialog
        open={lock.open}
        onOpenChange={lock.onOpenChange}
        title={lock.title}
        description={lock.description}
        confirmLabel={lock.confirmLabel}
        tone={lock.tone}
        placeholder={lock.placeholder}
        onSubmit={lock.submit}
        onCloseAutoFocus={lock.onCloseAutoFocus}
      />
    </div>
  );
}

/** The skeleton for the route's `Suspense` fallback, drawn until the address is known. */
export function AdminUsersSkeleton() {
  return (
    <Card>
      <LoadingState variant="table" />
    </Card>
  );
}

// No rows. With nothing set it says there is nobody at all. A search that finds nothing names the
// one rule a person can trip on (the API is accent sensitive) and offers the way back; a filter
// alone says nothing matched and offers the same way back.
function NoUsers({ filters }: { filters: UserFilters }) {
  if (!hasFilters(filters)) {
    return (
      <EmptyState
        icon={UsersRoundIcon}
        title={NO_USERS_TITLE}
        description={NO_USERS_DESCRIPTION}
      />
    );
  }
  return (
    <EmptyState
      icon={UsersRoundIcon}
      title={NO_MATCH_TITLE}
      description={filters.q === "" ? undefined : NO_MATCH_ACCENT}
      action={
        <Button asChild variant="outline" size="lg">
          <Link href={ADMIN_USERS_PATH}>{CLEAR_FILTERS}</Link>
        </Button>
      }
    />
  );
}
