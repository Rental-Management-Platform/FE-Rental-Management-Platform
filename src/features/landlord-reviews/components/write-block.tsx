"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useRef, useState, type RefObject } from "react";
import { FailureNotice } from "@/components/form/failure-notice";
import { RateLimitNotice } from "@/components/states/rate-limit-notice";
import { Button } from "@/components/ui/button";
import { LISTINGS_ANCHOR } from "@/features/landlord-profile/landlord-id";
import { isAbortError } from "@/lib/api/abort";
import { describeError, isApiError } from "@/lib/api/errors";
import type { MyReviewState } from "@/lib/api/types";
import { authHref } from "@/lib/next-path";
import { useSession } from "@/lib/session/auth-provider";
import { can } from "@/lib/session/can";
import { useCountdown } from "@/lib/use-countdown";
import { useReturnFocus } from "@/lib/use-return-focus";
import type { ReviewRole } from "../access";
import { useFocusRequest } from "../hooks/use-focus-request";
import { useReviewActions } from "../hooks/use-review-actions";
import { useReviewForm } from "../hooks/use-review-form";
import {
  EMPTY_REVIEW,
  toCreateBody,
  toPatchBody,
  type ReviewValues,
} from "../schemas/review-schema";
import {
  ALREADY_DELETED_MESSAGE,
  classifyReviewError,
  type ReviewAction,
} from "../review-errors";
import { DeleteReviewDialog } from "./delete-review-dialog";
import { MyReviewEditor, MyReviewRow } from "./my-review-row";
import { ReviewForm } from "./review-form";
import { WriteBlockSkeleton } from "./reviews-zone-skeleton";

type WriteBlockProps = {
  landlordId: string;
  role: ReviewRole;
  /** `GET /review`, read by the zone (it runs only for a `writer`). */
  mine: UseQueryResult<MyReviewState>;
  announce: (text: string) => void;
  clearAnnouncement: () => void;
  /** The heading of the zone: where focus goes when the thing that had it is gone. */
  zoneHeading: RefObject<HTMLElement | null>;
};

/**
 * The block under the heading that lets the viewer write (spec 0013, AC-6). A guest sees one row
 * that leads to sign in. A `writer` sees, first match wins: a skeleton while `GET /review` loads,
 * the pinned review, the form, the hint, or a failure notice. A `reader` (a landlord, an admin) and
 * a viewer whose session is still loading see nothing. The public list shows under it in every case.
 */
export function WriteBlock({ role, ...rest }: WriteBlockProps) {
  if (role === "guest") return <GuestRow />;
  if (role === "writer") return <WriterBlock {...rest} />;
  return null;
}

// "Đăng nhập để đánh giá chủ trọ": the way back is this page, with its query (the `reviewPage`).
function GuestRow() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  return (
    <GuestRowView
      href={authHref(
        "/login",
        search === "" ? pathname : `${pathname}?${search}`,
      )}
    />
  );
}

