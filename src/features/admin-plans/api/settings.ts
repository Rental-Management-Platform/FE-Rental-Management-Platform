import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/client";
import type {
  AdminUserListItem,
  Page,
  SettingKey,
  Setting,
  Uuid,
} from "@/lib/api/types";
import { adminNamesKey, settingsKey } from "./admin-plans-keys";

/**
 * `GET /settings` (`setting:read`, api-for-frontend.md 6.24): exactly two settings, in the order
 * `trial_days` then `trial_listing_limit`, with the `min` and `max` of each. Not paged.
 */
export const settingsQuery = (api: ApiClient) =>
  queryOptions({
    queryKey: settingsKey,
    queryFn: ({ signal }) => api.get<Setting[]>("/settings", { signal }),
  });

/**
 * `PATCH /settings/:key` (`setting:update`): the setting after the change, with `updatedAt` and
 * `updatedBy` of this save. `value` must be a whole number inside the limits of the key, and
 * anything else is a 400 on the field `value`.
 */
export const updateSetting = (api: ApiClient, key: SettingKey, value: number) =>
  api.patch<Setting>(`/settings/${key}`, { value });

/** What the name lookup needs of an account: no phone, no lock reason. */
export interface AdminName {
  id: Uuid;
  name: string | null;
  email: string;
}

/**
 * `GET /users?accountType=admin` (`user:read`): the first 50 admins, cut down to the id, the name and
 * the email, so the cache never holds a phone number. `updatedBy` of a setting is only an id, and
 * this is how the page finds the name. Kept five minutes: an admin list rarely changes.
 */
export const adminNamesQuery = (api: ApiClient) =>
  queryOptions({
    queryKey: adminNamesKey,
    queryFn: async ({ signal }): Promise<AdminName[]> => {
      const page = await api.get<Page<AdminUserListItem>>("/users", {
        query: { accountType: "admin", page: 1, pageSize: 50 },
        signal,
      });
      return page.items.map(({ id, name, email }) => ({ id, name, email }));
    },
    staleTime: 5 * 60_000,
  });
