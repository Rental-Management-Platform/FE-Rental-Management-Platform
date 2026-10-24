import { InfoIcon, LockIcon } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import type { EndedReason } from "@/lib/session/create-session";
import { endedMessage } from "@/lib/session/messages";

// Why the person is on the sign in page again (spec 0005, AC-10). It says nothing when there
// is nothing to say: a plain guest, or `unavailable`, which has its own notice with a retry.
export function EndedNotice({ reason }: { reason: EndedReason | null }) {
  const message = endedMessage(reason);
  if (message === null) return null;

  return (
    <Alert variant={reason === "locked" ? "warning" : "info"}>
      {reason === "locked" ? <LockIcon /> : <InfoIcon />}
      <AlertTitle>{message}</AlertTitle>
    </Alert>
  );
}
