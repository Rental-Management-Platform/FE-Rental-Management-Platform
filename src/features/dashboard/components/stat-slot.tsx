"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { describeError, isApiError } from "@/lib/api/errors";
import { formatWait } from "@/lib/format";
import { useCountdown } from "@/lib/use-countdown";
import type { StatState } from "../hooks/use-stat";

// The failure stays in this slot: the card still opens when it is ready, and the other cards
// keep working (spec 0008, AC-10). The block sits above the stretched link of the card, so the
// button is never a button inside a link. After a 429 the button waits out the time the answer
// gave, counting down the way `RateLimitNotice` does: one sentence for a screen reader, and the
// ticking number hidden from it. A 5xx adds the support code, as everywhere else.
function StatError({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  const secondsLeft = useCountdown(error);
  const { requestId } = describeError(error);
  const total =
    isApiError(error) && error.status === 429 ? error.retryAfterSeconds : null;
  const approximate = isApiError(error) && !error.retryAfterExact;
  const waiting = total !== null && secondsLeft > 0;

  return (
    <div
      role="status"
      className="relative z-10 flex flex-col items-start gap-2 pt-1"
    >
      <p className="text-sm text-destructive">Không tải được số liệu</p>
      {requestId && (
        <p className="text-xs text-muted-foreground">Mã hỗ trợ: {requestId}</p>
      )}
      {total !== null && waiting && (
        <p className="text-xs text-muted-foreground">
          <span className="sr-only">
            Hãy thử lại sau {formatWait(total, { approximate })}.
          </span>
          <span aria-hidden="true">
            Hãy thử lại sau {formatWait(secondsLeft, { approximate })}.
          </span>
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={waiting}
        onClick={onRetry}
      >
        Thử lại
      </Button>
    </div>
  );
}

// The number of a card, below its description. It only draws a state, so `/dev/ui` can show
// every state without a network call; `ToolCard` reads the real one.
export function StatSlot({
  state,
  onRetry,
}: {
  state: StatState;
  onRetry: () => void;
}) {
  switch (state.kind) {
    case "none":
      return null;
    case "loading":
      return (
        <div role="status" className="pt-1">
          <Skeleton className="h-4 w-32" />
          <span className="sr-only">Đang tải số liệu</span>
        </div>
      );
    case "error":
      return <StatError error={state.error} onRetry={onRetry} />;
    case "lines":
      return (
        <ul className="flex flex-col gap-0.5 pt-1 text-sm font-medium">
          {state.lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      );
  }
}
