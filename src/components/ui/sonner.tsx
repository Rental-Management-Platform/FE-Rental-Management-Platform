"use client";

import type { CSSProperties } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CircleCheckIcon,
  CircleXIcon,
  InfoIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

// Light theme only and top center, like the Figma Toast set (spec 0003). There is no theme
// provider, so the theme is pinned instead of read. Toasts are for short results ("Đã lưu");
// anything the person must read and act on is an Alert that stays on the page.
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="top-center"
      // The region's accessible name; Sonner's default is the English "Notifications".
      containerAriaLabel="Thông báo"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-5 text-success" />,
        info: <InfoIcon className="size-5 text-info" />,
        warning: (
          <TriangleAlertIcon className="size-5 text-warning-foreground" />
        ),
        error: <CircleXIcon className="size-5 text-destructive" />,
        loading: <Spinner />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as CSSProperties
      }
      toastOptions={{
        // Sonner's own CSS is not in a layer, so these need `!` to win over it.
        classNames: {
          toast: "gap-3!",
          icon: "m-0! size-5!",
          title: "text-sm! font-medium!",
          description: "text-sm! text-muted-foreground!",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
