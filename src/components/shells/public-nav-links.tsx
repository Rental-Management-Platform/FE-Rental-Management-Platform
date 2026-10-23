"use client";

import { usePathname } from "next/navigation";
import { useSession } from "@/lib/session/auth-provider";
import { currentHrefOf } from "./nav-current";
import type { PublicNavItem } from "./nav-config";
import { NavLink } from "./nav-link";
import { visibleNavItems } from "./visible-nav-items";

// Reads the path, so the shell wraps it in <Suspense> with a plain fallback. Items that need a
// permission appear once the session says the person has it.
export function PublicNavLinks({ items }: { items: readonly PublicNavItem[] }) {
  const pathname = usePathname();
  const state = useSession();
  const visible = visibleNavItems(items, state);
  const current = currentHrefOf(
    pathname,
    visible.map((item) => item.href),
  );
  return (
    <>
      {visible.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          current={item.href === current}
        >
          {item.label}
        </NavLink>
      ))}
    </>
  );
}
