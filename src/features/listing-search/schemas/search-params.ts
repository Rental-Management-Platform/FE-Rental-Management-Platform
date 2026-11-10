import { z } from "zod";

/** How many cards one page holds (spec 0009, AC-5). */
export const LISTING_PAGE_SIZE = 12;

// The limits of `GET /listings` (api-for-frontend.md, 6.19). The search field uses the first,
// the two price fields the second.
export const MAX_KEYWORD_LENGTH = 500;
export const MAX_PRICE = 100_000_000;
const MAX_PAGE = 1_000_000;

/** The three orders of the list (6.19). `newest` is the API's own default. */
export const LISTING_SORTS = ["newest", "price_asc", "price_desc"] as const;
export type ListingSort = (typeof LISTING_SORTS)[number];

/**
 * The search state, the only thing the address carries (spec 0016, AC-1, which extends spec
 * 0009, AC-2). The parameter names are the API's own.
 */
export type ListingSearch = {
  /** Trimmed, at most 500 characters. "" means no keyword. */
  q: string;
  /** Five digits. "" means every ward. A well formed code that is not in the catalog is kept. */
  wardCode: string;
  /** A whole number from 1 to 100,000,000. `null` means no lower limit (0 is the same thing). */
  minPrice: number | null;
  /** A whole number from 0 to 100,000,000. `null` means no upper limit. */
  maxPrice: number | null;
  sort: ListingSort;
  /** A whole number from 1 to 1,000,000. */
  page: number;
};

/** What an address gives: a value, a repeated value (an array), or nothing. */
type RawValue = string | string[] | null | undefined;
export type RawListingSearch = {
  q?: RawValue;
  wardCode?: RawValue;
  minPrice?: RawValue;
  maxPrice?: RawValue;
  sort?: RawValue;
  page?: RawValue;
};

// The first value wins when a parameter repeats.
const firstValue = (value: unknown): unknown =>
  Array.isArray(value) ? value[0] : value;

// Cut at a limit counted in UTF-16 units (what the API counts), without leaving half of an
// emoji at the end.
function cutAt(text: string, max: number): string {
  const cut = text.slice(0, max);
  const last = cut.charCodeAt(cut.length - 1);
  return last >= 0xd800 && last <= 0xdbff ? cut.slice(0, -1) : cut;
}

const keyword = z.preprocess(
  firstValue,
  z
    .string()
    .transform((text) => cutAt(text.trim(), MAX_KEYWORD_LENGTH).trim())
    .catch(""),
);

// Digits only, so "1e3", "2.5", "+5" and " 3" count as a bad value. A very long run of digits
// becomes Infinity, which the range check turns into the fallback too.
const pageNumber = z.preprocess(
  firstValue,
  z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(1).max(MAX_PAGE))
    .catch(1),
);

/**
 * Cleans one raw `page` value: a whole number from 1 to 1,000,000, else 1. It never throws. The
 * landlord's listings (scope #15) read their one `page` parameter with it, so the two lists
 * agree on what a bad page means.
 */
export const parsePageParam = (raw: RawValue): number => pageNumber.parse(raw);

// Exactly five digits, as the API wants. A code that is well formed but unknown is not an error
// for the API (an empty list), so it is kept.
const wardCode = z.preprocess(
  firstValue,
  z
    .string()
    .regex(/^\d{5}$/)
    .catch(""),
);

// One to nine digits and at most 100,000,000, so "-5", "1e6", "2.000.000" and " 5" count as a
// bad value (null). Nine digits also keeps the number far from the precision limit.
const price = z.preprocess(
  firstValue,
  z
    .string()
    .regex(/^\d{1,9}$/)
    .transform(Number)
    .pipe(z.number().int().min(0).max(MAX_PRICE))
    .nullable()
    .catch(null),
);

// A lower limit of 0 blocks nothing, so it is the same as none: one state, one address.
const minPrice = price.transform((value) => (value === 0 ? null : value));

const sort = z.preprocess(firstValue, z.enum(LISTING_SORTS).catch("newest"));

const listingSearchSchema = z.object({
  q: keyword,
  wardCode,
  minPrice,
  maxPrice: price,
  sort,
  page: pageNumber,
});

/**
 * Cleans the raw parameters of an address. It never throws and never asks for a redirect: every
 * bad value has a quiet fallback (no keyword, every ward, no price limit, the newest first,
 * page 1), so the API never answers 400 to a query this page sent. A reversed price range
 * (`minPrice` above `maxPrice`) is kept as it is: the page tells the person and does not call the
 * API (spec 0016, AC-4). Other parameters are not read and are never sent (spec 0009, AC-3).
 */
export function parseListingSearch(raw: RawListingSearch): ListingSearch {
  return listingSearchSchema.parse({
    q: raw.q,
    wardCode: raw.wardCode,
    minPrice: raw.minPrice,
    maxPrice: raw.maxPrice,
    sort: raw.sort,
    page: raw.page,
  });
}

/**
 * The same cleaning for what `useSearchParams` gives in the browser, where a missing parameter
 * is `null`. The search bar and the loading boundary both read the address through it, so they
 * always agree with the server.
 */
export function searchFromParams(params: {
  get: (name: string) => string | null;
}): ListingSearch {
  return parseListingSearch({
    q: params.get("q"),
    wardCode: params.get("wardCode"),
    minPrice: params.get("minPrice"),
    maxPrice: params.get("maxPrice"),
    sort: params.get("sort"),
    page: params.get("page"),
  });
}
