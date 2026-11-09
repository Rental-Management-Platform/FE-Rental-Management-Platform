// Small pure edits to what the cache holds, so each writer says what it changed and nothing
// else (spec 0012, AC-15).

import type { ChatMessage, ConversationItem } from "@/lib/api/types";

/** The inbox shows the last message without its id. */
export const toLastMessage = (
  message: ChatMessage,
): ConversationItem["lastMessage"] => ({
  seq: message.seq,
  senderId: message.senderId,
  isMine: message.isMine,
  body: message.body,
  createdAt: message.createdAt,
});

/**
 * The head after I sent `message`: it is now the last message, and my read mark moves to it, so
 * nothing is unread for me.
 */
export const withSentMessage = (
  head: ConversationItem,
  message: ChatMessage,
): ConversationItem => ({
  ...head,
  lastMessage: toLastMessage(message),
  lastMessageAt: message.createdAt,
  unreadCount: 0,
});
