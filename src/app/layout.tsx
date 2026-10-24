import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { env } from "@/lib/env";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
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
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
