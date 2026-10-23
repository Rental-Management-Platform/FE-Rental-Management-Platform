"use client";

import * as React from "react";
import { cn } from "cn";
import { Switch as SwitchPrimitive } from "radix-ui";
import { FOCUS_RING } from "@/lib/focus-ring";

// A 44 by 24 px track with a 20 px thumb, like the Figma Switch set. Off uses the input
// color (4.76:1 on white), on uses primary. One size only.
function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        FOCUS_RING,
        "peer group/switch relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors after:absolute after:-inset-y-2.5 aria-invalid:border-destructive data-checked:bg-primary data-unchecked:bg-input data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-5 rounded-full bg-background transition-transform data-checked:translate-x-5 data-unchecked:translate-x-0"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
