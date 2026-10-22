import type { NextConfig } from "next";

// Listing photos come from the API as paths: /api/v1/media/public/<uuid>.<ext>.
const MEDIA_PATHNAME = "/api/v1/media/public/**";

// Hosts the image optimizer refuses by default: localhost, loopback, link local, private ranges.
const LOCAL_OR_PRIVATE_HOST =
  /^(localhost|\[::1\]|127(\.\d+){3}|10(\.\d+){3}|192\.168(\.\d+){2}|172\.(1[6-9]|2\d|3[01])(\.\d+){2}|169\.254(\.\d+){2})$/;

// Same address the browser puts in front of photo paths (src/lib/env.ts).
const publicApiAddress = process.env.NEXT_PUBLIC_API_URL;

if (!publicApiAddress) {
  throw new Error(
    "NEXT_PUBLIC_API_URL is not set. Copy .env.example to .env.local and fill it in.",
  );
}

// A path such as /api/v1 means the API is proxied through Next.js, so photos are local.
const isProxyMode = publicApiAddress.startsWith("/");

if (!isProxyMode && !URL.canParse(publicApiAddress)) {
  throw new Error(
    `NEXT_PUBLIC_API_URL must be an absolute http(s) URL or a path starting with /, got "${publicApiAddress}".`,
  );
}

const apiUrl = isProxyMode ? null : new URL(publicApiAddress);

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: apiUrl
    ? {
        remotePatterns: [
          {
            protocol: apiUrl.protocol === "https:" ? "https" : "http",
            hostname: apiUrl.hostname,
            port: apiUrl.port,
            pathname: MEDIA_PATHNAME,
            search: "",
          },
        ],
        // Decided from the API address, never from NODE_ENV: `next start` on your own
        // computer is production mode too.
        dangerouslyAllowLocalIP: LOCAL_OR_PRIVATE_HOST.test(apiUrl.hostname),
      }
    : {
        localPatterns: [{ pathname: MEDIA_PATHNAME, search: "" }],
      },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
