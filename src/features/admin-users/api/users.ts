import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/client";
import type { AdminUserListItem, Page } from "@/lib/api/types";
import { adminUsersListKey } from "./admin-users-keys";

/** Twenty rows a page: the API default (spec 0023, "Value sourcing"; it allows 50 at most). */
export const ADMIN_USERS_PAGE_SIZE = 20;

/** Which page of the list the address asks for. */
export interface AdminUsersParams {
  page: number;
}

/**
 * `GET /users` (`user:read`, api-for-frontend.md 6.34): every account, locked ones and admins
 * included, newest first. Only a parameter that is set is sent: the API refuses a value outside
 * its list and a parameter it does not know. The rows keep the order the API gave.
 */
export const fetchAdminUsers = (
  api: ApiClient,
  params: AdminUsersParams,
  signal?: AbortSignal,
) =>
  api.get<Page<AdminUserListItem>>("/users", {
    query: { page: params.page, pageSize: ADMIN_USERS_PAGE_SIZE },
    signal,
  });

/**
 * One page of the list. The default `staleTime` of 0 is on purpose: an account locked or created
 * since shows up when the page opens or the window gets focus.
 */
export const adminUsersListQuery = (api: ApiClient, params: AdminUsersParams) =>
  queryOptions({
    queryKey: adminUsersListKey({
      ...params,
      pageSize: ADMIN_USERS_PAGE_SIZE,
    }),
    queryFn: ({ signal }) => fetchAdminUsers(api, params, signal),
    placeholderData: keepPreviousData,
  });