/** The row of a guest. It only draws, so `/dev/ui` can show it with no router. */
export function GuestRowView({ href }: { href: string }) {
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
// clears it (AC-7). It owns the delete dialog too, because the row the dialog opens from is gone
// once the delete works, and the dialog must still be there to close and to give focus away.
function WriterBlock({
  landlordId,
  mine,
  announce,
  clearAnnouncement,
  zoneHeading,
}: Omit<WriteBlockProps, "role">) {
  const session = useSession();
  const actions = useReviewActions(landlordId);
  const state = useReviewForm(EMPTY_REVIEW, "create");
  const pinnedFocus = useFocusRequest<HTMLHeadingElement>();
  const editFocus = useFocusRequest<HTMLButtonElement>();
  const returnFocus = useReturnFocus(() => zoneHeading.current);
  // The id of the review being edited. Keyed on the review, so an editor left open for a review
  // that was deleted somewhere else never turns up on the next one.
  const [editingId, setEditingId] = useState<string | null>(null);
  // What the last failed write said, for a failure that makes the part that sent it give way: the
  // form of a renter who is not eligible or had already reviewed, or the editor of a review that
  // an admin hid or that was deleted elsewhere. The form and the editor show the message themselves
  // while they are open, and this one is for after they are gone (AC-14). A failure that leaves
  // them open (a field message, a 429, the network) never comes here, so an old message cannot
  // turn up next to a state it has nothing to do with.
  const [notice, setNotice] = useState<{
    from: ReviewAction;
    message: string;
  } | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteFailure, setDeleteFailure] = useState<unknown>(null);
  const deleteSecondsLeft = useCountdown(deleteFailure);
  // Set in the handler itself, so two quick presses cannot both send.
  const deleting = useRef(false);

  if (mine.isPending) return <WriteBlockSkeleton />;

  if (mine.data === undefined) {
    return (
      <MineFailure error={mine.error} onRetry={() => void mine.refetch()} />
    );
  }

  const { review, canReview } = mine.data;
  const canCreate = can(session, "review:create");
  const canUpdate = can(session, "review:update");
  const canDelete = can(session, "review:delete");

  // The order of AC-8: the answer is in the `mine` key and the lists and the profile are asked to
  // read again (both inside `create`), then the form is cleared, focus goes to the pinned row, and
  // the sentence is announced. A failure keeps the draft and drops the focus request.
  const post = async (values: ReviewValues) => {
    clearAnnouncement();
    setNotice(null);
    pinnedFocus.request();
    try {
      await actions.create(toCreateBody(values));
    } catch (error) {
      pinnedFocus.cancel();
      rememberNotice(error, "create");
      throw error;
    }
    state.form.reset(EMPTY_REVIEW);
    announce("Đã đăng đánh giá của bạn.");
  };

  const rememberNotice = (error: unknown, action: ReviewAction) => {
    const { message, reload } = classifyReviewError(error, action);
    if (reload.mine) {
      setNotice({
        from: action,
        message: message ?? describeError(error).message,
      });
    }
  };

  const closeEditor = () => {
    // "Sửa" is not on screen while the editor is open, so focus goes to it once it is back.
    editFocus.request();
    setEditingId(null);
  };

  // AC-9. Only the fields that changed go out. When nothing changed no request is made and the
  // editor just closes, because the backend moves `updatedAt` even for an identical value.
  const save = async (values: ReviewValues) => {
    if (review === null) return;
    const body = toPatchBody(values, review);
    if (body === null) {
      closeEditor();
      return;
    }
    clearAnnouncement();
    setNotice(null);
    try {
      await actions.update(body);
    } catch (error) {
      rememberNotice(error, "update");
      throw error;
    }
    closeEditor();
    announce("Đã lưu thay đổi.");
  };

  const openDelete = () => {
    returnFocus.remember();
    setDeleteFailure(null);
    setDeleteOpen(true);
  };

  // AC-10. `remove` settles after the read of `mine` that follows the delete, so the dialog stays
  // open until the card is replaced by what is true now. It closes here, and its close handler
  // gives focus to the heading of the zone (the "Xóa" button it opened from is gone).
  const confirmDelete = async () => {
    if (deleting.current) return;
    deleting.current = true;
    clearAnnouncement();
    setDeleteFailure(null);
    try {
      const outcome = await actions.remove();
      // A notice left from an earlier failed write is about a review that no longer exists.
      state.clearFailure();
      setNotice(null);
      setDeleteOpen(false);
      announce(
        outcome === "already-gone"
          ? ALREADY_DELETED_MESSAGE
          : "Đã xóa đánh giá.",
      );
    } catch (error) {
      // The session changed under the request: there is nothing to show.
      if (!isAbortError(error)) setDeleteFailure(error);
    } finally {
      deleting.current = false;
    }
  };

  const editing =
    review !== null &&
    editingId === review.id &&
    review.status === "visible" &&
    canUpdate;

  const content =
    review !== null ? (
      editing ? (
        <MyReviewEditor review={review} onSave={save} onCancel={closeEditor} />
      ) : (
        <MyReviewRow
          review={review}
          headingRef={pinnedFocus.ref}
          editRef={editFocus.ref}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onEdit={() => {
            clearAnnouncement();
            setNotice(null);
            setEditingId(review.id);
          }}
          onDelete={openDelete}
        />
      )
    ) : canReview ? (
      // A renter without `review:create` has nothing to write with: no form, and no hint either,
      // because the hint would send them to chat for something they cannot do.
      canCreate ? (
        <>
          <h3 className="text-base">Viết đánh giá của bạn</h3>
          <ReviewForm state={state} mode="create" onSubmit={post} />
        </>
      ) : null
    ) : (
      <ReviewHint />
    );

  // The form and the editor show their own failure while they are open, so a notice from one of
  // them is only drawn here once that one is gone. The failure of an edit is still shown when the
  // form of a new review has taken the row's place (the review was deleted elsewhere). It stays
  // until the next send, edit or delete.
  const formShown = review === null && canReview && canCreate;
  const noticeShown =
    notice !== null && (notice.from === "create" ? !formShown : !editing);

  return (
    <>
      {content !== null && (
        <div className="flex flex-col gap-4 border-b pb-5">
          {noticeShown && (
            <FailureNotice failure={null} message={notice.message} />
          )}
          {content}
        </div>
      )}
      <DeleteReviewDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        isDeleting={actions.removing}
        failure={deleteFailure}
        secondsLeft={deleteSecondsLeft}
        onConfirm={() => void confirmDelete()}
        onCloseAutoFocus={returnFocus.onCloseAutoFocus}
      />
    </>
  );
}

/**
 * The renter may not review yet: only a landlord who answered them in chat opens the way (AC-6).
 * It lives in the write block's border row, so it has none of its own.
 */
export function ReviewHint() {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border p-4">
      <p>Nhắn tin với chủ trọ và đợi họ trả lời để đánh giá.</p>
      <Button asChild variant="outline" size="lg">
        <Link href={`#${LISTINGS_ANCHOR}`}>Xem tin của chủ trọ</Link>
      </Button>
    </div>
  );
}

/**
 * `GET /review` failed. The public list still shows. A 429 shows the wait counting down, and
 * "Thử lại" stays off until it ends.
 */
export function MineFailure({
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
