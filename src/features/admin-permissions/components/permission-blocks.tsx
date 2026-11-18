import {
  actionLabel,
  ADMIN_ONLY,
  cellLabel,
  moduleLabel,
  moduleNote,
  NO,
  YES,
} from "../admin-permissions-text";
import { EDITABLE_TYPES } from "../permission-model";
import { EditableCell } from "./permission-cells";
import type { MatrixProps } from "./permission-matrix";

/**
 * The matrix below `md` (scope #24): each module is a block, and each action in it stacks with one
 * labelled box for the landlord and one for the tenant, then a line for what the admin holds. The
 * blocks sit inside the zone and are told apart by a hairline and a muted heading, never by a card
 * of their own, because a card never sits inside another card. It shows the same boxes as the
 * table, and the hidden one is `display: none`, so a screen reader reads only one.
 */
export function PermissionBlocks({
  modules,
  typeNames,
  adminKeys,
  current,
  canEdit,
  saving,
  onToggle,
}: MatrixProps) {
  return (
    <div className="flex flex-col">
      {modules.map((module) => {
        const headingId = `permission-module-${module.module}`;
        return (
          <section
            key={module.module}
            aria-labelledby={headingId}
            className="border-t"
          >
            <div className="flex flex-col gap-0.5 bg-muted px-(--card-spacing) py-3">
              <h3 id={headingId} className="text-base">
                {moduleLabel(module.module)}
              </h3>
              {moduleNote(module) !== null && (
                <p className="text-xs text-muted-foreground">
                  {moduleNote(module)}
                </p>
              )}
            </div>
            <ul className="flex flex-col">
              {module.actions.map((action) => (
                <li
                  key={action.key}
                  className="flex flex-col gap-3 border-t px-(--card-spacing) py-4 first:border-t-0"
                >
                  <span className="font-medium">
                    {actionLabel(module.module, action.action)}
                  </span>
                  {action.adminOnly ? (
                    <p className="text-sm text-muted-foreground">
                      {ADMIN_ONLY}
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-x-6 gap-y-3">
                      {EDITABLE_TYPES.map((type) => (
                        <label
                          key={type}
                          className="flex items-center gap-2 text-sm"
                        >
                          <EditableCell
                            checked={current(type).has(action.key)}
                            label={cellLabel(
                              typeNames[type],
                              module.module,
                              action.action,
                            )}
                            disabled={!canEdit || saving}
                            onToggle={() => onToggle(type, action.key)}
                          />
                          {typeNames[type]}
                        </label>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {typeNames.admin}: {adminKeys.has(action.key) ? YES : NO}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
