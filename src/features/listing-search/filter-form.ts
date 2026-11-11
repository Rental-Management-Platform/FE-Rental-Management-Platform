import { z } from "zod";
import {
  cleanKeyword,
  MAX_PRICE,
  type ListingSearch,
  type ListingSort,
} from "./schemas/search-params";
import { PRICE_ERRORS } from "./text";

// The draft of the search bar (spec 0016, AC-7): what the boxes hold while a person types, and
// what the checked draft becomes. Pure functions, so each can be checked by calling it.

/** The draft as the boxes hold it. The two prices are the typed text. */
export type FilterFormInput = {
  q: string;
  wardCode: string;
  minPrice: string;
  maxPrice: string;
};

/** The draft after the schema has checked it: a clean keyword and prices that are numbers. */
export type FilterFormValues = {
  q: string;
  wardCode: string;
  minPrice: number | null;
  maxPrice: number | null;
};

/** What the text of a price box means (spec 0016, AC-8). */
export type PriceReading =
  | { kind: "empty" }
  | { kind: "number"; value: number }
  | { kind: "notDigits" }
  | { kind: "tooBig" };

/**
 * Reads the text of a price box. The ends are trimmed first, then only digits are accepted, so
 * "2.000.000" (the form the number line shows) is told "digits only" instead of being guessed at.
 * A number above 100,000,000 is too big. Empty means no limit, and 0 is a number.
 */
export function readPrice(text: string): PriceReading {
  const trimmed = text.trim();
  if (trimmed === "") return { kind: "empty" };
  if (!/^\d+$/.test(trimmed)) return { kind: "notDigits" };
  // A very long run of digits turns into Infinity, which is above the limit too.
  const value = Number(trimmed);
  return value > MAX_PRICE ? { kind: "tooBig" } : { kind: "number", value };
}

// One price box: the number, `null` for an empty box, or an issue with the words of AC-8.
const priceBox = z.string().transform((text, ctx): number | null => {
  const reading = readPrice(text);
  if (reading.kind === "empty") return null;
  if (reading.kind === "number") return reading.value;
  ctx.issues.push({
    code: "custom",
    message: PRICE_ERRORS[reading.kind],
    input: text,
  });
  return z.NEVER;
});

/**
 * The schema of the draft. It only runs when a person sends the form: nothing is checked while
 * typing. A box that is not a number is told so on its own. The range rule runs only when both
 * boxes are fine (Zod skips a rule on an object that already has an issue), and puts its message
 * on "Giá đến", the box a person is likely to change.
 */
export const filterFormSchema = z
  .object({
    q: z.string().transform(cleanKeyword),
    // The ward box can only hold a catalog code or "", so a stray value is turned into "".
    wardCode: z
      .string()
      .transform((code) => (/^\d{5}$/.test(code) ? code : "")),
    minPrice: priceBox,
    maxPrice: priceBox,
  })
  .superRefine(({ minPrice, maxPrice }, ctx) => {
    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      ctx.addIssue({
        code: "custom",
        path: ["maxPrice"],
        message: PRICE_ERRORS.reversed,
      });
    }
  });

type PartOfSearch = Pick<
  ListingSearch,
  "q" | "wardCode" | "minPrice" | "maxPrice"
>;

/** The draft that shows an applied search: the same four parts as text, an unset price as "". */
export const draftFromSearch = ({
  q,
  wardCode,
  minPrice,
  maxPrice,
}: PartOfSearch): FilterFormInput => ({
  q,
  wardCode,
  minPrice: minPrice === null ? "" : String(minPrice),
  maxPrice: maxPrice === null ? "" : String(maxPrice),
});

/**
 * The search a checked draft asks for: page 1, and the order that is applied now (applying a
 * filter keeps the order). A lower limit of 0 blocks nothing, so it becomes "no limit", the same
 * as the address parser does.
 */
export const searchFromFilterForm = (
  { q, wardCode, minPrice, maxPrice }: FilterFormValues,
  sort: ListingSort,
): ListingSearch => ({
  q,
  wardCode,
  minPrice: minPrice === 0 ? null : minPrice,
  maxPrice,
  sort,
  page: 1,
});
