"use client";

import { InfoIcon, TriangleAlertIcon } from "lucide-react";
import { useMemo } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { AccountType, AccountTypeView } from "@/lib/api/types";
import {
  IGNORED_TITLE,
  ignoredText,
  NOTE,
  NOTE_TITLE,
  READ_ONLY_NOTE,
  TYPE_NAME,
  ZONE_TITLE,
} from "../admin-permissions-text";
import { usePermissionEditor } from "../hooks/use-permission-editor";
import {
  EDITABLE_TYPES,
  grantableKeys,
  ignoredKeys,
  type MatrixModule,
} from "../permission-model";
import { PermissionBlocks } from "./permission-blocks";
import { PermissionMatrix } from "./permission-matrix";
import { SaveBar } from "./save-bar";

const TITLE_ID = "permissions-title";

/**
 * The matrix once the catalog and the three account types are read (scope #24). It says first
 * what a save does, because it is not instant: a token carries a copy of the permissions, so a new
 * list reaches a person who is signed in within 15 minutes, and a person who signs in again has it
 * at once. A person without `account_type:update` sees the matrix and no save bar.
 *
 * If the server holds a permission that the matrix cannot show (a key that is not in the catalog,
 * or that only an admin may hold), the page says so, because saving would drop it: the API replaces
 * the whole list and would refuse those keys anyway.
 */
export function PermissionEditor({
  modules,
  types,
  mayEdit,
}: {
  modules: readonly MatrixModule[];
  types: readonly AccountTypeView[];
  mayEdit: boolean;
}) {
  const editor = usePermissionEditor(modules, types);
  const grantable = useMemo(() => grantableKeys(modules), [modules]);

  const nameOf = (key: AccountType) =>
    types.find((t) => t.key === key)?.name || TYPE_NAME[key];
  const typeNames: Record<AccountType, string> = {
    landlord: nameOf("landlord"),
    tenant: nameOf("tenant"),
    admin: nameOf("admin"),
  };
  const adminKeys = useMemo(
    () => new Set(types.find((t) => t.key === "admin")?.permissions ?? []),
    [types],
  );
  const ignored = EDITABLE_TYPES.map((type) => ({
    type,
    keys: ignoredKeys(
      types.find((t) => t.key === type),
      grantable,
    ),
  })).filter((entry) => entry.keys.length > 0);

  const matrix = {
    modules,
    typeNames,
    adminKeys,
    current: editor.current,
    canEdit: mayEdit,
    saving: editor.saving,
    onToggle: editor.toggle,
  };
  const showBar =
    mayEdit &&
    (editor.dirtyTypes.length > 0 ||
      Object.values(editor.failures).some(Boolean));

  return (
    <>
      <Alert variant="info">
        <InfoIcon aria-hidden="true" />
        <AlertTitle>{NOTE_TITLE}</AlertTitle>
        <AlertDescription>{NOTE}</AlertDescription>
      </Alert>
      {!mayEdit && (
        <Alert>
          <InfoIcon aria-hidden="true" />
          <AlertDescription>{READ_ONLY_NOTE}</AlertDescription>
        </Alert>
      )}
      {ignored.map(({ type, keys }) => (
        <Alert key={type} variant="warning">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>{IGNORED_TITLE}</AlertTitle>
          <AlertDescription>
            {ignoredText(typeNames[type], keys)}
          </AlertDescription>
        </Alert>
      ))}

      <Card role="group" aria-labelledby={TITLE_ID}>
        <CardHeader className="border-b">
          <CardTitle>
            <h2 id={TITLE_ID} className="text-base">
              {ZONE_TITLE}
            </h2>
          </CardTitle>
        </CardHeader>
        {/* The same boxes twice: a table from `md` and stacked blocks below it. The hidden one is
            `display: none`, so a screen reader reads only one. */}
        <div className="hidden md:block">
          <PermissionMatrix {...matrix} />
        </div>
        <div className="md:hidden">
          <PermissionBlocks {...matrix} />
        </div>
      </Card>

      {showBar && (
        <SaveBar
          typeNames={typeNames}
          changes={editor.changes}
          dirtyTypes={editor.dirtyTypes}
          failures={editor.failures}
          saving={editor.saving}
          onSave={() => void editor.save()}
          onDiscard={editor.discard}
        />
      )}
    </>
  );
}
