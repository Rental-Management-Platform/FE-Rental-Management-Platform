import Link from "next/link";
import type { ComponentProps } from "react";
import { FOCUS_RING } from "@/lib/focus-ring";
import { cn } from "@/lib/utils";

// The text link under an auth form ("Đăng ký", "Đăng nhập"). It navigates, so it is a real link
// and not a button.
export function AuthLink({ className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        "rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline",
        FOCUS_RING,
        className,
      )}
      {...props}
    />
  );
}
