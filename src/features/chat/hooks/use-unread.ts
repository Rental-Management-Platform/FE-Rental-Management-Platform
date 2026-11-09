"use client";

import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/session/auth-provider";
import { unreadQueryOptions } from "../api/chat-queries";

/** How often the unread count is asked for again (spec 0012, AC-18). */
export const UNREAD_POLL_MS = 20_000;

/**
 * The unread count behind the indicator. A hidden tab does not ask and asks at once when it is
 * shown again. Only a person who may use chat mounts this (the indicator checks `canUseChat`
 * first), so no other account ever makes the request.
 */
export function useUnread() {
  const api = useApi();
  return useQuery({
    ...unreadQueryOptions(api),
    refetchInterval: UNREAD_POLL_MS,
  });
}
