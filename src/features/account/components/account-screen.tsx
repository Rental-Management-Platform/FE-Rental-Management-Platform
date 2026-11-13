"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/states/error-state";
import { ForbiddenState } from "@/components/states/forbidden-state";
import { LoadingState } from "@/components/states/loading-state";
import { isApiError } from "@/lib/api/errors";
import { useApi, useSession } from "@/lib/session/auth-provider";
import { can } from "@/lib/session/can";
import { profileQuery } from "../api/profile";
import { AccountDetails } from "./account-details";
import { ChangePasswordForm } from "./change-password-form";
import { ProfileForm } from "./profile-form";
import { SignOutAll } from "./sign-out-all";

// The account page of every signed in person (scope #28), read in the browser with the access
// token. The gate in the route group has already let a signed in person through; this reads the
// profile and shows the zones. A person without `profile:read` gets no request at all, and an
// answer of 403 `PERMISSION_DENIED` (the permission was taken away since the last refresh)
// is the same page level state. Hiding a zone is a convenience: the backend decides.
export function AccountScreen() {
  const api = useApi();
  const session = useSession();
  const mayRead = can(session, "profile:read");
  const mayEdit = can(session, "profile:update");
  const profile = useQuery({ ...profileQuery(api), enabled: mayRead });

  const denied =
    !mayRead ||
    (isApiError(profile.error) && profile.error.code === "PERMISSION_DENIED");
  // The state carries its own `h1`, so it stands alone and the page keeps one heading.
  if (denied) {
    return (
      <ForbiddenState message="Loại tài khoản của bạn hiện chưa được xem hồ sơ cá nhân." />
    );
  }

  const renderBody = () => {
    if (profile.data !== undefined) {
      return (
        <>
          <AccountDetails profile={profile.data} />
          <ProfileForm
            // A different person starts a different form.
            key={profile.data.id}
            profile={profile.data}
            canEdit={mayEdit}
          />
          <ChangePasswordForm />
          <SignOutAll />
        </>
      );
    }
    return profile.isError ? (
      <ErrorState
        error={profile.error}
        onRetry={() => void profile.refetch()}
      />
    ) : (
      <LoadingState variant="form" fields={3} />
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tài khoản của tôi"
        description="Xem và sửa thông tin của bạn, đổi mật khẩu và quản lý các thiết bị đang đăng nhập."
      />
      {renderBody()}
    </div>
  );
}
