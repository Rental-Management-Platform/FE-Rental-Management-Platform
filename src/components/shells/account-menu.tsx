"use client";

import { toast } from "sonner";
import { useSession, useSessionActions } from "@/lib/session/auth-provider";
import {
  AccountMenuView,
  type AccountMenuViewProps,
} from "./account-menu-view";

// The account area: a skeleton while the session loads, "Đăng nhập" and "Đăng ký" for a guest,
// a retry when the session could not be checked, and a menu for a signed in person. The server
// renders the loading view, so this needs no <Suspense>.
//
// "Đăng xuất" does not navigate and does not wait: the session is a guest the moment it is
// called, so the toast can show at once even if the server takes its full timeout to answer.
// A public page stays where it is as a guest view, and the route gate sends a gated page home.
export function AccountMenu(
  props: Omit<AccountMenuViewProps, "state" | "onSignOut" | "onRetry">,
) {
  const state = useSession();
  const { signOut, restore } = useSessionActions();
  return (
    <AccountMenuView
      {...props}
      state={state}
      onSignOut={() => {
        void signOut();
        toast.success("Đã đăng xuất");
      }}
      onRetry={() => void restore()}
    />
  );
}
