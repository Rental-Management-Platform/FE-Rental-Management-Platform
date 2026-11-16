import type { ApiClient } from "@/lib/api/client";
import type { Order, Uuid } from "@/lib/api/types";

/**
 * `POST /orders` (api-for-frontend.md, 6.27), for a landlord account with `order:create`. The body
 * is `{ planId }` and nothing else: the backend takes the price, the limit and the days from the
 * plan, and a stray field such as `price` is a 400. A 201 answer is the new `pending` order. It
 * cancels the landlord's older unpaid order in the same call, except when the create fails.
 * Mutations never retry (spec 0002), so a press sends one request.
 */
export const createOrder = (api: ApiClient, planId: Uuid) =>
  api.post<Order>("/orders", { planId });
