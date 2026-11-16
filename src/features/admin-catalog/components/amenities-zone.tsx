"use client";

import { useQuery } from "@tanstack/react-query";
import { SparklesIcon } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { EmptyState } from "@/components/states/empty-state";
import { LoadingState } from "@/components/states/loading-state";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { Amenity } from "@/lib/api/types";
import { useApi, useSession } from "@/lib/session/auth-provider";
import { can } from "@/lib/session/can";
import { useReturnFocus } from "@/lib/use-return-focus";
import {
  ADD_AMENITY,
  AMENITIES_FAILED_TITLE,
  AMENITIES_TITLE,
  AMENITY_CREATE_DESCRIPTION,
  AMENITY_CREATE_TITLE,
  AMENITY_DELETE_DESCRIPTION,
  amenitiesHeading,
  amenityDeleteTitle,
  amenityDeletedToast,
  amenityEditDescription,
  amenityEditTitle,
  NO_AMENITIES_DESCRIPTION,
  NO_AMENITIES_TITLE,
} from "../admin-catalog-text";
import { adminAmenitiesQuery } from "../api/catalog";
import { useCatalogMutations } from "../hooks/use-catalog-mutations";
import { useDeleteFlow } from "../hooks/use-delete-flow";
import { AmenityCreateForm, AmenityEditForm } from "./amenity-forms";
import { AmenityCards, AmenityTable } from "./amenity-list";
import { CatalogDialog } from "./catalog-dialog";
import { DeleteCatalogDialog } from "./delete-catalog-dialog";
import { ListFailure } from "./list-failure";

/**
 * The amenities (scope #23): the catalog the amenity boxes of the landlord forms read, with
 * "Thêm", "Sửa" (the name only) and "Xóa". It is short (13 in the demo), so it has no search and no
 * paging. It has its own read and its own states, so a failure here never touches the wards, and
 * the other way round. A button is drawn only for the permission it needs, and the backend still
 * decides. Focus works as in the wards zone.
 */
export function AmenitiesZone() {
  const api = useApi();
  const session = useSession();
  const mayCreate = can(session, "catalog:create");
  const mayUpdate = can(session, "catalog:update");
  const mayDelete = can(session, "catalog:delete");
  const query = useQuery(adminAmenitiesQuery(api));
  const { data } = query;

  const heading = useRef<HTMLHeadingElement>(null);
  const dialogFocus = useReturnFocus(() => heading.current);
  const deleteFocus = useReturnFocus(() => heading.current);
  const [dialog, setDialog] = useState<{
    open: boolean;
    amenity: Amenity | null;
  }>({ open: false, amenity: null });
  const { removeAmenity } = useCatalogMutations();
  const del = useDeleteFlow<Amenity>({
    send: (amenity) => removeAmenity.mutateAsync(amenity.key),
    doneToast: (amenity) => amenityDeletedToast(amenity.name),
  });

  const openCreate = () => {
    dialogFocus.remember();
    setDialog({ open: true, amenity: null });
  };
  const openEdit = (amenity: Amenity) => {
    dialogFocus.remember();
    setDialog({ open: true, amenity });
  };
  const askDelete = (amenity: Amenity) => {
    deleteFocus.remember();
    del.ask(amenity);
  };
  const closeDialog = () => setDialog((d) => ({ ...d, open: false }));

  const renderBody = (): ReactNode => {
    if (data === undefined) {
      return query.isError ? (
        <ListFailure
          error={query.error}
          title={AMENITIES_FAILED_TITLE}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <LoadingState variant="table" />
      );
    }
    if (data.length === 0) {
      return (
        <EmptyState
          icon={SparklesIcon}
          title={NO_AMENITIES_TITLE}
          description={NO_AMENITIES_DESCRIPTION}
        />
      );
    }
    const list = {
      rows: data,
      canUpdate: mayUpdate,
      canDelete: mayDelete,
      onEdit: openEdit,
      onDelete: askDelete,
    };
    return (
      <>
        {/* The same rows twice: a table from `md` and stacked blocks below it. The hidden one is
            `display: none`, so a screen reader reads only one. */}
        <div className="hidden md:block">
          <AmenityTable {...list} />
        </div>
        <div className="md:hidden">
          <AmenityCards {...list} />
        </div>
      </>
    );
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>
          {/* Focus lands here when a row leaves, so the title takes focus by code and has no ring
              of its own. The count is read out again when it changes. */}
          <h2
            ref={heading}
            tabIndex={-1}
            aria-live="polite"
            className="text-base outline-hidden"
          >
            {data === undefined
              ? AMENITIES_TITLE
              : amenitiesHeading(data.length)}
          </h2>
        </CardTitle>
      </CardHeader>

      {data !== undefined && mayCreate && (
        <div className="px-(--card-spacing) py-4">
          <Button type="button" size="lg" onClick={openCreate}>
            {ADD_AMENITY}
          </Button>
        </div>
      )}

      {renderBody()}

      <CatalogDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        onCloseAutoFocus={dialogFocus.onCloseAutoFocus}
        title={
          dialog.amenity === null
            ? AMENITY_CREATE_TITLE
            : amenityEditTitle(dialog.amenity.name)
        }
        description={
          dialog.amenity === null
            ? AMENITY_CREATE_DESCRIPTION
            : amenityEditDescription(dialog.amenity.key)
        }
      >
        {dialog.amenity === null ? (
          <AmenityCreateForm
            key="new"
            onDone={closeDialog}
            onCancel={closeDialog}
          />
        ) : (
          <AmenityEditForm
            key={dialog.amenity.key}
            amenity={dialog.amenity}
            onDone={closeDialog}
            onCancel={closeDialog}
          />
        )}
      </CatalogDialog>
      <DeleteCatalogDialog
        title={del.target === null ? "" : amenityDeleteTitle(del.target.name)}
        description={AMENITY_DELETE_DESCRIPTION}
        open={del.open}
        onOpenChange={del.onOpenChange}
        pending={del.pending}
        failure={del.failure}
        onConfirm={() => void del.confirm()}
        onCloseAutoFocus={deleteFocus.onCloseAutoFocus}
      />
    </Card>
  );
}
