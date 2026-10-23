"use client";

import * as React from "react";
import { cn } from "cn";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { CheckIcon } from "lucide-react";
import { FOCUS_RING } from "@/lib/focus-ring";

// A 20 px box like the Figma Checkbox set. The `after` layer widens the tap area to 44 px.
// An invalid box keeps the primary fill and gets the destructive border.
function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        FOCUS_RING,
        "peer relative flex size-5 shrink-0 items-center justify-center rounded-[4px] border border-input bg-background transition-[color,box-shadow,border-color] group-has-disabled/field:opacity-50 after:absolute after:-inset-3 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground aria-invalid:data-checked:border-destructive",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
      >
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
