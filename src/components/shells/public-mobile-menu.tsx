"use client";

import { MenuIcon, XIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useSession } from "@/lib/session/auth-provider";
import { AccountMenu } from "./account-menu";
import { currentHrefOf } from "./nav-current";
import type { PublicNavItem } from "./nav-config";
import { MenuLink } from "./nav-link";
import { visibleNavItems } from "./visible-nav-items";

interface MobileNavListProps {
  items: readonly PublicNavItem[];
  // `null` while the path is not known yet (the <Suspense> fallback), or when nothing matches.
  currentHref: string | null;
  onNavigate: () => void;
}

function MobileNavList({ items, currentHref, onNavigate }: MobileNavListProps) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => (
        <li key={item.href}>
          <MenuLink
            href={item.href}
            current={item.href === currentHref}
            onNavigate={onNavigate}
          >
            {item.label}
          </MenuLink>
        </li>
      ))}
    </ul>
  );
}

// Reads the path, so the sheet wraps it in <Suspense> with the same links as the fallback.
function MobileNavLinks({
  items,
  onNavigate,
}: Omit<MobileNavListProps, "currentHref">) {
  const pathname = usePathname();
  const state = useSession();
  const visible = visibleNavItems(items, state);
  return (
    <MobileNavList
      items={visible}
      currentHref={currentHrefOf(
        pathname,
        visible.map((item) => item.href),
      )}
      onNavigate={onNavigate}
    />
  );
}

// Below `md` the header shows the brand and this 44 by 44 px button. The sheet holds the nav
// links and the account actions, and closes when a link or "Đăng xuất" is chosen.
export function PublicMobileMenu({
  items,
}: {
  items: readonly PublicNavItem[];
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          className="md:hidden"
          aria-label="Mở menu"
        >
          <MenuIcon aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" showCloseButton={false}>
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription className="sr-only">
            Các trang chính và tài khoản của bạn.
          </SheetDescription>
        </SheetHeader>
        <SheetClose asChild>
          <Button
            variant="ghost"
            size="icon-lg"
            className="absolute top-2 right-2"
          >
            <XIcon aria-hidden="true" />
            <span className="sr-only">Đóng menu</span>
          </Button>
        </SheetClose>
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 pb-6">
          <nav aria-label="Menu chính">
            <Suspense
              fallback={
                <MobileNavList
                  items={items.filter((item) => item.permission === undefined)}
                  currentHref={null}
                  onNavigate={close}
                />
              }
            >
              <MobileNavLinks items={items} onNavigate={close} />
            </Suspense>
          </nav>
          <Separator />
          <AccountMenu variant="list" onNavigate={close} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
