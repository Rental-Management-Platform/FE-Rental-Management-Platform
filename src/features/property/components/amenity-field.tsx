"use client";

import { useId } from "react";
import { useController, type Control } from "react-hook-form";
import { ErrorState } from "@/components/states/error-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldError } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MAX_AMENITIES,
  toggleAmenityKey,
} from "@/features/amenities/amenity-keys";
import type { AmenityCatalog } from "@/features/amenities/amenity-catalog";
import type { PropertyInput, PropertyValues } from "../schemas/property-schema";

type PropertyControl = Control<PropertyInput, unknown, PropertyValues>;

// How many grey boxes stand in for the grid while the catalog loads. The catalog has 13 today.
const SKELETON_CELLS = 6;

/**
 * The amenities zone of a property form: a "Tiện ích" card with one tick box for each amenity of
 * `GET /amenities`, labelled with its `name`, in the order the API gives (spec 0017).
 *
 * It holds no value of its own: the ticked keys are `amenityKeys` of the parent form's `control`,
 * kept in catalog order, and the catalog arrives as `catalog` (a state the parent reads once, so
 * this zone never calls the network). A failed or slow catalog never blocks the form: the zone
 * shows its state and the form still sends an empty list.
 *
 * Once 30 are ticked, the rest are turned off and the status line says so (6.17 allows 30).
 */
export function AmenityField({
  control,
  catalog,
}: {
  control: PropertyControl;
  catalog: AmenityCatalog;
}) {
  const { field, fieldState } = useController({ control, name: "amenityKeys" });
  const titleId = useId();
  const errorId = useId();
  const keys = field.value;
  const isFull = keys.length >= MAX_AMENITIES;
  const error = fieldState.error?.message;

  return (
    <Card
      role="group"
      aria-labelledby={titleId}
      aria-describedby={error ? errorId : undefined}
    >
      <CardHeader className="border-b">
        <CardTitle id={titleId}>Tiện ích</CardTitle>
        <CardDescription>
          Không bắt buộc. Tích những gì nhà trọ có, tối đa {MAX_AMENITIES} tiện
          ích.
        </CardDescription>
      </CardHeader>
      <CardContent className="gap-4">
        {catalog.status === "loading" && (
          <div className="flex flex-col gap-4">
            <p role="status" className="sr-only">
              Đang tải danh sách tiện ích
            </p>
            <div
              aria-hidden="true"
              className="grid grid-cols-2 gap-2 sm:grid-cols-3"
            >
              {Array.from({ length: SKELETON_CELLS }, (_, index) => (
                <Skeleton key={index} className="h-11 rounded-lg" />
              ))}
            </div>
          </div>
        )}

        {catalog.status === "error" && (
          <div className="flex flex-col gap-2">
            <ErrorState
              error={catalog.error}
              title="Không tải được danh sách tiện ích"
              onRetry={catalog.retry}
              className="p-0"
            />
            <p className="text-sm text-muted-foreground">
              Bạn vẫn tạo được nhà trọ mà không chọn tiện ích.
            </p>
          </div>
        )}

        {catalog.status === "ready" && catalog.amenities.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Chưa có tiện ích nào để chọn.
          </p>
        )}

        {catalog.status === "ready" && catalog.amenities.length > 0 && (
          <>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {catalog.amenities.map((amenity, index) => {
                const checked = keys.includes(amenity.key);
                const id = `${titleId}-${amenity.key}`;
                return (
                  <li key={amenity.key}>
                    {/* The whole cell is the label, so the tap area is the cell (at least
                        44 px high) and not the 20 px box. */}
                    <label
                      htmlFor={id}
                      className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border bg-background px-3 py-2 has-disabled:cursor-not-allowed has-disabled:opacity-50 has-[[data-state=checked]]:border-primary/30 has-[[data-state=checked]]:bg-primary/5"
                    >
                      <Checkbox
                        // The first box takes the form's ref, so a message for the whole zone
                        // (from the backend, or `AMENITY_UNKNOWN`) can move focus there.
                        ref={index === 0 ? field.ref : undefined}
                        id={id}
                        checked={checked}
                        disabled={isFull && !checked}
                        aria-invalid={error ? true : undefined}
                        onBlur={field.onBlur}
                        onCheckedChange={(next) =>
                          field.onChange(
                            toggleAmenityKey(
                              catalog.amenities,
                              keys,
                              amenity.key,
                              next === true,
                            ),
                          )
                        }
                      />
                      <span className="min-w-0 text-sm break-words">
                        {amenity.name}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <p
              role="status"
              aria-live="polite"
              className="text-sm text-muted-foreground"
            >
              {isFull
                ? `Đã chọn đủ ${MAX_AMENITIES} tiện ích.`
                : `Đã chọn ${keys.length} tiện ích`}
            </p>
          </>
        )}

        {error && <FieldError id={errorId}>{error}</FieldError>}
      </CardContent>
    </Card>
  );
}
