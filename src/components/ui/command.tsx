"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "cn";
import { CheckIcon, SearchIcon } from "lucide-react";

// Added with `npx shadcn@latest add command`, then edited once (spec 0015, step 3). Edits: no
// `CommandDialog` (nothing here opens a command palette), and no `InputGroup` (its registry
// item would overwrite four files we edited), so the search row is a plain row with an icon;
// the highlight is `accent` like the Select menu; rows are 40 or 44 px; typed text uses
// `--text-input`; no `no-scrollbar` (the list is long, a scrollbar tells people it scrolls).

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "flex size-full flex-col overflow-hidden rounded-lg bg-popover text-popover-foreground",
        className,
      )}
      {...props}
    />
  );
}

// The search row: an icon, then the typed text at 16 px (`--text-input`, so iPhone does not zoom).
// The focus ring is drawn inside the row (`ring-inset`): the popover clips an outer ring.
function CommandInput({
  className,
  size = "default",
  ...props
}: Omit<React.ComponentProps<typeof CommandPrimitive.Input>, "size"> & {
  size?: "default" | "lg";
}) {
  return (
    <div
      data-slot="command-input-wrapper"
      data-size={size}
      className="flex shrink-0 items-center gap-2 border-b px-3 focus-within:ring-2 focus-within:ring-ring focus-within:ring-inset data-[size=default]:h-10 data-[size=lg]:h-11"
    >
      <SearchIcon
        aria-hidden
        className="size-5 shrink-0 text-muted-foreground"
      />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          "h-full w-full min-w-0 bg-transparent text-(length:--text-input) leading-(--text-input--line-height) outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "relative scroll-py-1 overflow-x-hidden overflow-y-auto overscroll-contain outline-none",
        className,
      )}
      {...props}
    />
  );
}

function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn("py-6 text-center text-sm", className)}
      {...props}
    />
  );
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "overflow-hidden p-1 text-foreground **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("-mx-1 h-px w-auto bg-border", className)}
      {...props}
    />
  );
}

// A row is at least 40 px high (44 px at `lg`), text at weight 500 like the Select menu, and the
// highlighted row (`data-selected`, the one Enter picks) is `accent`. A row that has `data-checked`
// shows a check mark at the right, so the chosen row is not marked by color alone.
function CommandItem({
  className,
  children,
  size = "default",
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item> & {
  size?: "default" | "lg";
}) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      data-size={size}
      className={cn(
        "group/command-item relative flex cursor-default items-center gap-2 rounded-md px-3 py-2 text-base font-medium outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[size=default]:min-h-10 data-[size=lg]:min-h-11 data-selected:bg-accent data-selected:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
        className,
      )}
      {...props}
    >
      {children}
      <CheckIcon
        aria-hidden
        className="ml-auto opacity-0 group-data-[checked=true]/command-item:opacity-100"
      />
    </CommandPrimitive.Item>
  );
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground group-data-selected/command-item:text-accent-foreground",
        className,
      )}
      {...props}
    />
  );
}

export {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
};
