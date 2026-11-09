"use client";

import { MessagesSquareIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ListPagination } from "@/components/list-pagination";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { RateLimitNotice } from "@/components/states/rate-limit-notice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { isApiError } from "@/lib/api/errors";
import type { ConversationItem } from "@/lib/api/types";
import { useSession } from "@/lib/session/auth-provider";
import { useCountdown } from "@/lib/use-countdown";
import { useNow } from "@/lib/use-now";
import { useInbox } from "../hooks/use-inbox";
import { parseInboxPage } from "../schemas/inbox-params";
import { InboxRow } from "./inbox-row";

const DESCRIPTION: Record<"tenant" | "landlord", string> = {
  tenant: "Các cuộc trò chuyện của bạn với chủ trọ.",
  landlord: "Trả lời những người tìm trọ đã nhắn cho bạn.",
};

interface InboxScreenProps {
  /** The inbox of this side: `/tin-nhan` or `/landlord/tin-nhan`. Every link is built from it. */
  basePath: string;
}

// Page 1 has no query, so the first page of the inbox is the clean address.
const pageHref = (basePath: string, page: number) =>
  page <= 1 ? basePath : `${basePath}?page=${page}`;

/**
 * The inbox (spec 0012, AC-6 and AC-7). The two pages of this screen, one for renters and one
 * for landlords, differ only in `basePath`. The page number is the `?page=` of the address.
 * It reads `useSearchParams`, so the page keeps it inside a `<Suspense>` boundary.
 */
export function InboxScreen({ basePath }: InboxScreenProps) {
  const page = parseInboxPage(useSearchParams().get("page"));
  const session = useSession();
  const { query: inbox, failing } = useInbox(page);
  // The labels "Hôm nay" and "Hôm qua" follow this, so they change by themselves at midnight.
  const now = useNow();
  // The words differ by account type. The gate has already let only these two types in.
  const side =
    session.status === "user" && session.user.accountType === "landlord"
      ? "landlord"
      : "tenant";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Tin nhắn" description={DESCRIPTION[side]} />

      {inbox.data === undefined && inbox.isError && (
        <InboxFailure
          error={inbox.error}
          onRetry={() => void inbox.refetch()}
        />
      )}
      {inbox.data === undefined && !inbox.isError && <InboxSkeleton />}

      {inbox.data !== undefined && inbox.data.total === 0 && (
        <InboxEmpty side={side} />
      )}
      {inbox.data !== undefined &&
        inbox.data.total > 0 &&
        inbox.data.items.length === 0 && <InboxPastEnd basePath={basePath} />}
      {inbox.data !== undefined && inbox.data.items.length > 0 && (
        <>
          {failing && (
            <p role="status" className="text-sm text-muted-foreground">
              Không cập nhật được tin mới. Đang thử lại.
            </p>
          )}
          <InboxList items={inbox.data.items} basePath={basePath} now={now} />
          <ListPagination
            page={inbox.data.page}
            pageSize={inbox.data.pageSize}
            total={inbox.data.total}
            itemLabel="cuộc trò chuyện"
            size="lg"
            hrefFor={(target) => pageHref(basePath, target)}
          />
        </>
      )}
    </div>
  );
}

/** The rows of one page in their zone. It only draws, so `/dev/ui` can show it on fake rows. */
export function InboxList({
  items,
  basePath,
  now,
}: {
  items: readonly ConversationItem[];
  basePath: string;
  now: Date;
}) {
  return (
    <Card className="gap-0 py-0">
      <ul className="divide-y">
        {items.map((item) => (
          <InboxRow key={item.id} item={item} basePath={basePath} now={now} />
        ))}
      </ul>
    </Card>
  );
}

// Rows of the same shape as the real ones, so the page does not jump when they arrive.
const SKELETON_ROWS = [0, 1, 2, 3];

export function InboxSkeleton() {
  return (
    <Card className="gap-0 py-0" aria-busy="true">
      <span role="status" className="sr-only">
        Đang tải hộp thư
      </span>
      <ul className="divide-y">
        {SKELETON_ROWS.map((row) => (
          <li key={row} className="flex gap-3 p-4 sm:px-5">
            <Skeleton className="aspect-4/3 w-20 shrink-0 rounded-lg" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-3.5 w-1/2" />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// Nothing here yet. The words differ: a renter starts a conversation, a landlord waits for one.
export function InboxEmpty({ side }: { side: "tenant" | "landlord" }) {
  return side === "landlord" ? (
    <EmptyState
      icon={MessagesSquareIcon}
      title="Chưa có ai nhắn cho bạn"
      description="Khi có người tìm trọ nhắn về tin của bạn, cuộc trò chuyện sẽ hiện ở đây."
    />
  ) : (
    <EmptyState
      icon={MessagesSquareIcon}
      title="Bạn chưa nhắn cho chủ trọ nào"
      description="Mở một tin và bấm “Nhắn cho chủ trọ” để hỏi về phòng bạn quan tâm."
      action={
        <Button asChild size="lg">
          <Link href="/">Tìm trọ</Link>
        </Button>
      }
    />
  );
}

// A page past the last one: the API answers it with no rows but still reports the total.
function InboxPastEnd({ basePath }: { basePath: string }) {
  return (
    <EmptyState
      icon={MessagesSquareIcon}
      title="Trang này không có cuộc trò chuyện"
      action={
        <Button asChild size="lg">
          <Link href={basePath}>Về trang đầu</Link>
        </Button>
      }
    />
  );
}

// A failed first read: a 429 shows the wait counting down, anything else the error. "Thử lại"
// stays off while the wait runs.
function InboxFailure({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  const secondsLeft = useCountdown(error);
  if (isApiError(error) && error.status === 429) {
    return (
      <div className="flex flex-col gap-4">
        <RateLimitNotice error={error} />
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="self-start"
          onClick={onRetry}
          disabled={secondsLeft > 0}
        >
          Thử lại
        </Button>
      </div>
    );
  }
  return (
    <ErrorState
      error={error}
      title="Không tải được hộp thư"
      onRetry={onRetry}
    />
  );
}
