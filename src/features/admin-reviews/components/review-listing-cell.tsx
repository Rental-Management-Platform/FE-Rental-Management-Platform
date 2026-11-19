import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import type { AdminListingReview } from "@/lib/api/types";
import { FOCUS_RING } from "@/lib/focus-ring";
import { listingPath } from "@/lib/listing-path";
import { cn } from "@/lib/utils";
import {
  ONLY_LISTING_LINK,
  onlyListingLabel,
  openListingTitle,
} from "../admin-reviews-text";

/**
 * The listing a room review is about: its title opens the public detail page in a new tab, by the
 * `code` of the listing (the row has no slug, and the address `/<code>` is a valid listing address).
 * The row does not say whether the listing still shows. A hidden or deleted listing has no public
 * page and the review stays in this list, so the link may not open: the line under the page title
 * says so. Under the title a small link sets the filter to this listing, because the title itself goes
 * to the public page. `filterHref` is `null` when the list is already filtered to this listing, so
 * the link would only repeat the page.
 */
export function ReviewListingCell({
  listing,
  filterHref,
}: {
  listing: AdminListingReview["listing"];
  filterHref: string | null;
}) {
  return (
    <div className="flex min-w-0 flex-col items-start gap-1">
      <Link
        href={listingPath(null, listing.code)}
        target="_blank"
        rel="noreferrer"
        aria-label={openListingTitle(listing.title)}
        title={listing.title}
        className={cn(
          FOCUS_RING,
          "inline-flex max-w-full min-w-0 items-start gap-1 rounded-sm font-medium hover:underline",
        )}
      >
        <span className="line-clamp-2 break-words whitespace-normal">
          {listing.title}
        </span>
        <ExternalLinkIcon
          aria-hidden="true"
          className="mt-1 size-3.5 shrink-0 text-muted-foreground"
        />
      </Link>
      {filterHref !== null && (
        <Link
          href={filterHref}
          scroll={false}
          aria-label={onlyListingLabel(listing.title)}
          className={cn(
            FOCUS_RING,
            "rounded-sm text-sm text-muted-foreground hover:text-foreground hover:underline",
          )}
        >
          {ONLY_LISTING_LINK}
        </Link>
      )}
    </div>
  );
}
