import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/client";
import type { AdminOrderPage } from "@/lib/api/types";
import { sameFilters, type AdminOrderFilters } from "../admin-order-filter";
import { adminOrdersListKey } from "./admin-orders-keys";

/** Ten rows a page, the same as the history of a landlord (spec 0022), on a table and on a phone. */
export const ADMIN_ORDERS_PAGE_SIZE = 10;

/** Which page of which filters the address asks for. */
export interface AdminOrdersParams extends AdminOrderFilters {
  page: number;
}

/**
 * `GET /orders/all` (`order:report`, api-for-frontend.md 6.37): the orders of every landlord, newest
 * first, with `summary` of the whole filtered set. Only a filter that is set is sent: the API
 * refuses a value outside its list and a parameter it does not know. The rows keep the order the
 * API gave, and the front end adds up nothing: the two totals are the ones in `summary`.
 */
export const fetchAdminOrders = (
  api: ApiClient,
  params: AdminOrdersParams,
  signal?: AbortSignal,
) =>
  api.get<AdminOrderPage>("/orders/all", {
    query: {
      page: params.page,
      pageSize: ADMIN_ORDERS_PAGE_SIZE,
      ...(params.status === "all" ? {} : { status: params.status }),
      ...(params.landlordId === null ? {} : { landlordId: params.landlordId }),
      ...(params.planId === null ? {} : { planId: params.planId }),
      ...(params.from === null ? {} : { from: params.from }),
      ...(params.to === null ? {} : { to: params.to }),
    },
    signal,
  });

/**
 * One page of the list. The previous page stays on screen while the next one loads, but only when
 * the filters are the same: rows or totals of other filters under a changed filter would be a lie.
 * The default `staleTime` of 0 is on purpose: an order paid or cancelled since shows up when the
 * page opens or the window gets focus.
 */
export const adminOrdersListQuery = (
  api: ApiClient,
  params: AdminOrdersParams,
) =>
  queryOptions({
    queryKey: adminOrdersListKey({
      ...params,
      pageSize: ADMIN_ORDERS_PAGE_SIZE,
    }),
    queryFn: ({ signal }) => fetchAdminOrders(api, params, signal),
    placeholderData: (previous, previousQuery) =>
      previousQuery !== undefined &&
      sameFilters(previousQuery.queryKey[3], params)
        ? previous
        : undefined,
  });
