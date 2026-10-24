import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { FOCUS_RING } from "@/lib/focus-ring";

// Sizes, border and states follow the Figma Input set (Components page, spec 0003).
// Text is 16 px at every size, so iPhone does not zoom in on focus. An invalid input keeps
// its destructive border while it has focus, so the error stays visible.
const inputVariants = cva(
  [
    FOCUS_RING,
    "w-full min-w-0 rounded-lg border border-input bg-background px-3 text-(length:--text-input) leading-(--text-input--line-height) transition-[color,box-shadow,border-color] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus-visible:border-destructive",
  ],
  {
    variants: {
      size: {
        sm: "h-8",
        default: "h-10",
        lg: "h-11",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

function Input({
  className,
  type,
  size,
  ...props
}: Omit<React.ComponentProps<"input">, "size"> &
  VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ size, className }))}
      {...props}
    />
  );
}

export { Input, inputVariants };
