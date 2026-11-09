"use client";

import { MessageSquareTextIcon } from "lucide-react";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { RateLimitNotice } from "@/components/states/rate-limit-notice";
import { Button } from "@/components/ui/button";
import { isApiError } from "@/lib/api/errors";
import { useCountdown } from "@/lib/use-countdown";

/** Nobody has reviewed this landlord (AC-12). */
export function NoReviews() {
  return (
    <EmptyState icon={MessageSquareTextIcon} title="Chưa có đánh giá nào." />
  );
}

/**
 * The page held only the viewer's own review, which is already pinned above (AC-12). The
 * pagination stays under it, so the person can go on.
 */
export function OnlyMyReview() {
  return (
    <EmptyState
      icon={MessageSquareTextIcon}
      title="Trang này không có đánh giá nào khác."
    />
  );
}

/** A page past the last one: the API answers it with no rows (AC-12). */
export function PastLastPage({ onFirstPage }: { onFirstPage: () => void }) {
  return (
    <EmptyState
      icon={MessageSquareTextIcon}
      title="Trang này không có đánh giá."
      action={
        <Button type="button" variant="outline" size="lg" onClick={onFirstPage}>
          Về trang đầu
        </Button>
      }
    />
  );
}

/**
 * The list could not be read (AC-13): a first load, or a page after the first, the same notice in
 * the same place. A 429 shows the wait counting down, and "Thử lại" stays off until it ends.
 */
export function ListFailure({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  const secondsLeft = useCountdown(error);

  if (isApiError(error) && error.status === 429) {
    return (
      <div className="flex flex-col items-start gap-4">
        <RateLimitNotice error={error} className="w-full" />
        <Button
          type="button"
          variant="outline"
          size="lg"
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
      title="Không tải được đánh giá"
      onRetry={onRetry}
    />
  );
}
