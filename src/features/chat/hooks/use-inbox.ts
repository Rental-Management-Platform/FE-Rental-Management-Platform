"use client";

import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/session/auth-provider";
import { inboxQuery } from "../api/chat-queries";

/** How often the open page of the inbox is asked for again (spec 0012, AC-6). */
export const INBOX_POLL_MS = 10_000;

/** One page of the inbox, asked for again every few seconds while its tab is shown. */
export function useInbox(page: number) {
  const api = useApi();
  return useQuery({
    ...inboxQuery(api, page),
    refetchInterval: INBOX_POLL_MS,
  });
}
