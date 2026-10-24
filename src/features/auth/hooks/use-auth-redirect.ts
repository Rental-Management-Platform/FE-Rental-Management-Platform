"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { afterAuthPath } from "@/lib/next-path";
import { useSession } from "@/lib/session/auth-provider";

/**
 * Moves a signed in person off an auth page, to `next` when it is safe, else to the home page
 * (spec 0005, AC-7). It is the one mechanism that does this, so a sign in, a visit by someone
 * who is already signed in, and a second tab that signed in all behave the same. `replace`
 * keeps the form out of the history, so the back button does not return to it.
 */
export function useAuthRedirect(next: string | null) {
  const state = useSession();
  const router = useRouter();

  useEffect(() => {
    if (state.status === "user") {
      router.replace(afterAuthPath(next, state.user));
    }
  }, [state, next, router]);
}
