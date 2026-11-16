"use client";

import { useQuery } from "@tanstack/react-query";
import { MapPinnedIcon, SearchXIcon } from "lucide-react";
import { useId, useMemo, useRef, useState, type ReactNode } from "react";
import { ListPagination } from "@/components/list-pagination";
import { EmptyState } from "@/components/states/empty-state";
import { LoadingState } from "@/components/states/loading-state";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { CatalogWard } from "@/lib/api/types";
import { lastPageOf } from "@/lib/pagination";
import { useApi, useSession } from "@/lib/session/auth-provider";
import { can } from "@/lib/session/can";
import { useReturnFocus } from "@/lib/use-return-focus";
import {
  ADD_WARD,
  CLEAR_SEARCH,
  NO_WARDS_DESCRIPTION,
  NO_WARDS_TITLE,
  noMatchTitle,
  SEARCH_LABEL,
  SEARCH_PLACEHOLDER,
  WARD_CREATE_DESCRIPTION,
  WARD_CREATE_TITLE,
  WARD_DELETE_DESCRIPTION,
  wardDeleteTitle,
  wardDeletedToast,
  wardEditDescription,
  wardEditTitle,
  WARDS_FAILED_TITLE,
  WARDS_TITLE,
  wardsHeading,
} from "../admin-catalog-text";
import { adminWardsQuery } from "../api/catalog";
import { useCatalogMutations } from "../hooks/use-catalog-mutations";
import { useDeleteFlow } from "../hooks/use-delete-flow";
import { filterWards } from "../ward-filter";
import { CatalogDialog } from "./catalog-dialog";
import { DeleteCatalogDialog } from "./delete-catalog-dialog";
import { ListFailure } from "./list-failure";
import { WardCreateForm, WardEditForm } from "./ward-forms";
import { WardCards, WardTable } from "./ward-list";

/** Twenty rows a page: 168 wards is too long for one screen, and the API has no paging. */
const PAGE_SIZE = 20;

const NONE: readonly CatalogWard[] = [];

/**
 * The wards, communes and special zones (scope #23): the catalog the ward picker of the landlord
 * forms reads, with "Thêm", "Sửa" (the two names) and "Xóa". The API gives all 168 at once and has
 * no search, so the zone keeps what was typed and the page in its own state and cuts the list here.
 * A button is drawn only for the permission it needs, and the backend still decides.
 *
 * Focus: a dialog that opens from a row or the toolbar gives focus back to the button, and to the
 * title of the zone when that button is gone (a row deleted).
 */
export function WardsZone() {
  const api = useApi();
  const session = useSession();
  const mayCreate = can(session, "catalog:create");
  const mayUpdate = can(session, "catalog:update");
  const mayDelete = can(session, "catalog:delete");
  const query = useQuery(adminWardsQuery(api));
  const wards = query.data ?? NONE;

  const [text, setText] = useState("");
  const [page, setPage] = useState(1);
  const searchId = useId();
  const shown = useMemo(() => filterWards(wards, text), [wards, text]);
  // A page past the last one (a delete emptied it, or a search shortened the list) shows the last.
  const current = Math.min(page, lastPageOf(shown.length, PAGE_SIZE));
  const rows = shown.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const heading = useRef<HTMLHeadingElement>(null);
  const dialogFocus = useReturnFocus(() => heading.current);
  const deleteFocus = useReturnFocus(() => heading.current);
  const [dialog, setDialog] = useState<{
    open: boolean;
    ward: CatalogWard | null;
  }>({ open: false, ward: null });
  const { removeWard } = useCatalogMutations();
  const del = useDeleteFlow<CatalogWard>({
    send: (ward) => removeWard.mutateAsync(ward.code),
    doneToast: (ward) => wardDeletedToast(ward.name),
  });

  const openCreate = () => {
    dialogFocus.remember();
    setDialog({ open: true, ward: null });
  };
  const openEdit = (ward: CatalogWard) => {
    dialogFocus.remember();
    setDialog({ open: true, ward });
  };
  const askDelete = (ward: CatalogWard) => {
    deleteFocus.remember();
    del.ask(ward);
  };
  const closeDialog = () => setDialog((d) => ({ ...d, open: false }));

  const renderBody = (): ReactNode => {
    if (query.data === undefined) {
      return query.isError ? (
        <ListFailure
          error={query.error}
          title={WARDS_FAILED_TITLE}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <LoadingState variant="table" />
      );
    }
    if (wards.length === 0) {
      return (
        <EmptyState
          icon={MapPinnedIcon}
          title={NO_WARDS_TITLE}
          description={NO_WARDS_DESCRIPTION}
        />
      );
    }
    if (shown.length === 0) {
      return (
        <EmptyState
          icon={SearchXIcon}
          title={noMatchTitle(text)}
          action={
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setText("")}
            >
              {CLEAR_SEARCH}
            </Button>
          }
        />
      );
    }
    const list = {
      rows,
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
          <WardTable {...list} />
        </div>
        <div className="md:hidden">
          <WardCards {...list} />
        </div>
        {shown.length > PAGE_SIZE && (
          <div className="border-t px-(--card-spacing) py-4">
            <ListPagination
              page={current}
              pageSize={PAGE_SIZE}
              total={shown.length}
              onPageChange={setPage}
              itemLabel="phường, xã"
            />
          </div>
        )}
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
            {query.data === undefined
              ? WARDS_TITLE
              : wardsHeading(shown.length, wards.length)}
          </h2>
        </CardTitle>
      </CardHeader>

      {wards.length > 0 && (
        <div className="flex flex-col gap-3 px-(--card-spacing) py-4 sm:flex-row sm:items-end sm:justify-between">
          <Field className="sm:max-w-sm">
            <FieldLabel htmlFor={searchId}>{SEARCH_LABEL}</FieldLabel>
            <Input
              id={searchId}
              type="search"
              size="lg"
              autoComplete="off"
              placeholder={SEARCH_PLACEHOLDER}
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                setPage(1);
              }}
            />
          </Field>
          {mayCreate && (
            <Button type="button" size="lg" onClick={openCreate}>
              {ADD_WARD}
            </Button>
          )}
        </div>
      )}
      {wards.length === 0 && query.data !== undefined && mayCreate && (
        <div className="px-(--card-spacing) py-4">
          <Button type="button" size="lg" onClick={openCreate}>
            {ADD_WARD}
          </Button>
        </div>
      )}

      {renderBody()}

      <CatalogDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        onCloseAutoFocus={dialogFocus.onCloseAutoFocus}
        title={
          dialog.ward === null
            ? WARD_CREATE_TITLE
            : wardEditTitle(dialog.ward.name)
        }
        description={
          dialog.ward === null
            ? WARD_CREATE_DESCRIPTION
            : wardEditDescription(dialog.ward.code)
        }
      >
        {dialog.ward === null ? (
          <WardCreateForm
            key="new"
            province={wards[0]}
            onDone={closeDialog}
            onCancel={closeDialog}
          />
        ) : (
          <WardEditForm
            key={dialog.ward.code}
            ward={dialog.ward}
            onDone={closeDialog}
            onCancel={closeDialog}
          />
        )}
      </CatalogDialog>
      <DeleteCatalogDialog
        title={del.target === null ? "" : wardDeleteTitle(del.target.name)}
        description={WARD_DELETE_DESCRIPTION}
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
