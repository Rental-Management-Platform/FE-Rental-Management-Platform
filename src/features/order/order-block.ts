// Which page level state a failed read of one order calls for (spec 0022, AC-12). Pure: no React.

import { isApiError } from "@/lib/api/errors";

/**
 * - `not-found`: the order does not exist, or is not mine. 404 `ORDER_NOT_FOUND` and 403
 *   `NOT_RESOURCE_OWNER` both give this one answer, so nothing says that an order with that id
 *   exists. A malformed id (400 `INVALID_ID`) is the same to the person.
 * - `forbidden`: 403 `PERMISSION_DENIED`, the account may not read orders.
 */
export type OrderBlock = "not-found" | "forbidden";

/** The state a failed read of an order takes the page to, or `null` for an ordinary failure. */
export function orderBlock(error: unknown): OrderBlock | null {
  if (!isApiError(error)) return null;
  const { status, code } = error;
  if (
    (status === 404 && code === "ORDER_NOT_FOUND") ||
    (status === 403 && code === "NOT_RESOURCE_OWNER") ||
    code === "INVALID_ID"
  ) {
    return "not-found";
  }
  return status === 403 && code === "PERMISSION_DENIED" ? "forbidden" : null;
}
