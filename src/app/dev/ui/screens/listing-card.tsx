import { MapPinIcon, RulerIcon } from "lucide-react";
import Link from "next/link";
import { ImagePlaceholder } from "@/components/states/image-placeholder";
import { Card } from "@/components/ui/card";
import type { PublicListingSummary } from "@/lib/api/types";
import {
  formatArea,
  formatDateOnly,
  formatDateTime,
  formatMoney,
} from "./sample-format";
import { SCREENS_HOME } from "./screens";

export const LISTING_DETAIL_HREF = `${SCREENS_HOME}/listing-detail`;

// Sample markup for a listing card. The features that show listings (#8, #15, #14) lift it into
// `src/features/` and point `href` at `/<slug>-<code>`; they do not redraw it. It takes
// the `GET /listings` row as it is. Every sample row has `coverImageUrl` null, so the photo
// slot is always `ImagePlaceholder`; the real card puts the photo there when a URL exists.
export function ListingCard({ listing }: { listing: PublicListingSummary }) {
  return (
    <Card className="relative gap-0 py-0 transition-shadow hover:shadow-md has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-offset-2">
      <ImagePlaceholder ratio="16:9" className="rounded-none" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="line-clamp-2 text-lg">
          <Link
            href={LISTING_DETAIL_HREF}
            className="outline-hidden after:absolute after:inset-0 hover:underline"
          >
            {listing.title}
          </Link>
        </h3>
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
