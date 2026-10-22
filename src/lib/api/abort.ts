// Pure helpers for calls that can be cancelled: no React, no state.

export const abortError = () =>
  new DOMException("The operation was aborted.", "AbortError");

export const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === "AbortError";

/** One signal that aborts when any of the given ones does, or undefined when there are none. */
export function anySignal(
  ...signals: Array<AbortSignal | undefined>
): AbortSignal | undefined {
  const present = signals.filter(
    (signal): signal is AbortSignal => signal !== undefined,
  );
  return present.length === 0 ? undefined : AbortSignal.any(present);
}

/**
 * The result of `promise`, or an AbortError as soon as `signal` aborts. Aborting only stops
 * this caller from waiting: `promise` keeps running, so the others sharing it are not
 * affected (one cancelled query must not cancel the refresh four other calls wait for).
 */
export function raceSignal<T>(
  promise: Promise<T>,
  signal: AbortSignal | undefined,
): Promise<T> {
  if (signal === undefined) return promise;
  if (signal.aborted) {
    // This caller will never read `promise`, and a rejection nobody reads is reported as
    // unhandled even though the other callers sharing it deal with it.
    promise.catch(() => undefined);
    return Promise.reject(abortError());
  }

  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(abortError());
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error: unknown) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
}
