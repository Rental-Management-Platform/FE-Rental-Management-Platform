import Link from "next/link";
import { FOCUS_RING } from "@/lib/focus-ring";
import { cn } from "@/lib/utils";
import { NO_NAME, onlyLandlordLabel } from "../admin-listings-text";

/**
 * The landlord of a listing: the name, or "Chưa đặt tên" when there is none (the row has no email).
 * The name is a link that filters the list to this landlord, so an admin can follow one landlord
 * without finding them in the filter first. It keeps the other filters and goes to page 1.
 */
export function LandlordCell({
  name,
  href,
}: {
  name: string | null;
  href: string;
}) {
  const label = name?.trim() ? name.trim() : NO_NAME;
  return (
    <Link
      href={href}
      title={onlyLandlordLabel(label)}
      className={cn(
        FOCUS_RING,
        "block truncate rounded-sm font-medium hover:underline",
      )}
    >
      {label}
    </Link>
  );
}
