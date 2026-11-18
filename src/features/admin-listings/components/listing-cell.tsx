import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import type { ModerationListing } from "@/lib/api/types";
import { FOCUS_RING } from "@/lib/focus-ring";
import { listingPath } from "@/lib/listing-path";
import { cn } from "@/lib/utils";
import { openListingName } from "../admin-listings-text";

/**
 * Which listing a row is: the title and under it the full address. A listing that is `visible` has
 * a public page, so its title opens it in a new tab, which is how an admin reads the photos and the
 * text before deciding. A hidden listing has none (the public page answers 404 to it), so its title
 * is plain text. The title and the address carry the full text in `title` when a long one is cut.
 */
export function ListingCell({
  listing,
}: {
  listing: Pick<
    ModerationListing,
    "title" | "slug" | "code" | "fullAddress" | "status"
  >;
}) {
  return (
    <div className="flex min-w-0 flex-col">
      {listing.status === "visible" ? (
        <Link
          href={listingPath(listing.slug, listing.code)}
          target="_blank"
          rel="noreferrer"
          aria-label={openListingName(listing.title)}
          title={listing.title}
          className={cn(
            FOCUS_RING,
            "inline-flex min-w-0 items-center gap-1 rounded-sm font-medium hover:underline",
          )}
        >
          <span className="truncate">{listing.title}</span>
          <ExternalLinkIcon
            aria-hidden="true"
            className="size-3.5 shrink-0 text-muted-foreground"
          />
        </Link>
      ) : (
        <span className="truncate font-medium" title={listing.title}>
          {listing.title}
        </span>
      )}
      <span
        className="truncate text-sm text-muted-foreground"
        title={listing.fullAddress}
      >
        {listing.fullAddress}
      </span>
    </div>
  );
}
