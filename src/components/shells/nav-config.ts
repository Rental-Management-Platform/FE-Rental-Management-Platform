import {
  LayoutDashboard,
  Search,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type { AccountType, PermissionKey } from "@/lib/api/types";
import { homePathOf } from "@/lib/next-path";
import { ADMIN_TOOLS, LANDLORD_TOOLS, navItemsOf } from "./workspace-tools";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  // An item with a permission shows only when `can(state, permission)` is true.
  permission?: PermissionKey;
};

// What the public chrome needs from an item. It has no icon, so a server component can hand it
// to a client component (an icon is a component, which cannot cross that line as a prop).
export type PublicNavItem = Pick<NavItem, "label" | "href" | "permission">;

export const toPublicNavItems = (items: readonly NavItem[]): PublicNavItem[] =>
  items.map(({ label, href, permission }) => ({ label, href, permission }));

// The public menu and `ACCOUNT_LINKS` still follow spec 0003 ("Nav configs"): a feature adds
// its item in the same change that ships its page, so no link points at a page that does not
// exist yet. The two work areas are different since spec 0008: their menus are built from the
// tool lists in `workspace-tools.ts`, one "Tổng quan" item first and then the ready tools, so a
// feature turns its menu item on by flipping its tool from `soon` to `ready`.
export const PUBLIC_NAV: readonly NavItem[] = [
  { label: "Tìm trọ", href: "/", icon: Search },
];

// "Tổng quan" is the dashboard of an area. Its address is the home path of the account type,
// and it is the current item on that exact address only (`exactHrefs` of the shell).
export const LANDLORD_HOME = homePathOf("landlord");

export const LANDLORD_NAV: readonly NavItem[] = [
  { label: "Tổng quan", href: LANDLORD_HOME, icon: LayoutDashboard },
  ...navItemsOf(LANDLORD_TOOLS),
];

export const ADMIN_HOME = homePathOf("admin");

// Every admin tool is still soon, so the admin menu holds "Tổng quan" alone until #20 and the
// rest turn their tools on.
export const ADMIN_NAV: readonly NavItem[] = [
  { label: "Tổng quan", href: ADMIN_HOME, icon: LayoutDashboard },
  ...navItemsOf(ADMIN_TOOLS),
];

// Links in the account menu: `all` for every signed in person, then the list of their own type.
// Display only: what a person may do stays with `can()` and the backend. The way back to the
// work area from the public pages (spec 0008, AC-14); the renter has no work area.
export const ACCOUNT_LINKS: Record<"all" | AccountType, readonly NavItem[]> = {
  all: [],
  tenant: [],
  landlord: [
    { label: "Khu chủ trọ", href: LANDLORD_HOME, icon: LayoutDashboard },
  ],
  admin: [{ label: "Quản trị", href: ADMIN_HOME, icon: ShieldCheck }],
};
