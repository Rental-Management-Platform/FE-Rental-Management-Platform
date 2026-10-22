import "client-only";
import { abortError, isAbortError, raceSignal } from "@/lib/api/abort";
import { createApiClient, type ApiClient } from "@/lib/api/client";
import { isApiError, type ApiError } from "@/lib/api/errors";
import type {
  LoginBody,
  MeResponse,
  PermissionKey,
  RegisterBody,
  TokenResponse,
  User,
} from "@/lib/api/types";
import { endReasonForRefresh, endReasonForTokenCall } from "./end-reasons";
import { clearHint, readHint, writeHint } from "./hint";

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

// The session could not be checked right now and may still be valid.
const UNAVAILABLE: SessionState = {
  status: "guest",
  endedReason: "unavailable",
};

// A token with less than this left is renewed before it is used (contract section 4.1).
export const EARLY_REFRESH_MS = 30_000;

// Used when a 429 carries no wait at all, which the error factory should never allow.
const FALLBACK_BLOCK_SECONDS = 60;

export interface SessionActions {
  /** Both reject with the `ApiError`, so a form can map it. */
  signIn(input: LoginBody): Promise<void>;
  signUp(body: RegisterBody): Promise<void>;
  /**
   * Finds out who is looking from the hint cookie. Runs only while the state is `loading`
   * or `guest('unavailable')`, and joins the restore that is already running. Never rejects.
   */
  restore(): Promise<void>;
}

/** Development only: lets the lab page reach the 401 retry path by hand. Never the token. */
export interface SessionDebug {
  getInfo(): { expiresAt: number | null; refreshCount: number };
  /** 0 turns the early refresh off, so an expired token is sent and the server says so. */
  setEarlyRefreshMs(ms: number): void;
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
  /** Undefined in a production build. */
  debug?: SessionDebug;
}

interface TokenRecord {
  accessToken: string;
  /** `now()` when the response arrived plus `expiresIn`, so only the browser clock is used. */
  expiresAt: number;
}

// The one `POST /auth/refresh` in progress, and the epoch it was started under.
interface Refresh {
  epoch: number;
  promise: Promise<TokenRecord>;
}

