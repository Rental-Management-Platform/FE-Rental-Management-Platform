import type { Ward } from "@/lib/api/types";
import { formatMoney } from "@/lib/format";
import { WARD_TEXTS } from "@/features/wards/texts";
import type { ListingSearch } from "./schemas/search-params";
import { listingsHref, withoutPrice, withoutWard } from "./search-href";

// The chips of the filters that are on (spec 0016, AC-11), read from the applied search, never
// from the draft. Pure functions, so each can be checked by calling it.

export type FilterChip = {
  key: "ward" | "price";
  /** What the chip says. */
  label: string;
  /** The address without this group of filters, back at page 1. */
  href: string;
};

const hasWard = ({ wardCode }: ListingSearch) => wardCode !== "";
const hasPrice = ({ minPrice, maxPrice }: ListingSearch) =>
  minPrice !== null || maxPrice !== null;

/** How many groups of filters are on (the ward, the price): 0, 1 or 2. The order is not one. */
export const activeFilterCount = (search: ListingSearch): number =>
  Number(hasWard(search)) + Number(hasPrice(search));

/**
 * The words of the ward chip: the ward's name from the catalog, "Mã 26743 (không có trong danh
 * sách)" when there is a catalog and it lacks the code, and "Mã 26743" while there is no catalog
 * yet (so a code is not called unknown before the catalog has loaded).
 */
export function wardChipLabel(
  wardCode: string,
  wards: readonly Ward[] | undefined,
): string {
  if (!wards) return WARD_TEXTS.codeOnly(wardCode);
  return (
    wards.find((ward) => ward.code === wardCode)?.name ??
    WARD_TEXTS.unknownCode(wardCode)
  );
}

/** "2.000.000 ₫ đến 4.000.000 ₫", "Từ 2.000.000 ₫" or "Đến 4.000.000 ₫". */
export function priceChipLabel(
  minPrice: number | null,
  maxPrice: number | null,
): string {
  if (minPrice !== null && maxPrice !== null) {
    return `${formatMoney(minPrice)} đến ${formatMoney(maxPrice)}`;
  }
  return minPrice !== null
    ? `Từ ${formatMoney(minPrice)}`
    : `Đến ${formatMoney(maxPrice ?? 0)}`;
}

/** One chip for each group that is on, the ward before the price. Empty when none is on. */
export function activeFilterChips(
  search: ListingSearch,
  wards: readonly Ward[] | undefined,
): FilterChip[] {
  const chips: FilterChip[] = [];
  if (hasWard(search)) {
    chips.push({
      key: "ward",
      label: wardChipLabel(search.wardCode, wards),
      href: listingsHref(withoutWard(search)),
    });
  }
  if (hasPrice(search)) {
    chips.push({
      key: "price",
      label: priceChipLabel(search.minPrice, search.maxPrice),
      href: listingsHref(withoutPrice(search)),
    });
  }
  return chips;
}
