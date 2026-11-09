"use client";

import { useQuery } from "@tanstack/react-query";
import { useApi, useSession } from "@/lib/session/auth-provider";
import { reviewListQuery } from "../api/review-queries";

/**
 * One page of the public list (spec 0013, AC-3). The login is optional, but the read waits for the
 * session to settle, so a person who has a session never gets one answer as a guest and a second
 * as themselves. The key carries `user.id`, or `"guest"`, because `isMine` depends on it.
 */
export function useReviewList(landlordId: string, page: number) {
  const api = useApi();
  const session = useSession();
  const viewer = session.status === "user" ? session.user.id : "guest";

  return useQuery({
    ...reviewListQuery(api, landlordId, viewer, page),
    enabled: session.status !== "loading",
  });
}
