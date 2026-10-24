"use client";

import { HomeIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSession } from "@/lib/session/auth-provider";
import { AccountMenu } from "./account-menu";
import { BrandLink } from "./brand";
import { currentHrefOf } from "./nav-current";
import type { NavItem } from "./nav-config";
import { SkipLink } from "./skip-link";
import { visibleNavItems } from "./visible-nav-items";

interface NavItemsProps {
  items: readonly NavItem[];
  // `null` while the path is not known yet (the <Suspense> fallback), or when nothing matches.
  currentHref: string | null;
  onNavigate: () => void;
}

function WorkspaceNavItems({ items, currentHref, onNavigate }: NavItemsProps) {
  return (
    <SidebarMenu>
      {items.map((item) => {
        const current = item.href === currentHref;
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={current} tooltip={item.label}>
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                onClick={onNavigate}
              >
                <item.icon aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

// Reads the path and the session, so the menu wraps it in <Suspense> with the same list as the
// fallback. An item that needs a permission appears once the session says the person has it.
function WorkspaceNavLinks({
  items,
  onNavigate,
}: Omit<NavItemsProps, "currentHref">) {
  const pathname = usePathname();
  const state = useSession();
  const visible = visibleNavItems(items, state);
  return (
    <WorkspaceNavItems
      items={visible}
      currentHref={currentHrefOf(
        pathname,
        visible.map((item) => item.href),
      )}
      onNavigate={onNavigate}
    />
  );
}

function WorkspaceSidebar({
  title,
  items,
}: {
  title: string;
  items: readonly NavItem[];
}) {
  // Below `lg` the menu is a sheet: choosing a link closes it.
  const { setOpenMobile } = useSidebar();
  const closeSheet = () => setOpenMobile(false);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 justify-center border-b border-sidebar-border px-4 group-data-[collapsible=icon]:px-2">
        <BrandLink
          className="group-data-[collapsible=icon]:justify-center"
          labelClassName="text-base leading-tight whitespace-normal group-data-[collapsible=icon]:sr-only"
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{title}</SidebarGroupLabel>
          <SidebarGroupContent>
            <nav aria-label={title}>
              <Suspense
                fallback={
                  <WorkspaceNavItems
                    items={items.filter(
                      (item) => item.permission === undefined,
                    )}
                    currentHref={null}
                    onNavigate={closeSheet}
                  />
                }
              >
                <WorkspaceNavLinks items={items} onNavigate={closeSheet} />
              </Suspense>
            </nav>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Về trang chủ">
              <Link href="/" onClick={closeSheet}>
                <HomeIcon aria-hidden="true" />
                <span>Về trang chủ</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

interface WorkspaceShellProps {
  /** Names the area: the group label, the menu landmark and the top bar. */
  title: string;
  /** A client component, because an item holds an icon, which a server component cannot pass. */
  items: readonly NavItem[];
  children: ReactNode;
}

// The landlord and admin frame (desktop first): a side menu that collapses to icons and
// becomes a sheet below `lg`, a top bar with the account menu, and the one `main`. It always
// starts expanded and does not remember its state (spec 0003, "Shells").
export function WorkspaceShell({
  title,
  items,
  children,
}: WorkspaceShellProps) {
  return (
    <SidebarProvider className="flex-1">
      <SkipLink />
      <WorkspaceSidebar title={title} items={items} />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger />
          <Separator
            orientation="vertical"
            className="h-5 data-vertical:self-center"
          />
          <span className="min-w-0 truncate text-sm font-medium text-muted-foreground">
            {title}
          </span>
          <div className="ml-auto">
            <AccountMenu size="default" />
          </div>
        </header>
        <main
          id="main"
          tabIndex={-1}
          className="flex flex-1 flex-col px-4 py-6 outline-hidden md:px-6 md:py-8"
        >
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
