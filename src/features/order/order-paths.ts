// Where an order lives in the browser (spec 0021). Pure: no React, no router.

/**
 * The history of a landlord's orders. Feature #19 builds this page. Until then it answers 404,
 * which is accepted (spec 0021).
 */
export const ORDERS_PATH = "/landlord/orders";

/**
 * The confirmation page of one order, addressed by the `id` of the order (never the `code`, which
 * the API does not accept in a path). Every link to an order uses this one function: "Mua" after
 * the 201 answer, "Tiếp tục thanh toán" from the pending notice, and later the history of #19.
 */
export const orderHref = (id: string) => `${ORDERS_PATH}/${id}`;
