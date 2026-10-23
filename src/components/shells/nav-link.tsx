import type { LucideIcon } from "lucide-react";
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
        "inline-flex h-11 items-center rounded-lg px-4 text-sm font-medium whitespace-nowrap transition-colors",
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

type MenuLinkProps = NavLinkProps & {
  icon?: LucideIcon;
  // Closes the sheet this link sits in.
  onNavigate?: () => void;
};

// A full width, 44 px row for the phone menu sheet.
export function MenuLink({
  href,
  current = false,
  icon: Icon,
  onNavigate,
  children,
}: MenuLinkProps) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "flex h-11 w-full items-center gap-3 rounded-lg px-3 text-base font-medium transition-colors",
        FOCUS_RING,
        current
          ? "bg-secondary text-primary"
          : "text-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      {Icon && <Icon aria-hidden="true" className="size-5 shrink-0" />}
      <span className="min-w-0 truncate">{children}</span>
    </Link>
  );
}
