"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { orderKey, ordersKey } from "@/features/order/api/order-keys";
import { createOrder } from "@/features/order/api/orders";
import { orderHref } from "@/features/order/order-paths";
import type { Uuid } from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";

/**
 * Creates the order of one plan and opens its confirmation page (spec 0021, AC-4). It sends
 * `{ planId }` and nothing else, and never retries by itself.
 *
 * On a 201 the order is stored under its own key, so the confirmation page of #19 can show it at
 * once, and every orders entry is marked out of date (the pending order is now this one, and the
 * older one was cancelled by the backend). Then the browser goes to `/landlord/orders/<id>`, a page
 * that feature #19 builds: until then the address shows the 404 page, which is accepted.
 */
export function useBuyPlan() {
  const api = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: Uuid) => createOrder(api, planId),
    onSuccess: (order) => {
      queryClient.setQueryData(orderKey(order.id), order);
      void queryClient.invalidateQueries({ queryKey: ordersKey });
      router.push(orderHref(order.id));
    },
  });
}
