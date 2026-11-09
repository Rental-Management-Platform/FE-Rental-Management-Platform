"use client";

import { useId, useRef } from "react";
import { ErrorState } from "@/components/states/error-state";
import { EmptyState } from "@/components/states/empty-state";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { isLandlordId } from "@/features/landlord-profile/landlord-id";
import { useLandlordProfile } from "@/features/landlord-profile/hooks/use-landlord-profile";
import { MessageSquareTextIcon } from "lucide-react";
import type { Page, PublicReview } from "@/lib/api/types";
import { useSession } from "@/lib/session/auth-provider";
import { reviewRole } from "../access";
import { useAnnounce } from "../hooks/use-announce";
import { useMyReview } from "../hooks/use-my-review";
import { useReviewList } from "../hooks/use-review-list";
import { listView } from "../review-list";
import { reviewCountText } from "../text";
import { ReviewList } from "./review-list";
import { ReviewRowsSkeleton } from "./reviews-zone-skeleton";
import { WriteBlock } from "./write-block";

/** The id of the zone, which the profile page may link to. */
export const REVIEWS_ANCHOR = "danh-gia";

/**
 * The "Đánh giá" zone of the landlord profile (spec 0013, AC-1). It reads in the browser only: the
 * server HTML holds the skeleton and no review text. A `landlordId` that is not a UUID makes no
 * request and draws nothing.
 */
export function ReviewsZone({ landlordId }: { landlordId: string }) {
  if (!isLandlordId(landlordId)) return null;
  return <Zone landlordId={landlordId} />;
}

function Zone({ landlordId }: { landlordId: string }) {
  const session = useSession();
  const role = reviewRole(session);
  const profile = useLandlordProfile(landlordId);
  const list = useReviewList(landlordId, 1);
  const mine = useMyReview(landlordId, role === "writer");
  const { announcement, announce, clear } = useAnnounce();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const headingId = useId();

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
        />

        {role === "loading" || list.isPending ? (
          <ReviewRowsSkeleton />
        ) : list.data === undefined ? (
          <ErrorState
            error={list.error}
            title="Không tải được đánh giá"
            onRetry={() => void list.refetch()}
          />
        ) : (
          <ListArea list={list.data} busy={list.isPlaceholderData} />
        )}
      </CardContent>
    </Card>
  );
}

function ListArea({ list, busy }: { list: Page<PublicReview>; busy: boolean }) {
  const view = listView(list);

  switch (view.kind) {
    case "empty":
      return (
        <EmptyState
          icon={MessageSquareTextIcon}
          title="Chưa có đánh giá nào."
        />
      );
    case "rows":
      return <ReviewList rows={view.rows} busy={busy} />;
    case "only-mine":
      return (
        <EmptyState
          icon={MessageSquareTextIcon}
          title="Trang này không có đánh giá nào khác."
        />
      );
    case "past-end":
      return (
        <EmptyState
          icon={MessageSquareTextIcon}
          title="Trang này không có đánh giá."
        />
      );
  }
}
