import { connection } from "next/server";

/**
 * `/healthz`: the answer the Docker `HEALTHCHECK` waits for (compose.yaml). It is outside `/api/`,
 * because the proxy in front sends every `/api/` path to the backend. It says only that this
 * server is up: it never calls the API, so a backend that is down does not make Docker restart
 * the frontend. `connection()` keeps it a live answer on every call, not a file made at build time.
 */
export async function GET() {
  await connection();
  return new Response("ok", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
