import type { ReactNode, Ref } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  breadcrumb?: ReactNode;
  // Buttons or links for the page. Right of the text from `md`, under it on a phone.
  actions?: ReactNode;
  // For a page that changes its own view and must move focus to the new `h1` (the order page,
  // spec 0022). The heading then takes focus by code only, with no ring of its own.
  titleRef?: Ref<HTMLHeadingElement>;
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
  titleRef,
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
        <h1
          ref={titleRef}
          tabIndex={titleRef ? -1 : undefined}
          className={titleRef ? "outline-hidden" : undefined}
        >
          {title}
        </h1>
        {description && (
          <div className="max-w-2xl text-base text-muted-foreground">
            {description}
          </div>
        )}
      </div>
      {actions && (
        // `empty:hidden`: an actions part that draws nothing (a button that is hidden for this
        // viewer) leaves no gap behind.
        <div className="flex shrink-0 flex-wrap items-center gap-3 empty:hidden">
          {actions}
        </div>
      )}
    </header>
  );
}
