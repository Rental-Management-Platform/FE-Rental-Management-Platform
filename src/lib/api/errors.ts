import { ERROR_CODES, type ErrorCode, type FieldError } from "./types";

export type { ErrorCode };

// Codes the client makes up itself. The backend never sends these.
export type ClientErrorCode = "NETWORK_ERROR" | "TIMEOUT" | "INVALID_RESPONSE";

export type ApiErrorCode = ErrorCode | ClientErrorCode;

// The one error shape every failed call throws. A plain Error made by a factory, so it
// survives structured clone and has no class to import. Narrow with `isApiError`.
export interface ApiError extends Error {
  name: "ApiError";
  /** HTTP status, 0 when no response arrived. */
  status: number;
  code: ApiErrorCode;
  /** Vietnamese, can be shown as it is. */
  message: string;
  /** Empty when the backend named no field. */
  errors: FieldError[];
  /** From the error body (headers are not readable across origins), null when unknown. */
  requestId: string | null;
  /** Set only on 429: seconds to wait. */
  retryAfterSeconds: number | null;
  /** True only when the seconds came from the `Retry-After` header. */
  retryAfterExact: boolean;
}

export interface ApiErrorInit {
  status: number;
  code: ApiErrorCode;
  message: string;
  errors?: FieldError[];
  requestId?: string | null;
  retryAfterSeconds?: number | null;
  retryAfterExact?: boolean;
}

export function createApiError(init: ApiErrorInit): ApiError {
  return Object.assign(new Error(init.message), {
    name: "ApiError" as const,
    status: init.status,
    code: init.code,
    errors: init.errors ?? [],
    requestId: init.requestId ?? null,
    retryAfterSeconds: init.retryAfterSeconds ?? null,
    retryAfterExact: init.retryAfterExact ?? false,
  });
}

export function isApiError(error: unknown): error is ApiError {
  return (
    error instanceof Error &&
    error.name === "ApiError" &&
    "status" in error &&
    "code" in error
  );
}

export function isKnownErrorCode(code: string): code is ErrorCode {
  return (ERROR_CODES as readonly string[]).includes(code);
}

// Fixed Vietnamese sentences for errors the client makes itself.
const MESSAGES = {
  NETWORK_ERROR:
    "Không kết nối được tới máy chủ. Hãy kiểm tra mạng rồi thử lại.",
  TIMEOUT: "Máy chủ phản hồi quá chậm. Vui lòng thử lại.",
  INVALID_RESPONSE:
    "Máy chủ trả về dữ liệu không đọc được. Vui lòng thử lại sau.",
  TOKEN_MISSING: "Bạn cần đăng nhập để tiếp tục.",
} as const;

// For an error response whose body had no usable `code` and `message` (a proxy 502 page).
export const HTTP_ERROR_MESSAGE = "Đã có lỗi xảy ra. Vui lòng thử lại sau.";

export const networkError = () =>
  createApiError({
    status: 0,
    code: "NETWORK_ERROR",
    message: MESSAGES.NETWORK_ERROR,
  });

export const timeoutError = () =>
  createApiError({ status: 0, code: "TIMEOUT", message: MESSAGES.TIMEOUT });

export const invalidResponseError = (status: number) =>
  createApiError({
    status,
    code: "INVALID_RESPONSE",
    message: MESSAGES.INVALID_RESPONSE,
  });

// A required call made without any token. Made on the machine: no request was sent, and it
// never ends a session.
export const missingTokenError = () =>
  createApiError({
    status: 401,
    code: "TOKEN_MISSING",
    message: MESSAGES.TOKEN_MISSING,
  });
