import type { Metadata } from "next";
import type { LandlordProfile } from "@/lib/api/types";
import { SITE_NAME } from "@/lib/site";
import { landlordPath } from "./landlord-id";
import {
  FAILED_TITLE,
  NOT_FOUND_TITLE,
  profileDescription,
  profileTitle,
} from "./text";

/** An address that is not a landlord, or a landlord that is gone: kept out of search. */
export const GONE_METADATA: Metadata = {
  title: NOT_FOUND_TITLE,
  robots: { index: false },
};

/** A profile that could not be read right now: kept out of search until it can be. */
export const FAILED_METADATA: Metadata = {
  title: FAILED_TITLE,
  robots: { index: false },
};

/**
 * The head of a profile page: the title, the description, the canonical address, the Open Graph
 * card and the Twitter card. Every page of the landlord's listings has the same canonical address
 * (the profile itself), so the list pages do not compete with it. There is no image and no rating
 * data: the profile has no picture, and the score is not given to search engines (spec 0013).
 */
export function profileMetadata(profile: LandlordProfile): Metadata {
  const title = profileTitle(profile.name);
  const description = profileDescription(profile);
  const canonical = landlordPath(profile.id);

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
    },
    twitter: { card: "summary", title, description },
  };
}
