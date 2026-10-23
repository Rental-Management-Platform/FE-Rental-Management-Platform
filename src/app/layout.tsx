import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { env } from "@/lib/env";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import { Providers } from "./providers";
import "./globals.css";

// Not a variable font on Google Fonts, so each weight is listed. The `vietnamese` subset
// carries the stacked diacritics (ễ, ợ, ẫ) that `latin` alone would miss.
const beVietnamPro = Be_Vietnam_Pro({
  weight: ["400", "500", "600", "700"],
  subsets: ["vietnamese", "latin"],
  display: "swap",
  variable: "--font-be-vietnam-pro",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
