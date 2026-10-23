import { NotFoundState } from "@/components/states/not-found-state";
import { PublicShell } from "@/components/shells/public-shell";

// An unknown URL lands here, outside every route group, so the public shell is added by hand
// and the person still has a header (spec 0003, AC-7).
export default function RootNotFound() {
  return (
    <PublicShell>
      <NotFoundState />
    </PublicShell>
  );
}
