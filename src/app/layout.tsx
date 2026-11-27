import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { env } from "@/lib/env";
import { SITE_DESCRIPTION, SITE_NAME, SITE_THEME_COLOR } from "@/lib/site";
import { Providers } from "./providers";
import "./globals.css";

// The site uses 400, 500 and 600 only (spec 0004), so those are the only weights declared and
// a stray bold cannot render. next/font/google takes no range string, only a list; Google
// answers the list with the same variable file for each weight, so it is one file per subset.
// The `vietnamese` subset carries the stacked diacritics (ễ, ợ, ẫ) that `latin` alone would miss.
const inter = Inter({
  weight: ["400", "500", "600"],
  subsets: ["vietnamese", "latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  // iPhone: opened from the home screen, the page runs without the Safari bars.
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "default" },
};

// Colors the browser bar in a tab and the status bar once the site is installed.
export const viewport: Viewport = { themeColor: SITE_THEME_COLOR };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${inter.variable} h-full antialiased`}>
      {/* The manifest link must be a direct child of <head>: a phone ignores it anywhere else and
          then makes only a browser shortcut, with the address bar on top. The Metadata API cannot
          promise that. A page that reads `searchParams` in `generateMetadata` (the home page, a
          listing) has its whole metadata streamed into <body> after the shell, and the link
          generated from `manifest.ts` goes with it. This copy is in the shell. The streamed one
          stays and is ignored, the first manifest link of the document wins. */}
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
