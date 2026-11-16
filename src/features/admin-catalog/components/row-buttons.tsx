import { Button } from "@/components/ui/button";
import { DELETE, deleteLabel, EDIT, editLabel } from "../admin-catalog-text";

/**
 * "Sửa" and "Xóa" of a ward or an amenity. A button is drawn only for a person who holds its
 * permission (`catalog:update`, `catalog:delete`), and the backend still decides. The names carry
 * the row, so a screen reader hears which one it is.
 */
export function RowButtons({
  name,
  size,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
}: {
  /** The name of the row, for the accessible name of each button. */
  name: string;
  size: "sm" | "lg";
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {canUpdate && (
        <Button
          type="button"
          variant="outline"
          size={size}
          aria-label={editLabel(name)}
          onClick={onEdit}
        >
          {EDIT}
        </Button>
      )}
      {canDelete && (
        <Button
          type="button"
          variant="outline"
          size={size}
          aria-label={deleteLabel(name)}
          onClick={onDelete}
        >
          {DELETE}
        </Button>
      )}
    </div>
  );
}
