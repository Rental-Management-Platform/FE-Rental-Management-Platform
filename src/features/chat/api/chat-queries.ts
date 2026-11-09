import {
  keepPreviousData,
  queryOptions,
  type QueryClient,
} from "@tanstack/react-query";
import { isAbortError } from "@/lib/api/abort";
import type { ApiClient } from "@/lib/api/client";
import type { ChatMessage, Uuid } from "@/lib/api/types";
import { mergeMessages } from "../merge-messages";
import {
  FIRST_PAGE_LIMIT,
  getConversation,
  getInbox,
  getMessages,
  getUnread,
  INBOX_PAGE_SIZE,
  POLL_PAGE_LIMIT,
} from "./chat-api";
import { chatKeys } from "./chat-keys";

/** After a round that said `hasMore`, how many more rounds one poll may run (spec 0012, AC-10). */
const MAX_POLL_ROUNDS = 5;

const lastSeqOf = (messages: readonly ChatMessage[]): number | null =>
  messages.at(-1)?.seq ?? null;

/** Told after each poll whether it worked, so the caller can count failures in a row. */
export type Track = (failed: boolean) => void;

// Wraps a read so it reports its result. A poll that was cancelled (the person left the page, or
// a newer ask took its place) is neither a success nor a failure. TanStack counts failures from 0
// at every fetch, so the count that doubles the wait has to be kept by the caller (AC-10).
const tracked =
  <Args extends unknown[], R>(
    track: Track | undefined,
    run: (...args: Args) => Promise<R>,
  ) =>
  async (...args: Args): Promise<R> => {
    try {
      const result = await run(...args);
      track?.(false);
      return result;
    } catch (error) {
      if (!isAbortError(error)) track?.(true);
      throw error;
    }
  };

/**
 * What one read of the messages of a conversation gives back (spec 0012, AC-10).
 *
 * With nothing in the cache it reads the newest 30. With messages in the cache it asks for what
 * is newer than the last `seq`, and while the answer says `hasMore` it asks again right away, up
 * to five rounds. What comes back is merged into the cache as it is *now*, after the last
 * `await`: sending a message or loading older ones may have written to it meanwhile, and the
 * value returned here replaces the cache, so a copy taken at the start would drop their work.
 */
export async function readMessages(
  api: ApiClient,
  client: QueryClient,
  id: Uuid,
  signal: AbortSignal,
): Promise<ChatMessage[]> {
  const key = chatKeys.messages(id);
  const latest = () => client.getQueryData<ChatMessage[]>(key) ?? [];

  const since = lastSeqOf(latest());
  if (since === null) {
    const first = await getMessages(api, id, {}, FIRST_PAGE_LIMIT, signal);
    return mergeMessages(latest(), first.items);
  }

  let received: ChatMessage[] = [];
  let after = since;
  for (let round = 0; round < MAX_POLL_ROUNDS; round += 1) {
    const page = await getMessages(
      api,
      id,
      { afterSeq: after },
      POLL_PAGE_LIMIT,
      signal,
    );
    received = [...received, ...page.items];
    after = lastSeqOf(page.items) ?? after;
    // An empty page cannot move the cursor, so asking again would repeat it.
    if (!page.hasMore || page.items.length === 0) break;
    signal.throwIfAborted();
  }
  return mergeMessages(latest(), received);
}

/** The messages of a conversation: ascending by `seq`, and gone from the cache when closed. */
export const messagesQuery = (api: ApiClient, id: Uuid, track?: Track) =>
  queryOptions({
    queryKey: chatKeys.messages(id),
    queryFn: tracked(track, ({ signal, client }) =>
      readMessages(api, client, id, signal),
    ),
    // Closing a conversation drops its messages, so opening it again starts from the newest 30
    // and never from a copy that may be missing messages.
    gcTime: 0,
    // The next poll is the retry, and TanStack's own failure count restarts at each fetch.
    retry: false,
  });

/** The head of a conversation. The send and read answers write to it, so no timer is needed. */
export const conversationQuery = (api: ApiClient, id: Uuid) =>
  queryOptions({
    queryKey: chatKeys.conversation(id),
    queryFn: ({ signal }) => getConversation(api, id, signal),
  });

/** One page of the inbox. The page before stays on screen while the next one loads. */
export const inboxQuery = (api: ApiClient, page: number, track?: Track) =>
  queryOptions({
    queryKey: chatKeys.inbox(page),
    queryFn: tracked(track, ({ signal }) =>
      getInbox(api, { page, pageSize: INBOX_PAGE_SIZE }, signal),
    ),
    placeholderData: keepPreviousData,
    retry: false,
  });

/**
 * The conversation a renter already has about a listing, or `null` (spec 0012, AC-3). The
 * `queryFn` returns the item itself and not the page, so the `setQueryData` that follows a first
 * message writes the same shape. It runs only when the page opens and the viewer may chat.
 */
export const byListingQuery = (api: ApiClient, listingId: Uuid) =>
  queryOptions({
    queryKey: chatKeys.byListing(listingId),
    queryFn: async ({ signal }) => {
      const page = await getInbox(
        api,
        { page: 1, pageSize: 1, listingId },
        signal,
      );
      return page.items[0] ?? null;
    },
    staleTime: 30_000,
  });

/** How long an unread count counts as fresh. */
export const UNREAD_STALE_MS = 10_000;

/**
 * The unread count (spec 0012, AC-18 and AC-19). The indicator in the page header and the
 * landlord dashboard card read the same key, so one request and one cache entry serve both. The
 * card does not poll on its own: the indicator in the same page frame does.
 */
export const unreadQueryOptions = (api: ApiClient, track?: Track) =>
  queryOptions({
    queryKey: chatKeys.unread(),
    queryFn: tracked(track, ({ signal }) => getUnread(api, signal)),
    staleTime: UNREAD_STALE_MS,
    // The next poll is the retry (see `messagesQuery`).
    retry: false,
  });
