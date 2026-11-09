"use client";

import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/session/auth-provider";
import { unreadQueryOptions } from "../api/chat-queries";
import { usePollRules } from "./use-poll-rules";

/** How often the unread count is asked for again (spec 0012, AC-18). */
export const UNREAD_POLL_MS = 20_000;

/**
 * The unread count behind the indicator, asked for again under the rules of `usePollRules`. Only a
 * person who may use chat mounts this (the indicator checks `canUseChat` first), so no other
 * account ever makes the request. The indicator says nothing when it fails: the number just stays.
 */
export function useUnread() {
  const api = useApi();
  const { track, options } = usePollRules(UNREAD_POLL_MS);
  return useQuery({ ...unreadQueryOptions(api, track), ...options });
}
