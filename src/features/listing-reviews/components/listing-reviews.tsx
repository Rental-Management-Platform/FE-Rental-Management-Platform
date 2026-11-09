"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { chatBasePath } from "@/features/chat/access";
import { byListingQuery } from "@/features/chat/api/chat-queries";
import { mayChatAbout, toChatEntry } from "@/features/chat/chat-entry";
import { reviewRole } from "@/features/reviews/access";
import { RatingLine } from "@/features/reviews/components/rating-line";
import { ReviewsZoneView } from "@/features/reviews/components/reviews-zone-view";
import { useReviewPage } from "@/features/reviews/hooks/use-review-page";
import type { ReviewSubject } from "@/features/reviews/types";
import { isApiError } from "@/lib/api/errors";
import { isUuid } from "@/lib/is-uuid";
import { useApi, useSession } from "@/lib/session/auth-provider";
import { useListingSummary } from "../hooks/use-listing-summary";
import { useMyListingReview } from "../hooks/use-my-review";
import { useListingReviewActions } from "../hooks/use-review-actions";
import { useListingReviewList } from "../hooks/use-review-list";
import { classifyListingReview } from "../review-errors";
import {
  LISTING_GUEST_LABEL,
  LISTING_REVIEWS_ANCHOR,
  LISTING_REVIEWS_HEADING,
} from "../texts";
import { ListingHint } from "./listing-hint";

type ListingReviewsProps = {
  /** The UUID `id` of the listing detail: the review calls take it, never the slug or the code. */
  id: string;
  /** The 8 character code, for the summary read (`GET /listings/:code`). */
  code: string;
  /** For the hint's message button (spec 0014, AC-9). */
  title: string;
  landlord: { id: string; name: string | null };
  /** The two numbers the server read: the first values of the score line. */
  reviewCount: number;
  ratingAverage: number | null;
};

// The listing is hidden or deleted after the page opened: any of the reads says so with this code.
const isListingGone = (error: unknown) =>
  isApiError(error) && error.code === "LISTING_NOT_FOUND";

/**
 * The "Đánh giá phòng" block at the bottom of the listing page (spec 0014, AC-1). It reads in the
 * browser only: the server HTML holds the skeleton with the heading and the score, and no review
 * text. It reads `reviewPage` from the address, so the page keeps it inside a `<Suspense>`
 * boundary. An `id` that is not a UUID makes no request and draws nothing.
 */
export function ListingReviews(props: ListingReviewsProps) {
  if (!isUuid(props.id)) return null;
  return <Block {...props} />;
}

function Block({
  id,
  code,
  title,
  landlord,
  reviewCount,
  ratingAverage,
}: ListingReviewsProps) {
  const api = useApi();
  const router = useRouter();
  const session = useSession();
  const role = reviewRole(session);
  const summary = useListingSummary(id, code, { reviewCount, ratingAverage });
  // The page of reviews changes the address with the native History API, so the server renders
  // nothing for it (AC-14).
  const { page, setPage } = useReviewPage("history");
  const list = useListingReviewList(id, page);
  const mine = useMyListingReview(id, role === "writer");
  const actions = useListingReviewActions(id);

  // The chat lookup is the one the contact card runs (same key), so it costs no second request.
  // Only someone who may chat about this listing runs it, never while the session is `loading`.
  const lookup = useQuery({
    ...byListingQuery(api, id),
    enabled: mayChatAbout(session, landlord.id),
  });
  const entry = toChatEntry(session, { landlord }, lookup);
  const landlordName = landlord.name ?? "Chủ trọ";

  // The listing is gone (AC-16). The server read of the page then answers `LISTING_NOT_FOUND` and
  // the page becomes the not found page, so the block only has to ask the server once. The flag is
  // a ref, so it survives the StrictMode double effect and never asks twice for one mount.
  const refreshed = useRef(false);
  const refreshPage = useCallback(() => {
    if (refreshed.current) return;
    refreshed.current = true;
    router.refresh();
  }, [router]);

  // A read said the listing is gone: draw nothing and ask the server. A write that hits it first
  // keeps the block on screen with "Tin này không còn." until the page changes (`onGone`).
  const readGone =
    isListingGone(list.error) ||
    isListingGone(mine.error) ||
    isListingGone(summary.error);
  useEffect(() => {
    if (readGone) refreshPage();
  }, [readGone, refreshPage]);
  if (readGone) return null;

  const subject: ReviewSubject = {
    list,
    mine,
    actions,
    classify: classifyListingReview,
    heading: LISTING_REVIEWS_HEADING,
    // The numbers of the summary read: never the length of the list, never reduced for my own.
    summary: (
      <p className="text-sm text-muted-foreground">
        <RatingLine
          reviewCount={summary.data.reviewCount}
          ratingAverage={summary.data.ratingAverage}
        />
      </p>
    ),
    guestLabel: LISTING_GUEST_LABEL,
    // A viewer who cannot chat about this listing gets no hint at all (AC-9). A guest has the
    // sign in row, and the hint is only ever drawn for a `writer`.
    hint:
      entry.kind === "none" || entry.kind === "guest" ? null : (
        <ListingHint
          entry={entry}
          listing={{ id, title }}
          landlordName={landlordName}
          basePath={
            session.status === "user"
              ? chatBasePath(session.user.accountType)
              : null
          }
        />
      ),
    onGone: refreshPage,
  };

  return (
    <ReviewsZoneView
      id={LISTING_REVIEWS_ANCHOR}
      role={role}
      page={page}
      setPage={setPage}
      subject={subject}
    />
  );
}
