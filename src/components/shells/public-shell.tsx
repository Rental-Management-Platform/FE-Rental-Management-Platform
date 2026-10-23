import { House } from "lucide-react";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { FOCUS_RING } from "@/lib/focus-ring";
import { SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";
import { PUBLIC_NAV } from "./nav-config";
import { NavLink } from "./nav-link";
import { PublicNavLinks } from "./public-nav-links";

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

// The same links without `aria-current`: the server HTML holds them even before the leaf
// that reads the path has run.
function PublicNavFallback() {
  return PUBLIC_NAV.map((item) => (
    <NavLink key={item.href} href={item.href}>
      {item.label}
    </NavLink>
  ));
}

// Below `md` only the brand shows for now. The menu button and its sheet arrive with the
// shell milestone (spec 0003, M4), after their Figma frames are approved.
function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 h-16 border-b bg-background">
      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-8">
          <Link
            href="/"
            className={cn(
              "flex min-w-0 items-center gap-2 rounded-lg",
              FOCUS_RING,
            )}
          >
            <BrandMark />
            <span className="truncate text-base font-semibold md:text-lg">
              {SITE_NAME}
            </span>
          </Link>
          <nav
            aria-label="Điều hướng chính"
            className="hidden items-center gap-1 md:flex"
          >
            <Suspense fallback={<PublicNavFallback />}>
              <PublicNavLinks />
            </Suspense>
          </nav>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" size="lg">
            <Link href="/login">Đăng nhập</Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/register">Đăng ký</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <>
      <PublicHeader />
      <main
        id="main"
        tabIndex={-1}
        className="flex flex-1 flex-col outline-hidden"
      >
        {children}
      </main>
    </>
  );
}
