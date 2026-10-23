import { Search, type LucideIcon } from "lucide-react";
import type { PermissionKey } from "@/lib/api/types";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  // An item with a permission shows only when `can(state, permission)` is true.
  permission?: PermissionKey;
};

// A feature adds its item in the same change that ships its page, so no link points at a
// page that does not exist yet (spec 0003, "Nav configs").
export const PUBLIC_NAV: readonly NavItem[] = [
  { label: "Tìm trọ", href: "/", icon: Search },
];
