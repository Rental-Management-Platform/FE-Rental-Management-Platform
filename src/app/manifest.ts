import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_THEME_COLOR } from "@/lib/site";

// What a phone reads when the site is added to the home screen. `display: "standalone"` is the
// line that removes the address bar: without a manifest the phone only makes a shortcut that
// opens in the browser. The status bar takes `theme_color`, so it matches the white header.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    lang: "vi",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: SITE_THEME_COLOR,
    theme_color: SITE_THEME_COLOR,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
