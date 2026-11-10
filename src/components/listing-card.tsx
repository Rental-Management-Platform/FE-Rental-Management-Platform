import { MapPinIcon, RulerIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ListingPhoto } from "@/components/listing-photo";
import { Card } from "@/components/ui/card";
import type { IsoDateTime, ListingSummary } from "@/lib/api/types";
import {
  formatArea,
  formatDateOnly,
  formatDateTime,
  formatMoney,
} from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

type ListingCardProps = {
  /** A row of `GET /listings` (or any list of listings), as the API sent it. */
  listing: ListingSummary;
  /**
   * Where the card goes: `/<slug>-<code>`, passed by the detail page (#9). Without it the title
   * is plain text and the card is not a link, so nothing points at a page that does not exist.
   */
  href?: string;
  /** The first card of a page loads its photo at once. */
  eagerPhoto?: boolean;
  /**
   * The heart (scope #14), a slot on the right of the title keyed to this row by whoever passes it.
   * It draws nothing for a person who gets no heart, and the slot then takes no room. The card
   * knows nothing about sessions: the heart brings its own.
   */
  heart?: ReactNode;
  /** `favoritedAt` as the API sent it, on the saved page only: adds the "Đã lưu ngày" line. */
  savedAt?: IsoDateTime;
};

// Only a card that goes somewhere reacts to the pointer and shows the ring around the stretched
// link.
const LINKED_CARD =
  "transition-shadow hover:shadow-md has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-offset-2";

/**
 * The card of one listing on a list page (spec 0009, AC-8), lifted from the sample card of
 * `/dev/ui/screens`. It stands on the canvas, never inside a zone. With an `href`, the title is
 * the link and a stretched link covers the whole card.
 */
export function ListingCard({
  listing,
  href,
  eagerPhoto = false,
  heart,
  savedAt,
}: ListingCardProps) {
  return (
    <Card className={cn("relative gap-0 py-0", href && LINKED_CARD)}>
      <ListingPhoto
        src={listing.coverImageUrl ? mediaUrl(listing.coverImageUrl) : null}
        eager={eagerPhoto}
      />
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* The heart sits beside the title and above the stretched link. The negative margins
            pull its 44 px target back to the padding of the card, so the row is not taller than
            the title needs. */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 min-w-0 text-lg">
            {href ? (
              <Link
                href={href}
                className="outline-hidden after:absolute after:inset-0 hover:underline"
              >
                {listing.title}
              </Link>
            ) : (
              listing.title
            )}
          </h3>
          <div className="-mt-2 -mr-2 shrink-0 empty:hidden">{heart}</div>
        </div>
        <p className="text-xl font-semibold text-primary">
          {formatMoney(listing.price)}
          <span className="text-sm font-normal text-muted-foreground">
            {" "}
            mỗi tháng
          </span>
        </p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <li className="flex items-center gap-1.5">
            <RulerIcon aria-hidden="true" className="size-4" />
            {formatArea(listing.areaM2)}
          </li>
          {listing.deposit !== null && (
            <li>Cọc {formatMoney(listing.deposit)}</li>
          )}
          {listing.availableFrom !== null && (
            <li>Vào ở từ {formatDateOnly(listing.availableFrom)}</li>
          )}
        </ul>
        <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
          <MapPinIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span className="line-clamp-2">{listing.fullAddress}</span>
        </p>
        {savedAt !== undefined && (
          <p className="text-sm text-muted-foreground">
            Đã lưu ngày {formatDateTime(savedAt)}
          </p>
        )}
        <p className="mt-auto flex items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
          <span className="min-w-0 truncate">
            {listing.landlord.name ?? "Chủ trọ"}
          </span>
          <span className="shrink-0">
            Đăng ngày {formatDateTime(listing.createdAt)}
          </span>
        </p>
      </div>
    </Card>
  );
}
