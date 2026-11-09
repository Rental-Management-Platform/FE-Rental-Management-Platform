"use client";

import Image from "next/image";
import { useState } from "react";
import { ImagePlaceholder } from "@/components/states/image-placeholder";
import { mediaUrl } from "@/lib/media";

/**
 * The small cover of a listing, in the inbox and in the head of a conversation. The path comes
 * from the API (`coverImageUrl`, always `null` for a listing that is no longer public). A `null`,
 * a path that is not a public photo path, and a photo that fails to load all show the placeholder,
 * never a broken image. The box fills the width of its parent, so the parent sets the size, and
 * `sizes` tells the browser that width so it does not fetch a large file.
 */
export function ListingCover({
  path,
  sizes,
}: {
  path: string | null;
  sizes: string;
}) {
  const src = path === null ? null : mediaUrl(path);
  // The address that failed, not a flag, so a new address gets a fresh try.
  const [failed, setFailed] = useState<string | null>(null);

  if (src === null || failed === src) {
    return <ImagePlaceholder ratio="4:3" className="[&_svg]:size-6" />;
  }
  return (
    <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg bg-muted">
      <Image
        src={src}
        alt=""
        fill
        sizes={sizes}
        onError={() => setFailed(src)}
        className="object-cover"
      />
    </div>
  );
}
