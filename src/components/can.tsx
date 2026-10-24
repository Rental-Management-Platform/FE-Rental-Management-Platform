"use client";

import type { ReactNode } from "react";
import type { PermissionKey } from "@/lib/api/types";
import { useSession } from "@/lib/session/auth-provider";
import { can } from "@/lib/session/can";

interface CanProps {
  /** For example `listing:create`. */
  permission: PermissionKey;
  children: ReactNode;
  /** Shown when the person lacks the permission, or is a guest. Nothing by default. */
  fallback?: ReactNode;
  /** Shown while the session is being found out. Nothing by default. */
  loading?: ReactNode;
}

/**
 * Shows its children only to a person who has `permission`. It hides and never disables: a
 * dimmed button that cannot be used tells the person nothing, and the reasons that matter, such
 * as a used up quota or an ended trial, are not permissions and get a notice of their own.
 *
 * It is display only. The backend checks every call, so a hidden control is a convenience and
 * never protects anything. This is the one way to ask "may this person?": do not write a
 * check of `accountType` by hand (spec 0005, AC-14).
 */
export function Can({
  permission,
  children,
  fallback = null,
  loading = null,
}: CanProps) {
  const state = useSession();
  if (state.status === "loading") return loading;
  return can(state, permission) ? children : fallback;
}
