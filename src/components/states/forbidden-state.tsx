import { LockIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

interface ForbiddenStateProps {
  /** Replaces the explanation under the title, for example the message the backend sent. */
  message?: string;
  className?: string;
}

// The backend still decides who may do what. This only explains why a page did not open.
export function ForbiddenState({ message, className }: ForbiddenStateProps) {
  return (
    <Empty className={cn("border-0 py-16", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LockIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle role="heading" aria-level={1}>
          Bạn không có quyền truy cập
        </EmptyTitle>
        <EmptyDescription>
          {message ?? "Tài khoản của bạn không mở được trang này."}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild size="lg">
          <Link href="/">Về trang chủ</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
