import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/client";
import type { Order, Page, Uuid } from "@/lib/api/types";
import type { OrderFilter } from "../order-filter";
import { orderKey, ordersListKey, pendingOrderKey } from "./order-keys";

/**
 * `POST /orders` (api-for-frontend.md, 6.27), for a landlord account with `order:create`. The body
 * is `{ planId }` and nothing else: the backend takes the price, the limit and the days from the
 * plan, and a stray field such as `price` is a 400. A 201 answer is the new `pending` order. It
 * cancels the landlord's older unpaid order in the same call, except when the create fails.
 * Mutations never retry (spec 0002), so a press sends one request.
 */
export const createOrder = (api: ApiClient, planId: Uuid) =>
  api.post<Order>("/orders", { planId });

/**
 * `GET /orders?status=pending` (`order:read`), one row. A landlord has at most one unpaid order,
 * so page 1 of size 1 holds it, newest first. The default `staleTime` of 0 is on purpose: the
 * entry is read again when the page opens, because the order may have been paid or cancelled in
 * another tab since.
 */
export const pendingOrderQuery = (api: ApiClient) =>
  queryOptions({
    queryKey: pendingOrderKey,
    queryFn: ({ signal }) =>
      api.get<Page<Order>>("/orders", {
        query: { status: "pending", page: 1, pageSize: 1 },
        signal,
      }),
  });

/**
 * `GET /orders/:id` (`order:read`): one of my orders, in any status, from its own fixed fields.
 * 404 `ORDER_NOT_FOUND` and 403 `NOT_RESOURCE_OWNER` both mean "not an order of mine" to the page.
 */
export const getOrder = (api: ApiClient, id: Uuid, signal?: AbortSignal) =>
  api.get<Order>(`/orders/${encodeURIComponent(id)}`, { signal });

/**
 * `POST /orders/:id/pay` (permission `order:create`, landlord account only), with no body. A 200
 * answer is the `paid` order with `paidAt`, `startsAt` and `endsAt`. Paying a paid order answers
 * the same 200 and makes no second period; a plan turned off answers 409 `PLAN_INACTIVE` and
 * leaves the order pending. Mutations never retry (spec 0002), so a press sends one request.
 */
export const payOrder = (api: ApiClient, id: Uuid) =>
  api.post<Order>(`/orders/${encodeURIComponent(id)}/pay`);

/**
 * One order as a query (spec 0022, AC-2). An order stored by a press on "Mua" (spec 0021) shows at
 * once and is read again in the background. The default `staleTime` of 0 and the default refetch
 * on window focus are on purpose: a payment or a cancel made in another tab shows up when this
 * tab gets focus.
 */
export const orderQuery = (api: ApiClient, id: Uuid) =>
  queryOptions({
    queryKey: orderKey(id),
    queryFn: ({ signal }) => getOrder(api, id, signal),
  });

/**
 * `POST /orders/:id/cancel` (permission `order:cancel`), with no body. A 200 answer is the
 * `cancelled` order with `cancelledAt`. Cancelling a cancelled order answers the same 200; a paid
 * order answers 409 `ORDER_STATE_INVALID`. Mutations never retry (spec 0002).
 */
export const cancelOrder = (api: ApiClient, id: Uuid) =>
  api.post<Order>(`/orders/${encodeURIComponent(id)}/cancel`);

/** Ten rows a page, the same on the table and on the phone (spec 0022, AC-14). */
export const ORDERS_PAGE_SIZE = 10;

/** Which page of which filter the address asks for. */
export interface OrdersListParams {
  filter: OrderFilter;
  page: number;
}

/**
 * `GET /orders` (`order:read`, api-for-frontend.md 6.27): my orders in every status, newest first.
 * "Tất cả" sends no `status`. The rows keep the order the API gave: the front end sorts nothing.
 */
export const fetchOrders = (
  api: ApiClient,
  { filter, page }: OrdersListParams,
  signal?: AbortSignal,
) =>
  api.get<Page<Order>>("/orders", {
    query: {
      page,
      pageSize: ORDERS_PAGE_SIZE,
      ...(filter === "all" ? {} : { status: filter }),
    },
    signal,
  });

/**
 * One page of the history. The previous page stays on screen while the next one loads, but only
 * inside the same filter: rows of another filter under a new highlighted tab would be a lie. The
 * default `staleTime` of 0 is on purpose: an order paid or cancelled elsewhere shows up when the
 * page opens or the window gets focus.
 */
export const ordersListQuery = (api: ApiClient, params: OrdersListParams) =>
  queryOptions({
    queryKey: ordersListKey({
      status: params.filter,
      page: params.page,
      pageSize: ORDERS_PAGE_SIZE,
    }),
    queryFn: ({ signal }) => fetchOrders(api, params, signal),
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[2].status === params.filter
        ? previous
        : undefined,
  });
