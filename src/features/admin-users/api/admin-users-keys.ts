/**
 * The cache keys of the admin users page (scope #20). The session clears the cache when it
 * changes, so no key needs a user id. Everything starts with `adminUsersKey`, so one call can mark
 * every page of the list out of date together.
 */
export const adminUsersKey = ["admin", "users"] as const;

/** One page of the list. `list` is the third part, so it never meets another read of this page. */
export const adminUsersListKey = (params: { page: number; pageSize: number }) =>
  [...adminUsersKey, "list", params] as const;
