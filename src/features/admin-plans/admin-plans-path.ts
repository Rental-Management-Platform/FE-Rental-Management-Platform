// Where the plans and trial settings live, for an admin (scope #22). Pure: no React, no router.

/**
 * The page of the plans (`GET /plans/all`, permission `plan:read`) and the two trial settings
 * (`GET /settings`, permission `setting:read`). The admin tool "Gói và dùng thử" uses this one
 * constant.
 */
export const ADMIN_PLANS_PATH = "/admin/plans";
