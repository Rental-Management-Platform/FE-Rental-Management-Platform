import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

// What crawlers may read (spec 0009, AC-13). Private areas and the sign in pages are closed, and
// so is every address with a keyword: each one costs an API call, and all server renders share
// one IP and the limit of 300 a minute. The sitemap line points to the listing sitemap (spec
// 0010, AC-17).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/landlord",
        "/admin",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/favorites",
        "/account",
        "/tin-nhan",
        "/*?q=",
        "/*&q=",
      ],
    },
    sitemap: `${env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  };
}
