"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { isAbortError } from "@/lib/api/abort";
import { GONE_TOAST } from "../admin-catalog-text";
import { classifyCatalogError, type CatalogFailure } from "../catalog-failure";

/**
 * The delete dialog of one table of the catalog (scope #23), for a ward or an amenity: which row it
 * asks about, whether it is open, what a failed delete says, and what the confirm button does.
 *
 * The dialog stays open while the request runs and closes only when the answer has come. A row
 * that is already gone closes it too (another admin deleted it first). `CATALOG_IN_USE` keeps it
 * open and says why, because an entry a property names can never be deleted, only renamed. A ref
 * guards the press, because state lags a render behind a fast second one.
 */
export function useDeleteFlow<T>({
  send,
  doneToast,
}: {
  send: (item: T) => Promise<unknown>;
  doneToast: (item: T) => string;
}) {
  const [target, setTarget] = useState<T | null>(null);
  const [open, setOpen] = useState(false);
  const [failure, setFailure] = useState<CatalogFailure | null>(null);
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);

  const ask = (item: T) => {
    setTarget(item);
    setFailure(null);
    setOpen(true);
  };

  // Escape and a click outside must not close it while a request runs.
  const onOpenChange = (next: boolean) => {
    if (pending && !next) return;
    setOpen(next);
  };

  const confirm = async () => {
    if (target === null || inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setFailure(null);
    try {
      await send(target);
      toast.success(doneToast(target));
      setOpen(false);
    } catch (error) {
      // The session changed under the request (a sign out in this tab): nothing to show.
      if (isAbortError(error)) return;
      const next = classifyCatalogError(error);
      if (next.kind === "gone") {
        toast(GONE_TOAST);
        setOpen(false);
      } else {
        setFailure(next);
      }
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  };

  return { target, open, failure, pending, ask, onOpenChange, confirm };
}
