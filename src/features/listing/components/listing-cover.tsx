"use client";

import Image from "next/image";
import { useState } from "react";
import { ImagePlaceholder } from "@/components/states/image-placeholder";
import type { OwnerListingSummary } from "@/lib/api/types";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

// The width of the cover in a row, so the image is not fetched at a larger size than it is shown.
const COVER_SIZES = "96px";

/**
 * The small cover of a row (spec 0019, AC-10). The photo is asked for only when the listing is
 * public: the backend answers 404 for the photo of a listing guests cannot see, and a page of ten
 * rows would draw ten broken requests. Every other case (hidden, no photo, a path that is not a
 * public photo path, a photo that fails to load) shows the placeholder, with no error and no
 * broken image icon. The box is decorative: the title beside it already names the listing.
 */
export function ListingCover({
  listing,
  className,
}: {
  listing: Pick<OwnerListingSummary, "isPublic" | "coverImageUrl">;
  /** The width, such as `w-16`. */
  className?: string;
}) {
  // The address that failed, not a flag, so a new address gets a fresh try.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src =
    listing.isPublic && listing.coverImageUrl !== null
      ? mediaUrl(listing.coverImageUrl)
      : null;

  return (
    <div aria-hidden="true" className={cn("shrink-0", className)}>
      {src === null || failedSrc === src ? (
        <ImagePlaceholder ratio="4:3" className="rounded-md [&_svg]:size-5" />
      ) : (
        <div className="relative aspect-4/3 w-full overflow-hidden rounded-md bg-muted">
          <Image
            src={src}
            alt=""
            fill
            sizes={COVER_SIZES}
            onError={() => setFailedSrc(src)}
            className="object-cover"
          />
        </div>
      )}
    </div>
  );
}
