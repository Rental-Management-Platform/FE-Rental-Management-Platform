import type { ListingSearch } from "@/features/listing-search/schemas/search-params";
import type { Ward } from "@/lib/api/types";
import { SAMPLE_CODES, SAMPLE_WARDS } from "./ward-picker-sample";

// Fake data for the search filters preview in `/dev/ui` (spec 0016, AC-21): fixed searches typed
// with the real `ListingSearch`, no network call and no randomness. The wards are the fake catalog
// of the ward picker preview, and the codes are made up (never sent to the API).

// A copy the type `Ward[]` of `initialWards` accepts. The bar never changes it.
export const SAMPLE_CATALOG: Ward[] = [...SAMPLE_WARDS];

const PLAIN: ListingSearch = {
  q: "",
  wardCode: "",
  minPrice: null,
  maxPrice: null,
  sort: "newest",
  page: 1,
};

/** The plain list: nothing is on, so no chip and no number on the "Bộ lọc" button. */
export const SEARCH_PLAIN: ListingSearch = PLAIN;

/** A ward and both prices: two chips, "Xóa bộ lọc" after them, and a 2 on the "Bộ lọc" button. */
export const SEARCH_FILTERED: ListingSearch = {
  ...PLAIN,
  wardCode: SAMPLE_CODES.benThanh,
  minPrice: 2_000_000,
  maxPrice: 4_000_000,
};

/** A keyword, a ward, only a lower price and an order: the keyword and the order are no chips. */
export const SEARCH_KEYWORD: ListingSearch = {
  ...PLAIN,
  q: "gác lửng",
  wardCode: SAMPLE_CODES.benThanh,
  minPrice: 2_000_000,
  sort: "price_asc",
};

/** A well formed code the catalog does not have: the chip says "không có trong danh sách". */
export const SEARCH_UNKNOWN_WARD: ListingSearch = {
  ...PLAIN,
  wardCode: SAMPLE_CODES.unknown,
};

/** The lower price above the upper one, which the page does not send to the API. */
export const SEARCH_REVERSED: ListingSearch = {
  ...PLAIN,
  minPrice: 5_000_000,
  maxPrice: 2_000_000,
};

/** A keyword alone, for the empty state that offers only "Xóa tìm kiếm". */
export const SEARCH_KEYWORD_ONLY: ListingSearch = { ...PLAIN, q: "gác lửng" };

/** The text two price boxes hold when each kind of mistake is made (spec 0016, AC-8). */
export const PRICE_MISTAKES = [
  {
    label: "không phải chữ số · dán “2.000.000” từ dòng đọc số",
    minPrice: "2.000.000",
    maxPrice: "",
  },
  {
    label: "vượt giới hạn · 100000001",
    minPrice: "",
    maxPrice: "100000001",
  },
  {
    label: "khoảng giá ngược · từ 5000000 đến 2000000",
    minPrice: "5000000",
    maxPrice: "2000000",
  },
] as const;
