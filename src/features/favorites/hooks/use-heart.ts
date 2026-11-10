"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Uuid } from "@/lib/api/types";
import { useSession } from "@/lib/session/auth-provider";
import { useCountdown } from "@/lib/use-countdown";
import { classifyFavoriteError } from "../favorite-errors";
import { toHeartView, type HeartFlag } from "../favorite-view";
import { useToggleFavorite } from "./use-toggle-favorite";

const SAVED = "Đã lưu tin.";
const UNSAVED = "Đã bỏ lưu tin.";

// One id for every failure, so a second one replaces the first and toasts never pile up.
const FAILURE_TOAST_ID = "favorite-failure";

type UseHeartOptions = {
  listingId: Uuid;
  /** What the place that shows the heart knows about the flag of this listing. */
  flag: HeartFlag;
  /** Told after a save or an unsave went through, with the new state. */
  onChanged?: (saved: boolean) => void;
};

/**
 * The behaviour of one heart (api-for-frontend.md, 6.33), shared by the card on a public list, the
 * button on the detail page and the card on the saved page. It turns the session and the flag
 * into one `HeartView` and runs the press.
 *
 * While a call is in flight, and while a 429 counts down, the press does nothing. The heart stays
 * focusable, so focus is not lost (the rule of the chat box). A failure is a toast, because a card
 * has no room for a message of its own. When the listing is gone (a 404 on a save) the page is
 * asked to draw itself again, so the card leaves a list and the detail page says "not found".
 */
export function useHeart({ listingId, flag, onChanged }: UseHeartOptions) {
  const session = useSession();
  const router = useRouter();
  const mutation = useToggleFavorite(listingId);
  const [announcement, setAnnouncement] = useState("");
  const sending = useRef(false);

  const view = toHeartView(session, flag);
  const secondsLeft = useCountdown(mutation.error);
  const locked = mutation.isPending || secondsLeft > 0;

  const toggle = () => {
    // `isPending` only turns true a moment after the press, so a second press in the same instant
    // would still get through. The ref closes that gap at once.
    if (view.kind !== "ready" || locked || sending.current) return;
    sending.current = true;
    const next = !view.saved;
    setAnnouncement("");
    mutation.mutate(next, {
      onSuccess: () => {
        // An old failure on screen is no longer true.
        toast.dismiss(FAILURE_TOAST_ID);
        setAnnouncement(next ? SAVED : UNSAVED);
        onChanged?.(next);
      },
      onError: (error) => {
        const failure = classifyFavoriteError(error);
        toast.error(failure.message, { id: FAILURE_TOAST_ID });
        if (failure.kind === "gone") router.refresh();
      },
      onSettled: () => {
        sending.current = false;
      },
    });
  };

  return {
    view,
    pending: mutation.isPending,
    locked,
    announcement,
    toggle,
  };
}
