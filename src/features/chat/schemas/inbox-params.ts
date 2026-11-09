import { z } from "zod";

const MAX_PAGE = 1_000_000;

// Digits only, so "1e3", "2.5", "+5" and " 3" are bad values. A very long run of digits becomes
// Infinity, which the range check turns into the fallback too.
const pageNumber = z
  .string()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().min(1).max(MAX_PAGE))
  .catch(1);

/**
 * The page of the inbox an address asks for (spec 0012, AC-7). It never throws and never asks
 * for a redirect: a missing, non numeric or out of range `?page=` is page 1, so the API never
 * answers 400 to a request this page made.
 */
export function parseInboxPage(raw: string | null | undefined): number {
  return pageNumber.parse(raw ?? "");
}
