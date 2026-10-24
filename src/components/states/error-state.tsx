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
  error?: unknown;
  /**
   * Replaces the message taken from the error, for a state that has no error object to read
   * it from (the session could not be checked).
   */
  message?: string;
  /** Shows the retry button when given. */
  onRetry?: () => void;
  title?: string;
  /** The title is the page's one `h1`, as in `NotFoundState`, for a state that fills a page. */
  page?: boolean;
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
  message: customMessage,
  onRetry,
  title = "Không tải được dữ liệu",
  page = false,
  supportCode,
  className,
}: ErrorStateProps) {
  const { message: describedMessage, requestId } = describeError(error);
  const message = customMessage ?? describedMessage;
  const code = supportCode === undefined ? requestId : supportCode;

  return (
    <Empty role="alert" className={cn("border-0", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <TriangleAlertIcon aria-hidden="true" className="text-destructive" />
        </EmptyMedia>
        <EmptyTitle
          role={page ? "heading" : undefined}
          aria-level={page ? 1 : undefined}
        >
          {title}
        </EmptyTitle>
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
