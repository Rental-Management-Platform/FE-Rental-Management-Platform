"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { isAbortError } from "@/lib/api/abort";
import type { Page, PropertyListItem } from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import {
  deleteProperty,
  refreshAfterPropertyWrite,
} from "../api/delete-property";
import { myPropertiesPageKey } from "../api/my-properties";
import { propertyDetailKey } from "../api/properties-key";
import {
  classifyDeletePropertyError,
  type DeletePropertyFailure,
} from "../property-failure";

/** The page without the row. `total` follows, so the heading and the page links stay honest. */
export function withoutProperty(
  page: Page<PropertyListItem>,
  id: string,
): Page<PropertyListItem> {
  const items = page.items.filter((item) => item.id !== id);
  return items.length === page.items.length
    ? page
    : { ...page, items, total: Math.max(0, page.total - 1) };
}

/**
 * The one delete dialog of "Nhà trọ của tôi" (spec 0019, AC-12). A single dialog serves every
 * row, so it is driven by state and has no trigger: the page remembers the opener with
 * `useReturnFocus`.
 *
 * It waits for the server and never removes the row first. A success (and a 404, which is the
 * same outcome) closes the dialog, takes the row out of the page, and reads the property lists
 * again, so the picker of the post listing form loses it too. A 409 means a listing was added in
 * another tab: its sentence stays in the dialog and the list is read again, which turns the
 * delete button off. Any other failure stays in the dialog as well.
 */
export function useDeleteProperty(page: number) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<PropertyListItem | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<DeletePropertyFailure | null>(null);
  // State is a render behind a fast double click, so a ref guards the request itself.
  const inFlight = useRef(false);

  const ask = (property: PropertyListItem) => {
    setTarget(property);
    setFailure(null);
    setOpen(true);
  };

  // Escape and the backdrop must not close it while the request runs.
  const onOpenChange = (next: boolean) => {
    if (pending && !next) return;
    setOpen(next);
  };

  const removed = (property: PropertyListItem) => {
    setOpen(false);
    queryClient.setQueryData(
      myPropertiesPageKey(page),
      (current: Page<PropertyListItem> | undefined) =>
        current && withoutProperty(current, property.id),
    );
    queryClient.removeQueries({ queryKey: propertyDetailKey(property.id) });
    toast.success("Đã xóa nhà trọ", { description: property.name });
    void refreshAfterPropertyWrite(queryClient);
  };

  const confirm = async () => {
    if (target === null || inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setFailure(null);
    try {
      await deleteProperty(api, target.id);
      removed(target);
    } catch (error) {
      // The session changed under the request (a sign out in this tab): nothing to show.
      if (isAbortError(error)) {
        setOpen(false);
        return;
      }
      const next = classifyDeletePropertyError(error);
      if (next.kind === "gone") {
        removed(target);
      } else {
        setFailure(next);
        if (next.kind === "has-listings") {
          // The row's `listingCount` is out of date: read the list again.
          void refreshAfterPropertyWrite(queryClient);
        }
      }
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  };

  return { target, open, pending, failure, ask, onOpenChange, confirm };
}
