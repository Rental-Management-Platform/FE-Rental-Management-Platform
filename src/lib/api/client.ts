import "client-only";
import { abortError, anySignal } from "./abort";
import {
  isApiError,
  missingTokenError,
  networkError,
  timeoutError,
  type ApiError,
} from "./errors";
import { buildUrl, parseResponse, type Query } from "./http";

// Each attempt (a send, a refresh, a resend) gets its own time limit.
const REQUEST_TIMEOUT_MS = 20_000;

/**
 * - `none`: no token, never touches the session (public routes, login, refresh).
 * - `required`: needs a login; a guest fails on the machine with 401 `TOKEN_MISSING`.
 * - `optional`: sends the token when there is one, and works as a guest when there is not.
 */
export type AuthMode = "required" | "optional" | "none";

export interface RequestOptions {
  /** Default `GET`. */
  method?: string;
  /** Under the API address; starts with `/`. */
  path: string;
  query?: Query;
  /** A JSON value, or `FormData` for a file upload. */
  body?: unknown;
  /** Default `required`. */
  auth?: AuthMode;
  /**
   * Inside a TanStack `queryFn`, always pass the `signal` it gives you: without it
   * `cancelQueries` cancels nothing.
   */
  signal?: AbortSignal;
}

type CallOptions = Omit<RequestOptions, "method" | "path" | "body">;

export interface ApiClient {
  request<T>(options: RequestOptions): Promise<T>;
  get<T>(path: string, options?: CallOptions): Promise<T>;
  post<T>(path: string, body?: unknown, options?: CallOptions): Promise<T>;
  patch<T>(path: string, body?: unknown, options?: CallOptions): Promise<T>;
  delete<T>(path: string, options?: CallOptions): Promise<T>;
}

/** What the client asks of the session that holds the access token. */
export interface SessionPort {
  /**
   * Aborts when the session changes (sign in, sign out, session end), so a call never
   * outlives the session it started under.
   */
  signal(): AbortSignal;
  /**
   * The access token for a call, or null when there is none. May wait for a restore or a
   * refresh; `signal` only ends this caller's wait, never the refresh it shares with others.
   */
  getToken(
    mode: Exclude<AuthMode, "none">,
    signal?: AbortSignal,
  ): Promise<string | null>;
  /**
   * The server answered 401 `TOKEN_EXPIRED` to `rejectedToken`: the token to resend with.
   * That is the current token when another call has already replaced the rejected one,
   * otherwise the result of the one shared refresh.
   */
  renewToken(rejectedToken: string, signal?: AbortSignal): Promise<string>;
  /**
   * The server answered a call that carried `rejectedToken` with `error`. The session decides
   * whether that answer proves it is over, and ignores it when `rejectedToken` is no longer
   * the current token (the session has moved on). A `TOKEN_EXPIRED` here means the one
   * resend failed too.
   */
  rejectToken(rejectedToken: string, error: ApiError): void;
}

export interface ApiClientDeps {
  /** `NEXT_PUBLIC_API_URL`: an absolute address, or a path such as `/api/v1`. */
  baseUrl: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
  /**
   * The session that holds the token. Without one, a `required` call fails as a guest and
   * an `optional` call goes out as a guest.
   */
  session?: SessionPort;
}

/**
 * The client as the session sees it: the public client plus the one way to send a token the
 * session holds itself (its own `/auth/me` calls), which never waits on the session.
 */
export interface SessionApiClient extends ApiClient {
  requestWithToken<T>(
    accessToken: string,
    options: Omit<RequestOptions, "auth">,
  ): Promise<T>;
}

const isTokenExpired = (error: unknown): error is ApiError =>
  isApiError(error) && error.status === 401 && error.code === "TOKEN_EXPIRED";

const bearer = (accessToken: string | null): Record<string, string> =>
  accessToken === null ? {} : { Authorization: `Bearer ${accessToken}` };

