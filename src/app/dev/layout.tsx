import { notFound } from "next/navigation";
import type { ReactNode } from "react";

// Everything under /dev (the design gallery and its sample screens) is a development tool, so a
// production build answers 404 for all of it.
export default function DevLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return children;
}
