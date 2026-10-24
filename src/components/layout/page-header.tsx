import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  breadcrumb?: ReactNode;
  // Buttons or links for the page. Right of the text from `md`, under it on a phone.
  actions?: ReactNode;
  className?: string;
}

// The top of a page: the one `h1`, with an optional breadcrumb above it and a description
// below. It stands on the canvas with no card around it (spec 0004). A screen whose shell
// already owns the title, such as the auth card, does not use it.
export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-start md:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-2">
        {breadcrumb}
        <h1>{title}</h1>
        {description && (
          <div className="max-w-2xl text-base text-muted-foreground">
            {description}
          </div>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {actions}
        </div>
      )}
    </header>
  );
}
