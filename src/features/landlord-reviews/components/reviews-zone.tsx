"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useRef } from "react";
import { ListPagination } from "@/components/list-pagination";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { landlordKeys } from "@/features/landlord-profile/api/landlord-keys";
import { useLandlordProfile } from "@/features/landlord-profile/hooks/use-landlord-profile";
import { isLandlordId } from "@/features/landlord-profile/landlord-id";
import { isApiError } from "@/lib/api/errors";
import type { Page, PublicReview } from "@/lib/api/types";
import { useSession } from "@/lib/session/auth-provider";
import { reviewRole } from "../access";
import { useAnnounce } from "../hooks/use-announce";
import { useLastTotal } from "../hooks/use-last-total";
import { useMyReview } from "../hooks/use-my-review";
import { useReviewList } from "../hooks/use-review-list";
import { useReviewPage } from "../hooks/use-review-page";
import { listView, pageCount, REVIEWS_PAGE_SIZE } from "../review-list";
import { reviewCountText } from "../text";
import {
  ListFailure,
  NoReviews,
  OnlyMyReview,
  PastLastPage,
} from "./list-states";
import { ReviewList } from "./review-list";
import { ReviewRowsSkeleton } from "./reviews-zone-skeleton";
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
  const headingId = useId();

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
    <Card
      id={REVIEWS_ANCHOR}
      role="region"
      aria-labelledby={headingId}
      className="scroll-mt-24"
    >
      <CardHeader className="border-b">
        <h2
          ref={headingRef}
          id={headingId}
          tabIndex={-1}
          className="text-base outline-hidden"
        >
          Đánh giá
        </h2>
        {/* The count is `reviewCount` of the profile, never the length of the list, and it has no
            text while the profile is not loaded. */}
        {profile.data !== undefined && (
          <p className="text-sm text-muted-foreground">
            {reviewCountText(profile.data.reviewCount)}
          </p>
        )}
      </CardHeader>
      <CardContent className="gap-5">
        {/* Always mounted, so the sentences that arrive later are read out. */}
        <span role="status" className="sr-only">
          {announcement}
        </span>

        <WriteBlock
          landlordId={landlordId}
          role={role}
          mine={mine}
          announce={announce}
          clearAnnouncement={clear}
          zoneHeading={headingRef}
        />

        {role === "loading" || list.isPending ? (
          <ReviewRowsSkeleton />
        ) : list.data === undefined ? (
          <ListFailure error={list.error} onRetry={() => void list.refetch()} />
        ) : (
          <ListArea
            list={list.data}
            busy={list.isPlaceholderData}
            onFirstPage={() => goToPage(1)}
          />
        )}

        {/* It stays whenever there is more than one page, also under an odd page and under a page
            that failed to load (then `total` is the last one that came back). */}
        {total !== null && pageCount(total) > 1 && (
          <ListPagination
            page={page}
            pageSize={REVIEWS_PAGE_SIZE}
            total={total}
            itemLabel="đánh giá"
            size="lg"
            onPageChange={goToPage}
          />
        )}
      </CardContent>
    </Card>
  );
}

// What one answer of the list draws (AC-12), decided by the pure `listView`.
function ListArea({
  list,
  busy,
  onFirstPage,
}: {
  list: Page<PublicReview>;
  busy: boolean;
  onFirstPage: () => void;
}) {
  const view = listView(list);

  switch (view.kind) {
    case "empty":
      return <NoReviews />;
    case "rows":
      return <ReviewList rows={view.rows} busy={busy} />;
    case "only-mine":
      return <OnlyMyReview />;
    case "past-end":
      return <PastLastPage onFirstPage={onFirstPage} />;
  }
}
