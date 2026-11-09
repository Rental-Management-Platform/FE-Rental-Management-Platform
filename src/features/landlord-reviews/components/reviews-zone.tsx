"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { landlordKeys } from "@/features/landlord-profile/api/landlord-keys";
import { useLandlordProfile } from "@/features/landlord-profile/hooks/use-landlord-profile";
import { isLandlordId } from "@/features/landlord-profile/landlord-id";
import { reviewRole } from "@/features/reviews/access";
import { CountLine } from "@/features/reviews/components/count-line";
import { ReviewsZoneView } from "@/features/reviews/components/reviews-zone-view";
import { useReviewPage } from "@/features/reviews/hooks/use-review-page";
import type { ReviewSubject } from "@/features/reviews/types";
import { isApiError } from "@/lib/api/errors";
import { useSession } from "@/lib/session/auth-provider";
import { useMyReview } from "../hooks/use-my-review";
import { useReviewActions } from "../hooks/use-review-actions";
import { useReviewList } from "../hooks/use-review-list";
import { classifyLandlordReview } from "../review-errors";
import { LandlordHint } from "./landlord-hint";

/** The id of the zone, which the profile page may link to. */
export const REVIEWS_ANCHOR = "danh-gia";

// The landlord is locked or deleted after the page opened: either read says so with this code.
const isLandlordGone = (error: unknown) =>
  isApiError(error) && error.code === "LANDLORD_NOT_FOUND";

/**
 * The "Đánh giá" zone of the landlord profile (spec 0013, AC-1), now a thin subject on the shared
 * reviews view (spec 0014, AC-22). It reads in the browser only: the server HTML holds the skeleton
 * and no review text. It reads `reviewPage` from the address, so the profile page keeps it inside a
 * `<Suspense>` boundary. A `landlordId` that is not a UUID makes no request and draws nothing.
 */
export function ReviewsZone({ landlordId }: { landlordId: string }) {
  if (!isLandlordId(landlordId)) return null;
  return <Zone landlordId={landlordId} />;
}

function Zone({ landlordId }: { landlordId: string }) {
  const queryClient = useQueryClient();
  const session = useSession();
  const role = reviewRole(session);
  const profile = useLandlordProfile(landlordId);
  const { page, setPage } = useReviewPage();
  const list = useReviewList(landlordId, page);
  const mine = useMyReview(landlordId, role === "writer");
  const actions = useReviewActions(landlordId);

  // The profile is read again so the page says "không tìm thấy chủ trọ" in its own words (AC-13).
  const readProfileAgain = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: landlordKeys.profile(landlordId),
    });
  }, [landlordId, queryClient]);

  // A landlord that is gone takes the whole zone with it.
  const gone = isLandlordGone(list.error) || isLandlordGone(mine.error);
  useEffect(() => {
    if (gone) readProfileAgain();
  }, [gone, readProfileAgain]);
  if (gone) return null;

  const subject: ReviewSubject = {
    list,
    mine,
    actions,
    classify: classifyLandlordReview,
    heading: "Đánh giá",
    // No count while the profile is not loaded.
    summary:
      profile.data === undefined ? null : (
        <CountLine count={profile.data.reviewCount} />
      ),
    guestLabel: "Đăng nhập để đánh giá chủ trọ",
    hint: <LandlordHint />,
    onGone: readProfileAgain,
  };

  return (
    <ReviewsZoneView
      id={REVIEWS_ANCHOR}
      role={role}
      page={page}
      setPage={setPage}
      subject={subject}
    />
  );
}
