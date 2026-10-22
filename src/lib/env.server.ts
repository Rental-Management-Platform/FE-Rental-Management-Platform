import "server-only";
import { z } from "zod";
import { env, httpUrl } from "@/lib/env";

// The server falls back to the browser address. In proxy mode that address is a path,
// so API_URL must then be set to the full address of the API.
const parsed = httpUrl.safeParse(
  process.env.API_URL || env.NEXT_PUBLIC_API_URL,
);

if (!parsed.success) {
  throw new Error(
    `Invalid API_URL. The server needs an absolute http(s) address; when NEXT_PUBLIC_API_URL is a path, set API_URL to the full address.\n${z.prettifyError(parsed.error)}`,
  );
}

export const serverEnv = { API_URL: parsed.data };
