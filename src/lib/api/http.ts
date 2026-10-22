// Pure helpers for talking to the API: no React, no browser only code, no state. The browser
// client uses them now, and the server reader (src/lib/api/server.ts) will reuse them.

import {
  HTTP_ERROR_MESSAGE,
  createApiError,
  invalidResponseError,
  isKnownErrorCode,
  type ApiError,
} from "./errors";
import { blockSecondsFor } from "./rate-limits";
import type { FieldError } from "./types";

export type QueryPrimitive = string | number | boolean | null | undefined;
export type QueryValue = QueryPrimitive | QueryPrimitive[];
export type Query = Record<string, QueryValue>;

/** What `parseResponse` needs to know about the request that got the response. */
export interface RequestTarget {
  method: string;
  path: string;
}

/**
 * Address plus path plus query string. `path` must start with one `/`, so a token can only
 * ever go to the API address. Values that are `undefined`, `null` or `""` are dropped,
 * booleans become `true` or `false`, and an array repeats the key.
 */
export function buildUrl(baseUrl: string, path: string, query?: Query): string {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error(`API path must start with one "/", got "${path}".`);
  }

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item === undefined || item === null || item === "") continue;
      search.append(key, String(item));
    }
  }

  const queryString = search.toString();
  if (!queryString) return `${baseUrl}${path}`;
  return `${baseUrl}${path}${path.includes("?") ? "&" : "?"}${queryString}`;
}

/**
 * Seconds from the `Retry-After` header, or null. The browser hides the header from
 * cross origin pages, so null is normal. Only an integer of 1 or more counts.
 */
export function readRetryAfter(headers: Headers): number | null {
  const raw = headers.get("Retry-After")?.trim();
  if (!raw || !/^\d+$/.test(raw)) return null;
  const seconds = Number(raw);
  return seconds >= 1 ? seconds : null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const tryParseJson = (text: string): { value: unknown } | null => {
  try {
    return { value: JSON.parse(text) };
  } catch {
    return null;
  }
};

function readFieldErrors(value: unknown): FieldError[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry): FieldError[] =>
    isRecord(entry) &&
    typeof entry.field === "string" &&
    typeof entry.message === "string"
      ? [
          {
            field: entry.field,
            code: typeof entry.code === "string" ? entry.code : "",
            message: entry.message,
          },
        ]
      : [],
  );
}

// The wait after a 429: the header when readable, else the table, else 60 seconds.
function readWait(response: Response, request: RequestTarget) {
  const fromHeader = readRetryAfter(response.headers);
  return fromHeader !== null
    ? { retryAfterSeconds: fromHeader, retryAfterExact: true }
    : {
        retryAfterSeconds: blockSecondsFor(request.method, request.path),
        retryAfterExact: false,
      };
}

function errorFromResponse(
  response: Response,
  body: unknown,
  request: RequestTarget,
): ApiError {
  const wait = response.status === 429 ? readWait(response, request) : {};

  // A body with a string `code` and `message` is the backend's own error. A code this
  // client does not know becomes HTTP_ERROR, with the backend's message kept.
  if (
    isRecord(body) &&
    typeof body.code === "string" &&
    typeof body.message === "string"
  ) {
    return createApiError({
      status: response.status,
      code: isKnownErrorCode(body.code) ? body.code : "HTTP_ERROR",
      message: body.message,
      errors: readFieldErrors(body.errors),
      requestId: typeof body.requestId === "string" ? body.requestId : null,
      ...wait,
    });
  }

  return createApiError({
    status: response.status,
    code: "HTTP_ERROR",
    message: HTTP_ERROR_MESSAGE,
    ...wait,
  });
}

/**
 * Turns a response into its JSON value, or throws an `ApiError`. A 204 gives `undefined`.
 * The type `T` is trusted, not checked at run time. Reading the body can reject (network,
 * abort, timeout), and that rejection is left for the caller to classify.
 */
export async function parseResponse<T>(
  response: Response,
  request: RequestTarget,
): Promise<T> {
  if (response.ok && response.status === 204) return undefined as T;

  const parsed = tryParseJson(await response.text());

  if (response.ok) {
    if (parsed === null) throw invalidResponseError(response.status);
    return parsed.value as T;
  }
  throw errorFromResponse(response, parsed?.value, request);
}
