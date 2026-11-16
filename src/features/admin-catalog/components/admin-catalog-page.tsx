"use client";

import { PageHeader } from "@/components/layout/page-header";
import { ForbiddenState } from "@/components/states/forbidden-state";
import { useSession } from "@/lib/session/auth-provider";
import { can } from "@/lib/session/can";
import {
  ADMIN_CATALOG_DESCRIPTION,
  ADMIN_CATALOG_FORBIDDEN_MESSAGE,
  ADMIN_CATALOG_TITLE,
} from "../admin-catalog-text";
import { AmenitiesZone } from "./amenities-zone";
import { WardsZone } from "./wards-zone";

/**
 * "Danh mục" (scope #23): the wards and the amenities the landlord forms offer, each in a zone of
 * its own with its own read and its own states. It runs in the browser, behind the route gate of
 * the admin. The two lists are public to read, so a person without `catalog:read` gets the
 * forbidden state and no request is made; the writes are checked by the backend, and a button is
 * drawn only for the permission it needs.
 */
export function AdminCatalogPage() {
  const session = useSession();
  if (!can(session, "catalog:read")) {
    return <ForbiddenState message={ADMIN_CATALOG_FORBIDDEN_MESSAGE} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={ADMIN_CATALOG_TITLE}
        description={ADMIN_CATALOG_DESCRIPTION}
      />
      <WardsZone />
      <AmenitiesZone />
    </div>
  );
}
