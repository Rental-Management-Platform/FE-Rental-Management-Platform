// The calls of chat (api-for-frontend.md, 6.39), one function each. They take the client and the
// `signal` TanStack hands a `queryFn`, so a call that is left behind is cancelled. Nothing here
// logs, stores or puts message text anywhere but the request body (spec 0012, AC-22).

import type { ApiClient } from "@/lib/api/client";
import type {
  ChatMessage,
  ChatMessagesPage,
  ConversationItem,
  OpenConversationResult,
  Page,
  UnreadSummary,
  Uuid,
} from "@/lib/api/types";

/** How many messages the first read of a conversation asks for: the newest ones. */
export const FIRST_PAGE_LIMIT = 30;
/** How many messages one poll round asks for. The contract allows 1 to 100. */
export const POLL_PAGE_LIMIT = 100;
/** Rows per page of the inbox. */
export const INBOX_PAGE_SIZE = 20;

const enc = encodeURIComponent;

/** `POST /listings/:id/conversations`: opens the conversation with the first message. */
export const openConversation = (
  api: ApiClient,
  listingId: Uuid,
  body: string,
) =>
  api.post<OpenConversationResult>(
    `/listings/${enc(listingId)}/conversations`,
    {
      body,
    },
  );

/** `POST /conversations/:id/messages`. A create call: it is never sent twice by itself. */
export const sendMessage = (api: ApiClient, id: Uuid, body: string) =>
  api.post<ChatMessage>(`/conversations/${enc(id)}/messages`, { body });

/**
 * `GET /conversations/:id/messages`. Send `afterSeq` (newer) or `beforeSeq` (older), never both:
 * the backend answers 400 to both. With neither, it gives the newest `limit` messages.
 */
export type MessageCursor =
  | { afterSeq: number; beforeSeq?: never }
  | { beforeSeq: number; afterSeq?: never }
  | { afterSeq?: never; beforeSeq?: never };

export const getMessages = (
  api: ApiClient,
  id: Uuid,
  cursor: MessageCursor,
  limit: number,
  signal?: AbortSignal,
) =>
  api.get<ChatMessagesPage>(`/conversations/${enc(id)}/messages`, {
    query: { limit, afterSeq: cursor.afterSeq, beforeSeq: cursor.beforeSeq },
    signal,
  });

/** `GET /conversations/:id`: the head of one conversation. */
export const getConversation = (
  api: ApiClient,
  id: Uuid,
  signal?: AbortSignal,
) => api.get<ConversationItem>(`/conversations/${enc(id)}`, { signal });

/** `GET /me/conversations`, newest activity first. `listingId` narrows it to one listing. */
export const getInbox = (
  api: ApiClient,
  params: { page: number; pageSize: number; listingId?: Uuid },
  signal?: AbortSignal,
) =>
  api.get<Page<ConversationItem>>("/me/conversations", {
    query: params,
    signal,
  });

/** `GET /me/conversations/unread-count`: how many conversations and messages are unread. */
export const getUnread = (api: ApiClient, signal?: AbortSignal) =>
  api.get<UnreadSummary>("/me/conversations/unread-count", { signal });

/**
 * `POST /conversations/:id/read`: marks everything up to `upToSeq` as read and answers with the
 * conversation, whose `unreadCount` is the new one. The read mark never moves back, so a repeat
 * is safe.
 */
export const markRead = (api: ApiClient, id: Uuid, upToSeq: number) =>
  api.post<ConversationItem>(`/conversations/${enc(id)}/read`, { upToSeq });
