import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { serverGet } from "@/lib/api/server";
import type { Page, PublicListingSummary } from "@/lib/api/types";
import { env } from "@/lib/env";
import { listingPath } from "@/lib/listing-path";

// At most 20 reads of 50 rows: 1,000 listings, far under the 50,000 address limit of a sitemap,
// and at most 20 of the 300 reads a minute that every server render shares (spec 0010, AC-17).
// A larger catalogue needs `generateSitemaps`.
const PAGE_SIZE = 50;
const MAX_PAGES = 20;

/**
 * `/sitemap.xml`: the home page and every public listing, as absolute addresses. It reads the
 * list as a guest, one page after another, so it holds only what a guest can see. It is fresh on
 * every request, because Next.js caches a sitemap unless it uses a request time API, and a listing
 * that was just hidden must leave it at once. A failed read is thrown, so the answer is a 500,
 * never a sitemap that is half empty.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();

  const site = env.NEXT_PUBLIC_SITE_URL;
  const entries: MetadataRoute.Sitemap = [{ url: `${site}/` }];
  // The newest first order can shift while the walk runs, so a row can appear on two pages.
  const seen = new Set<string>();

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await serverGet<Page<PublicListingSummary>>("/listings", {
      page,
      pageSize: PAGE_SIZE,
    });
    for (const listing of result.items) {
      if (seen.has(listing.code)) continue;
      seen.add(listing.code);
      entries.push({
        url: `${site}${listingPath(listing.slug, listing.code)}`,
      });
    }
    if (result.items.length < PAGE_SIZE || page * PAGE_SIZE >= result.total) {
      break;
    }
  }

  return entries;
}
