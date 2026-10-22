import { z } from "zod";

const withoutTrailingSlash = (value: string) => value.replace(/\/+$/, "");

// z.httpUrl() rejects localhost and private addresses, so use z.url() limited to http(s).
export const httpUrl = z
  .url({ protocol: /^https?$/ })
  .transform(withoutTrailingSlash);

// Absolute http(s) URL, or a path such as /api/v1 when the API is proxied by Next.js.
const apiAddress = z.union(
  [httpUrl, z.string().startsWith("/").transform(withoutTrailingSlash)],
  {
    error: "must be an absolute http(s) URL, or a path starting with /",
  },
);

const publicEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: apiAddress,
  NEXT_PUBLIC_SITE_URL: httpUrl,
});

// Next.js only inlines NEXT_PUBLIC_* values into browser code when they are written as
// the literal process.env.NEXT_PUBLIC_X, so each one is listed by hand.
const parsed = publicEnvSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

if (!parsed.success) {
  throw new Error(
    `Invalid environment variables. Copy .env.example to .env.local and fill it in.\n${z.prettifyError(parsed.error)}`,
  );
}

export const env = parsed.data;
