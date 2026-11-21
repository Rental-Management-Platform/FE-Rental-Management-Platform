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

// In proxy mode the image optimizer fetches a photo such as /api/v1/media/public/<uuid>.png from
// this very server, through its own router, never through the proxy in front of it (nginx in
// Docker, see Dockerfile). Without a rewrite that request is a 404 and every photo breaks. The
// rewrite points that one path at the API. It is read when `next build` runs and baked into the
// build, so it is a build argument, not a runtime variable. The default is the API container on
// the Docker network (docs/guild/huong-dan-docker-cho-fe.md, section 3).
const mediaOrigin = process.env.MEDIA_ORIGIN || "http://api:3000";

if (isProxyMode && !URL.canParse(mediaOrigin)) {
  throw new Error(
    `MEDIA_ORIGIN must be an absolute http(s) URL such as http://api:3000, got "${mediaOrigin}".`,
  );
}

const nextConfig: NextConfig = {
  // A self contained server in .next/standalone, so the Docker image needs no node_modules.
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    agentUpgrade: "security",
  },
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
  async rewrites() {
    if (!isProxyMode) return [];
    const route = MEDIA_PATHNAME.replace("**", ":file");
    return [
      { source: route, destination: `${new URL(mediaOrigin).origin}${route}` },
    ];
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
