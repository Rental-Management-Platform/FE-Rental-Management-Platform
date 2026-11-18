import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/client";
import type {
  AccountTypeView,
  PermissionCatalogEntry,
  UpdateAccountTypeBody,
} from "@/lib/api/types";
import type { EditableType } from "../permission-model";
import {
  accountTypesKey,
  permissionCatalogKey,
} from "./admin-permissions-keys";

/**
 * `GET /permissions` (`account_type:read`, api-for-frontend.md 6.13): one entry per module with its
 * actions, whether it is owner scoped, and the actions only an admin may hold. The default
 * `staleTime` of 0 is on purpose: the page reads it again every time it opens.
 */
export const permissionCatalogQuery = (api: ApiClient) =>
  queryOptions({
    queryKey: permissionCatalogKey,
    queryFn: ({ signal }) =>
      api.get<PermissionCatalogEntry[]>("/permissions", { signal }),
  });

/**
 * `GET /account-types` (`account_type:read`, api-for-frontend.md 6.14): the three types with their
 * permissions already spelled out as single actions. Read again every time the page opens, so a
 * change another admin saved shows up.
 */
export const accountTypesQuery = (api: ApiClient) =>
  queryOptions({
    queryKey: accountTypesKey,
    queryFn: ({ signal }) =>
      api.get<AccountTypeView[]>("/account-types", { signal }),
  });

/**
 * `PATCH /account-types/:key` (`account_type:update`): the type after the change. The list
 * **replaces** every permission of the type, so it is the whole list the person ended up with, as
 * single actions and never `module:manage`. Only `landlord` and `tenant` can be saved: the admin
 * type is protected (409 `SYSTEM_TYPE_PROTECTED`). Mutations never retry (spec 0002).
 */
export const updateAccountType = (
  api: ApiClient,
  key: EditableType,
  permissions: string[],
) =>
  api.patch<AccountTypeView>(`/account-types/${key}`, {
    permissions,
  } satisfies UpdateAccountTypeBody);
