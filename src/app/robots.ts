import type { MetadataRoute } from "next";

// What crawlers may read (spec 0009, AC-13). Private areas and the sign in pages are closed, and
// so is every address with a keyword: each one costs an API call, and all server renders share
// one IP and the limit of 300 a minute. There is no sitemap line yet, listing detail (#9) adds it.
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
        "/*?q=",
        "/*&q=",
      ],
    },
  };
}
