import Link from "next/link";
import { TABS_LABEL, TAB_LANDLORD, TAB_LISTING } from "../admin-reviews-text";
import {
  adminReviewsHref,
  switchTab,
  type ReviewFilters,
  type ReviewTab,
} from "../review-filter";

const TABS: readonly { tab: ReviewTab; label: string }[] = [
  { tab: "landlord", label: TAB_LANDLORD },
  { tab: "listing", label: TAB_LISTING },
];

/**
 * The two tabs of the page, "Chủ trọ" and "Phòng" (scope #36). Each is a real link to `?tab=`, so
 * the tab is in the address and can be shared, and Back goes to the other tab. A change of tab
 * keeps the status and the writer, which mean the same in both lists, and drops what belongs to
 * one list only (the landlord, the listing). The current one carries `aria-current` and the
 * underline of the line tabs. Built like the status tabs of the orders of every landlord.
 */
export function ReviewTabs({ filters }: { filters: ReviewFilters }) {
  return (
    <nav aria-label={TABS_LABEL} className="border-b">
      <ul className="flex gap-1 overflow-x-auto">
        {TABS.map(({ tab, label }) => (
          <li key={tab} className="flex">
            {/* The ring sits inside, so the scrolling row never clips it. */}
            <Link
              href={adminReviewsHref(switchTab(filters, tab), 1)}
              scroll={false}
              aria-current={tab === filters.tab ? "page" : undefined}
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
