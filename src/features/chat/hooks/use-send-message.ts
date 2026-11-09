"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ChatMessage, ConversationItem, Uuid } from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import { sendMessage } from "../api/chat-api";
import { chatKeys } from "../api/chat-keys";
import { withSentMessage } from "../conversation-cache";
import { mergeMessages } from "../merge-messages";

/**
 * Sends one message in a conversation (spec 0012, AC-15). There is no optimistic bubble: the
 * message appears when the server has it, so a message that never arrived is never shown. The
 * answer is merged into the messages with `mergeMessages`, so a poll running at the same time
 * cannot drop it or repeat it.
 *
 * It never retries by itself: a create call is not safe to repeat. The caller locks its button
 * while `isPending` is true.
 */
export function useSendMessage(id: Uuid) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) => sendMessage(api, id, body),
    onSuccess: (message) => {
      // Nothing to merge into when the list is not loaded: writing a lone message there would
      // make the next poll think the list is whole and skip the older ones.
      queryClient.setQueryData<ChatMessage[]>(
        chatKeys.messages(id),
        (current) =>
          current === undefined ? undefined : mergeMessages(current, [message]),
      );
      queryClient.setQueryData<ConversationItem>(
        chatKeys.conversation(id),
        (head) =>
          head === undefined ? undefined : withSentMessage(head, message),
      );
      // This conversation must jump to the top of page 1 of the inbox, which an edit in place
      // cannot do, so the inbox is read again. The unread count may have moved too.
      void queryClient.invalidateQueries({ queryKey: chatKeys.inboxAll() });
      void queryClient.invalidateQueries({ queryKey: chatKeys.unread() });
    },
  });
}
