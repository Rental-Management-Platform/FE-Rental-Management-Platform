import type { ListingImage } from "@/lib/api/types";
import { mediaUrl } from "@/lib/media";

/**
 * The image of a share card (spec 0010, AC-15): the photo with the lowest `position`, as a path
 * of our own image optimizer, which `metadataBase` turns into an absolute address. It asks for
 * 1200 px wide at quality 75, both of which the optimizer allows by default. Or `null` when the
 * listing has no photo, or the photo path is not a public photo path: the card then has text
 * only. No width or height is written, because the size of the original is not known.
 */
export function shareImagePath(images: readonly ListingImage[]): string | null {
  const first = [...images].sort((a, b) => a.position - b.position)[0];
  if (first === undefined) return null;

  const address = mediaUrl(first.url);
  if (address === null) return null;

  return `/_next/image?${new URLSearchParams({ url: address, w: "1200", q: "75" })}`;
}
