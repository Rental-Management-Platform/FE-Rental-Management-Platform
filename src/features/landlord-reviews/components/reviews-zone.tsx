"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { landlordKeys } from "@/features/landlord-profile/api/landlord-keys";
import { useLandlordProfile } from "@/features/landlord-profile/hooks/use-landlord-profile";
import { isLandlordId } from "@/features/landlord-profile/landlord-id";
import { isApiError } from "@/lib/api/errors";
import { useSession } from "@/lib/session/auth-provider";
import { reviewRole } from "../access";
import { useAnnounce } from "../hooks/use-announce";
import { useLastTotal } from "../hooks/use-last-total";
import { useMyReview } from "../hooks/use-my-review";
import { useReviewList } from "../hooks/use-review-list";
import { useReviewPage } from "../hooks/use-review-page";
import { reviewCountText } from "../text";
import { ReviewListArea } from "./review-list-area";
import { ReviewsZoneFrame } from "./reviews-zone-frame";
import { WriteBlock } from "./write-block";

/** The id of the zone, which the profile page may link to. */
export const REVIEWS_ANCHOR = "danh-gia";

// The landlord is locked or deleted after the page opened: either read says so with this code.
const isLandlordGone = (error: unknown) =>
  isApiError(error) && error.code === "LANDLORD_NOT_FOUND";

/**
 * The "Đánh giá" zone of the landlord profile (spec 0013, AC-1). It reads in the browser only: the
 * server HTML holds the skeleton and no review text. It reads `reviewPage` from the address, so
 * the profile page keeps it inside a `<Suspense>` boundary. A `landlordId` that is not a UUID
 * makes no request and draws nothing.
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
  const total = useLastTotal(list.data?.total);
  const { announcement, announce, clear } = useAnnounce();
  const headingRef = useRef<HTMLHeadingElement>(null);

  // A landlord that is gone takes the whole zone with it, and the profile is read again so the page
  // says "không tìm thấy chủ trọ" in its own words (AC-13).
  const gone = isLandlordGone(list.error) || isLandlordGone(mine.error);
  useEffect(() => {
    if (gone) {
      void queryClient.invalidateQueries({
        queryKey: landlordKeys.profile(landlordId),
      });
    }
  }, [gone, landlordId, queryClient]);
  if (gone) return null;

  // A page change moves focus to the heading without scrolling (the person keeps their place) and
  // says which page it is (AC-11).
  const goToPage = (to: number) => {
    setPage(to);
    headingRef.current?.focus({ preventScroll: true });
    announce(`Trang ${to}`);
  };

  return (
    <ReviewsZoneFrame
      id={REVIEWS_ANCHOR}
      headingRef={headingRef}
      // No count while the profile is not loaded.
      countText={
        profile.data === undefined
          ? null
          : reviewCountText(profile.data.reviewCount)
      }
      announcement={announcement}
    >
      <WriteBlock
        landlordId={landlordId}
        role={role}
        mine={mine}
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
