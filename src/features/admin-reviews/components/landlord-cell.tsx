import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { landlordPath } from "@/features/landlord-profile/landlord-id";
import { FOCUS_RING } from "@/lib/focus-ring";
import { cn } from "@/lib/utils";
import { NO_NAME, openLandlordName } from "../admin-reviews-text";

/**
 * The landlord a review is about: the name, or "Chưa đặt tên" when there is none. The name opens
 * the public profile `/chu-tro/<id>` (scope #15) in a new tab, which is how an admin reads the
 * landlord's side before deciding, and the list keeps its place. Whether the public profile opens
 * is the profile page's to say: this row has the landlord's id and name and nothing else.
 */
export function LandlordCell({
  landlord,
}: {
  landlord: { id: string; name: string | null };
}) {
  const label = landlord.name?.trim() ? landlord.name.trim() : NO_NAME;
  return (
    <Link
      href={landlordPath(landlord.id)}
      target="_blank"
      rel="noreferrer"
      aria-label={openLandlordName(label)}
      title={label}
      className={cn(
        FOCUS_RING,
        "inline-flex max-w-full min-w-0 items-center gap-1 rounded-sm font-medium hover:underline",
      )}
    >
      <span className="truncate">{label}</span>
      <ExternalLinkIcon
        aria-hidden="true"
        className="size-3.5 shrink-0 text-muted-foreground"
      />
    </Link>
  );
}
