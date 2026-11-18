"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ForbiddenState } from "@/components/states/forbidden-state";
import { LoadingState } from "@/components/states/loading-state";
import { Card } from "@/components/ui/card";
import { ListFailure } from "@/features/admin-catalog/components/list-failure";
import { isApiError } from "@/lib/api/errors";
import { useApi, useSession } from "@/lib/session/auth-provider";
import { can } from "@/lib/session/can";
import {
  ADMIN_PERMISSIONS_DESCRIPTION,
  ADMIN_PERMISSIONS_FORBIDDEN_MESSAGE,
  ADMIN_PERMISSIONS_TITLE,
  READ_FAILED_TITLE,
} from "../admin-permissions-text";
import { accountTypesQuery, permissionCatalogQuery } from "../api/permissions";
import { buildMatrix } from "../permission-model";
import { PermissionEditor } from "./permission-editor";

/**
 * "Phân quyền" (scope #24): the matrix of what the landlord and the tenant types may do, with the
 * admin type shown as it is. It runs in the browser, because the lists need a login, and sits
 * behind the route gate of the admin. The catalog and the account types are two reads that are
 * needed together, so they load and fail together, with one "Thử lại" for both. A person without
 * `account_type:read` gets the forbidden state and no request is made; one without
 * `account_type:update` reads the matrix and has no save bar.
 */
export function AdminPermissionsPage() {
  const api = useApi();
  const session = useSession();
  const mayRead = can(session, "account_type:read");
  const mayEdit = can(session, "account_type:update");
  const catalog = useQuery({
    ...permissionCatalogQuery(api),
    enabled: mayRead,
  });
  const types = useQuery({ ...accountTypesQuery(api), enabled: mayRead });
  const modules = useMemo(
    () => (catalog.data === undefined ? [] : buildMatrix(catalog.data)),
    [catalog.data],
  );

  const refused = [catalog, types].some(
    (query) =>
      query.data === undefined &&
      isApiError(query.error) &&
      query.error.status === 403 &&
      query.error.code === "PERMISSION_DENIED",
  );
  if (!mayRead || refused) {
    return <ForbiddenState message={ADMIN_PERMISSIONS_FORBIDDEN_MESSAGE} />;
  }

  const failed = catalog.data === undefined || types.data === undefined;
  const failure = catalog.data === undefined ? catalog : types;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={ADMIN_PERMISSIONS_TITLE}
        description={ADMIN_PERMISSIONS_DESCRIPTION}
      />
      {catalog.data !== undefined && types.data !== undefined ? (
        <PermissionEditor
          modules={modules}
          types={types.data}
          mayEdit={mayEdit}
        />
      ) : (
        <Card>
          {failed && failure.isError ? (
            <ListFailure
              error={failure.error}
              title={READ_FAILED_TITLE}
              onRetry={() => {
                void catalog.refetch();
                void types.refetch();
              }}
            />
          ) : (
            <LoadingState variant="table" />
          )}
        </Card>
      )}
    </div>
  );
}
