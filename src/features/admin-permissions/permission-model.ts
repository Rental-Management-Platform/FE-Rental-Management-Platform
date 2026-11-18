// The matrix of permissions as data (scope #24, api-for-frontend.md 6.13 and 6.14). Pure: no React,
// no router, never changes what it is given.

import type { AccountTypeView, PermissionCatalogEntry } from "@/lib/api/types";

/**
 * The two account types an admin may change. The admin type is shown and never edited: the API
 * refuses it (409 `SYSTEM_TYPE_PROTECTED`), so there is no box and no request for it.
 */
export const EDITABLE_TYPES = ["landlord", "tenant"] as const;
export type EditableType = (typeof EDITABLE_TYPES)[number];

/** `module:action`, the key a permission is stored and sent under. */
export const permissionKey = (module: string, action: string) =>
  `${module}:${action}`;

export interface MatrixAction {
  key: string;
  module: string;
  action: string;
  /** Only an admin may hold it: a landlord or a tenant cannot be given it (`adminActions`). */
  adminOnly: boolean;
}

export interface MatrixModule {
  module: string;
  /** `read`, `update` and `delete` of the module reach only the caller's own data. */
  ownerScoped: boolean;
  actions: MatrixAction[];
}

/** The catalog as rows, in the order the API gave: one module, then its actions. */
export const buildMatrix = (
  catalog: readonly PermissionCatalogEntry[],
): MatrixModule[] =>
  catalog.map((entry) => ({
    module: entry.module,
    ownerScoped: entry.ownerScoped,
    actions: entry.actions.map((action) => ({
      key: permissionKey(entry.module, action),
      module: entry.module,
      action,
      adminOnly: entry.adminActions.includes(action),
    })),
  }));

/** Every key a landlord or a tenant can be given: all of the catalog but the admin only ones. */
export const grantableKeys = (modules: readonly MatrixModule[]): Set<string> =>
  new Set(
    modules.flatMap((m) =>
      m.actions.filter((a) => !a.adminOnly).map((a) => a.key),
    ),
  );

/**
 * What the server holds for a type, cut down to what the matrix can show and the API accepts. A
 * key that is not in the catalog (`PERMISSION_UNKNOWN`) or is admin only (`PERMISSION_ADMIN_ONLY`)
 * would be refused if it were sent again, so it is not part of the starting point.
 */
export const baselineOf = (
  type: Pick<AccountTypeView, "permissions"> | undefined,
  grantable: ReadonlySet<string>,
): Set<string> =>
  new Set((type?.permissions ?? []).filter((key) => grantable.has(key)));

/** The keys the server holds that the matrix cannot show, and a save would therefore drop. */
export const ignoredKeys = (
  type: Pick<AccountTypeView, "permissions"> | undefined,
  grantable: ReadonlySet<string>,
): string[] => (type?.permissions ?? []).filter((key) => !grantable.has(key));

/** A copy of the set with the key turned on if it was off, and off if it was on. */
export function toggled(set: ReadonlySet<string>, key: string): Set<string> {
  const next = new Set(set);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}

export const sameSet = (
  a: ReadonlySet<string>,
  b: ReadonlySet<string>,
): boolean => a.size === b.size && [...a].every((key) => b.has(key));

/** How many keys a change adds and how many it takes away. */
export function countChanges(
  from: ReadonlySet<string>,
  to: ReadonlySet<string>,
): { added: number; removed: number } {
  let added = 0;
  let removed = 0;
  for (const key of to) if (!from.has(key)) added += 1;
  for (const key of from) if (!to.has(key)) removed += 1;
  return { added, removed };
}

/**
 * The whole list to send, as single actions (never `module:manage`), in the order of the catalog.
 * `PATCH /account-types/:key` replaces everything the type holds with this list.
 */
export const orderedKeys = (
  set: ReadonlySet<string>,
  modules: readonly MatrixModule[],
): string[] =>
  modules.flatMap((m) =>
    m.actions.filter((a) => set.has(a.key)).map((a) => a.key),
  );
