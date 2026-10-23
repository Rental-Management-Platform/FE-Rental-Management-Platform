"use client";

import { RouteError } from "@/components/states/route-error";

// Catches what the layouts below the root throw, such as a shell. No shell is safe to use here,
// so this brings its own `main`. `retry()` is the Next.js 16.3 way; `reset()` would not refetch.
export default function RootError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <main
      id="main"
      tabIndex={-1}
      className="flex flex-1 items-center justify-center p-4 outline-hidden"
    >
      <RouteError error={error} retry={retry} />
    </main>
  );
}
