"use client";

import { useState } from "react";
import { useSession, useSessionActions } from "@/lib/session/auth-provider";
import type { SessionState } from "@/lib/session/create-session";
import { useAuthRedirect } from "./use-auth-redirect";

type GuestState = Extract<SessionState, { status: "guest" }>;

/**
 * What an auth page draws for the session (spec 0005, "Pages and states"):
 *  - `loading`: the form skeleton, so a person who already has a session never sees the form flash.
 *  - `form`: a guest, with the reason the session ended when there is one.
 *  - `none`: signed in. The redirect moves the person away, so the page draws nothing.
 *
 * Once the form has been shown it stays mounted through a later `loading` (the retry of
 * `guest('unavailable')`), so what the person typed is not lost; `retrying` says it is
 * waiting for the answer.
 */
export function useAuthPage(next: string | null) {
  useAuthRedirect(next);
  const state = useSession();
  const { restore } = useSessionActions();

  // The last guest state seen. Kept in state, set while rendering, which React allows for a
  // value derived from props and state: it re-renders at once, before anything is drawn.
  const [remembered, setRemembered] = useState<GuestState | null>(null);
  if (state.status === "guest" && state !== remembered) setRemembered(state);

  const guest = state.status === "guest" ? state : remembered;
  const view =
    state.status === "user" ? "none" : guest === null ? "loading" : "form";

  return {
    view,
    guest,
    retrying: state.status === "loading",
    restore: () => void restore(),
  } as const;
}
