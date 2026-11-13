import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Profile } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { ACCOUNT_TYPE_LABEL } from "../access";

// The three facts a person cannot change here: email, account type and the day they joined
// (api-for-frontend.md, 6.35). Shown as they came, and never as boxes that look editable.
export function AccountDetails({ profile }: { profile: Profile }) {
  return (
    <Card role="group" aria-labelledby="account-details-title">
      <CardHeader className="border-b">
        <CardTitle>
          <h2 id="account-details-title" className="text-base">
            Thông tin tài khoản
          </h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid gap-4 sm:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-1">
            <dt className="text-sm text-muted-foreground">Email</dt>
            <dd className="text-base font-medium break-words">
              {profile.email}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-sm text-muted-foreground">Loại tài khoản</dt>
            <dd className="text-base font-medium">
              {ACCOUNT_TYPE_LABEL[profile.accountType]}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-sm text-muted-foreground">Tham gia từ</dt>
            <dd className="text-base font-medium">
              {formatDateTime(profile.createdAt)}
            </dd>
          </div>
        </dl>
        <p className="text-sm text-muted-foreground">
          Email và loại tài khoản không đổi được.
        </p>
      </CardContent>
    </Card>
  );
}
