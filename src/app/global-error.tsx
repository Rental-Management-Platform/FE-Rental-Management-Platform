"use client";

import { RouteError } from "@/components/states/route-error";
import { SITE_NAME } from "@/lib/site";
import "./globals.css";

// Replaces the root layout when that layout itself fails, so it brings its own <html> and
// <body> and imports the styles (without them it would follow the system color scheme). The
// font and the providers belong to the layout and are not here: the `--font-sans` list in
// globals.css falls back to the system font.
export default function GlobalError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <title>{`Có lỗi xảy ra | ${SITE_NAME}`}</title>
        <main
          id="main"
          tabIndex={-1}
          className="flex flex-1 items-center justify-center p-4 outline-hidden"
        >
          <RouteError error={error} retry={retry} />
        </main>
      </body>
    </html>
  );
}
