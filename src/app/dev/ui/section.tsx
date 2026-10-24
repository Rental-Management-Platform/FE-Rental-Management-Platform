import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

// A gallery section: the heading on the canvas, the examples in a white zone, so components
// are drawn on the surface they are made for (spec 0004). A section whose examples are cards or
// boxes that need the canvas behind them passes `bare`.
export function Section({
  title,
  description,
  bare = false,
  children,
}: {
  title: string;
  description?: string;
  bare?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl md:text-2xl">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {bare ? (
        children
      ) : (
        <Card>
          <CardContent className="gap-4">{children}</CardContent>
        </Card>
      )}
    </section>
  );
}

// A small grey code label above a row of examples, the way the Button section names variants.
export function Labeled({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <code className="text-sm text-muted-foreground">{label}</code>
      {children}
    </div>
  );
}
