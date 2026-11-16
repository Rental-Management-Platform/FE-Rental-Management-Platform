import { CheckIcon, ClockIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/api/types";
import { ORDER_STATUS_LABEL } from "../order-text";

// A status is words with an icon, never color alone (design.md). Pending waits for the landlord,
// so it is the one that asks for attention; paid is the good end, cancelled a quiet one.
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="warning">
          <ClockIcon data-icon="inline-start" aria-hidden="true" />
          {ORDER_STATUS_LABEL.pending}
        </Badge>
      );
    case "paid":
      return (
        <Badge variant="success">
          <CheckIcon data-icon="inline-start" aria-hidden="true" />
          {ORDER_STATUS_LABEL.paid}
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="secondary">
          <XIcon data-icon="inline-start" aria-hidden="true" />
          {ORDER_STATUS_LABEL.cancelled}
        </Badge>
      );
  }
}
