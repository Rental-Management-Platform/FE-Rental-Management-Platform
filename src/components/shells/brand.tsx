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

interface BrandImageProps {
  className?: string;
  // `eager` for a logo above the fold (the header): it is the largest paint there, so it must
  // not wait for the lazy loader. The footer one is below the fold and keeps the default.
  loading?: "eager" | "lazy";
}

/** The whole logo as it was drawn: the house, the name and the slogan under it. */
export function BrandLogo({ className, loading }: BrandImageProps) {
  return (
    <Image
      src="/logo.png"
      alt={LOGO_ALT}
      width={720}
      height={629}
      unoptimized
      loading={loading}
      className={cn("h-14 w-auto shrink-0", className)}
    />
  );
}

/** The house alone, for a place too narrow for the whole logo. */
export function BrandMark({ className, loading }: BrandImageProps) {
  return (
    <Image
      src="/logo-mark.png"
      alt={LOGO_ALT}
      width={192}
      height={192}
      unoptimized
      loading={loading}
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
      {/* The brand link sits in a header, always above the fold, so both pictures load at once
          (the house too, so collapsing the side menu never waits for it). */}
      <BrandLogo
        loading="eager"
        className={cn(
          collapsedToMark && "group-data-[collapsible=icon]:hidden",
          logoClassName,
        )}
      />
      {collapsedToMark && (
        <BrandMark
          loading="eager"
          className="hidden group-data-[collapsible=icon]:block"
        />
      )}
    </Link>
  );
}
