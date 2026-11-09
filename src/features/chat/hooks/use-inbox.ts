"use client";

import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/session/auth-provider";
import { inboxQuery } from "../api/chat-queries";
import { usePollRules } from "./use-poll-rules";

/** How often the open page of the inbox is asked for again (spec 0012, AC-6). */
export const INBOX_POLL_MS = 10_000;

/** One page of the inbox, asked for again every few seconds under the rules of `usePollRules`. */
export function useInbox(page: number) {
  const api = useApi();
  const { track, options, failing } = usePollRules(INBOX_POLL_MS);
  const query = useQuery({ ...inboxQuery(api, page, track), ...options });
  return { query, failing };
}
