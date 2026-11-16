"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createOrder } from "@/features/order/api/orders";
import { orderHref } from "@/features/order/order-paths";
import type { Uuid } from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";

/**
 * Creates the order of one plan and opens its confirmation page (spec 0021, AC-4). It sends
 * `{ planId }` and nothing else, and never retries by itself. On a 201 the browser goes to
 * `/landlord/orders/<id>`, a page that feature #19 builds: until then the address shows the 404
 * page, which is accepted.
 */
export function useBuyPlan() {
  const api = useApi();
  const router = useRouter();

  return useMutation({
    mutationFn: (planId: Uuid) => createOrder(api, planId),
    onSuccess: (order) => router.push(orderHref(order.id)),
  });
}
