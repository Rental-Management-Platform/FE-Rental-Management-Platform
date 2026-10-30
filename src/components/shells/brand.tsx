import Image from "next/image";
import Link from "next/link";
import { FOCUS_RING } from "@/lib/focus-ring";
import { SITE_NAME, SITE_SLOGAN } from "@/lib/site";
import { cn } from "@/lib/utils";

// The name and the slogan are drawn inside the logo, so the picture carries them for a screen
// reader too.
const LOGO_ALT = `${SITE_NAME}. ${SITE_SLOGAN}`;

// Both pictures are cut out of `public/logo_raw.jpg` (the logo as it was sent, 2000 px, on paper):
// `logo.png` is the whole logo (house, name, slogan) and `logo-mark.png` the house alone.
// `unoptimized`: they are small fixed files that need no resizing, and in proxy mode
// `next.config.ts` lets the image optimizer fetch only the API photo paths, so it would refuse them.

/** The whole logo as it was drawn: the house, the name and the slogan under it. */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt={LOGO_ALT}
      width={720}
      height={629}
      unoptimized
      className={cn("h-14 w-auto shrink-0", className)}
    />
  );
}

/** The house alone, for a place too narrow for the whole logo. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <Image
      src="/logo-mark.png"
      alt={LOGO_ALT}
      width={192}
      height={192}
      unoptimized
      className={cn("size-10 shrink-0", className)}
    />
  );
}

interface BrandLinkProps {
  className?: string;
  // The height of the whole logo (`h-14` by default); the width follows the picture.
  logoClassName?: string;
  // Show the house alone when the side menu is collapsed to icons.
  collapsedToMark?: boolean;
}

export function BrandLink({
  className,
  logoClassName,
  collapsedToMark = false,
}: BrandLinkProps) {
  return (
    <Link
      href="/"
      className={cn(
        "flex min-w-0 items-center rounded-lg",
        FOCUS_RING,
        className,
      )}
    >
      <BrandLogo
        className={cn(
          collapsedToMark && "group-data-[collapsible=icon]:hidden",
          logoClassName,
        )}
      />
      {collapsedToMark && (
        <BrandMark className="hidden group-data-[collapsible=icon]:block" />
      )}
    </Link>
  );
}
