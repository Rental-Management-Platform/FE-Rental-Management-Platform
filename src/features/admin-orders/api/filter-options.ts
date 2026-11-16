import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/client";
import type { AdminPlan, AdminUserListItem, Page, Uuid } from "@/lib/api/types";
import { landlordOptionsKey, planOptionsKey } from "./admin-orders-keys";

/** The most one page can hold (api-for-frontend.md, section 2). */
const OPTIONS_PAGE_SIZE = 50;

/** What the plan filter needs of a plan. A plan that is turned off can still have orders. */
export interface PlanOption {
  id: Uuid;
  name: string;
  isActive: boolean;
}

/** What the landlord filter needs of an account: no phone, no lock reason. */
export interface LandlordOption {
  id: Uuid;
  name: string | null;
  email: string;
}

/**
 * `GET /plans/all` (`plan:read`): every plan, the turned off ones too, cut down to what the filter
 * shows. Kept a minute, so changing a filter does not read it again.
 */
export const planOptionsQuery = (api: ApiClient) =>
  queryOptions({
    queryKey: planOptionsKey,
    queryFn: async ({ signal }): Promise<PlanOption[]> => {
      const page = await api.get<Page<AdminPlan>>("/plans/all", {
        query: { page: 1, pageSize: OPTIONS_PAGE_SIZE },
        signal,
      });
      return page.items.map(({ id, name, isActive }) => ({
        id,
        name,
        isActive,
      }));
    },
    staleTime: 60_000,
  });

/**
 * `GET /users?accountType=landlord` (`user:read`): the first 50 landlords, newest first, locked ones
 * included because their orders stay in the list. The answer is cut down to the id, the name and
 * the email, so the cache never holds a phone number. With more than 50 landlords the rest are not
 * in the filter, and the name of a landlord in the table is the way to filter by them.
 */
export const landlordOptionsQuery = (api: ApiClient) =>
  queryOptions({
    queryKey: landlordOptionsKey,
    queryFn: async ({ signal }): Promise<LandlordOption[]> => {
      const page = await api.get<Page<AdminUserListItem>>("/users", {
        query: {
          accountType: "landlord",
          page: 1,
          pageSize: OPTIONS_PAGE_SIZE,
        },
        signal,
      });
      return page.items.map(({ id, name, email }) => ({ id, name, email }));
    },
    staleTime: 60_000,
  });
