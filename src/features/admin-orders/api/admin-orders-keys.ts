import type { AdminOrderFilters } from "../admin-order-filter";

/**
 * The cache keys of the admin orders page (scope #25). The session clears the cache when it
 * changes, so no key needs a user id. Everything starts with `adminOrdersKey`, so one call can
 * mark the list and both filter lists out of date together.
 */
export const adminOrdersKey = ["admin", "orders"] as const;

/** One page of one set of filters. `list` is the third part, so it never meets the option keys. */
export const adminOrdersListKey = (
  params: AdminOrderFilters & { page: number; pageSize: number },
) => [...adminOrdersKey, "list", params] as const;

/** The plans of the plan filter (`GET /plans/all`). */
export const planOptionsKey = [...adminOrdersKey, "plan-options"] as const;

/** The landlords of the landlord filter (`GET /users?accountType=landlord`). */
export const landlordOptionsKey = [
  ...adminOrdersKey,
  "landlord-options",
] as const;

/** One search text of the landlord filter. `""` is the first page with no search. */
export const landlordSearchKey = (text: string) =>
  [...landlordOptionsKey, text] as const;
