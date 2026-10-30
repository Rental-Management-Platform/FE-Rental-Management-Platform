"use client";

import type { FormEventHandler, ReactNode } from "react";
import type { Control, Path } from "react-hook-form";
import { DatePicker } from "@/components/form/date-picker";
import { FailureNotice } from "@/components/form/failure-notice";
import { FormField } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { ListingInput, ListingValues } from "../schemas/listing-schema";
import { MoneyPreview, moneyPreviewText } from "./money-preview";

/**
 * The six fields every listing form has, in screen order. The post form puts `propertyId`
 * before them; the edit form has no such field, so a backend message for it would have
 * nowhere to go.
 */
export const LISTING_FIELDS: readonly Path<ListingInput>[] = [
  "title",
  "description",
  "price",
  "areaM2",
  "deposit",
  "availableFrom",
];

/** The ids a control is described by: what `FormField` gave, then the money preview line. */
const describedBy = (given: string | undefined, preview: string | undefined) =>
  [given, preview].filter(Boolean).join(" ") || undefined;

interface ListingFormProps {
  /** Names the form for a screen reader. */
  label: string;
  control: Control<ListingInput, unknown, ListingValues>;
  /** The caller's `handleSubmit(...)`: what happens on submit differs for a post and a save. */
  onSubmit: FormEventHandler<HTMLFormElement>;
  /**
   * The top of the first zone: the property select when posting, the property as plain text
   * when editing (it cannot change).
   */
  property: ReactNode;
  /** `failure` and `secondsLeft` of `useFormFailure`, and `errors.root?.server?.message`. */
  failure: unknown;
  message: string | undefined;
  secondsLeft: number;
  isSubmitting: boolean;
  submitLabel: string;
  busyLabel: string;
}

// The listing form shared by the post and the edit page: two zones on the canvas with the notice
// and the submit row under them (api-for-frontend.md, 6.18 and 6.22). The caller owns the form
// state and the call; this draws the fields.
export function ListingForm({
  label,
  control,
  onSubmit,
  property,
  failure,
  message,
  secondsLeft,
  isSubmitting,
  submitLabel,
  busyLabel,
}: ListingFormProps) {
  return (
    <form
      noValidate
      method="post"
      aria-label={label}
      onSubmit={onSubmit}
      className="flex flex-col gap-6"
    >
      {/* Each zone is a labelled group, like the fieldset it replaces. The hairline under the
          title row is there because a form follows it. */}
      <Card role="group" aria-labelledby="listing-main-title">
        <CardHeader className="border-b">
          <CardTitle id="listing-main-title">Thông tin chính</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {property}
            <FormField
              control={control}
              name="title"
              label="Tiêu đề"
              description="Từ 5 đến 120 ký tự."
            >
              {({ field, aria }) => (
                <Input
                  size="lg"
                  autoComplete="off"
                  placeholder="Phòng đẹp có gác gần chợ Bến Thành"
                  {...field}
                  {...aria}
                />
              )}
            </FormField>
            <FormField
              control={control}
              name="description"
              label="Mô tả"
              description="Từ 10 đến 5.000 ký tự, văn bản thường."
            >
              {({ field, aria }) => (
                <Textarea
                  rows={6}
                  placeholder="Giờ giấc, chỗ để xe, nội thất, quy định chung"
                  {...field}
                  {...aria}
                />
              )}
            </FormField>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card role="group" aria-labelledby="listing-price-title">
        <CardHeader className="border-b">
          <CardTitle id="listing-price-title">
            Giá, diện tích và ngày vào ở
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="md:grid md:grid-cols-2">
            <FormField
              control={control}
              name="price"
              label="Giá thuê (đồng mỗi tháng)"
              description="Từ 100.000 đến 100.000.000."
            >
              {({ field, aria }) => {
                const previewId = `${aria.id}-preview`;
                const preview = moneyPreviewText(field.value);
                return (
                  <>
                    <Input
                      size="lg"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="3500000"
                      {...field}
                      {...aria}
                      aria-describedby={describedBy(
                        aria["aria-describedby"],
                        preview ? previewId : undefined,
                      )}
                    />
                    <MoneyPreview
                      id={previewId}
                      typed={field.value}
                      suffix=" mỗi tháng"
                    />
                  </>
                );
              }}
            </FormField>
            <FormField
              control={control}
              name="areaM2"
              label="Diện tích (m²)"
              description="Tối đa một chữ số sau dấu phẩy."
            >
              {({ field, aria }) => (
                <Input
                  size="lg"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="22,5"
                  {...field}
                  {...aria}
                />
              )}
            </FormField>
            <FormField
              control={control}
              name="deposit"
              label="Tiền cọc (đồng)"
              description="Để trống nếu không thu cọc."
            >
              {({ field, aria }) => {
                const previewId = `${aria.id}-preview`;
                const preview = moneyPreviewText(field.value);
                return (
                  <>
                    <Input
                      size="lg"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="3500000"
                      {...field}
                      {...aria}
                      aria-describedby={describedBy(
                        aria["aria-describedby"],
                        preview ? previewId : undefined,
                      )}
                    />
                    <MoneyPreview id={previewId} typed={field.value} />
                  </>
                );
              }}
            </FormField>
            <FormField
              control={control}
              name="availableFrom"
              label="Ngày vào ở"
              description="Để trống nếu có thể vào ở ngay."
            >
              {({ field, aria }) => <DatePicker {...field} {...aria} />}
            </FormField>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <FailureNotice failure={failure} message={message} />
        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting || secondsLeft > 0}
            aria-busy={isSubmitting}
          >
            {isSubmitting && <Spinner size="sm" />}
            {isSubmitting ? busyLabel : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
