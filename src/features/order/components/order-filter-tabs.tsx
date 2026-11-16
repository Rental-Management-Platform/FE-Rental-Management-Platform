import Link from "next/link";
import { ORDER_FILTERS, ordersHref, type OrderFilter } from "../order-filter";

/**
 * The four links above the history (spec 0022, AC-14): "Tất cả", "Chờ thanh toán", "Đã thanh toán"
 * and "Đã hủy". Each is a real link to `?status=`, so the filter is in the address and can be
 * shared. The current one carries `aria-current` and the underline of the line tabs. There is no
 * count on a link, because the API has no way to give one without a call for each. A row that is
 * wider than the window scrolls inside itself. It is built like the filter of "Tin của tôi".
 */
export function OrderFilterTabs({ filter }: { filter: OrderFilter }) {
  return (
    <nav
      aria-label="Lọc đơn theo trạng thái"
      className="border-b px-(--card-spacing)"
    >
      <ul className="flex gap-1 overflow-x-auto">
        {ORDER_FILTERS.map(({ value, label }) => (
          <li key={value} className="flex">
            {/* A new filter starts on page 1. The ring sits inside, so the scrolling row never
                clips it. */}
            <Link
              href={ordersHref(value, 1)}
              aria-current={value === filter ? "page" : undefined}
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
