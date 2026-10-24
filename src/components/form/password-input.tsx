"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState, type ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<ComponentProps<typeof Input>, "type" | "size">;

// A password field with a show and hide button inside its right edge. It is always the 44 px
// size, so the button can be 44 px too. It replaces a "type it again" field: the person can
// look at what they typed. Spread `field` and `aria` from `FormField` onto it, as for `Input`.
export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        size="lg"
        className={cn("pr-12", className)}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        aria-pressed={visible}
        aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        disabled={props.disabled}
        onClick={() => setVisible((shown) => !shown)}
        className="absolute top-0 right-0"
      >
        {visible ? (
          <EyeOffIcon aria-hidden="true" />
        ) : (
          <EyeIcon aria-hidden="true" />
        )}
      </Button>
    </div>
  );
}
