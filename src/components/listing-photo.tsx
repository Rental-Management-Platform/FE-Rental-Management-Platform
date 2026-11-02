"use client";

import Image from "next/image";
import { useState } from "react";
import { ImagePlaceholder } from "@/components/states/image-placeholder";

// The width of the photo in the three column grid of the list page (page padding 16 px, 24 px
// from md, content at most 1152 px, gap 16 px): one column below sm, two from sm, three from lg.
// Another layout (the detail gallery, #9) passes its own `sizes`.
export const LISTING_GRID_SIZES =
  "(min-width: 1200px) 357px, (min-width: 1024px) calc((100vw - 80px) / 3), (min-width: 768px) calc((100vw - 64px) / 2), (min-width: 640px) calc((100vw - 48px) / 2), calc(100vw - 32px)";

type ListingPhotoProps = {
  /** The address already made by `mediaUrl(coverImageUrl)`. `null` shows the placeholder. */
  src: string | null;
  /** The first photo of a page: loads at once and with high priority (it is the LCP image). */
  eager?: boolean;
  sizes?: string;
};

/**
 * The photo box of a listing (spec 0009, AC-9). A 16:9 box that holds one of three things: the
 * photo, the placeholder when there is no photo address, or nothing at all when the photo fails
 * to load. A failed photo hides the box and shows no error and no broken image icon. The
 * alternative text is empty because the title beside it already names the listing.
 */
export function ListingPhoto({
  src,
  eager = false,
  sizes = LISTING_GRID_SIZES,
}: ListingPhotoProps) {
  // The address that failed, not a flag, so a new address gets a fresh try.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (src === null) {
    return <ImagePlaceholder ratio="16:9" className="rounded-none" />;
  }
  if (failedSrc === src) return null;

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-muted">
      <Image
        src={src}
        alt=""
        fill
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        onError={() => setFailedSrc(src)}
        className="object-cover"
      />
    </div>
  );
}
