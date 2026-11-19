import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/client";
import type { AdminPlan, AdminUserListItem, Page, Uuid } from "@/lib/api/types";
import { landlordSearchKey, planOptionsKey } from "./admin-orders-keys";

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

/** The landlords one read returned, and how many there are in all for that search. */
export interface LandlordOptions {
  items: LandlordOption[];
  total: number;
}

/**
 * `GET /users?accountType=landlord` (`user:read`): the first 50 landlords that match `text`, newest
 * first, locked ones included because their orders stay in the list. `text` goes to the API as `q`
 * (email, name or phone, and a name must be typed with its accents, 6.34); an empty text is the
 * first 50 with no search. With more than 50 landlords the rest are reached by typing, so the
 * answer carries `total` and the filter can say how many are not shown. The answer is cut down to
 * the id, the name and the email, so the cache never holds a phone number. The rows of the
 * previous text stay on screen while the next one loads.
 */
export const landlordOptionsQuery = (api: ApiClient, text = "") =>
  queryOptions({
    queryKey: landlordSearchKey(text),
    queryFn: async ({ signal }): Promise<LandlordOptions> => {
      const page = await api.get<Page<AdminUserListItem>>("/users", {
        query: {
          accountType: "landlord",
          q: text,
          page: 1,
          pageSize: OPTIONS_PAGE_SIZE,
        },
        signal,
      });
      return {
        items: page.items.map(({ id, name, email }) => ({ id, name, email })),
        total: page.total,
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
