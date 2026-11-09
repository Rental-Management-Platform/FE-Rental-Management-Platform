"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { FailureNotice } from "@/components/form/failure-notice";
import { RateLimitNotice } from "@/components/states/rate-limit-notice";
import { Button } from "@/components/ui/button";
import { LISTINGS_ANCHOR } from "@/features/landlord-profile/landlord-id";
import { isApiError } from "@/lib/api/errors";
import type { MyReviewState } from "@/lib/api/types";
import { authHref } from "@/lib/next-path";
import { useCountdown } from "@/lib/use-countdown";
import type { ReviewRole } from "../access";
import { useFocusRequest } from "../hooks/use-focus-request";
import { useReviewActions } from "../hooks/use-review-actions";
import { useReviewForm } from "../hooks/use-review-form";
import {
  EMPTY_REVIEW,
  toCreateBody,
  type ReviewValues,
} from "../schemas/review-schema";
import { MyReviewRow } from "./my-review-row";
import { ReviewForm } from "./review-form";
import { WriteBlockSkeleton } from "./reviews-zone-skeleton";

type WriteBlockProps = {
  landlordId: string;
  role: ReviewRole;
  /** `GET /review`, read by the zone (it runs only for a `writer`). */
  mine: UseQueryResult<MyReviewState>;
  announce: (text: string) => void;
  clearAnnouncement: () => void;
};

/**
 * The block under the heading that lets the viewer write (spec 0013, AC-6). A guest sees one row
 * that leads to sign in. A `writer` sees, first match wins: a skeleton while `GET /review` loads,
 * the pinned review, the form, the hint, or a failure notice. A `reader` (a landlord, an admin) and
 * a viewer whose session is still loading see nothing. The public list shows under it in every case.
 */
export function WriteBlock({
  landlordId,
  role,
  mine,
  announce,
  clearAnnouncement,
}: WriteBlockProps) {
  if (role === "guest") return <GuestRow />;
  if (role === "writer") {
    return (
      <WriterBlock
        landlordId={landlordId}
        mine={mine}
        announce={announce}
        clearAnnouncement={clearAnnouncement}
      />
    );
  }
  return null;
}

// "Đăng nhập để đánh giá chủ trọ": the way back is this page, with its query (the `reviewPage`).
function GuestRow() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const href = authHref(
    "/login",
    search === "" ? pathname : `${pathname}?${search}`,
  );

  return (
    <div className="border-b pb-5">
      <Button asChild variant="outline" size="lg">
        <Link href={href}>Đăng nhập để đánh giá chủ trọ</Link>
      </Button>
    </div>
  );
}

// The part of the write block for a renter. It owns the form of a new review, so the draft lives
// above the part that swaps the form for the pinned row or the hint, and a read of `mine` never
// clears it (AC-7).
function WriterBlock({
  landlordId,
  mine,
  announce,
  clearAnnouncement,
}: Omit<WriteBlockProps, "role">) {
  const actions = useReviewActions(landlordId);
  const state = useReviewForm(EMPTY_REVIEW);
  const pinnedFocus = useFocusRequest<HTMLHeadingElement>();

  // The order of AC-8: the answer is in the `mine` key and the lists and the profile are asked to
  // read again (both inside `create`), then the form is cleared, focus goes to the pinned row, and
  // the sentence is announced. A failure keeps the draft and drops the focus request.
  const post = async (values: ReviewValues) => {
    clearAnnouncement();
    pinnedFocus.request();
    try {
      await actions.create(toCreateBody(values));
    } catch (error) {
      pinnedFocus.cancel();
      throw error;
    }
    state.form.reset(EMPTY_REVIEW);
    announce("Đã đăng đánh giá của bạn.");
  };

  if (mine.isPending) return <WriteBlockSkeleton />;

  if (mine.data === undefined) {
    return (
      <MineFailure error={mine.error} onRetry={() => void mine.refetch()} />
    );
  }

  const { review, canReview } = mine.data;

  return (
    <div className="flex flex-col gap-4 border-b pb-5">
      {review !== null ? (
        <MyReviewRow review={review} headingRef={pinnedFocus.ref} />
      ) : canReview ? (
        <>
          <h3 className="text-base">Viết đánh giá của bạn</h3>
          <ReviewForm state={state} mode="create" onSubmit={post} />
        </>
      ) : (
        <>
          {/* The form is gone, so what the last send said is shown here (a renter who is not
              eligible, or who already reviewed). */}
          <FailureNotice
            failure={state.failure}
            message={state.form.formState.errors.root?.server?.message}
          />
          <ReviewHint />
        </>
      )}
    </div>
  );
}

// The renter may not review yet: only a landlord who answered them in chat opens the way (AC-6).
function ReviewHint() {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border p-4">
      <p>Nhắn tin với chủ trọ và đợi họ trả lời để đánh giá.</p>
      <Button asChild variant="outline" size="lg">
        <Link href={`#${LISTINGS_ANCHOR}`}>Xem tin của chủ trọ</Link>
      </Button>
    </div>
  );
}

// `GET /review` failed. The public list still shows. A 429 shows the wait counting down, and
// "Thử lại" stays off until it ends.
function MineFailure({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  const secondsLeft = useCountdown(error);
  const limited = isApiError(error) && error.status === 429;

  return (
    <div className="flex flex-col items-start gap-3 border-b pb-5">
      {limited ? (
        <RateLimitNotice error={error} className="w-full" />
      ) : (
        <p role="alert" className="text-sm text-destructive">
          Không tải được trạng thái đánh giá của bạn.
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
    </div>
  );
}
