// Where the permissions by account type live, for an admin (scope #24). Pure: no React, no router.

/**
 * The page of the permission matrix (`GET /permissions`, `GET /account-types`, and `PATCH
 * /account-types/:key` to save; permissions `account_type:read` and `account_type:update`). The
 * admin tool "Phân quyền" uses this one constant.
 */
export const ADMIN_PERMISSIONS_PATH = "/admin/permissions";
