import type { Uuid } from "@/lib/api/types";

/**
 * The cache keys of the orders of the person who is signed in (spec 0021). The session clears the
 * cache when it changes, so no key needs a user id. All three start with `ordersKey`, so one
 * `invalidateQueries({ queryKey: ordersKey })` marks the pending read, one order and the history of
 * #19 out of date together.
 */
export const ordersKey = ["orders"] as const;

/** The one pending order (`GET /orders?status=pending`, one row). */
export const pendingOrderKey = [...ordersKey, "pending"] as const;

/** One order by its id: written from the 201 answer of a create, read by #19's page. */
export const orderKey = (id: Uuid) => [...ordersKey, id] as const;
