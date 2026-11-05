import { cache } from "react";
import { serverGet } from "@/lib/api/server";
import type { ListingDetail } from "@/lib/api/types";

/**
 * One listing, read on the server as a guest (spec 0010, AC-4). It sends the 8 character code
 * only, never the slug from the address, so a typed or old slug can never reach the API. A guest
 * read always answers `landlord.phone` as `null`: the number is added by the browser for a
 * signed in person, so it is never in the server HTML.
 *
 * `cache()` only de-duplicates the calls of one render (the page and, later, its metadata). It
 * keeps nothing between visits, so a listing that was just hidden leaves the page at once.
 */
export const getListing = cache((code: string): Promise<ListingDetail> =>
  serverGet<ListingDetail>(`/listings/${code}`),
);
