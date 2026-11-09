"use client";

import { StarIcon } from "lucide-react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import type { Ref } from "react";
import { FOCUS_RING } from "@/lib/focus-ring";
import { cn } from "@/lib/utils";

const CHOICES = [1, 2, 3, 4, 5];

type StarInputProps = {
  /** The chosen number of stars, or `undefined` when nothing is chosen yet. */
  value: number | undefined;
  onChange: (stars: number) => void;
  onBlur: () => void;
  /**
   * Goes on the radio that takes focus when the form moves focus to this field after an error:
   * the chosen one, or the first when none is chosen.
   */
  inputRef: Ref<HTMLButtonElement>;
  /** The id of the visible label ("Số sao"). */
  labelId: string;
  describedBy?: string;
  invalid: boolean;
  /** True while the form is sending: the choice cannot change, and focus is not lost. */
  readOnly: boolean;
};

/**
 * The star input of the review form (spec 0013, AC-7): a `radiogroup` of five radios named "1 sao"
 * to "5 sao". Radix gives the keyboard part: one Tab stop, the arrow keys move the choice, and
 * Space chooses. The stars up to the chosen one are filled. Each radio is 44 px square at every
 * width, so it is easy to hit on a phone.
 *
 * With nothing chosen the group has no value (an empty text, so Radix keeps it controlled), and
 * the form says "Hãy chọn số sao." when it is sent that way. While sending, a change is ignored
 * and the radios are not disabled, so focus stays where it was.
 */
export function StarInput({
  value,
  onChange,
  onBlur,
  inputRef,
  labelId,
  describedBy,
  invalid,
  readOnly,
}: StarInputProps) {
  const tabStop = value ?? 1;

  return (
    <RadioGroupPrimitive.Root
      value={value === undefined ? "" : String(value)}
      onValueChange={(next) => {
        if (!readOnly) onChange(Number(next));
      }}
      orientation="horizontal"
      aria-labelledby={labelId}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      aria-readonly={readOnly || undefined}
      className="flex w-fit gap-1"
    >
      {CHOICES.map((choice) => (
        <RadioGroupPrimitive.Item
          key={choice}
          value={String(choice)}
          ref={choice === tabStop ? inputRef : undefined}
          aria-label={`${choice} sao`}
          onBlur={onBlur}
          className={cn(
            FOCUS_RING,
            "flex size-11 shrink-0 items-center justify-center rounded-lg",
          )}
        >
          <StarIcon
            aria-hidden="true"
            className={cn(
              "size-7",
              choice <= (value ?? 0)
                ? "fill-current text-primary"
                : "text-muted-foreground",
            )}
          />
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  );
}
