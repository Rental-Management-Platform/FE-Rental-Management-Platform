import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/client";
import type { AdminUserListItem, Page, User, Uuid } from "@/lib/api/types";
import { sameFilters, type UserFilters } from "../user-filter";
import { adminUsersListKey } from "./admin-users-keys";

/** Twenty rows a page: the API default (spec 0023, "Value sourcing"; it allows 50 at most). */
export const ADMIN_USERS_PAGE_SIZE = 20;

/** Which page of which filters the address asks for. */
export interface AdminUsersParams extends UserFilters {
  page: number;
}

/**
 * `GET /users` (`user:read`, api-for-frontend.md 6.34): every account, locked ones and admins
 * included, newest first. Only a filter that is set is sent: the API refuses a value outside its
 * list and a parameter it does not know. The rows keep the order the API gave.
 */
export const fetchAdminUsers = (
  api: ApiClient,
  params: AdminUsersParams,
  signal?: AbortSignal,
) =>
  api.get<Page<AdminUserListItem>>("/users", {
    query: {
      page: params.page,
      pageSize: ADMIN_USERS_PAGE_SIZE,
      ...(params.accountType === "all"
        ? {}
        : { accountType: params.accountType }),
      ...(params.status === "all" ? {} : { status: params.status }),
      ...(params.q === "" ? {} : { q: params.q }),
    },
    signal,
  });

/**
 * One page of the list. The previous page stays on screen while the next one loads, but only when
 * the filters are the same: rows of other filters under a changed filter would be a lie. The
 * default `staleTime` of 0 is on purpose: an account locked or created since shows up when the
 * page opens or the window gets focus.
 */
export const adminUsersListQuery = (api: ApiClient, params: AdminUsersParams) =>
  queryOptions({
    queryKey: adminUsersListKey({
      ...params,
      pageSize: ADMIN_USERS_PAGE_SIZE,
    }),
    queryFn: ({ signal }) => fetchAdminUsers(api, params, signal),
    placeholderData: (previous, previousQuery) =>
      previousQuery !== undefined &&
      sameFilters(previousQuery.queryKey[3], params)
        ? previous
        : undefined,
  });

/**
 * `POST /users/:id/lock` (`user:lock`, 6.10): the account becomes `locked` and every session of it
 * ends at once. The body is only the reason (1 to 500 characters). The answer has six fields and
 * no `lockedReason`, so the page reads the list again instead of patching a row.
 */
export const lockUser = (api: ApiClient, id: Uuid, reason: string) =>
  api.post<User>(`/users/${id}/lock`, { reason });

/**
 * `POST /users/:id/unlock` (`user:lock`, 6.11): the account becomes `active`. The sessions that a
 * lock ended do not come back. Same body and same answer as a lock.
 */
export const unlockUser = (api: ApiClient, id: Uuid, reason: string) =>
  api.post<User>(`/users/${id}/unlock`, { reason });
