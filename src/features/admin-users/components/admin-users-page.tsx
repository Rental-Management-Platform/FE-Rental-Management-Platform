"use client";

import { useQuery } from "@tanstack/react-query";
import { UsersRoundIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ListPagination } from "@/components/list-pagination";
import { EmptyState } from "@/components/states/empty-state";
import { ForbiddenState } from "@/components/states/forbidden-state";
import { LoadingState } from "@/components/states/loading-state";
import { Card } from "@/components/ui/card";
import { ListFailure } from "@/features/admin-catalog/components/list-failure";
import { parsePageParam } from "@/features/listing-search/schemas/search-params";
import { isApiError } from "@/lib/api/errors";
import { useApi, useSession } from "@/lib/session/auth-provider";
import { can } from "@/lib/session/can";
import { cn } from "@/lib/utils";
import { ADMIN_USERS_PATH } from "../admin-users-path";
import {
  ADMIN_USERS_DESCRIPTION,
  ADMIN_USERS_FAILED_TITLE,
  ADMIN_USERS_FORBIDDEN_MESSAGE,
  ADMIN_USERS_TITLE,
  NO_USERS_DESCRIPTION,
  NO_USERS_TITLE,
  usersHeading,
} from "../admin-users-text";
import { ADMIN_USERS_PAGE_SIZE, adminUsersListQuery } from "../api/users";
import { UserCards } from "./user-cards";
import { UsersTable } from "./users-table";

const HEADING_ID = "admin-users-title";

// The address of one page. Page 1 leaves its parameter out, so the clean address is the one a
// person shares.
const pageHref = (page: number) =>
  page > 1 ? `${ADMIN_USERS_PATH}?page=${page}` : ADMIN_USERS_PATH;

/**
 * "Người dùng" (scope #20, `GET /users`): every account with its type, its status and, for a
 * locked one, the reason. It runs in the browser, because the list needs a login, and sits behind
 * the route gate of the admin. The page is the query of the address, so the page reads
 * `useSearchParams` and its route keeps it inside a `<Suspense>` boundary.
 */
export function AdminUsersPage() {
  const searchParams = useSearchParams();
  const page = parsePageParam(searchParams.get("page"));

  const api = useApi();
  const session = useSession();
  const mayRead = can(session, "user:read");
  const query = useQuery({
    ...adminUsersListQuery(api, { page }),
    enabled: mayRead,
  });
  const { data } = query;

  if (
    !mayRead ||
    (data === undefined &&
      isApiError(query.error) &&
      query.error.status === 403 &&
      query.error.code === "PERMISSION_DENIED")
  ) {
    return <ForbiddenState message={ADMIN_USERS_FORBIDDEN_MESSAGE} />;
  }

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
        <h2
          id={HEADING_ID}
          aria-live="polite"
          className={cn(
            "px-(--card-spacing) pt-4 pb-3 text-base",
            data.total === 0 && "sr-only",
          )}
        >
          {usersHeading(data.total)}
        </h2>

        {data.items.length === 0 ? (
          <EmptyState
            icon={UsersRoundIcon}
            title={NO_USERS_TITLE}
            description={NO_USERS_DESCRIPTION}
          />
        ) : (
          <>
            {/* The same rows twice: a table from `md` and stacked blocks below it. The hidden
                one is `display: none`, so a screen reader reads only one. */}
            <div className="hidden md:block">
              <UsersTable rows={data.items} />
            </div>
            <div className="md:hidden">
              <UserCards rows={data.items} />
            </div>
          </>
        )}

        {data.total > ADMIN_USERS_PAGE_SIZE && (
          <div className="border-t px-(--card-spacing) py-4">
            <ListPagination
              page={page}
              pageSize={ADMIN_USERS_PAGE_SIZE}
              total={data.total}
              hrefFor={pageHref}
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
      <Card>{renderBody()}</Card>
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
