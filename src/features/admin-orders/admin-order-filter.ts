// What the admin orders page reads from its address, and how it writes one back (scope #25).
// Pure: no React, no router.

import {
  parseOrderFilter,
  type OrderFilter,
} from "@/features/order/order-filter";
import type { DateOnly, Uuid } from "@/lib/api/types";
import { isUuid } from "@/lib/is-uuid";
import { ADMIN_ORDERS_PATH } from "./admin-orders-path";

/**
 * Every filter of `GET /orders/all` (api-for-frontend.md, 6.37). `all` and `null` mean "not
 * sent". The status is the same four words as the history of a landlord, so it shares the type.
 * The days are days in Vietnam, as `YYYY-MM-DD`, and filter on the day the order was created.
 */
export interface AdminOrderFilters {
  status: OrderFilter;
  landlordId: Uuid | null;
  planId: Uuid | null;
  from: DateOnly | null;
  to: DateOnly | null;
}

/** What the page shows with a clean address. */
export const NO_FILTERS: AdminOrderFilters = {
  status: "all",
  landlordId: null,
  planId: null,
  from: null,
  to: null,
};

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * The day a text names, or `null` when it is not a real day on the calendar (30 February) or is
 * outside the years the API accepts (2000 to 2100). A day the API would refuse is never sent.
 */
export function parseDay(raw: string | null | undefined): DateOnly | null {
  const match = raw === null || raw === undefined ? null : DAY.exec(raw);
  if (match === null) return null;
  const [year, month, day] = match.slice(1).map(Number);
  if (year < 2000 || year > 2100) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  const real =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
  return real ? match[0] : null;
}

/**
 * The filters an address asks for. A value the API would refuse (an unknown status, an id that is
 * not a UUID, a day that does not exist) is treated as if it were not there, so it is never sent.
 * An id with the right shape that belongs to nobody is kept: the API answers it with an empty list.
 */
export function parseAdminOrderFilters(
  read: (name: string) => string | null,
): AdminOrderFilters {
  const id = (raw: string | null) => (raw !== null && isUuid(raw) ? raw : null);
  return {
    status: parseOrderFilter(read("status")),
    landlordId: id(read("landlordId")),
    planId: id(read("planId")),
    from: parseDay(read("from")),
    to: parseDay(read("to")),
  };
}

/**
 * True when the first day is after the last one. The API refuses it and reports the fault on `to`,
 * so the page says so under that field and makes no call (YYYY-MM-DD compares as text).
 */
export const rangeIsBackwards = ({ from, to }: AdminOrderFilters): boolean =>
  from !== null && to !== null && from > to;

/** True when anything is filtered, the status included. */
export const hasFilters = (filters: AdminOrderFilters): boolean =>
  !sameFilters(filters, NO_FILTERS);

export const sameFilters = (
  a: AdminOrderFilters,
  b: AdminOrderFilters,
): boolean =>
  a.status === b.status &&
  a.landlordId === b.landlordId &&
  a.planId === b.planId &&
  a.from === b.from &&
  a.to === b.to;

/**
 * The address of one page of one set of filters. Only what is set is written, and page 1 leaves
 * its parameter out, so the clean address is the one a person shares.
 */
export function adminOrdersHref(
  filters: AdminOrderFilters,
  page: number,
): string {
  const params = new URLSearchParams();
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.landlordId !== null) params.set("landlordId", filters.landlordId);
  if (filters.planId !== null) params.set("planId", filters.planId);
  if (filters.from !== null) params.set("from", filters.from);
  if (filters.to !== null) params.set("to", filters.to);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query === "" ? ADMIN_ORDERS_PATH : `${ADMIN_ORDERS_PATH}?${query}`;
}

/** What a landlord is called in the list: the name, or the email when there is no name. */
export const landlordLabel = (landlord: {
  name: string | null;
  email: string;
}): string => {
  const name = landlord.name?.trim();
  return name ? name : landlord.email;
};
