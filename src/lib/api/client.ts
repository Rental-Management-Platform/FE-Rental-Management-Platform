import "client-only";
import {
  isApiError,
  missingTokenError,
  networkError,
  timeoutError,
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

export interface ApiClientDeps {
  /** `NEXT_PUBLIC_API_URL`: an absolute address, or a path such as `/api/v1`. */
  baseUrl: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
}

const abortError = () =>
  new DOMException("The operation was aborted.", "AbortError");

export function createApiClient(deps: ApiClientDeps): ApiClient {
  const { baseUrl, timeoutMs = REQUEST_TIMEOUT_MS } = deps;
  // `fetch` called as a method of another object throws "Illegal invocation".
  const doFetch: typeof fetch =
    deps.fetch ?? ((input, init) => globalThis.fetch(input, init));

  // One send. A call aborted by the caller is rethrown as the native AbortError, unwrapped.
  async function attempt<T>(
    options: RequestOptions,
    headers: Record<string, string>,
  ): Promise<T> {
    const method = (options.method ?? "GET").toUpperCase();
    const url = buildUrl(baseUrl, options.path, options.query);
    const hasBody = options.body !== undefined;
    const isForm = options.body instanceof FormData;

    const timeout = AbortSignal.timeout(timeoutMs);
    const signal = options.signal
      ? AbortSignal.any([timeout, options.signal])
      : timeout;

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
      if (options.signal?.aborted) {
        throw error instanceof DOMException && error.name === "AbortError"
          ? error
          : abortError();
      }
      if (timeout.aborted) throw timeoutError();
      throw networkError();
    }
  }

  async function request<T>(options: RequestOptions): Promise<T> {
    // Without a session there is no token, so the caller is a guest.
    if ((options.auth ?? "required") === "required") throw missingTokenError();
    return attempt<T>(options, {});
  }

  return {
    request,
    get: (path, options) => request({ ...options, method: "GET", path }),
    post: (path, body, options) =>
      request({ ...options, method: "POST", path, body }),
    patch: (path, body, options) =>
      request({ ...options, method: "PATCH", path, body }),
    delete: (path, options) => request({ ...options, method: "DELETE", path }),
  };
}
