import "client-only";
import { createApiClient, type ApiClient } from "@/lib/api/client";
import type {
  LoginBody,
  MeResponse,
  PermissionKey,
  RegisterBody,
  TokenResponse,
  User,
} from "@/lib/api/types";
import { writeHint } from "./hint";

// Why the person is a guest although they had a session.
export type EndedReason = "expired" | "revoked" | "locked" | "unavailable";

// What `useSession()` returns. The token is not part of it.
export type SessionState =
  | { status: "loading" }
  | { status: "guest"; endedReason: EndedReason | null }
  | { status: "user"; user: User; permissions: PermissionKey[] };

// The state of every server render and of the first client render.
export const LOADING_STATE: SessionState = { status: "loading" };

const PLAIN_GUEST: SessionState = { status: "guest", endedReason: null };

export interface SessionActions {
  /** Both reject with the `ApiError`, so a form can map it. */
  signIn(input: LoginBody): Promise<void>;
  signUp(body: RegisterBody): Promise<void>;
}

export interface SessionConfig {
  /** `NEXT_PUBLIC_API_URL`. */
  baseUrl: string;
  fetch?: typeof fetch;
  now?: () => number;
  /**
   * A session ended. Cancels what is in flight and empties the query cache, before anyone
   * is told. The session calls it from the end session path.
   */
  onSessionEnd(): void;
  /** A person signed in or registered. Refetches what depends on who is looking. */
  onUserChange(): void;
}

export interface Session {
  api: ApiClient;
  actions: SessionActions;
  /** The same object until a transition happens, as `useSyncExternalStore` requires. */
  getState(): SessionState;
  subscribe(listener: () => void): () => void;
}

interface TokenRecord {
  accessToken: string;
  /** `now()` when the response arrived plus `expiresIn`, so only the browser clock is used. */
  expiresAt: number;
}

/**
 * The only place the access token lives: a variable in this closure. It is in no React
 * state, no hook result, no `ApiError`, no storage and no URL. Creating a session does
 * nothing (no request, no cookie read), because React may run a `useState` initializer twice.
 */
export function createSession(config: SessionConfig): Session {
  const { now = Date.now } = config;

  let state: SessionState = LOADING_STATE;
  let token: TokenRecord | null = null;
  // Every action that changes the state starts a new epoch. Work that began under an older
  // one is dropped (its token is never stored) and requests tied to it are aborted.
  let epoch = 0;
  let sessionAbort = new AbortController();
  const listeners = new Set<() => void>();

  function setState(next: SessionState) {
    state = next;
    listeners.forEach((listener) => listener());
  }

  function startEpoch(): number {
    sessionAbort.abort();
    sessionAbort = new AbortController();
    return ++epoch;
  }

  function assertCurrent(startedIn: number) {
    if (epoch !== startedIn) {
      throw new DOMException("The session changed.", "AbortError");
    }
  }

  const client = createApiClient({
    baseUrl: config.baseUrl,
    fetch: config.fetch,
    session: {
      signal: () => sessionAbort.signal,
      getToken: () => Promise.resolve(token?.accessToken ?? null),
    },
  });

  // Login and register answer with a token. Who the person is comes from `/auth/me`, never
  // from decoding the token. The order matters: the refresh cookie exists once the answer
  // arrives, so the hint goes first; then the token; then `/auth/me` with that token passed
  // by hand, so it never waits on the session it is part of building.
  async function authenticate(
    path: "/auth/login" | "/auth/register",
    body: LoginBody | RegisterBody,
  ): Promise<void> {
    const startedIn = startEpoch();
    const signal = sessionAbort.signal;

    const { accessToken, expiresIn } = await client.post<TokenResponse>(
      path,
      body,
      { auth: "none", signal },
    );
    assertCurrent(startedIn);

    writeHint();
    token = { accessToken, expiresAt: now() + expiresIn * 1000 };

    try {
      const me = await client.requestWithToken<MeResponse>(accessToken, {
        path: "/auth/me",
        signal,
      });
      assertCurrent(startedIn);
      setState({ status: "user", user: me.user, permissions: me.permissions });
    } catch (error) {
      // The login worked but the person could not be read: drop the token, keep the hint
      // (the refresh cookie is real), and let the caller see why. A session that ended
      // meanwhile has already set its own state.
      if (epoch === startedIn) {
        token = null;
        setState(PLAIN_GUEST);
      }
      throw error;
    }

    config.onUserChange();
  }

  return {
    api: client,
    actions: {
      signIn: (input) => authenticate("/auth/login", input),
      signUp: (body) => authenticate("/auth/register", body),
    },
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
