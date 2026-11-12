"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { abortError } from "@/lib/api/abort";
import {
  reverseStreet,
  searchAddress,
  type SearchTarget,
} from "../api/nominatim";
import { LOOKUP_GAP_MS } from "../config";
import type { Pin } from "../pin";

// Waits `ms`, or rejects with an AbortError as soon as `signal` aborts.
function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(abortError());
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * The two Nominatim calls as mutations (spec 0011, AC-8, AC-9, AC-14). They are user triggered,
 * not cached reads, and mutations never retry, which also keeps them inside the public limit of
 * one request a second for the whole app.
 *
 * Both share one lane. At most one lookup is in flight: starting one aborts the older, whichever
 * kind it was. Two lookups start at least 1.1 seconds apart, so a lookup that comes too soon
 * waits for its turn (and a newer one replaces it while it waits). `abort` stops what is
 * running, for a submit, a ward change or closing the map, and leaving the page does the same.
 * An aborted mutation fails with an AbortError, which the caller ignores.
 */
export function useAddressLookup() {
  const current = useRef<AbortController | null>(null);
  const lastStart = useRef(0);

  const abort = () => {
    current.current?.abort();
    current.current = null;
  };

  useEffect(
    () => () => {
      current.current?.abort();
    },
    [],
  );

  const paced = async <T>(task: (signal: AbortSignal) => Promise<T>) => {
    current.current?.abort();
    const mine = new AbortController();
    current.current = mine;
    const remaining = lastStart.current + LOOKUP_GAP_MS - Date.now();
    if (remaining > 0) await wait(remaining, mine.signal);
    lastStart.current = Date.now();
    return task(mine.signal);
  };

  const search = useMutation({
    mutationFn: (target: SearchTarget) =>
      paced((signal) => searchAddress(target, signal)),
  });
  const reverse = useMutation({
    mutationFn: (pin: Pin) => paced((signal) => reverseStreet(pin, signal)),
  });

  return { search, reverse, abort };
}
