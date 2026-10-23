import { CircleAlertIcon } from "lucide-react";
import { RateLimitNotice } from "@/components/states/rate-limit-notice";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { describeError, isApiError } from "@/lib/api/errors";

interface FailureNoticeProps {
  /** The error the submit threw, or null (`failure` from `useFormFailure`). */
  failure: unknown;
  /** The form level message: `errors.root?.server?.message`. */
  message: string | undefined;
  className?: string;
}

/**
 * Everything about a failed submit that does not belong under one input: a 429 becomes the
 * rate limit notice with its countdown, anything else with a message becomes a destructive
 * alert, and a 5xx adds the support code. It never repeats a countdown of its own.
 */
export function FailureNotice({
  failure,
  message,
  className,
}: FailureNoticeProps) {
  if (isApiError(failure) && failure.status === 429) {
    return <RateLimitNotice error={failure} className={className} />;
  }
  if (!message) return null;

  // Only a 5xx answer carries a support code, see `describeError`.
  const { requestId } = describeError(failure);
  return (
    <Alert variant="destructive" className={className}>
      <CircleAlertIcon />
      <AlertTitle>{message}</AlertTitle>
      {requestId && <AlertDescription>Mã hỗ trợ: {requestId}</AlertDescription>}
    </Alert>
  );
}
