"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ConversationItem, Uuid } from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import { openConversation } from "../api/chat-api";
import { chatKeys } from "../api/chat-keys";

/**
 * Sends the first message of a renter about a listing, which opens the conversation (spec 0012,
 * AC-4). On success it writes the conversation under the two keys a page may read it from, so
 * the page it leads to and the listing button already know it, and it marks the inbox and the
 * unread count stale. Closing the dialog and moving to the conversation are the caller's, after
 * the promise settles.
 *
 * It never retries by itself: opening is not safe to repeat. The caller locks its button while
 * `isPending` is true.
 */
export function useOpenConversation(listingId: Uuid) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) => openConversation(api, listingId, body),
    onSuccess: ({ conversation }) => {
      queryClient.setQueryData<ConversationItem>(
        chatKeys.conversation(conversation.id),
        conversation,
      );
      // Keyed by the listing of the answer, which is the one this dialog was opened on.
      queryClient.setQueryData<ConversationItem | null>(
        chatKeys.byListing(conversation.listing.id),
        conversation,
      );
      void queryClient.invalidateQueries({ queryKey: chatKeys.inboxAll() });
      void queryClient.invalidateQueries({ queryKey: chatKeys.unread() });
    },
  });
}
