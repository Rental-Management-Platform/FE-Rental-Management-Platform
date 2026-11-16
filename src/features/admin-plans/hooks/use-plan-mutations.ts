"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isApiError } from "@/lib/api/errors";
import type { PlanBody, Uuid } from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import { plansListKey } from "../api/admin-plans-keys";
import { createPlan, deletePlan, updatePlan } from "../api/plans";
import type { PlanPatch } from "../schemas/plan-schema";

/**
 * The three writes of the plans page. Each one marks the list out of date and waits for the list to
 * be read again before it resolves, so the table already shows the new state when a dialog closes
 * or a switch is let go. A plan that is gone (`PLAN_NOT_FOUND`) also marks the list out of date, so
 * its row leaves even though the write failed. The list is read again, never patched by hand,
 * because a price change moves a plan to another place in the order the API gives.
 */
export function usePlanMutations() {
  const api = useApi();
  const queryClient = useQueryClient();
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: plansListKey });
  const refreshWhenGone = (error: unknown) => {
    if (isApiError(error) && error.code === "PLAN_NOT_FOUND") void refresh();
  };

  const create = useMutation({
    mutationFn: (body: PlanBody) => createPlan(api, body),
    onSuccess: refresh,
  });
  const update = useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: Uuid;
      patch: PlanPatch | { isActive: boolean };
    }) => updatePlan(api, id, patch),
    onSuccess: refresh,
    onError: refreshWhenGone,
  });
  const remove = useMutation({
    mutationFn: (id: Uuid) => deletePlan(api, id),
    onSuccess: refresh,
    onError: refreshWhenGone,
  });

  return { create, update, remove };
}
