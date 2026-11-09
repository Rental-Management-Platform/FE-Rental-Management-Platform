import { StarRating } from "@/components/star-rating";
import { ratingText } from "../text";

type RatingLineProps = {
  /** Visible reviews, a whole number from 0. */
  reviewCount: number;
  /** One decimal, `null` exactly when `reviewCount` is 0. */
  ratingAverage: number | null;
};

/**
 * A score (spec 0013, AC-20, and spec 0014, AC-3): stars and "4,3 (12 đánh giá)", or only "Chưa có
 * đánh giá" when nobody has reviewed. It never draws empty stars for a score of 0, so a new landlord
 * or a new room does not look like a bad one. It draws what it is given and never computes an
 * average: the backend does. It is used under a landlord's name and under the heading of the room
 * reviews.
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
