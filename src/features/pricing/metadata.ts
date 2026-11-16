import type { Metadata } from "next";
import { PRICING_PATH } from "@/lib/pricing-path";
import { SITE_NAME } from "@/lib/site";
import { PRICING_META_DESCRIPTION, PRICING_TITLE } from "./text";

/**
 * The head of `/bang-gia` (spec 0021, AC-1): its own title and description, the canonical address,
 * the Open Graph card and the Twitter card. The page is open to search engines and has no
 * structured data. The copy is fixed and holds no plan name, price or limit, so it never goes
 * stale when an admin changes a plan.
 */
export const PRICING_METADATA: Metadata = {
  title: PRICING_TITLE,
  description: PRICING_META_DESCRIPTION,
  alternates: { canonical: PRICING_PATH },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "vi_VN",
    title: PRICING_TITLE,
    description: PRICING_META_DESCRIPTION,
    url: PRICING_PATH,
  },
  twitter: {
    card: "summary",
    title: PRICING_TITLE,
    description: PRICING_META_DESCRIPTION,
  },
};
