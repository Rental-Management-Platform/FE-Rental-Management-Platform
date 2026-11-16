/**
 * The cache keys of the plans page (scope #22). The session clears the cache when it changes, so
 * no key needs a user id. They all start with `admin`, and no key meets the ones of the admin
 * orders page.
 */
export const adminPlansKey = ["admin", "plans"] as const;

/** The plans, the turned off ones included (`GET /plans/all`). A write marks this out of date. */
export const plansListKey = [...adminPlansKey, "list"] as const;

/** The two trial settings (`GET /settings`). A save writes its answer straight in. */
export const settingsKey = ["admin", "settings"] as const;

/** The admins, to turn the id of "who changed it last" into a name (`GET /users`). */
export const adminNamesKey = ["admin", "admin-names"] as const;
