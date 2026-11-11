"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
  useFieldArray,
  useFormState,
  useWatch,
  type Control,
  type UseFormSetValue,
} from "react-hook-form";
import { FormField } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FeeKind, FeeUnit } from "@/lib/api/types";
import { feeKindLabel, feeUnitLabel, formatFeePrice } from "@/lib/format";
import {
  DEFAULT_UNIT_BY_KIND,
  FEE_PRICE_MAX_LENGTH,
  FEE_UNITS,
  MAX_FEES,
  kindOptions,
  nextFreeKind,
  readFeePrice,
  unitAfterKindChange,
  type FeeRowInput,
} from "../fees";
import type { PropertyInput, PropertyValues } from "../schemas/property-schema";

type PropertyControl = Control<PropertyInput, unknown, PropertyValues>;

/**
 * The fees zone of a property form: a "Các khoản phí ngoài tiền thuê" card with one row for each
 * fee the landlord adds (spec 0017). A row has four boxes, "Loại phí", "Giá (đồng)", "Đơn vị" and
 * "Ghi chú", and a "Xóa" button. The zone is empty when it opens, takes at most six rows (one for
 * each kind), and a kind another row holds is left out of the select.
 *
 * It holds no value of its own and sets no default: every value comes from `control` of the
 * parent form, so a parent that starts with rows (the edit form of #12) shows exactly those rows.
 * `setValue` is the parent's, used for one thing: when a row changes its kind, its unit follows.
 *
 * One `useFieldArray` runs the rows; the rows are read with `useWatch` everywhere else, and a row
 * is keyed by `field.id`, never by its index, so a removed row does not hand its boxes to the
 * next one.
 */
export function FeeRowsField({
  control,
  setValue,
}: {
  control: PropertyControl;
  setValue: UseFormSetValue<PropertyInput>;
}) {
  const { fields, append, remove } = useFieldArray({ control, name: "fees" });
  const watched = useWatch({ control, name: "fees" });
  const { errors } = useFormState({ control, name: "fees" });
  const titleId = useId();
  const limitId = useId();
  const zoneErrorId = useId();
  const addRef = useRef<HTMLButtonElement>(null);
  const focusAddAfterRemove = useRef(false);
  const [announcement, setAnnouncement] = useState("");

  // What each row holds now. `fields` only keeps what a row started with, so the live values
  // come from `useWatch`; a row it has not caught up with yet falls back to its starting value.
  const rows: FeeRowInput[] = fields.map(
    (field, index) => watched?.[index] ?? field,
  );
  const isFull = rows.length >= MAX_FEES;
  const zoneError = errors.fees?.message ?? errors.fees?.root?.message;

  // Focus goes back to "Thêm khoản phí" after a delete, but a full zone has that button turned
  // off until the row is gone. So the focus waits for the render that follows the delete.
  useEffect(() => {
    if (focusAddAfterRemove.current) {
      focusAddAfterRemove.current = false;
      addRef.current?.focus();
    }
  }, [fields.length]);

  const add = () => {
    const kind = nextFreeKind(rows);
    if (kind === undefined) return;
    append(
      { kind, price: "", unit: DEFAULT_UNIT_BY_KIND[kind], note: "" },
      { focusName: `fees.${rows.length}.kind` },
    );
    setAnnouncement(`Đã thêm khoản phí ${feeKindLabel(kind)}.`);
  };

  const removeRow = (index: number) => {
    const label = feeKindLabel(rows[index].kind);
    focusAddAfterRemove.current = true;
    remove(index);
    setAnnouncement(`Đã xóa khoản phí ${label}.`);
  };

  return (
    <Card
      role="group"
      aria-labelledby={titleId}
      aria-describedby={zoneError ? zoneErrorId : undefined}
    >
      <CardHeader className="border-b">
        <CardTitle id={titleId}>Các khoản phí ngoài tiền thuê</CardTitle>
        <CardDescription>
          Không bắt buộc. Mỗi loại phí khai một lần, tối đa {MAX_FEES} khoản.
        </CardDescription>
      </CardHeader>
      <CardContent className="gap-5">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Chưa có khoản phí nào.
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {fields.map((field, index) => (
              <FeeRow
                key={field.id}
                control={control}
                setValue={setValue}
                index={index}
                row={rows[index]}
                kinds={kindOptions(rows, index)}
                onRemove={() => removeRow(index)}
              />
            ))}
          </div>
        )}

        {zoneError && <FieldError id={zoneErrorId}>{zoneError}</FieldError>}

        <div className="flex flex-col items-start gap-2">
          <Button
            ref={addRef}
            type="button"
            variant="outline"
            size="lg"
            disabled={isFull}
            aria-describedby={isFull ? limitId : undefined}
            onClick={add}
          >
            <PlusIcon aria-hidden="true" />
            Thêm khoản phí
          </Button>
          {isFull && (
            <p id={limitId} className="text-sm text-muted-foreground">
              Đã đủ {MAX_FEES} loại phí.
            </p>
          )}
        </div>

        {/* One live region for the zone: it is always in the page, so a screen reader hears each
            change of its text. */}
        <p role="status" aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </CardContent>
    </Card>
  );
}

