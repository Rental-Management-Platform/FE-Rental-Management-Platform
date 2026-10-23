import { House } from "lucide-react";
import Link from "next/link";
import { FOCUS_RING } from "@/lib/focus-ring";
import { SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground",
        className,
      )}
    >
      <House className="size-5" />
    </span>
  );
}

interface BrandLinkProps {
  className?: string;
  // Pass `sr-only` classes to keep the name for screen readers while the label is hidden,
  // for example when the side menu is collapsed to icons.
  labelClassName?: string;
}

export function BrandLink({ className, labelClassName }: BrandLinkProps) {
  return (
    <Link
      href="/"
      className={cn(
        "flex min-w-0 items-center gap-2 rounded-lg",
        FOCUS_RING,
        className,
      )}
    >
      <BrandMark />
      <span
        className={cn(
          "truncate text-base font-semibold md:text-lg",
          labelClassName,
        )}
      >
        {SITE_NAME}
      </span>
    </Link>
  );
}
