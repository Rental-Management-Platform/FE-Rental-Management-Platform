import { reviewCountText } from "../text";

/**
 * The line under the heading of the landlord reviews area (spec 0013, AC-1): "12 đánh giá", or
 * "Chưa có đánh giá". It is the `reviewCount` of the profile, never the length of the list.
 */
export function CountLine({ count }: { count: number }) {
  return (
    <p className="text-sm text-muted-foreground">{reviewCountText(count)}</p>
  );
}