export function createApiClient(deps: ApiClientDeps): SessionApiClient {
  const { baseUrl, session, timeoutMs = REQUEST_TIMEOUT_MS } = deps;
  // `fetch` called as a method of another object throws "Illegal invocation".
  const doFetch: typeof fetch =
    deps.fetch ?? ((input, init) => globalThis.fetch(input, init));

  // One send. A call aborted by the caller or by the end of a session is rethrown as the
  // native AbortError, unwrapped.
  async function attempt<T>(
    options: RequestOptions,
    headers: Record<string, string>,
    sessionSignal?: AbortSignal,
  ): Promise<T> {
    const method = (options.method ?? "GET").toUpperCase();
    const url = buildUrl(baseUrl, options.path, options.query);
    const hasBody = options.body !== undefined;
    const isForm = options.body instanceof FormData;

    const timeout = AbortSignal.timeout(timeoutMs);
    const signal = AbortSignal.any(
      [timeout, options.signal, sessionSignal].filter(
        (item): item is AbortSignal => item !== undefined,
      ),
    );

    try {
      const response = await doFetch(url, {
        method,
        headers: {
          Accept: "application/json",
          // FormData sets its own Content-Type, with the boundary.
          ...(hasBody && !isForm && { "Content-Type": "application/json" }),
          ...headers,
        },
        body: !hasBody
          ? undefined
          : isForm
            ? (options.body as FormData)
            : JSON.stringify(options.body),
        // Lets login and register store the refresh cookie across origins.
        credentials: options.path.startsWith("/auth/") ? "include" : undefined,
        signal,
      });
      return await parseResponse<T>(response, { method, path: options.path });
    } catch (error) {
      if (isApiError(error)) throw error;
      if (options.signal?.aborted || sessionSignal?.aborted) {
        throw error instanceof DOMException && error.name === "AbortError"
          ? error
          : abortError();
      }
      if (timeout.aborted) throw timeoutError();
      throw networkError();
    }
  }

  async function request<T>(options: RequestOptions): Promise<T> {
    const mode = options.auth ?? "required";
    if (mode === "none") return attempt<T>(options, {});

    // Taken before the token, so a call belongs to the session it started under.
    const sessionSignal = session?.signal();
    // Ends this call's wait for a token when the caller leaves or the session changes.
    const waitSignal = anySignal(options.signal, sessionSignal);
    const accessToken = session
      ? await session.getToken(mode, waitSignal)
      : null;

    // No token at all: made on the machine, no request is sent, and it never ends a session.
    if (accessToken === null && mode === "required") throw missingTokenError();

    try {
      return await attempt<T>(options, bearer(accessToken), sessionSignal);
    } catch (error) {
      // Optional reads never answer 401 (an expired token only turns them into the guest
      // version, which the early refresh prevents), so only `required` has a second try.
      if (mode !== "required" || !session || accessToken === null) throw error;
      if (!isApiError(error)) throw error;
      if (!isTokenExpired(error)) {
        // Some answers prove the session is over (an invalid token, a locked account).
        session.rejectToken(accessToken, error);
        throw error;
      }
      return resendOnce<T>(
        options,
        session,
        accessToken,
        waitSignal,
        sessionSignal,
      );
    }
  }

  // The one resend: a fresh token (never a second refresh for the same attempt). If the server
  // still says it is expired, or answers with anything that ends a session, the session
  // decides and the call throws.
  async function resendOnce<T>(
    options: RequestOptions,
    session: SessionPort,
    rejectedToken: string,
    waitSignal: AbortSignal | undefined,
    sessionSignal: AbortSignal | undefined,
  ): Promise<T> {
    const renewed = await session.renewToken(rejectedToken, waitSignal);
    try {
      return await attempt<T>(options, bearer(renewed), sessionSignal);
    } catch (error) {
      if (isApiError(error)) session.rejectToken(renewed, error);
      throw error;
    }
  }

  const requestWithToken: SessionApiClient["requestWithToken"] = (
    accessToken,
    options,
  ) => attempt(options, { Authorization: `Bearer ${accessToken}` });

  return {
    request,
    requestWithToken,
    get: (path, options) => request({ ...options, method: "GET", path }),
    post: (path, body, options) =>
      request({ ...options, method: "POST", path, body }),
    patch: (path, body, options) =>
      request({ ...options, method: "PATCH", path, body }),
    delete: (path, options) => request({ ...options, method: "DELETE", path }),
  };
}
