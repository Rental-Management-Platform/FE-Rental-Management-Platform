"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ChatMessage, ConversationItem, Uuid } from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import { useNow } from "@/lib/use-now";
import { conversationQuery } from "../api/chat-queries";
import { isConversationId } from "../conversation-id";
import { useComposer } from "../hooks/use-composer";
import { useMarkRead } from "../hooks/use-mark-read";
import { useOlderMessages } from "../hooks/use-older-messages";
import { useSendMessage } from "../hooks/use-send-message";
import { useStickyBottom } from "../hooks/use-sticky-bottom";
import { useThreadMessages } from "../hooks/use-thread-messages";
import { threadBlock } from "../thread-block";
import { Composer } from "./composer";
import { ConversationListingCard } from "./conversation-listing-card";
import { MessageList } from "./message-list";
import { ThreadBlocked } from "./thread-blocked";
import { ThreadSkeleton } from "./thread-skeleton";

const UNKNOWN_NAME = "Người dùng";

interface ThreadScreenProps {
  /** The inbox of this side: `/tin-nhan` or `/landlord/tin-nhan`. Every link is built from it. */
  basePath: string;
}

/**
 * One conversation (spec 0012, AC-8 and AC-9). The two pages of this screen, one for renters and
 * one for landlords, differ only in `basePath`. The id comes from the address, and an address that
 * cannot be an id is "not found" without a request.
 *
 * It fills the height its page gives it (`h-full`), so the list scrolls inside a column whose last
 * part is the message box: the box is always in view, with the on screen keyboard open too.
 */
export function ThreadScreen({ basePath }: ThreadScreenProps) {
  const { id } = useParams<{ id: string }>();
  if (!isConversationId(id)) {
    return (
      <ThreadBlocked
        block="not-found"
        basePath={basePath}
        onRetry={() => undefined}
      />
    );
  }
  // A key per id, so going from one conversation to another never carries state across.
  return <Thread key={id} id={id} basePath={basePath} />;
}

// Reads the head and the messages, and decides what the page shows: a state that replaces it, the
// skeleton, or the conversation. The conversation holds the message box, so a draft exists only
// once there is something to reply to.
function Thread({ id, basePath }: { id: Uuid; basePath: string }) {
  const api = useApi();
  const head = useQuery(conversationQuery(api, id));
  const { query: messages, failing } = useThreadMessages(id);

  const blocked = threadBlock([head, messages]);
  if (blocked) {
    return (
      <ThreadBlocked
        block={blocked.block}
        error={blocked.error}
        basePath={basePath}
        onRetry={() => {
          void head.refetch();
          void messages.refetch();
        }}
      />
    );
  }
  if (head.data === undefined || messages.data === undefined) {
    return <ThreadSkeleton />;
  }
  return (
    <Conversation
      id={id}
      head={head.data}
      messages={messages.data}
      failing={failing}
      basePath={basePath}
    />
  );
}

interface ConversationProps {
  id: Uuid;
  head: ConversationItem;
  messages: readonly ChatMessage[];
  /** Two asks for newer messages in a row failed. */
  failing: boolean;
  basePath: string;
}

function Conversation({
  id,
  head,
  messages,
  failing,
  basePath,
}: ConversationProps) {
  const composer = useComposer();
  const send = useSendMessage(id);
  const now = useNow();
  const sticky = useStickyBottom(messages);
  const older = useOlderMessages(id, sticky.scrollRef, messages[0]?.seq);
  // Marks the conversation read once its newest message is really in front of the person.
  useMarkRead({ id, head, messages, atBottom: sticky.atBottom });
  const name = head.otherUser.name ?? UNKNOWN_NAME;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader
        breadcrumb={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={basePath}>Hộp thư</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="truncate">{name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
        title={name}
      />
      <Card className="min-h-0 flex-1 gap-0 py-0">
        <ConversationListingCard listing={head.listing} otherName={name} />
        <Separator />
        <MessageList
          messages={messages}
          otherName={name}
          now={now}
          older={older}
          scrollRef={sticky.scrollRef}
          onScroll={sticky.onScroll}
          unseen={sticky.unseen}
          scrollToBottom={sticky.scrollToBottom}
        />
        <Separator />
        <div className="flex shrink-0 flex-col gap-2 p-3">
          {failing && (
            <p role="status" className="text-sm text-muted-foreground">
              Không cập nhật được tin mới. Đang thử lại.
            </p>
          )}
          <Composer
            composer={composer}
            onSend={(body) => send.mutateAsync(body)}
            placeholder="Nhập tin nhắn"
            focusWhenMouse
          />
        </div>
      </Card>
    </div>
  );
}
