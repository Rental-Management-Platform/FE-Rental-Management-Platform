"use client";

import { useEffect, useRef } from "react";
import { useApi, useSession } from "@/lib/session/auth-provider";

/**
 * Makes the backend count this visit (spec 0010, AC-10). The server read already counted once,
 * but as the server's own IP, so a guest's real visit is missed. A guest sends one more
 * `GET /listings/<code>` from the browser and ignores the answer and every error. It draws
 * nothing.
 *
 * It runs only for a guest (also one whose session restore failed, who may still have a session
 * and whose sign in still works), never while the session is `loading`, and never for a signed
 * in person, whose visit is counted by the phone read.
 */
export function GuestViewCounter({ code }: { code: string }) {
  const api = useApi();
  const isGuest = useSession().status === "guest";
  // Set before the send, so the second effect run of React StrictMode in development does not
  // send again. The cleanup never aborts the request.
  const sent = useRef(false);

  useEffect(() => {
    if (!isGuest || sent.current) return;
    sent.current = true;
    api.get(`/listings/${code}`, { auth: "none" }).catch(() => undefined);
  }, [api, code, isGuest]);

  return null;
}
