import type { LandlordProfile } from "@/lib/api/types";
import { formatCount, formatRating } from "@/lib/format";
import { SITE_NAME } from "@/lib/site";

/** What a landlord is called when the account has no name. */
export const UNNAMED_LANDLORD = "Chủ trọ";

export const NOT_FOUND_TITLE = "Không tìm thấy chủ trọ";
export const FAILED_TITLE = "Không mở được hồ sơ chủ trọ";

const hasName = (name: string | null): name is string =>
  name !== null && name.trim() !== "";

/** The name to show: the account name, or "Chủ trọ" when there is none. */
export const landlordName = (name: string | null) =>
  hasName(name) ? name : UNNAMED_LANDLORD;

/** The title of the tab: "Chủ trọ Trần Minh Khoa", or only "Chủ trọ" when there is no name. */
export const profileTitle = (name: string | null) =>
  hasName(name) ? `${UNNAMED_LANDLORD} ${name}` : UNNAMED_LANDLORD;

/**
 * The description for search results and share cards. It names the landlord and says how many
 * listings and followers there are, and it leaves the score out on purpose (spec 0013: no rating
 * data for search engines).
 */
export const profileDescription = ({
  name,
  publicListingCount,
  followerCount,
}: Pick<LandlordProfile, "name" | "publicListingCount" | "followerCount">) =>
  `Hồ sơ chủ trọ${hasName(name) ? ` ${name}` : ""} trên ${SITE_NAME}: ` +
  `${formatCount(publicListingCount)} tin đang hiện, ` +
  `${formatCount(followerCount)} người theo dõi.`;

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
