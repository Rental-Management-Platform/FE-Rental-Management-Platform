import Link from "next/link";
import { ORDER_FILTERS } from "@/features/order/order-filter";
import { adminOrdersHref, type AdminOrderFilters } from "../admin-order-filter";
import { STATUS_NAV_LABEL } from "../admin-orders-text";

/**
 * The four links above the list: "Tất cả", "Chờ thanh toán", "Đã thanh toán" and "Đã hủy". Each is
 * a real link to `?status=` that keeps the other filters and starts on page 1, so the filters are
 * in the address and can be shared. The current one carries `aria-current` and the underline of
 * the line tabs. A row that is wider than the window scrolls inside itself. It is built like the
 * tabs of the history of a landlord.
 */
export function AdminOrderStatusTabs({
  filters,
}: {
  filters: AdminOrderFilters;
}) {
  return (
    <nav aria-label={STATUS_NAV_LABEL} className="border-b px-(--card-spacing)">
      <ul className="flex gap-1 overflow-x-auto">
        {ORDER_FILTERS.map(({ value, label }) => (
          <li key={value} className="flex">
            {/* The ring sits inside, so the scrolling row never clips it. */}
            <Link
              href={adminOrdersHref({ ...filters, status: value }, 1)}
              aria-current={value === filters.status ? "page" : undefined}
              className="relative inline-flex h-10 items-center px-3 text-sm font-medium whitespace-nowrap text-muted-foreground outline-hidden transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary after:opacity-0 after:transition-opacity hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset aria-[current=page]:text-foreground aria-[current=page]:after:opacity-100"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
