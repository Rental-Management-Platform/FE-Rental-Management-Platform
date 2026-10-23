"use client";

import { useId, type ReactNode } from "react";
import {
  Controller,
  type Control,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";

/** What a control needs so a screen reader reads its label, help text and error together. */
export interface FormFieldAria {
  id: string;
  "aria-invalid": true | undefined;
  "aria-describedby": string | undefined;
}

interface FormFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  /** Help text. It gives way to the error message while the field is invalid. */
  description?: string;
  /** Keeps the label for screen readers and hides it on screen. */
  hideLabel?: boolean;
  /** `horizontal` puts the control before its label, for a checkbox or a switch. */
  orientation?: "vertical" | "horizontal";
  className?: string;
  /**
   * Draws the control. Spread `field` onto it (RHF's value, onChange, onBlur, ref) and `aria`
   * as well, so the label points at it and the error is read with it. The ref must reach the
   * element that takes focus, so that a server error can move focus there.
   */
  children: (api: {
    field: ControllerRenderProps<TFieldValues, TName>;
    aria: FormFieldAria;
  }) => ReactNode;
}

/**
 * One form field: a visible label, the control, then help text or the error under it. The ids
 * come from `useId`, so two fields on a page never share one. shadcn's `Field` does not link
 * an error to its control by itself, so this does: `aria-describedby` and `aria-invalid` go
 * on the control and `data-invalid` on the field.
 */
export function FormField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  hideLabel,
  orientation = "vertical",
  className,
  children,
}: FormFieldProps<TFieldValues, TName>) {
  const id = useId();
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const error = fieldState.error?.message;
        const showDescription = Boolean(description) && !error;
        const aria: FormFieldAria = {
          id,
          "aria-invalid": fieldState.invalid ? true : undefined,
          "aria-describedby": error
            ? errorId
            : showDescription
              ? descriptionId
              : undefined,
        };
        const labelNode = (
          <FieldLabel
            htmlFor={id}
            className={hideLabel ? "sr-only" : undefined}
          >
            {label}
          </FieldLabel>
        );
        const messages = (
          <>
            {showDescription && (
              <FieldDescription id={descriptionId}>
                {description}
              </FieldDescription>
            )}
            {error && <FieldError id={errorId}>{error}</FieldError>}
          </>
        );
        const invalid = fieldState.invalid || undefined;

        if (orientation === "horizontal") {
          return (
            <Field
              orientation="horizontal"
              data-invalid={invalid}
              className={cn("py-3", className)}
            >
              {children({ field, aria })}
              <FieldContent>
                {labelNode}
                {messages}
              </FieldContent>
            </Field>
          );
        }

        return (
          <Field data-invalid={invalid} className={className}>
            {labelNode}
            {children({ field, aria })}
            {messages}
          </Field>
        );
      }}
    />
  );
}
