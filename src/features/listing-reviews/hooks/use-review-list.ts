"use client";

import { useQuery } from "@tanstack/react-query";
import { useApi, useSession } from "@/lib/session/auth-provider";
import { listingReviewListQuery } from "../api/review-queries";

/**
 * One page of the public list of a room (spec 0014, AC-6). The login is optional, but the read
 * waits for the session to settle, so a person who has a session never gets one answer as a guest
 * and a second as themselves. The key carries `user.id`, or `"guest"`, because `isMine` depends on
 * it. `listingId` is the `id` of the detail, never the slug or the code.
 */
export function useListingReviewList(listingId: string, page: number) {
  const api = useApi();
  const session = useSession();
  const viewer = session.status === "user" ? session.user.id : "guest";

  return useQuery({
    ...listingReviewListQuery(api, listingId, viewer, page),
    enabled: session.status !== "loading",
  });
}
