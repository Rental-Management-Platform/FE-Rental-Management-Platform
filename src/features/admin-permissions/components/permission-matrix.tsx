import { Fragment } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AccountType } from "@/lib/api/types";
import {
  actionLabel,
  cellLabel,
  COLUMN_ACTION,
  countLabel,
  FIXED_TYPE_NOTE,
  moduleLabel,
  moduleNote,
  TABLE_CAPTION,
} from "../admin-permissions-text";
import {
  EDITABLE_TYPES,
  type EditableType,
  type MatrixModule,
} from "../permission-model";
import { EditableCell, FixedCell, LockedCell } from "./permission-cells";

/** What the table and the blocks of the matrix need to draw a box and to change it. */
export interface MatrixProps {
  modules: readonly MatrixModule[];
  /** The three names, from the API with the fixed words as a fallback. */
  typeNames: Record<AccountType, string>;
  /** What the admin type holds: shown only, never changed. */
  adminKeys: ReadonlySet<string>;
  current: (type: EditableType) => ReadonlySet<string>;
  canEdit: boolean;
  saving: boolean;
  onToggle: (type: EditableType, key: string) => void;
}

/**
 * The matrix from `md` up (scope #24): one row per action, grouped by module, with a column for
 * each of the landlord, the tenant and the admin. It runs edge to edge in its zone. The order is
 * the one of the catalog, and the front end sorts nothing. The landlord and tenant columns hold
 * boxes, except where only an admin may hold the action (a lock); the admin column is read only.
 */
export function PermissionMatrix({
  modules,
  typeNames,
  adminKeys,
  current,
  canEdit,
  saving,
  onToggle,
}: MatrixProps) {
  return (
    <Table>
      <TableCaption className="sr-only">{TABLE_CAPTION}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>{COLUMN_ACTION}</TableHead>
          {EDITABLE_TYPES.map((type) => (
            <TableHead key={type} className="text-center">
              {typeNames[type]}
              <span className="block text-xs font-normal">
                {countLabel(current(type).size)}
              </span>
            </TableHead>
          ))}
          <TableHead className="text-center">
            {typeNames.admin}
            <span className="block text-xs font-normal">{FIXED_TYPE_NOTE}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {modules.map((module) => (
          <Fragment key={module.module}>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead
                colSpan={4}
                scope="colgroup"
                className="h-auto py-2 text-foreground"
              >
                <span className="font-semibold">
                  {moduleLabel(module.module)}
                </span>
                {moduleNote(module) !== null && (
                  <span className="block text-xs font-normal text-muted-foreground">
                    {moduleNote(module)}
                  </span>
                )}
              </TableHead>
            </TableRow>
            {module.actions.map((action) => (
              <TableRow key={action.key}>
                <TableCell>
                  {actionLabel(module.module, action.action)}
                </TableCell>
                {EDITABLE_TYPES.map((type) => {
                  const label = cellLabel(
                    typeNames[type],
                    module.module,
                    action.action,
                  );
                  return (
                    <TableCell key={type} className="text-center">
                      {action.adminOnly ? (
                        <LockedCell label={label} />
                      ) : (
                        <EditableCell
                          checked={current(type).has(action.key)}
                          label={label}
                          disabled={!canEdit || saving}
                          onToggle={() => onToggle(type, action.key)}
                        />
                      )}
                    </TableCell>
                  );
                })}
                <TableCell className="text-center">
                  <FixedCell
                    has={adminKeys.has(action.key)}
                    label={cellLabel(
                      typeNames.admin,
                      module.module,
                      action.action,
                    )}
                  />
                </TableCell>
              </TableRow>
            ))}
          </Fragment>
        ))}
      </TableBody>
    </Table>
  );
}
