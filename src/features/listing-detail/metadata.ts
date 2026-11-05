import type { Metadata } from "next";
import type { ListingDetail } from "@/lib/api/types";
import { listingPath } from "@/lib/listing-path";
import { SITE_NAME } from "@/lib/site";
import { shareImagePath } from "./share-image";
import { FAILED_TITLE, GONE_TITLE, listingDescription } from "./text";

/** A listing that is gone, or an address that is not a listing address: kept out of search. */
export const GONE_METADATA: Metadata = {
  title: GONE_TITLE,
  robots: { index: false },
};

/** A listing that could not be read right now: kept out of search until it can be. */
export const FAILED_METADATA: Metadata = {
  title: FAILED_TITLE,
  robots: { index: false },
};

/**
 * The head of a listing page (spec 0010, AC-14 and AC-15): the title, the description, the
 * canonical address of the listing (so a wrong slug canonicalises to the right one), the Open
 * Graph card and the Twitter card. The card has the first photo when there is one, else text
 * only.
 */
export function listingMetadata(listing: ListingDetail): Metadata {
  const title = listing.title;
  const description = listingDescription(listing);
  const canonical = listingPath(listing.slug, listing.code);
  const image = shareImagePath(listing.images);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "vi_VN",
      title,
      description,
      url: canonical,
      ...(image !== null && { images: [{ url: image }] }),
    },
    twitter: {
      card: image === null ? "summary" : "summary_large_image",
      title,
      description,
      ...(image !== null && { images: [image] }),
    },
  };
}
