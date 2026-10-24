"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { ErrorState } from "@/components/states/error-state";
import { ForbiddenState } from "@/components/states/forbidden-state";
import { LoadingState } from "@/components/states/loading-state";
import { AuthShell } from "@/components/shells/auth-shell";
import { CardContent } from "@/components/ui/card";
import type { AccountType } from "@/lib/api/types";
import { authHref } from "@/lib/next-path";
import { useSession, useSessionActions } from "@/lib/session/auth-provider";
import { UNAVAILABLE_MESSAGE, UNAVAILABLE_TITLE } from "@/lib/session/messages";
import { gateRedirect, gateView, type SessionStatus } from "../gate";

interface RequireSessionProps {
  /** Only this account type passes. Any signed in person passes when it is left out. */
  accountType?: AccountType;
  children: ReactNode;
}

/**
 * The route gate (spec 0005, AC-9 and AC-10): the children show only to a signed in person of
 * the right account type. Mount it in a layout, outside the shell, so a guest or a person of
 * the wrong type never sees the menu of another role. Its own states are drawn inside
 * `AuthShell`, which brings the skip link, the one `main` and a brand header.
 *
 * It is a convenience for people and never protects data: it runs in the browser, and the
 * backend checks every call. The server renders only the loading state, so nothing of a gated
 * page reaches a guest as a screen.
 */
export function RequireSession({ accountType, children }: RequireSessionProps) {
  const state = useSession();
  const { restore } = useSessionActions();
  const router = useRouter();
  // The status the last effect saw. It is how an explicit sign out (`user` then `guest(null)`)
  // is told apart from an arrival (`loading` then `guest(null)`).
  const previous = useRef<SessionStatus>("loading");

  useEffect(() => {
    const redirect = gateRedirect(previous.current, state);
    previous.current = state.status;
    if (redirect === "home") {
      router.replace("/");
    } else if (redirect === "login") {
      // Read here and never while rendering: the server does not know the query, and reading
      // it during render would make the page differ between server and browser.
      const { pathname, search } = window.location;
      router.replace(authHref("/login", `${pathname}${search}`));
    }
  }, [state, router]);

  // Leaving the page, or being hidden by <Activity>, forgets the past. Coming back to a gated
  // page after signing out on a public page then counts as an arrival, not as a sign out.
  useEffect(
    () => () => {
      previous.current = "loading";
    },
    [],
  );

  const view = gateView(state, accountType);
  if (view === "content") return children;

  return (
    <AuthShell>
      {view === "loading" && (
        <CardContent>
          <h1 className="sr-only">Đang tải trang</h1>
          <LoadingState variant="form" fields={2} />
        </CardContent>
      )}
      {view === "unavailable" && (
        <ErrorState
          page
          title={UNAVAILABLE_TITLE}
          message={UNAVAILABLE_MESSAGE}
          onRetry={() => void restore()}
        />
      )}
      {view === "forbidden" && <ForbiddenState />}
    </AuthShell>
  );
}
