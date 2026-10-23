import {
  GlobeIcon,
  LayoutDashboardIcon,
  LogInIcon,
  PaletteIcon,
} from "lucide-react";
import type { NavItem } from "@/components/shells/nav-config";

// The real arrays are nearly empty until the features that own the pages ship, so the shell
// previews use this list. Every link points at a page that exists. `/dev/ui` is the address
// that the other three sit under, which also shows that only one item is ever the current page.
export const SAMPLE_NAV: readonly NavItem[] = [
  { label: "Công khai", href: "/dev/ui/shells/public", icon: GlobeIcon },
  { label: "Đăng nhập", href: "/dev/ui/shells/auth", icon: LogInIcon },
  {
    label: "Khu làm việc",
    href: "/dev/ui/shells/workspace",
    icon: LayoutDashboardIcon,
  },
  { label: "Thư viện", href: "/dev/ui", icon: PaletteIcon },
];
