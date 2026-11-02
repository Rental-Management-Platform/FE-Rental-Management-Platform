import { env } from "@/lib/env";

// The only place a photo path may point to (api-for-frontend.md, 6.28 and Appendix C). It is the
// same path `images.localPatterns` and `images.remotePatterns` allow in next.config.ts.
const MEDIA_PREFIX = "/api/v1/media/public/";

// What follows the prefix is one file name, `<uuid>.<extension>`. Letters, digits, dot, dash and
// underscore only, so a path can never climb out of the folder or carry a query or a fragment.
const MEDIA_FILE_NAME = /^[A-Za-z0-9_-]+(\.[A-Za-z0-9_-]+)*$/;

/**
 * The address of a photo, from the path the backend returned (`ListingImage.url`,
 * `coverImageUrl`), or `null` when the path is not a public photo path. A `null` is shown as no
 * photo, never as a broken image. `apiAddress` is `NEXT_PUBLIC_API_URL`: an absolute address
 * gives the origin in front of the path, a path such as `/api/v1` (the API is proxied by
 * Next.js) leaves the path as it is.
 */
export function buildMediaUrl(apiAddress: string, path: string): string | null {
  if (!path.startsWith(MEDIA_PREFIX)) return null;
  if (!MEDIA_FILE_NAME.test(path.slice(MEDIA_PREFIX.length))) return null;
  if (apiAddress.startsWith("/")) return path;
  return URL.canParse(apiAddress)
    ? `${new URL(apiAddress).origin}${path}`
    : null;
}

/** `buildMediaUrl` for the address this site was built with (spec 0007, AC-12). */
export const mediaUrl = (path: string): string | null =>
  buildMediaUrl(env.NEXT_PUBLIC_API_URL, path);
