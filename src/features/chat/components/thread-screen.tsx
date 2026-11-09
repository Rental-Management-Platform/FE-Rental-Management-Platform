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
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ChatMessage, ConversationItem, Uuid } from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import { conversationQuery } from "../api/chat-queries";
import { isConversationId } from "../conversation-id";
import { useComposer } from "../hooks/use-composer";
import { useSendMessage } from "../hooks/use-send-message";
import { useThreadMessages } from "../hooks/use-thread-messages";
import { threadBlock } from "../thread-block";
import { Composer } from "./composer";
import { MessageList } from "./message-list";
import { ThreadBlocked } from "./thread-blocked";
import { ThreadSkeleton } from "./thread-skeleton";

const UNKNOWN_NAME = "Người dùng";

interface ThreadScreenProps {
  /** The inbox of this side: `/tin-nhan` or `/landlord/tin-nhan`. Every link is built from it. */
  basePath: string;
}

/**
 * One conversation (spec 0012, AC-8). The two pages of this screen, one for renters and one for
 * landlords, differ only in `basePath`. The id comes from the address, and an address that cannot
 * be an id is "not found" without a request.
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
  const messages = useThreadMessages(id);

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
      basePath={basePath}
    />
  );
}

interface ConversationProps {
  id: Uuid;
  head: ConversationItem;
  messages: readonly ChatMessage[];
  basePath: string;
}

function Conversation({ id, head, messages, basePath }: ConversationProps) {
  const composer = useComposer();
  const send = useSendMessage(id);
  const name = head.otherUser.name ?? UNKNOWN_NAME;

  return (
    <div className="flex flex-col gap-6">
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
        title={`Trò chuyện với ${name}`}
        description={<span className="break-words">{head.listing.title}</span>}
      />
      <Card>
        <CardContent>
          <MessageList messages={messages} otherName={name} />
        </CardContent>
        <Separator />
        <CardContent>
          <Composer
            composer={composer}
            onSend={(body) => send.mutateAsync(body)}
            placeholder="Nhập tin nhắn"
            focusWhenMouse
          />
        </CardContent>
      </Card>
    </div>
  );
}
