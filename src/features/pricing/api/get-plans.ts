import { cache } from "react";
import { serverGet } from "@/lib/api/server";
import type { Page, Plan } from "@/lib/api/types";

// The most one read can return (api-for-frontend.md, section 2). The seed has three plans and
// nobody expects more than a handful, so one read holds them all. If the number ever goes above
// this, the page needs paging (spec 0021, follow up).
const PLANS_PAGE_SIZE = 50;

/**
 * The plans on sale, read on the server as a guest (api-for-frontend.md, 6.26). The API already
 * lists them price ascending and then by name, so the page draws them in this order and sorts
 * nothing. It sends no token and no cookie, so the HTML is the same for everyone.
 *
 * `cache()` only de-duplicates the calls of one render. It keeps nothing between visits, so a plan
 * an admin just turned off is gone from the next visit.
 */
export const getPlans = cache((): Promise<Page<Plan>> =>
  serverGet<Page<Plan>>("/plans", { page: 1, pageSize: PLANS_PAGE_SIZE }),
);
