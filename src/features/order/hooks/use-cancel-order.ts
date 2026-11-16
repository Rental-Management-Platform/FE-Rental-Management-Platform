"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Uuid } from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import { orderKey, ordersKey } from "../api/order-keys";
import { cancelOrder } from "../api/orders";

/**
 * Cancels one order (spec 0022, AC-7 and AC-16). The id is the variable of the press, so the order
 * page and every row of the history use this one hook. It sends no body and never retries by
 * itself. On a 200 the cancelled order is stored under its own key, so the order page turns into
 * the cancelled view in place, and every orders entry is marked out of date (the history and the
 * pricing notice). The shared membership is left alone: a cancelled order never changed the limit.
 */
export function useCancelOrder() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: Uuid) => cancelOrder(api, id),
    onSuccess: (order) => {
      queryClient.setQueryData(orderKey(order.id), order);
      void queryClient.invalidateQueries({ queryKey: ordersKey });
    },
  });
}
