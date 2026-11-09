"use client";

import { CheckIcon, UserPlusIcon } from "lucide-react";
import Link from "next/link";
import { RateLimitNotice } from "@/components/states/rate-limit-notice";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { isApiError } from "@/lib/api/errors";
import { useCountdown } from "@/lib/use-countdown";
import { classifyFollowError } from "../follow-errors";
import type { FollowView } from "../follow-view";

type FollowButtonProps = {
  view: FollowView;
  /** A follow or unfollow is in flight. */
  pending: boolean;
  /** The error of the last follow or unfollow, or `null`. */
  failure: unknown;
  /** What a screen reader hears after a success, or "". Never carries personal data. */
  announcement: string;
  signInHref: string;
  onToggle: () => void;
  onRetry: () => void;
};

/**
 * Draws one `FollowView` (api-for-frontend.md, 6.32), so `/dev/ui` can show every state with no
 * session and no network.
 *
 * While a call is in flight, and while a 429 counts down, the button is locked with
 * `aria-disabled` and not `disabled`, so focus stays on it (the rule of the chat box). Nothing is
 * sent again by itself. A line under the button says what went wrong and is read out at once.
 */
export function FollowButton({
  view,
  pending,
  failure,
  announcement,
  signInHref,
  onToggle,
  onRetry,
}: FollowButtonProps) {
  const secondsLeft = useCountdown(failure);
  const locked = pending || secondsLeft > 0;
  const result = failure === null ? null : classifyFollowError(failure);

  return (
    <div className="flex flex-col gap-2 md:items-end">
      {/* Always mounted, so the text that arrives later is read out. */}
      <span role="status" className="sr-only">
        {announcement}
      </span>

      {view.kind === "checking" && (
        <>
          {/* With scripts off the session never resolves, so the skeleton hides and the sign in
              button stands in. */}
          <div aria-busy="true" className="noscript:hidden">
            <span className="sr-only">Đang kiểm tra trạng thái theo dõi</span>
            <Skeleton className="h-11 w-36 rounded-lg" />
          </div>
          <noscript>
            <GuestLink href={signInHref} />
          </noscript>
        </>
      )}

      {view.kind === "guest" && <GuestLink href={signInHref} />}

      {view.kind === "ready" && (
        <Button
          type="button"
          size="lg"
          variant={view.following ? "outline" : "default"}
          disabled={!view.canChange}
          aria-disabled={locked || undefined}
          aria-busy={pending}
          onClick={() => {
            if (!locked) onToggle();
          }}
        >
          {pending ? (
            <Spinner size="sm" />
          ) : view.following ? (
            <CheckIcon data-icon="inline-start" />
          ) : (
            <UserPlusIcon data-icon="inline-start" />
          )}
          {view.following ? "Đang theo dõi" : "Theo dõi"}
        </Button>
      )}

      {view.kind === "failed" && <ViewFailure view={view} onRetry={onRetry} />}

      {result?.kind === "rate-limited" && (
        <RateLimitNotice error={failure} className="max-w-sm" />
      )}
      {result?.kind === "message" && (
        <p
          role="alert"
          className="max-w-xs text-sm text-destructive md:text-right"
        >
          {result.message}
        </p>
      )}
    </div>
  );
}

// The sign in button of a guest. The same block is the `noscript` stand in, so it is a plain link.
function GuestLink({ href }: { href: string }) {
  return (
    <Button asChild size="lg">
      <Link href={href}>
        <UserPlusIcon data-icon="inline-start" />
        Theo dõi
      </Link>
    </Button>
  );
}

// The read of `isFollowing` failed. It leaves the rest of the page alone. A 429 shows the wait
// counting down, and "Thử lại" stays off until it ends.
function ViewFailure({
  view,
  onRetry,
}: {
  view: Extract<FollowView, { kind: "failed" }>;
  onRetry: () => void;
}) {
  const secondsLeft = useCountdown(view.error);

  if (view.reason === "gone") {
    return (
      <p className="text-sm text-muted-foreground">Chủ trọ này không còn.</p>
    );
  }

  return (
    <>
      {isApiError(view.error) && view.error.status === 429 ? (
        <RateLimitNotice error={view.error} className="max-w-sm" />
      ) : (
        <p className="text-sm text-muted-foreground">
          Chưa lấy được trạng thái theo dõi.
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={onRetry}
        disabled={secondsLeft > 0}
      >
        Thử lại
      </Button>
    </>
  );
}
