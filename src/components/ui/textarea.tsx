import * as React from "react";
import { cn } from "cn";
import { FOCUS_RING } from "@/lib/focus-ring";

// 96 px minimum height, like the Figma Textarea set. It grows with its content, so there is
// no drag handle.
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        FOCUS_RING,
        "flex field-sizing-content min-h-24 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-(length:--text-input) leading-(--text-input--line-height) transition-[color,box-shadow,border-color] placeholder:text-muted-foreground focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus-visible:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
