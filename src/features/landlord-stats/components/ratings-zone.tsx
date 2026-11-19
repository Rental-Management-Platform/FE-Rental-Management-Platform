import { useId } from "react";
import { describeChange } from "@/components/stats/describe-change";
import { StatRow } from "@/components/stats/stat-row";
import { StatsZone } from "@/components/stats/stats-zone";
import { StarRating } from "@/components/star-rating";
import type { RatingBlock, Statistics } from "@/lib/api/types";
import { formatCount, formatRating } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  LANDLORD_RATING_NOTE,
  LANDLORD_RATING_TITLE,
  NEW_REVIEWS_LABEL,
  NO_RATING_TEXT,
  RATINGS_ZONE_TITLE,
  reviewCountLine,
  ROOMS_RATING_NOTE,
  ROOMS_RATING_TITLE,
} from "../landlord-stats-text";

function RatingPanel({
  title,
  note,
  rating,
  className,
}: {
  title: string;
  note: string;
  rating: RatingBlock;
  className?: string;
}) {
  const titleId = useId();
  const { average, count, newInRange } = rating;
  return (
    <div
      role="group"
      aria-labelledby={titleId}
      className={cn("flex flex-col gap-3", className)}
    >
      <div className="flex flex-col gap-0.5">
        <h3 id={titleId} className="text-sm font-medium">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">{note}</p>
      </div>
      {average === null ? (
        <p className="text-base text-muted-foreground">{NO_RATING_TEXT}</p>
      ) : (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <StarRating value={average} />
            <span className="text-2xl font-semibold text-card-foreground tabular-nums">
              {formatRating(average)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {reviewCountLine(count)}
          </p>
        </div>
      )}
      <StatRow
        label={NEW_REVIEWS_LABEL}
        value={formatCount(newInRange.value)}
        change={describeChange(newInRange)}
      />
    </div>
  );
}

/**
 * The zone "Đánh giá" (spec 0024, AC-12): two scores side by side, each with its stars, its count
 * and the reviews that are new in the range. They are two different things (the reviews on the
 * landlord's profile, and the reviews on the landlord's listings), so they are never added or
 * averaged and each has its own panel.
 */
export function RatingsZone({ statistics }: { statistics: Statistics }) {
  const { ratings } = statistics;
  return (
    <StatsZone title={RATINGS_ZONE_TITLE}>
      <div className="grid gap-6 sm:grid-cols-2">
        <RatingPanel
          title={LANDLORD_RATING_TITLE}
          note={LANDLORD_RATING_NOTE}
          rating={ratings.landlord}
        />
        <RatingPanel
          title={ROOMS_RATING_TITLE}
          note={ROOMS_RATING_NOTE}
          rating={ratings.rooms}
          className="sm:border-l sm:pl-6"
        />
      </div>
    </StatsZone>
  );
}
