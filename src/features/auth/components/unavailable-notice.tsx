import { TriangleAlertIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  RETRY_LABEL,
  UNAVAILABLE_MESSAGE,
  UNAVAILABLE_TITLE,
} from "@/lib/session/messages";

interface UnavailableNoticeProps {
  onRetry: () => void;
  /** The retry is running: the button waits for the answer instead of sending a second one. */
  retrying: boolean;
}

// The session could not be checked and may still be valid (spec 0002 requires a retry on
// every sign in page). The form below it still works, so a person can sign in anyway.
export function UnavailableNotice({
  onRetry,
  retrying,
}: UnavailableNoticeProps) {
  return (
    <Alert variant="warning">
      <TriangleAlertIcon />
      <AlertTitle>{UNAVAILABLE_TITLE}</AlertTitle>
      <AlertDescription>
        <p>{UNAVAILABLE_MESSAGE}</p>
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={retrying}
          aria-busy={retrying}
          onClick={onRetry}
        >
          {retrying && <Spinner size="sm" />}
          {RETRY_LABEL}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
