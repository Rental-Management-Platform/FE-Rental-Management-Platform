import { formatCount, formatRating } from "@/lib/format";

/** What a landlord is called when the account has no name. */
export const UNNAMED_LANDLORD = "Chủ trọ";

export const NOT_FOUND_TITLE = "Không tìm thấy chủ trọ";
export const FAILED_TITLE = "Không mở được hồ sơ chủ trọ";

/** The name to show: the account name, or "Chủ trọ" when there is none. */
export const landlordName = (name: string | null) =>
  name === null || name.trim() === "" ? UNNAMED_LANDLORD : name;

/**
 * The line next to the stars (spec 0013, AC-20): "4,3 (12 đánh giá)", or "Chưa có đánh giá" when
 * there is no review. It never shows a score of 0, because the contract gives `null` for it.
 */
export function ratingText(
  reviewCount: number,
  ratingAverage: number | null,
): string {
  if (reviewCount <= 0 || ratingAverage === null) return "Chưa có đánh giá";
  return `${formatRating(ratingAverage)} (${formatCount(reviewCount)} đánh giá)`;
}
