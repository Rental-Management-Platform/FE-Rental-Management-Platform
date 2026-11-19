import Link from "next/link";
import {
  describeChange,
  describeRate,
} from "@/components/stats/describe-change";
import { StatRow } from "@/components/stats/stat-row";
import { StatsZone } from "@/components/stats/stats-zone";
import { Button } from "@/components/ui/button";
import { LANDLORD_CHAT_BASE } from "@/features/chat/access";
import type { Statistics } from "@/lib/api/types";
import { formatCount } from "@/lib/format";
import {
  CHAT_ZONE_TITLE,
  OPEN_INBOX_LABEL,
  REPLIED_LABEL,
  REPLY_RATE_LABEL,
  UNREAD_LABEL,
  unreadLine,
} from "../landlord-stats-text";

/**
 * The zone "Tin nhắn" (spec 0024, AC-13): the reply rate, which changes by points and not by
 * percent, the conversations that were answered, and what is unread right now (a number of the
 * moment, so no arrow), with a link to the inbox. A period that opened no conversation has no
 * rate: a dash and a sentence, never 0%.
 */
export function ChatZone({ statistics }: { statistics: Statistics }) {
  const { chat } = statistics;
  const rate = describeRate(chat.replyRate);
  const noUnread = chat.unreadMessages === 0 && chat.unreadConversations === 0;

  return (
    <StatsZone title={CHAT_ZONE_TITLE}>
      <div className="flex flex-col gap-4">
        <StatRow
          label={REPLY_RATE_LABEL}
          value={rate.value}
          change={rate.change}
          note={rate.note ?? undefined}
          muted={chat.replyRate.value === null}
        />
        <StatRow
          label={REPLIED_LABEL}
          value={formatCount(chat.repliedConversations.value)}
          change={describeChange(chat.repliedConversations)}
        />
        <StatRow
          label={UNREAD_LABEL}
          value={unreadLine(chat.unreadConversations, chat.unreadMessages)}
          muted={noUnread}
        />
      </div>
      <div>
        <Button asChild variant="outline" className="max-md:h-11">
          <Link href={LANDLORD_CHAT_BASE}>{OPEN_INBOX_LABEL}</Link>
        </Button>
      </div>
    </StatsZone>
  );
}
