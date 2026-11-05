// Text for the head of the listing page: the description under a search result and in a share
// card (spec 0010, AC-14), and the titles of the two pages that have no listing to name.
import type { ListingDetail } from "@/lib/api/types";
import { formatArea, formatMoney } from "@/lib/format";

/** A listing that is gone, or an address that is not a listing address. */
export const GONE_TITLE = "Không tìm thấy tin";

/** A listing that could not be read right now (a 429, a 5xx, no network). */
export const FAILED_TITLE = "Tin cho thuê";

// Search results and share cards cut a description at about this length.
const DESCRIPTION_LIMIT = 160;

/**
 * `text` cut at a word so it is at most `limit` characters long, ending with "…" when something
 * was left out. A comma or a colon left at the end of the cut is dropped.
 */
export function truncateAtWord(text: string, limit: number): string {
  if (text.length <= limit) return text;
  // One character is kept for the ellipsis. If the cut falls right before a space, the last word
  // is whole and stays.
  const room = text.slice(0, limit - 1);
  const wholeWord = text[limit - 1] === " ";
  const lastSpace = room.lastIndexOf(" ");
  const cut = wholeWord || lastSpace <= 0 ? room : room.slice(0, lastSpace);
  return `${cut.replace(/[\s,;:]+$/, "")}…`;
}

/**
 * The description of a listing for the page head, at most 160 characters: the price with "mỗi
 * tháng", the area, the full address, then the start of the description with its whitespace
 * collapsed (spec 0010, AC-14).
 */
export function listingDescription(
  listing: Pick<
    ListingDetail,
    "price" | "areaM2" | "fullAddress" | "description"
  >,
): string {
  const facts = `${formatMoney(listing.price)} mỗi tháng, ${formatArea(listing.areaM2)}, ${listing.fullAddress}.`;
  const body = listing.description.replace(/\s+/g, " ").trim();
  return truncateAtWord(
    body === "" ? facts : `${facts} ${body}`,
    DESCRIPTION_LIMIT,
  );
}
