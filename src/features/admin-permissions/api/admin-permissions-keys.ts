/**
 * The cache keys of the permissions page (scope #24). The session clears the cache when it
 * changes, so no key needs a user id.
 */

/** The catalog of modules and actions (`GET /permissions`). */
export const permissionCatalogKey = [
  "admin",
  "permissions",
  "catalog",
] as const;

/** The three account types with their permissions (`GET /account-types`). A save writes its answer in. */
export const accountTypesKey = [
  "admin",
  "permissions",
  "account-types",
] as const;
