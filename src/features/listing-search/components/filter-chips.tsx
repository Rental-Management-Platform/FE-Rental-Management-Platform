import { XIcon } from "lucide-react";
import Link from "next/link";
import type { Ward } from "@/lib/api/types";
import { FOCUS_RING } from "@/lib/focus-ring";
import { cn } from "@/lib/utils";
import { activeFilterChips } from "../filter-chips";
import type { ListingSearch } from "../schemas/search-params";
import { listingsHref, withoutFilters } from "../search-href";
import { SEARCH_BAR_TEXTS } from "../text";

/**
 * The row of the filters that are on (spec 0016, AC-11, AC-12): one chip for the ward and one for
 * the price, each a real link to the address without that group, and "Xóa bộ lọc" after them when
 * both are on. It reads the applied search, not the draft, and it has no keyword and no order,
 * which are not filters. With no filter on it draws nothing. A chip and the clear link are 44 px
 * high under `md`, where a finger uses them.
 *
 * `wards` is the catalog, or `undefined` while it has not loaded: the ward chip then says
 * "Mã 26743" and changes to the name when the catalog arrives.
 */
export function FilterChips({
  search,
  wards,
}: {
  search: ListingSearch;
  wards: readonly Ward[] | undefined;
}) {
  const chips = activeFilterChips(search, wards);
  if (chips.length === 0) return null;

  return (
    <ul
      aria-label={SEARCH_BAR_TEXTS.activeFilters}
      className="flex flex-wrap items-center gap-2"
    >
      {chips.map((chip) => (
        <li key={chip.key} className="flex max-w-full">
          <Link
            href={chip.href}
            aria-label={SEARCH_BAR_TEXTS.removeFilter(chip.label)}
            className={cn(
              FOCUS_RING,
              "inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-full border border-border bg-secondary px-3 text-sm font-medium text-secondary-foreground hover:underline md:min-h-8",
            )}
          >
            <span className="min-w-0 truncate">{chip.label}</span>
            <XIcon aria-hidden className="size-4 shrink-0" />
          </Link>
        </li>
      ))}
      {chips.length > 1 && (
        <li>
          <Link
            href={listingsHref(withoutFilters(search))}
            className={cn(
              FOCUS_RING,
              "inline-flex min-h-11 items-center rounded-md px-2 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground md:min-h-8",
            )}
          >
            {SEARCH_BAR_TEXTS.clearFilters}
          </Link>
        </li>
      )}
    </ul>
  );
}
