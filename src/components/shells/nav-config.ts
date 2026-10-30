import { HousePlus, Search, type LucideIcon } from "lucide-react";
import type { AccountType, PermissionKey } from "@/lib/api/types";

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

// A feature adds its item in the same change that ships its page, so no link points at a
// page that does not exist yet (spec 0003, "Nav configs"). The landlord menu holds only the
// create property page until #12 brings the rest, the admin menu stays empty until #20, and
// `ACCOUNT_LINKS` until #14, #12, #20 and #28.
export const PUBLIC_NAV: readonly NavItem[] = [
  { label: "Tìm trọ", href: "/", icon: Search },
];

export const LANDLORD_NAV: readonly NavItem[] = [
  {
    label: "Thêm nhà trọ",
    href: "/landlord/properties/new",
    icon: HousePlus,
    permission: "property:create",
  },
];

export const ADMIN_NAV: readonly NavItem[] = [];

// Links in the account menu: `all` for every signed in person, then the list of their own type.
// Display only: what a person may do stays with `can()` and the backend.
export const ACCOUNT_LINKS: Record<"all" | AccountType, readonly NavItem[]> = {
  all: [],
  tenant: [],
  landlord: [],
  admin: [],
};
