import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { ConversationItem } from "@/lib/api/types";
import { FOCUS_RING } from "@/lib/focus-ring";
import { formatMoney } from "@/lib/format";
import { listingPath } from "@/lib/listing-path";
import { cn } from "@/lib/utils";
import { ListingCover } from "./listing-cover";

interface ConversationListingCardProps {
  listing: ConversationItem["listing"];
  /** The name of the other person. */
  otherName: string;
}

/**
 * The small card of the listing at the top of a conversation (spec 0012, AC-9): the cover, the
 * title, the price and the other person.
 *
 * A listing that is public is a link to its page. One that is not (hidden, or its landlord is
 * locked) has no link, because the page would answer "not found", and says so with a label. The
 * conversation still works: nobody is stopped from writing because of this.
 */
export function ConversationListingCard({
  listing,
  otherName,
}: ConversationListingCardProps) {
  const content = (
    <>
      {/* Decorative: the title beside it already names the listing. */}
      <div aria-hidden="true" className="w-16 shrink-0">
        <ListingCover path={listing.coverImageUrl} sizes="64px" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate font-medium">{listing.title}</p>
        <p className="truncate text-sm text-muted-foreground">
          {formatMoney(listing.price)}
          <span aria-hidden="true"> · </span>
          <span className="sr-only">, </span>
          {otherName}
        </p>
        {/* Under the text and not beside it, so a narrow screen keeps the title readable. */}
        {!listing.isPublic && (
          <Badge variant="outline" className="mt-1">
            Tin không còn hiển thị
          </Badge>
        )}
      </div>
    </>
  );

  const layout = "flex items-center gap-3 px-4 py-3";
  if (!listing.isPublic) {
    return <div className={layout}>{content}</div>;
  }
  return (
    <Link
      href={listingPath(listing.slug, listing.code)}
      className={cn(
        FOCUS_RING,
        layout,
        "transition-colors hover:bg-accent focus-visible:ring-offset-0 focus-visible:ring-inset",
      )}
    >
      {content}
    </Link>
  );
}
