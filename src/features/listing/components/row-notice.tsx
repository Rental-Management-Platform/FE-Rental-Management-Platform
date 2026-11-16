import { CircleAlertIcon, TriangleAlertIcon } from "lucide-react";
import { RateLimitNotice } from "@/components/states/rate-limit-notice";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QuotaRefusalNotice } from "@/features/membership/components/quota-refusal-notice";
import type { RowNotice } from "../row-ui";

/**
 * The line under a row about its last write (spec 0019, AC-6, AC-7). A state that moved is a
 * quiet warning, a refusal (no plan, limit reached) is a quiet warning with the way out (spec
 * 0020, AC-8), a failed call is an error, and a 429 is the shared notice with its countdown. The
 * message of a refusal is the backend's own Vietnamese sentence, shown as it came.
 */
export function RowNoticeView({ notice }: { notice: RowNotice }) {
  switch (notice.kind) {
    case "rate-limited":
      return <RateLimitNotice error={notice.error} />;
    case "blocked":
      return <QuotaRefusalNotice code={notice.code} message={notice.message} />;
    case "warning":
      return (
        <Alert variant="warning">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertDescription>{notice.message}</AlertDescription>
        </Alert>
      );
    case "error":
      return (
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden="true" />
          <AlertDescription>{notice.message}</AlertDescription>
        </Alert>
      );
  }
}
