"use client";

import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/states/error-state";
import { ForbiddenState } from "@/components/states/forbidden-state";
import { NotFoundState } from "@/components/states/not-found-state";
import { RateLimitNotice } from "@/components/states/rate-limit-notice";
import { Button } from "@/components/ui/button";
import { useCountdown } from "@/lib/use-countdown";
import type { ThreadBlock } from "../thread-block";

interface ThreadBlockedProps {
  block: ThreadBlock;
  /** What the failed read threw, for the message and the wait. */
  error?: unknown;
  /** The inbox, where "not found" leads back to. */
  basePath: string;
  onRetry: () => void;
}

/**
 * The states that take the whole conversation page (spec 0012, AC-20). Each one carries the one
 * `h1` of the page, so the page never has two or none.
 */
export function ThreadBlocked({
  block,
  error,
  basePath,
  onRetry,
}: ThreadBlockedProps) {
  switch (block) {
    case "not-found":
      return (
        <NotFoundState
          title="Không tìm thấy cuộc trò chuyện"
          backHref={basePath}
          backLabel="Về hộp thư"
        />
      );
    case "forbidden":
      return <ForbiddenState />;
    case "rate-limited":
      return <RateLimited error={error} onRetry={onRetry} />;
    case "error":
      return (
        <ErrorState
          page
          error={error}
          title="Không tải được cuộc trò chuyện"
          onRetry={onRetry}
        />
      );
  }
}

// A 429: the wait counts down and "Thử lại" stays off until it ends.
function RateLimited({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  const secondsLeft = useCountdown(error);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Tin nhắn" />
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
