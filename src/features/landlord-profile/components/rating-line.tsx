import { StarRating } from "@/components/star-rating";
import type { LandlordProfile } from "@/lib/api/types";
import { ratingText } from "../text";

type RatingLineProps = Pick<LandlordProfile, "reviewCount" | "ratingAverage">;

/**
 * The score under the landlord's name (spec 0013, AC-20): stars and "4,3 (12 đánh giá)", or only
 * "Chưa có đánh giá" when nobody has reviewed. It never draws empty stars for a score of 0, so a
 * new landlord does not look like a bad one. It draws what it is given and never computes an
 * average: the backend does.
 */
export function RatingLine({ reviewCount, ratingAverage }: RatingLineProps) {
  const hasScore = reviewCount > 0 && ratingAverage !== null;
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {hasScore && <StarRating value={ratingAverage} />}
      <span>{ratingText(reviewCount, ratingAverage)}</span>
    </span>
  );
}
