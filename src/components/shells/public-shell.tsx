import { Suspense, type ReactNode } from "react";
import { ChatIndicator } from "@/features/chat/components/chat-indicator";
import { AccountMenu } from "./account-menu";
import { BrandLink } from "./brand";
import {
  PUBLIC_NAV,
  toPublicNavItems,
  type NavItem,
  type PublicNavItem,
} from "./nav-config";
import { NavLink } from "./nav-link";
import { PublicMobileMenu } from "./public-mobile-menu";
import { PublicNavLinks } from "./public-nav-links";
import { SiteFooter } from "./site-footer";
import { SkipLink } from "./skip-link";

// The same links without `aria-current`: the server HTML holds them even before the leaf
// that reads the path has run. An item that needs a permission waits for the session.
function PublicNavFallback({ items }: { items: readonly PublicNavItem[] }) {
  return items
    .filter((item) => item.permission === undefined)
    .map((item) => (
      <NavLink key={item.href} href={item.href}>
        {item.label}
      </NavLink>
    ));
}

interface PublicShellProps {
  children: ReactNode;
  // The previews under /dev pass a sample list, because the real one is nearly empty.
  nav?: readonly NavItem[];
}

// Static on purpose (spec 0003, AC-9): no `cookies()` or `headers()`. Only the leaves that read
// the path or the session are client components, and the path reader sits in <Suspense>.
export function PublicShell({ children, nav = PUBLIC_NAV }: PublicShellProps) {
  const items = toPublicNavItems(nav);
  return (
    <>
      <SkipLink />
      <header className="sticky top-0 z-40 h-16 border-b bg-background">
        <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-8">
            <BrandLink />
            <nav
              aria-label="Điều hướng chính"
              className="hidden items-center gap-1 md:flex"
            >
              <Suspense fallback={<PublicNavFallback items={items} />}>
                <PublicNavLinks items={items} />
              </Suspense>
            </nav>
          </div>
          {/* The chat indicator is outside the phone menu sheet, beside its button, and from `md`
              before the account menu (spec 0012, AC-18). This group is the right hand side of
              the header, so the indicator appearing once the session is known grows it to the
              left and never moves the account menu. */}
          <div className="flex shrink-0 items-center gap-1">
            <ChatIndicator size="lg" />
            <div className="hidden md:block">
              <AccountMenu size="lg" />
            </div>
            <PublicMobileMenu items={items} />
          </div>
        </div>
      </header>
      <main
        id="main"
        tabIndex={-1}
        className="flex flex-1 flex-col outline-hidden"
      >
        {children}
      </main>
      <SiteFooter nav={items} />
    </>
  );
}
