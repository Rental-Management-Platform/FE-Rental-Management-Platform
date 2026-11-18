"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { isAbortError } from "@/lib/api/abort";
import type { AdminUserListItem } from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import { useReturnFocus } from "@/lib/use-return-focus";
import {
  GONE_TOAST,
  revokeTitle,
  revokedToast,
  userLabel,
} from "../admin-users-text";
import { adminUsersKey } from "../api/admin-users-keys";
import { revokeSessions } from "../api/users";
import { rowFocusTarget } from "../row-focus";
import {
  classifyUserError,
  describeRevokeFailure,
  type RevokeFailure,
} from "../user-failure";

/**
 * The confirm dialog of "Thu hồi phiên" (scope #20, spec 0023, AC-10), shared by every row: which
 * row it asks about, whether it is open, what a failed revoke says, and what the confirm button
 * does.
 *
 * A revoke changes no row, so on a 204 the dialog closes with a toast and the list is not read
 * again. The dialog stays open while the request runs and closes only when the answer has come. A
 * 404 `USER_NOT_FOUND` closes it too, reads the list again (the row is gone) and says so. Every
 * other failure stays inside, a 429 with its countdown, and the admin can confirm again. A ref
 * guards the press, because state lags a render behind a fast second one.
 */
export function useRevokeFlow() {
  const api = useApi();
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<AdminUserListItem | null>(null);
  const [open, setOpen] = useState(false);
  const [failure, setFailure] = useState<RevokeFailure | null>(null);
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);
  const { remember, onCloseAutoFocus } = useReturnFocus(() =>
    rowFocusTarget(target?.id),
  );

  const write = useMutation({
    mutationFn: (user: AdminUserListItem) => revokeSessions(api, user.id),
  });

  const ask = (user: AdminUserListItem) => {
    remember();
    setTarget(user);
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
      await write.mutateAsync(target);
      toast.success(revokedToast(userLabel(target)));
      setOpen(false);
    } catch (error) {
      // The session changed under the request (a sign out in this tab): nothing to show.
      if (isAbortError(error)) return;
      if (classifyUserError(error) === "gone") {
        await queryClient.invalidateQueries({ queryKey: adminUsersKey });
        toast(GONE_TOAST);
        setOpen(false);
      } else {
        setFailure(describeRevokeFailure(error));
      }
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  };

  return {
    title: target === null ? "" : revokeTitle(userLabel(target)),
    open,
    failure,
    pending,
    ask,
    onOpenChange,
    confirm,
    onCloseAutoFocus,
  };
}
