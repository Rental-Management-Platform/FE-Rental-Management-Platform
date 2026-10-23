import { FOCUS_RING } from "@/lib/focus-ring";
import { cn } from "@/lib/utils";

// The first thing a keyboard user reaches. It stays out of sight until focused, then jumps to
// the `main` landmark, which has `id="main"` and `tabIndex={-1}` so it can take the focus.
export function SkipLink() {
  return (
    <a
      href="#main"
      className={cn(
        "sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-3 focus:text-sm focus:font-medium focus:text-primary-foreground",
        FOCUS_RING,
      )}
    >
      Bỏ qua, tới nội dung chính
    </a>
  );
}