// The line under the price box: what the typed digits read as, "Miễn phí" for 0, and a hint
// while the box is empty. Nothing while the text is not a number (the box says why after a
// send). `FormField` hides it while the box has an error, so the error takes its place.
function priceLine(text: string): string | undefined {
  if (text.trim() === "") return "Nhập 0 nếu miễn phí.";
  const price = readFeePrice(text);
  return price === null ? undefined : formatFeePrice(price);
}

function FeeRow({
  control,
  setValue,
  index,
  row,
  kinds,
  onRemove,
}: {
  control: PropertyControl;
  setValue: UseFormSetValue<PropertyInput>;
  index: number;
  row: FeeRowInput;
  kinds: readonly FeeKind[];
  onRemove: () => void;
}) {
  const titleId = useId();
  const kindLabel = feeKindLabel(row.kind);

  return (
    <div
      role="group"
      aria-labelledby={titleId}
      className="flex flex-col gap-4 border-t pt-5 first:border-t-0 first:pt-0"
    >
      <div className="flex items-center justify-between gap-3">
        <p id={titleId} className="font-medium">
          Khoản phí {index + 1}: {kindLabel}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          aria-label={`Xóa khoản phí ${kindLabel}`}
          onClick={onRemove}
        >
          <Trash2Icon aria-hidden="true" />
          Xóa
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name={`fees.${index}.kind`}
          label="Loại phí"
        >
          {({ field, aria }) => (
            <Select
              value={field.value}
              onValueChange={(next) => {
                const kind = next as FeeKind;
                setValue(
                  `fees.${index}.unit`,
                  unitAfterKindChange(row.kind, kind, row.unit),
                  { shouldDirty: true },
                );
                field.onChange(kind);
              }}
            >
              <SelectTrigger
                ref={field.ref}
                size="lg"
                onBlur={field.onBlur}
                {...aria}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {kinds.map((kind) => (
                  <SelectItem key={kind} value={kind}>
                    {feeKindLabel(kind)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>

        <FormField
          control={control}
          name={`fees.${index}.price`}
          label="Giá (đồng)"
          description={priceLine(row.price)}
        >
          {({ field, aria }) => (
            <Input
              {...field}
              {...aria}
              type="text"
              size="lg"
              inputMode="numeric"
              autoComplete="off"
              maxLength={FEE_PRICE_MAX_LENGTH}
            />
          )}
        </FormField>

        <FormField control={control} name={`fees.${index}.unit`} label="Đơn vị">
          {({ field, aria }) => (
            <Select
              value={field.value}
              onValueChange={(next) => field.onChange(next as FeeUnit)}
            >
              <SelectTrigger
                ref={field.ref}
                size="lg"
                onBlur={field.onBlur}
                {...aria}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FEE_UNITS.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {feeUnitLabel(unit)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>

        <FormField
          control={control}
          name={`fees.${index}.note`}
          label="Ghi chú"
          description="Không bắt buộc, tối đa 100 ký tự."
        >
          {({ field, aria }) => (
            <Input
              {...field}
              {...aria}
              size="lg"
              autoComplete="off"
              placeholder="Tính theo đồng hồ"
            />
          )}
        </FormField>
      </div>
    </div>
  );
}
