"use client";

import { useRef } from "react";
import type { ReviewRole } from "../access";
import { useAnnounce } from "../hooks/use-announce";
import { useLastTotal } from "../hooks/use-last-total";
import type { ReviewSubject } from "../types";
import { ReviewListArea } from "./review-list-area";
import { ReviewsZoneFrame } from "./reviews-zone-frame";
import { WriteBlock } from "./write-block";

type ReviewsZoneViewProps = {
  /** The id of the zone, which a page may link to. */
  id?: string;
  role: ReviewRole;
  /** The page of reviews, from the address. */
  page: number;
  /** Writes the page into the address (the subject picked how, in `useReviewPage`). */
  setPage: (page: number) => void;
  subject: ReviewSubject;
};

/**
 * One reviews area, drawn from a subject (spec 0014, "The adapter"): the frame, the write block and
 * the list area. A subject zone reads its own list, `mine` and writes, builds a `ReviewSubject` and
 * hands it here. This view owns what is the same for every subject: the announcement line, the
 * heading that takes focus, the page count that survives a failed page, and what a page change does
 * (focus goes to the heading without scrolling, and "Trang N" is announced).
 */
export function ReviewsZoneView({
  id,
  role,
  page,
  setPage,
  subject,
}: ReviewsZoneViewProps) {
  const {
    list,
    mine,
    actions,
    classify,
    heading,
    summary,
    guestLabel,
    hint,
    onGone,
  } = subject;
  const total = useLastTotal(list.data?.total);
  const { announcement, announce, clear } = useAnnounce();
  const headingRef = useRef<HTMLHeadingElement>(null);

  // A page change moves focus to the heading without scrolling (the person keeps their place) and
  // says which page it is (spec 0013, AC-11).
  const goToPage = (to: number) => {
    setPage(to);
    headingRef.current?.focus({ preventScroll: true });
    announce(`Trang ${to}`);
  };

  return (
    <ReviewsZoneFrame
      id={id}
      heading={heading}
      headingRef={headingRef}
      summary={summary}
      announcement={announcement}
    >
      <WriteBlock
        role={role}
        mine={mine}
        actions={actions}
        classify={classify}
        guestLabel={guestLabel}
        hint={hint}
        onGone={onGone}
        announce={announce}
        clearAnnouncement={clear}
        zoneHeading={headingRef}
      />

      <ReviewListArea
        loading={role === "loading" || list.isPending}
        list={list.data}
        error={list.error}
        busy={list.isPlaceholderData}
        page={page}
        total={total}
        onPageChange={goToPage}
        onRetry={() => void list.refetch()}
      />
    </ReviewsZoneFrame>
  );
}
