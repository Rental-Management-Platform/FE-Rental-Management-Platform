import { TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { describeError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  /** What a failed call threw. The message is `describeError(error).message`. */
  error: unknown;
  /** Shows the retry button when given. */
  onRetry?: () => void;
  title?: string;
  /**
   * Replaces the support code taken from the error. A Next.js route error has no `requestId`
   * but a `digest`. `null` hides the code.
   */
  supportCode?: string | null;
  className?: string;
}

// The support code comes from `describeError`, which returns it only for a 5xx answer: a 4xx is
// something the person can fix, and a code would only confuse.
export function ErrorState({
  error,
  onRetry,
  title = "Không tải được dữ liệu",
  supportCode,
  className,
}: ErrorStateProps) {
  const { message, requestId } = describeError(error);
  const code = supportCode === undefined ? requestId : supportCode;

  return (
    <Empty role="alert" className={cn("border-0", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <TriangleAlertIcon aria-hidden="true" className="text-destructive" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
        {code && (
          <p className="text-xs text-muted-foreground">Mã hỗ trợ: {code}</p>
        )}
      </EmptyHeader>
      {onRetry && (
        <EmptyContent>
          <Button variant="outline" size="lg" onClick={onRetry}>
            Thử lại
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}
