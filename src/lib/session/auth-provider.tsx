"use client";

import {
  createContext,
  useContext,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/client";
import { env } from "@/lib/env";
import {
  createSession,
  LOADING_STATE,
  type Session,
  type SessionActions,
  type SessionState,
} from "./create-session";

const SessionContext = createContext<Session | null>(null);

// One session per mount, built once. A server render builds its own and never gives it a
// token, so nothing can pass from one visitor to another.
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session] = useState(() =>
    createSession({
      baseUrl: env.NEXT_PUBLIC_API_URL,
      onSessionEnd: () => {
        // Cancel first so nothing in flight writes to the cache, then empty it.
        void queryClient.cancelQueries();
        queryClient.clear();
      },
      onUserChange: () => {
        void queryClient.invalidateQueries();
      },
    }),
  );

  return <SessionContext value={session}>{children}</SessionContext>;
}

function useSessionContext(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error("Wrap the app in <AuthProvider>.");
  return session;
}

/** Who is looking: `loading`, `guest` or `user`. Never holds the token. */
export function useSession(): SessionState {
  const session = useSessionContext();
  return useSyncExternalStore(
    session.subscribe,
    session.getState,
    () => LOADING_STATE,
  );
}

/**
 * The one API client. Inside a `queryFn`, always pass the `signal` TanStack gives you:
 * without it `cancelQueries` cancels nothing. Stable across renders.
 */
export function useApi(): ApiClient {
  return useSessionContext().api;
}

/** Stable across renders. */
export function useSessionActions(): SessionActions {
  return useSessionContext().actions;
}
