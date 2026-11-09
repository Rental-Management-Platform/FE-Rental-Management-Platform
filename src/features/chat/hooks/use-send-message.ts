"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { ChatMessage, ConversationItem, Uuid } from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import { sendMessage } from "../api/chat-api";
import { chatKeys } from "../api/chat-keys";
import { withSentMessage } from "../conversation-cache";
import { mergeMessages } from "../merge-messages";
import { classifySendError } from "../send-errors";

/**
 * Sends one message in a conversation (spec 0012, AC-15 and AC-16). There is no optimistic bubble:
 * the message appears when the server has it, so a message that never arrived is never shown. The
 * answer is merged into the messages with `mergeMessages`, so a poll running at the same time
 * cannot drop it or repeat it.
 *
 * It never retries by itself: a create call is not safe to repeat. It returns two functions:
 *
 * * `send`: the call itself. It rejects at once when it fails, so the error can be shown at once.
 * * `afterFailure`: what to do next, which the box runs after it has shown the error and while its
 *   button stays locked. No answer came back (network, time out): the message may have arrived all
 *   the same, so one read of the newest messages runs. If it did arrive it shows up, and the draft
 *   still in the box is the person's to delete. The button cannot be pressed while it is not known
 *   whether the message got there. The conversation does not exist (any more): the messages are
 *   read again, which answers 404 too, and the page shows "not found" at once and not at the next
 *   poll.
 */
export function useSendMessage(id: Uuid) {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation({
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

  const { mutateAsync } = mutation;
  const afterFailure = useCallback(
    async (error: unknown): Promise<void> => {
      const { maybeDelivered, conversationGone } = classifySendError(
        error,
        "send",
      );
      if (!maybeDelivered && !conversationGone) return;
      // `refetchQueries` does not throw: a read that fails is not worth a second message to the
      // person, who already has the error of the send.
      await queryClient.refetchQueries({ queryKey: chatKeys.messages(id) });
    },
    [queryClient, id],
  );

  return { send: mutateAsync, afterFailure };
}
