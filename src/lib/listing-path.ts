// The address of one listing: `/<slug>-<code>`, or `/<code>` when there is no slug (spec 0010,
// AC-2). Two pure functions, shared by the card link, the detail page, the sitemap and later
// pages. Only the code ever reaches the API; the slug is for people and search engines.

export type ListingPath = {
  /** 8 characters: lowercase letters without i, l, o, and the digits 2 to 9 (spec 0001). */
  code: string;
  /** The words before the code, or `null` when the address is only the code. */
  slug: string | null;
};

// The code is the last 8 characters, alone or after a dash. A capital letter does not match, the
// API answers 404 to it too.
const CODE_AT_END = /(?:^|-)([a-hjkmnp-z2-9]{8})$/;

// A longer segment is never a listing address. It also keeps the pattern cheap to run.
const MAX_SEGMENT_LENGTH = 200;

/**
 * Splits the address segment into its code and slug, or gives `null` when it is not a listing
 * address. A `null` is the signal to answer "not found" before any API call.
 */
export function parseListingPath(segment: string): ListingPath | null {
  if (segment.length > MAX_SEGMENT_LENGTH) return null;
  const match = CODE_AT_END.exec(segment);
  if (match === null) return null;

  const code = match[1];
  // The address is the code alone, or "<slug>-<code>". A lone dash in front of the code leaves an
  // empty slug, which is the same as having none.
  const slug =
    segment.length === code.length
      ? ""
      : segment.slice(0, segment.length - code.length - 1);
  return { code, slug: slug === "" ? null : slug };
}

/** The canonical address of a listing. Never makes `/-<code>`. */
export const listingPath = (slug: string | null, code: string): string =>
  slug === null || slug === "" ? `/${code}` : `/${slug}-${code}`;
