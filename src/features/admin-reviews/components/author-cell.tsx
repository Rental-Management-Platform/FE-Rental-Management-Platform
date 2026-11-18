import Link from "next/link";
import { authorName } from "@/features/reviews/text";
import { FOCUS_RING } from "@/lib/focus-ring";
import { cn } from "@/lib/utils";
import { onlyAuthorLabel } from "../admin-reviews-text";

/**
 * The writer of a review: the name, or "Người dùng" when the account has none (the row has no
 * email). The name is a link that filters the list to this writer, so an admin can follow one
 * writer without knowing their id. It keeps the other filters and goes to page 1.
 */
export function AuthorCell({
  name,
  href,
}: {
  name: string | null;
  href: string;
}) {
  const label = authorName(name);
  return (
    <Link
      href={href}
      scroll={false}
      title={onlyAuthorLabel(label)}
      className={cn(
        FOCUS_RING,
        "block truncate rounded-sm font-medium hover:underline",
      )}
    >
      {label}
    </Link>
  );
}