const canRestore = (state: SessionState) =>
  state.status === "loading" ||
  (state.status === "guest" && state.endedReason === "unavailable");

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
  // At most one refresh is shared by every caller of the same epoch, and a restore on page
  // load is kept apart from it so the session's own calls never wait on themselves.
  let refreshing: Refresh | null = null;
  let restoring: Promise<void> | null = null;
  // Set by a 429 on refresh: a retry only lengthens the block, so later attempts fail at
  // once with the same error until the time has passed.
  let refreshBlock: { until: number; error: ApiError } | null = null;
  let refreshCount = 0;
  let earlyRefreshMs = EARLY_REFRESH_MS;
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

  // A logged in person lost the session. In this order: abort what carries the old token,
  // drop the token and the hint, empty the cache, and only then tell subscribers, so the
  // cache is already empty when any component sees the new state.
  function endSession(reason: EndedReason | null) {
    startEpoch();
    token = null;
    clearHint();
    config.onSessionEnd();
    setState(
      reason === null ? PLAIN_GUEST : { status: "guest", endedReason: reason },
    );
  }

  // ---------- Refresh ----------

  async function fetchRefresh(startedIn: number): Promise<TokenRecord> {
    try {
      const { accessToken, expiresIn } = await client.post<TokenResponse>(
        "/auth/refresh",
        undefined,
        // `none`, so it never waits on the session it is renewing. It ignores the abort
        // signal of whoever started it and has its own timeout.
        { auth: "none" },
      );
      // The session changed while this ran: the token belongs to someone who is gone.
      assertCurrent(startedIn);
      const record = { accessToken, expiresAt: now() + expiresIn * 1000 };
      token = record;
      return record;
    } catch (error) {
      if (epoch === startedIn && isApiError(error)) onRefreshFailed(error);
      throw error;
    }
  }

  // A failed refresh. While someone is logged in, an answer that proves the session is over
  // ends it. During a restore the restore reads the answer itself (nothing was loaded yet,
  // so nothing is aborted and no cache is emptied). A network error, a 5xx or a 429 never
  // ends a session: the error reaches the callers and the hint stays.
  function onRefreshFailed(error: ApiError) {
    if (error.status === 429) {
      refreshBlock = {
        until:
          now() + (error.retryAfterSeconds ?? FALLBACK_BLOCK_SECONDS) * 1000,
        error,
      };
    }
    if (state.status !== "user") return;
    const reason = endReasonForRefresh(error, true);
    if (reason !== undefined) endSession(reason);
  }

  function startRefresh(): Promise<TokenRecord> {
    const startedIn = epoch;
    refreshCount += 1;
    const promise: Promise<TokenRecord> = fetchRefresh(startedIn).finally(
      () => {
        if (refreshing?.promise === promise) refreshing = null;
      },
    );
    refreshing = { epoch: startedIn, promise };
    // Each caller handles its own copy of a failure; this keeps the shared handle from being
    // reported as unhandled when every caller has already left.
    promise.catch(() => undefined);
    return promise;
  }

  function joinRefresh(): Promise<TokenRecord> {
    if (refreshBlock !== null && now() < refreshBlock.until) {
      return Promise.reject(refreshBlock.error);
    }
    // A refresh started under an older epoch is for someone else and its result is dropped.
    if (refreshing !== null && refreshing.epoch === epoch) {
      return refreshing.promise;
    }
    return startRefresh();
  }

  // ---------- Tokens for the client ----------

  async function getToken(
    mode: "required" | "optional",
    signal?: AbortSignal,
  ): Promise<string | null> {
    // A restore on page load decides whether there is a token at all, so calls wait for it.
    if (restoring !== null) await raceSignal(restoring, signal);

    const current = token;
    // A guest: nothing to renew, and no refresh is sent on their behalf.
    if (current === null) return null;
    if (earlyRefreshMs <= 0 || current.expiresAt - now() > earlyRefreshMs) {
      return current.accessToken;
    }

    try {
      return (await raceSignal(joinRefresh(), signal)).accessToken;
    } catch (error) {
      // The caller left or the session changed: that is not a refresh failure.
      if (isAbortError(error)) throw error;
      // A token that has not really expired still works, and an optional read never fails
      // because of a refresh (it goes out as a guest if it must).
      const old = token;
      if (old !== null && old.expiresAt > now()) return old.accessToken;
      if (mode === "optional") return null;
      throw error;
    }
  }

  async function renewToken(
    rejectedToken: string,
    signal?: AbortSignal,
  ): Promise<string> {
    const current = token;
    // The session ended while the call was in flight.
    if (current === null) throw abortError();
    // Another call has already replaced the rejected token: use it, no second refresh.
    if (current.accessToken !== rejectedToken) return current.accessToken;
    return (await raceSignal(joinRefresh(), signal)).accessToken;
  }

  function rejectToken(rejectedToken: string, reason: "expired") {
    if (token?.accessToken === rejectedToken) endSession(reason);
  }

  const client = createApiClient({
    baseUrl: config.baseUrl,
    fetch: config.fetch,
    session: {
      signal: () => sessionAbort.signal,
      getToken,
      renewToken,
      rejectToken,
    },
  });

  // ---------- Restore on page load ----------

  // Settles a restore that did not reach `user`. An answer that proves there is no session
  // makes a guest and clears the hint. Anything else (network, 5xx, 429, a wrong origin)
  // only means the session could not be checked: the hint stays and `restore()` can be run
  // again.
  function failRestore(error: unknown, refreshed: boolean) {
    token = null;
    const reason = !isApiError(error)
      ? undefined
      : refreshed
        ? endReasonForTokenCall(error)
        : endReasonForRefresh(error, false);

    if (reason !== undefined) {
      clearHint();
      setState(
        reason === null
          ? PLAIN_GUEST
          : { status: "guest", endedReason: reason },
      );
      return;
    }

    console.warn("The session could not be checked just now.", error);
    if (isApiError(error) && error.code === "ORIGIN_NOT_ALLOWED") {
      console.error(
        "The API refused this origin. Add it to ALLOWED_ORIGINS on the backend.",
      );
    }
    setState(UNAVAILABLE);
  }

  async function runRestore(startedIn: number): Promise<void> {
    // Changed since `restore()` was called (a sign in): nothing is left to find out.
    if (epoch !== startedIn || !canRestore(state)) return;
    if (state.status !== "loading") setState(LOADING_STATE);

    // A guest does not spend one of the API's 60 refreshes per minute finding that out.
    if (!readHint()) {
      setState(PLAIN_GUEST);
      return;
    }

    let refreshed = false;
    try {
      const { accessToken } = await joinRefresh();
      refreshed = true;
      assertCurrent(startedIn);
      // Passed by hand and never through the session, so the restore cannot wait on itself.
      const me = await client.requestWithToken<MeResponse>(accessToken, {
        path: "/auth/me",
        signal: sessionAbort.signal,
      });
      assertCurrent(startedIn);
      setState({ status: "user", user: me.user, permissions: me.permissions });
    } catch (error) {
      // The session changed meanwhile, and whoever changed it has set the state.
      if (epoch !== startedIn) return;
      failRestore(error, refreshed);
    }
  }

  function restore(): Promise<void> {
    if (restoring !== null) return restoring;
    if (!canRestore(state)) return Promise.resolve();

    const startedIn = epoch;
    // Started on a later tick so `restoring` is set before the first state change tells
    // anyone, and a second call (React StrictMode runs effects twice) joins this one.
    const promise: Promise<void> = Promise.resolve()
      .then(() => runRestore(startedIn))
      .finally(() => {
        if (restoring === promise) restoring = null;
      });
    restoring = promise;
    return promise;
  }

  // ---------- Sign in and register ----------

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
      restore,
    },
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    debug:
      process.env.NODE_ENV === "production"
        ? undefined
        : {
            getInfo: () => ({
              expiresAt: token?.expiresAt ?? null,
              refreshCount,
            }),
            setEarlyRefreshMs: (ms) => {
              earlyRefreshMs = ms;
            },
          },
  };
}
