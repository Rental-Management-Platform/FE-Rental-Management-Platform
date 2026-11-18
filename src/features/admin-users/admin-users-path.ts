// Where the accounts of everyone live, for an admin (scope #20, spec 0023). Pure: no React, no
// router.

/**
 * The page of every account (`GET /users`, permission `user:read`). The admin tool "Người dùng"
 * and every link back to the clean list use this one constant.
 */
export const ADMIN_USERS_PATH = "/admin/users";

/**
 * The id of the heading above the rows. A write that makes the row leave the list (a status filter
 * is set and the row no longer matches) sends focus here, because the button that opened the
 * dialog is gone.
 */
export const RESULTS_HEADING_ID = "admin-users-title";
