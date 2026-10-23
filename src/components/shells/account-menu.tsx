"use client";

import { useSession, useSessionActions } from "@/lib/session/auth-provider";
import {
  AccountMenuView,
  type AccountMenuViewProps,
} from "./account-menu-view";

// The account area: a skeleton while the session loads, "Đăng nhập" and "Đăng ký" for a guest,
// a menu for a signed in person. "Đăng xuất" does not navigate: the route gate of #5 moves a
// guest off protected pages. The server renders the loading view, so this needs no <Suspense>.
export function AccountMenu(
  props: Omit<AccountMenuViewProps, "state" | "onSignOut">,
) {
  const state = useSession();
  const { signOut } = useSessionActions();
  return (
    <AccountMenuView
      {...props}
      state={state}
      onSignOut={() => void signOut()}
    />
  );
}
