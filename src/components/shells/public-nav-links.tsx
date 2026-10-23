"use client";

import { usePathname } from "next/navigation";
import { PUBLIC_NAV } from "./nav-config";
import { NavLink } from "./nav-link";

// "/" matches only itself; any other item also owns the pages below it.
const isCurrent = (pathname: string, href: string) =>
  href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);

// Reads the path, so the shell wraps it in <Suspense> with a plain fallback.
export function PublicNavLinks() {
  const pathname = usePathname();
  return (
    <>
      {PUBLIC_NAV.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          current={isCurrent(pathname, item.href)}
        >
          {item.label}
        </NavLink>
      ))}
    </>
  );
}
