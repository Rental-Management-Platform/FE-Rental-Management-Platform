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

// Next sets `NEXT_PHASE` itself; it is `phase-production-build` while `next build` renders the
// pages. A read that is allowed to fail on a live page (the ward catalog) must still fail the
// build, so an empty result is never shut into the static shell (spec 0016, AC-10).
const phase = z.string().optional().parse(process.env.NEXT_PHASE);

export const serverEnv = {
  API_URL: parsed.data,
  IS_PRODUCTION_BUILD: phase === "phase-production-build",
};
