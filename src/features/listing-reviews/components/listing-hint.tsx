"use client";

import { useId } from "react";
import {
  ChatEntryControl,
  type ChatEntryControlProps,
} from "@/features/chat/components/chat-entry-control";

/**
 * What a renter who may not review this room yet sees (spec 0014, AC-9): the sentence that says
 * what to do, and under it the message button of spec 0012 (the first message button, "Xem tin
 * nhắn của bạn" when a conversation about this listing exists, a skeleton while the lookup runs).
 * It lives in the write block's border row, so it has no row of its own.
 *
 * The page has two message buttons (this one and the contact card's), so the button points at the
 * sentence with `aria-describedby` and a screen reader can tell them apart. The block shows only
 * what `canReview` says: a chat about another listing of the same landlord does not unlock it.
 */
export function ListingHint(props: Omit<ChatEntryControlProps, "describedBy">) {
  const sentenceId = useId();
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border p-4">
      <p id={sentenceId}>
        Nhắn tin cho chủ trọ về tin này và đợi họ trả lời để đánh giá phòng.
      </p>
      <ChatEntryControl {...props} describedBy={sentenceId} />
    </div>
  );
}
