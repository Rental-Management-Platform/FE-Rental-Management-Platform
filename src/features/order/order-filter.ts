// What the order history reads from its address, and how it writes one back (spec 0022, AC-14).
// Pure: no React, no router.

import type { OrderStatus } from "@/lib/api/types";
import { formatCount } from "@/lib/format";
import { ORDERS_PATH } from "./order-paths";

/** `all` sends no `status`. The other three are the `status` of `GET /orders`. */
export type OrderFilter = "all" | OrderStatus;

/** The four links of the filter, in screen order. */
export const ORDER_FILTERS: readonly { value: OrderFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ thanh toán" },
  { value: "paid", label: "Đã thanh toán" },
  { value: "cancelled", label: "Đã hủy" },
];

const STATUSES: readonly OrderStatus[] = ["pending", "paid", "cancelled"];

/**
 * The filter an address asks for. No value means all, and a value that is not one of the three
 * statuses is treated as all, so an unknown `status` is never sent to the API.
 */
export const parseOrderFilter = (raw: string | null | undefined): OrderFilter =>
  STATUSES.find((status) => status === raw) ?? "all";

/**
 * The address of one page of one filter. "Tất cả" and page 1 leave their parameter out, so the
 * clean address is the one a person shares.
 */
export function ordersHref(filter: OrderFilter, page: number): string {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("status", filter);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query === "" ? ORDERS_PATH : `${ORDERS_PATH}?${query}`;
}

/** The words of the list heading, which a screen reader hears again when the count changes. */
export function ordersHeading(filter: OrderFilter, total: number): string {
  const count = formatCount(total);
  switch (filter) {
    case "all":
      return `${count} đơn`;
    case "pending":
      return `${count} đơn chờ thanh toán`;
    case "paid":
      return `${count} đơn đã thanh toán`;
    case "cancelled":
      return `${count} đơn đã hủy`;
  }
}
