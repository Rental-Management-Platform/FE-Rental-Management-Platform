// Where the listings of everyone live, for an admin (scope #21). Pure: no React, no router.

/**
 * The page that moderates listings (`GET /moderation/listings`, permission `listing:moderate`). The
 * admin tool "Kiểm duyệt tin" and every link back to the clean list use this one constant.
 */
export const ADMIN_LISTINGS_PATH = "/admin/listings";

/**
 * The id of the heading above the rows. A write that makes the row leave the list (a status filter
 * is set and the row no longer matches) sends focus here, because the button that opened the
 * dialog is gone.
 */
export const RESULTS_HEADING_ID = "admin-listings-title";
