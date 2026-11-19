"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { landlordStatsKey } from "@/features/landlord-stats/api/landlord-stats";
import { membershipKey } from "@/features/membership/api/membership-query";
import type { Uuid } from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import { orderKey, ordersKey } from "../api/order-keys";
import { payOrder } from "../api/orders";

/**
 * The test payment of one order (spec 0022, AC-5). It sends no body and never retries by itself.
 *
 * On a 200 the paid order is stored under its own key, so the page turns into the paid view in
 * place with no wait. Every orders entry is marked out of date (the history and the pricing notice
 * must not show it as unpaid), and so is the shared membership, because the plan, the limit and the
 * status strip all just changed. The statistics of the landlord overview are marked out of date the
 * same way (they are read when `/landlord` is next opened, not now), because a purchase changes the
 * plan, the held back count and the money (spec 0024, AC-20). That is the one rule that cannot leave
 * the strip, the overview or the pricing page stale; one extra read of the order is accepted for it.
 */
export function usePayOrder(id: Uuid) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => payOrder(api, id),
    onSuccess: (order) => {
      queryClient.setQueryData(orderKey(id), order);
      void queryClient.invalidateQueries({ queryKey: ordersKey });
      void queryClient.invalidateQueries({ queryKey: membershipKey });
      void queryClient.invalidateQueries({
        queryKey: landlordStatsKey,
        refetchType: "none",
      });
    },
  });
}
