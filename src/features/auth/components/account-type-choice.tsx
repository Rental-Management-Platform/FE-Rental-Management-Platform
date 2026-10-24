"use client";

import { useId, type Ref } from "react";
import { FieldError } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ACCOUNT_TYPES,
  type RegisterAccountType,
} from "../schemas/register-schema";

const OPTIONS: Record<
  RegisterAccountType,
  { title: string; description: string }
> = {
  landlord: {
    title: "Người đăng bài",
    description: "Đăng tin cho thuê và quản lý nhà trọ. Cần số điện thoại.",
  },
  tenant: {
    title: "Người tìm trọ",
    description: "Xem tin, lưu tin yêu thích và theo dõi chủ trọ.",
  },
};

interface AccountTypeChoiceProps {
  /** An empty string until a card is chosen: no type is preselected. */
  value: "" | RegisterAccountType;
  onChange: (value: RegisterAccountType) => void;
  onBlur: () => void;
  /** The error message to show under the cards, if any. */
  error?: string;
  /** Goes to the first card, so a message about the type can move focus there. */
  firstCardRef?: Ref<HTMLButtonElement>;
}

// Two cards in a radio group: arrow keys move between them, and a click anywhere on a card
// chooses it. It is not a `FormField`, because a label cannot name a group of radios: the group
// is named by a hidden text instead. The note under the cards is always shown, since the choice
// is final.
export function AccountTypeChoice({
  value,
  onChange,
  onBlur,
  error,
  firstCardRef,
}: AccountTypeChoiceProps) {
  const id = useId();
  const nameId = `${id}-name`;
  const noteId = `${id}-note`;
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-3">
      <span id={nameId} className="sr-only">
        Loại tài khoản
      </span>
      <RadioGroup
        aria-labelledby={nameId}
        value={value}
        onValueChange={(next) => onChange(next as RegisterAccountType)}
        onBlur={onBlur}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${noteId} ${errorId}` : noteId}
      >
        {ACCOUNT_TYPES.map((type, index) => {
          const { title, description } = OPTIONS[type];
          const itemId = `${id}-${type}`;
          return (
            <label
              key={type}
              htmlFor={itemId}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-input bg-card p-4 transition-colors has-focus-visible:border-ring has-data-[state=checked]:border-primary has-data-[state=checked]:bg-accent"
            >
              <RadioGroupItem
                id={itemId}
                value={type}
                ref={index === 0 ? firstCardRef : undefined}
                aria-labelledby={`${itemId}-title`}
                aria-describedby={`${itemId}-description`}
                className="mt-0.5"
              />
              <span className="flex min-w-0 flex-col gap-1">
                <span
                  id={`${itemId}-title`}
                  className="text-base font-semibold text-foreground"
                >
                  {title}
                </span>
                <span
                  id={`${itemId}-description`}
                  className="text-sm text-muted-foreground"
                >
                  {description}
                </span>
              </span>
            </label>
          );
        })}
      </RadioGroup>
      <p id={noteId} className="text-sm text-muted-foreground">
        Loại tài khoản không đổi được sau khi đăng ký.
      </p>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}
