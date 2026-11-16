// The search box over the wards table (scope #23). The API has no search and no paging for the
// catalog (api-for-frontend.md, 6.30), so the whole list is read once and cut here. Pure: no React,
// no router.

import { matchWards } from "@/features/wards/ward-match";
import type { CatalogWard } from "@/lib/api/types";

const DIGITS = /^\d+$/;

/**
 * The wards that fit what was typed. Digits only means the start of a code ("267" finds
 * "26732" and "26743"). Anything else is matched against the name the way the ward picker of the
 * landlord forms does it: every typed word starts a word of the name, accents ignored, so "ben
 * thanh" finds "Phường Bến Thành". Nothing typed keeps every ward in the order the API gave. It
 * never changes `wards`.
 */
export function filterWards(
  wards: readonly CatalogWard[],
  text: string,
): CatalogWard[] {
  const typed = text.trim();
  if (typed === "") return [...wards];
  if (DIGITS.test(typed)) {
    return wards.filter((ward) => ward.code.startsWith(typed));
  }
  return matchWards(wards, typed);
}
