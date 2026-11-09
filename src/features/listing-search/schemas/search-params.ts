import { z } from "zod";

/** How many cards one page holds (spec 0009, AC-5). */
export const LISTING_PAGE_SIZE = 12;

// The limits of `GET /listings` (api-for-frontend.md, 6.19). The search field uses the first.
export const MAX_KEYWORD_LENGTH = 500;
const MAX_PAGE = 1_000_000;

/**
 * The search state, the only thing the address carries (spec 0009, AC-2).
 * #13 later adds wardCode, minPrice, maxPrice and sort to this same shape.
 */
export type ListingSearch = {
  /** Trimmed, at most 500 characters. "" means no keyword. */
  q: string;
  /** A whole number from 1 to 1,000,000. */
  page: number;
};

/** What an address gives: a value, a repeated value (an array), or nothing. */
type RawValue = string | string[] | null | undefined;
export type RawListingSearch = { q?: RawValue; page?: RawValue };

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

const listingSearchSchema = z.object({ q: keyword, page: pageNumber });

/**
 * Cleans the raw `q` and `page` of an address. It never throws and never asks for a redirect:
 * every bad value has a quiet fallback (no keyword, page 1), so the API never answers 400 to a
 * query this page sent. Other parameters are not read (spec 0009, AC-3).
 */
export function parseListingSearch(raw: RawListingSearch): ListingSearch {
  return listingSearchSchema.parse({ q: raw.q, page: raw.page });
}
