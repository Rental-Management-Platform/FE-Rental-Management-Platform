import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/client";
import type { Order, Page, Uuid } from "@/lib/api/types";
import { pendingOrderKey } from "./order-keys";

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
