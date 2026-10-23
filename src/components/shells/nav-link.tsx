import Link from "next/link";
import type { ReactNode } from "react";
import { FOCUS_RING } from "@/lib/focus-ring";
import { cn } from "@/lib/utils";

type NavLinkProps = { href: string; current?: boolean; children: ReactNode };

// Used by the client leaf that knows the path and by the plain fallback that does not,
// so both draw the same link.
export function NavLink({ href, current = false, children }: NavLinkProps) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={cn(
        "inline-flex h-11 items-center rounded-lg px-4 text-sm font-medium transition-colors",
        FOCUS_RING,
        current
          ? "bg-secondary text-primary"
          : "text-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      {children}
    </Link>
  );
}
