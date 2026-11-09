"use client";

import { MessageCircleIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/format";
import { useSession } from "@/lib/session/auth-provider";
import { chatBasePath, canUseChat } from "../access";
import { useUnread } from "../hooks/use-unread";

/** At most this many show; more is "99+". */
const MAX_SHOWN = 99;

const accessibleName = (unread: number) =>
  unread > 0
    ? `Tin nhắn, ${formatCount(unread)} cuộc trò chuyện chưa đọc`
    : "Tin nhắn";

interface ChatIndicatorProps {
  /** `lg` (44 px) in the public header, `default` (40 px) in the work area top bar. */
  size?: "default" | "lg";
}

/**
 * The speech bubble with the number of conversations that have something unread (spec 0012,
 * AC-18). It is a link to the inbox, and the number is not a bell: it counts conversations, not
 * messages.
 *
 * It draws nothing for a guest, for an admin, and while the session is loading, so the server
 * HTML and the first render in the browser are the same. It sits to the left of the account menu,
 * which is aligned to the right, so appearing after the session is known does not move the
 * account menu.
 *
 * The number changes every few seconds, so there is no live region: a screen reader finds it in
 * the name of the link, when it looks.
 */
export function ChatIndicator({ size = "default" }: ChatIndicatorProps) {
  const session = useSession();
  if (!canUseChat(session)) return null;
  return (
    <Indicator
      size={size}
      href={chatBasePath(session.user.accountType) ?? "/"}
    />
  );
}

// Apart from `ChatIndicator` so the unread query is made only by someone who may chat.
function Indicator({ size, href }: { size: "default" | "lg"; href: string }) {
  const { data } = useUnread();
  return (
    <ChatIndicatorView
      size={size}
      href={href}
      unread={data?.unreadConversations ?? 0}
    />
  );
}

/**
 * Draws the bubble for a given count and reads nothing, so `/dev/ui` can show 0, 7 and "99+" with
 * no session and no network.
 */
export function ChatIndicatorView({
  size,
  href,
  unread,
}: {
  size: "default" | "lg";
  href: string;
  unread: number;
}) {
  return (
    <Button
      asChild
      variant="ghost"
      size={size === "lg" ? "icon-lg" : "icon"}
      className="relative"
    >
      <Link href={href} aria-label={accessibleName(unread)}>
        <MessageCircleIcon aria-hidden="true" />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-medium text-destructive-foreground"
          >
            {unread > MAX_SHOWN ? `${MAX_SHOWN}+` : formatCount(unread)}
          </span>
        )}
      </Link>
    </Button>
  );
}
