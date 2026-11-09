"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ImagePlaceholder } from "@/components/states/image-placeholder";
import type { ConversationItem } from "@/lib/api/types";
import { FOCUS_RING } from "@/lib/focus-ring";
import { formatDateTime } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

const UNKNOWN_NAME = "Người dùng";

// The cover is small, so the browser is told its width and does not fetch a large file.
function Cover({ path }: { path: string | null }) {
  const src = path === null ? null : mediaUrl(path);
  // The address that failed, not a flag, so a new address gets a fresh try.
  const [failed, setFailed] = useState<string | null>(null);

  if (src === null || failed === src) {
    return <ImagePlaceholder ratio="4:3" className="[&_svg]:size-6" />;
  }
  return (
    <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg bg-muted">
      <Image
        src={src}
        alt=""
        fill
        sizes="80px"
        onError={() => setFailed(src)}
        className="object-cover"
      />
    </div>
  );
}

interface InboxRowProps {
  item: ConversationItem;
  /** The inbox of this side. The row links to `<basePath>/<id>`. */
  basePath: string;
}

/**
 * One conversation in the inbox (spec 0012, AC-6): the cover of the listing, the other person,
 * the listing, and the last message. The last message is plain text, shown with `{...}` and cut
 * to one line, with "Bạn:" in front when it is mine.
 */
export function InboxRow({ item, basePath }: InboxRowProps) {
  const name = item.otherUser.name ?? UNKNOWN_NAME;
  return (
    <li>
      <Link
        href={`${basePath}/${item.id}`}
        className={cn(
          FOCUS_RING,
          "flex gap-3 p-4 transition-colors hover:bg-accent focus-visible:ring-offset-0 focus-visible:ring-inset sm:px-5",
        )}
      >
        {/* Decorative: the title beside it already names the listing. */}
        <div aria-hidden="true" className="w-20 shrink-0 self-start">
          <Cover path={item.listing.coverImageUrl} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate font-medium">{name}</p>
            <time
              dateTime={item.lastMessageAt}
              className="shrink-0 text-sm text-muted-foreground"
            >
              {formatDateTime(item.lastMessageAt)}
            </time>
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {item.listing.title}
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {item.lastMessage.isMine && "Bạn: "}
            {item.lastMessage.body}
          </p>
        </div>
      </Link>
    </li>
  );
}
