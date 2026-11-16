// Where an order lives in the browser (spec 0021). Pure: no React, no router.

/** The history of a landlord's orders, with the status tabs and the pages (spec 0022). */
export const ORDERS_PATH = "/landlord/orders";

/**
 * The confirmation page of one order, addressed by the `id` of the order (never the `code`, which
 * the API does not accept in a path). Every link to an order uses this one function: "Mua" after
 * the 201 answer, "Tiếp tục thanh toán" from the pending notice, and the rows of the history.
 */
export const orderHref = (id: string) => `${ORDERS_PATH}/${id}`;
