import { cache } from "react";
import { serverGet } from "@/lib/api/server";
import type { LandlordProfile } from "@/lib/api/types";

/**
 * One landlord's public profile, read on the server as a guest (api-for-frontend.md, 6.31). A
 * guest read always answers `isFollowing` as `null`: the browser adds what depends on the viewer,
 * so the server HTML is the same for everyone. The caller has already checked that `id` is a UUID.
 *
 * `cache()` only de-duplicates the calls of one render (the page and its metadata). It keeps
 * nothing between visits, so a landlord who was just locked leaves the page at once.
 */
export const getLandlordProfile = cache(
  (id: string): Promise<LandlordProfile> =>
    serverGet<LandlordProfile>(`/landlords/${id}`),
);
