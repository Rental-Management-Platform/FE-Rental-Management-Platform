import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { FOCUS_RING } from "@/lib/focus-ring";
import { SITE_DESCRIPTION } from "@/lib/site";
import { cn } from "@/lib/utils";
import { BrandLogo } from "./brand";
import type { PublicNavItem } from "./nav-config";

// Static: no session, no path. Links that need a permission are left out, because the server
// cannot know the person.
export function SiteFooter({ nav }: { nav: readonly PublicNavItem[] }) {
  const links = nav.filter((item) => item.permission === undefined);

  return (
    <footer className="border-t bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex max-w-sm flex-col gap-2">
            <BrandLogo className="h-24 self-start" />
            <p className="text-sm text-muted-foreground">{SITE_DESCRIPTION}</p>
          </div>
          {links.length > 0 && (
            <nav aria-label="Liên kết chân trang">
              <ul className="flex flex-col md:flex-row md:flex-wrap md:justify-end md:gap-1">
                {links.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "inline-flex h-11 items-center rounded-lg px-2 text-sm font-medium text-foreground hover:underline",
                        FOCUS_RING,
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
        <Separator />
        <p className="text-sm text-muted-foreground">
          Dự án demo, thanh toán chỉ là thanh toán thử.
        </p>
      </div>
    </footer>
  );
}
