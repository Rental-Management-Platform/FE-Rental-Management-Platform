import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { BrandLink } from "./brand";

// A minimal centered frame for sign in and register: the brand on top, one card up to
// `max-w-sm`, no nav and no footer. The page puts `CardHeader` and `CardContent` inside.
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center justify-center px-4">
        <BrandLink />
      </header>
      <main
        id="main"
        tabIndex={-1}
        className="flex flex-1 items-start justify-center px-4 pt-4 pb-12 outline-hidden sm:items-center sm:pt-0"
      >
        <Card className="w-full max-w-sm">{children}</Card>
      </main>
    </div>
  );
}
