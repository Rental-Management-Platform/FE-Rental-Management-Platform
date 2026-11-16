import Link from "next/link";
import type { AdminOrder } from "@/lib/api/types";
import { FOCUS_RING } from "@/lib/focus-ring";
import { cn } from "@/lib/utils";
import { landlordLabel } from "../admin-order-filter";
import { onlyLandlordLabel } from "../admin-orders-text";

/**
 * The landlord of an order: the name, or the email when there is no name, and under the name the
 * email. The name is a link that filters the list to this landlord, so an admin can follow one
 * landlord without finding them in the filter first. It keeps the other filters and goes to page 1.
 */
export function LandlordCell({
  landlord,
  href,
}: {
  landlord: AdminOrder["landlord"];
  href: string;
}) {
  const label = landlordLabel(landlord);
  return (
    <div className="flex min-w-0 flex-col">
      <Link
        href={href}
        title={onlyLandlordLabel(label)}
        className={cn(
          FOCUS_RING,
          "block truncate rounded-sm font-medium hover:underline",
        )}
      >
        {label}
      </Link>
      {label !== landlord.email && (
        <span
          className="block truncate text-sm text-muted-foreground"
          title={landlord.email}
        >
          {landlord.email}
        </span>
      )}
    </div>
  );
}
