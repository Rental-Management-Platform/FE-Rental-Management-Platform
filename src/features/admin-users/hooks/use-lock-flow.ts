"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { dashboardKey } from "@/features/dashboard/api/stats";
import type { AdminUserListItem } from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import { useReturnFocus } from "@/lib/use-return-focus";
import {
  ALREADY_ACTIVE_TOAST,
  ALREADY_LOCKED_TOAST,
  GONE_TOAST,
  LOCK_CONFIRM,
  LOCK_PLACEHOLDER,
  LOCK_TITLE,
  UNLOCK_CONFIRM,
  UNLOCK_PLACEHOLDER,
  UNLOCK_TITLE,
  lockDescription,
  lockedToast,
  unlockDescription,
  unlockedToast,
  userLabel,
} from "../admin-users-text";
import { adminUsersKey } from "../api/admin-users-keys";
import { lockUser, unlockUser } from "../api/users";
import { rowFocusTarget } from "../row-focus";
import { classifyUserError } from "../user-failure";

/** The words of the dialog for the row it was opened on. Empty while no row was asked about. */
const dialogWords = (user: AdminUserListItem | null) => {
  if (user === null) {
    return {
      title: "",
      description: "",
      confirmLabel: "",
      placeholder: "",
      tone: "default" as const,
    };
  }
  const isAdmin = user.accountType === "admin";
  return user.status === "active"
    ? {
        title: LOCK_TITLE,
        description: lockDescription(user.email, isAdmin),
        confirmLabel: LOCK_CONFIRM,
        placeholder: LOCK_PLACEHOLDER,
        tone: "destructive" as const,
      }
    : {
        title: UNLOCK_TITLE,
        description: unlockDescription(user.email, isAdmin),
        confirmLabel: UNLOCK_CONFIRM,
        placeholder: UNLOCK_PLACEHOLDER,
        tone: "default" as const,
      };
};

/**
 * The reason dialog of the users table (scope #20, spec 0023, AC-6 to AC-9), shared by every row:
 * which row it asks about, whether it is open, and what sending does.
 *
 * A lock and an unlock write, then the list is read again before the dialog closes, so the row
 * already shows its new status and the reason the list returned (the answer of the write has no
 * `lockedReason`). The `dashboardKey` entries are marked out of date too, so the locked accounts
 * number on the dashboard card stays right. Another admin who was first (409 `ACCOUNT_ALREADY_LOCKED`
 * or `ACCOUNT_NOT_LOCKED`) or an account that is gone (404 `USER_NOT_FOUND`) closes the dialog and
 * says so in a toast, because the list is the truth now. Every other failure is thrown to
 * `ReasonDialog`, which shows it inside and keeps what was typed.
 *
 * The button that opened the dialog may be gone when it closes (a locked row has no "Khóa"), so
 * focus goes to a button of the same row, and to the heading of the results when the row left the
 * list.
 */
export function useLockFlow() {
  const api = useApi();
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<AdminUserListItem | null>(null);
  const [open, setOpen] = useState(false);
  const { remember, onCloseAutoFocus } = useReturnFocus(() =>
    rowFocusTarget(target?.id),
  );

  const write = useMutation({
    mutationFn: ({
      user,
      reason,
    }: {
      user: AdminUserListItem;
      reason: string;
    }) =>
      user.status === "active"
        ? lockUser(api, user.id, reason)
        : unlockUser(api, user.id, reason),
  });

  // The list is the truth after a write: read it again and wait for it, so the dialog closes on
  // rows that already show the new state.
  const refresh = async () => {
    void queryClient.invalidateQueries({ queryKey: dashboardKey });
    await queryClient.invalidateQueries({ queryKey: adminUsersKey });
  };

  const ask = (user: AdminUserListItem) => {
    remember();
    setTarget(user);
    setOpen(true);
  };

  const submit = async (reason: string) => {
    if (target === null) return;
    const locking = target.status === "active";
    try {
      await write.mutateAsync({ user: target, reason });
    } catch (error) {
      const outcome = classifyUserError(error);
      if (outcome === "other") throw error;
      await refresh();
      toast(
        outcome === "already-locked"
          ? ALREADY_LOCKED_TOAST
          : outcome === "already-active"
            ? ALREADY_ACTIVE_TOAST
            : GONE_TOAST,
      );
      setOpen(false);
      return;
    }
    await refresh();
    const label = userLabel(target);
    toast.success(locking ? lockedToast(label) : unlockedToast(label));
    setOpen(false);
  };

  return {
    ...dialogWords(target),
    open,
    ask,
    submit,
    onOpenChange: setOpen,
    onCloseAutoFocus,
  };
}
