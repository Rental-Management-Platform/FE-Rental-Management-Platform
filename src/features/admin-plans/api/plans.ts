import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/client";
import type { AdminPlan, Page, PlanBody, Uuid } from "@/lib/api/types";
import type { PlanPatch } from "../schemas/plan-schema";
import { plansListKey } from "./admin-plans-keys";

/** The most one page can hold (api-for-frontend.md, section 2). A shop has a handful of plans. */
export const PLANS_PAGE_SIZE = 50;

/**
 * `GET /plans/all` (`plan:read`, api-for-frontend.md 6.26): every plan, the turned off ones too, in
 * the order of the pricing page (price up, then name). The front end sorts nothing.
 */
export const fetchAdminPlans = (api: ApiClient, signal?: AbortSignal) =>
  api.get<Page<AdminPlan>>("/plans/all", {
    query: { page: 1, pageSize: PLANS_PAGE_SIZE },
    signal,
  });

/**
 * The plans as a query. The default `staleTime` of 0 is on purpose: a plan added, turned off or
 * deleted by another admin shows up when the page opens or the window gets focus.
 */
export const adminPlansQuery = (api: ApiClient) =>
  queryOptions({
    queryKey: plansListKey,
    queryFn: ({ signal }) => fetchAdminPlans(api, signal),
  });

/**
 * `POST /plans` (`plan:create`): the new plan, a 201 answer. Without `isActive` it is on sale.
 * Mutations never retry (spec 0002), so a press sends one request.
 */
export const createPlan = (api: ApiClient, body: PlanBody) =>
  api.post<AdminPlan>("/plans", body);

/**
 * `PATCH /plans/:id` (`plan:update`): the plan after the change. The body holds changed fields
 * only (or `isActive` alone for the sale switch), and a stray field such as `id` is a 400.
 */
export const updatePlan = (
  api: ApiClient,
  id: Uuid,
  patch: PlanPatch | { isActive: boolean },
) => api.patch<AdminPlan>(`/plans/${encodeURIComponent(id)}`, patch);

/**
 * `DELETE /plans/:id` (`plan:delete`), a 204 answer. A plan that any order names, a cancelled one
 * too, answers 409 `PLAN_IN_USE`: it can only be turned off.
 */
export const deletePlan = (api: ApiClient, id: Uuid) =>
  api.delete<void>(`/plans/${encodeURIComponent(id)}`);
