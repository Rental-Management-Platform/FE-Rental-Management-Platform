import { cn } from "cn";

// The teal accent tint, like the Figma Skeleton set (muted was nearly invisible on white).
// Under prefers-reduced-motion the global rule in globals.css stops the pulse.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-accent", className)}
      {...props}
    />
  );
}

export { Skeleton };
