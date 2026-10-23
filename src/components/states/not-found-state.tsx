import { SearchXIcon } from "lucide-react";
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

interface NotFoundStateProps {
  title?: string;
  /** Where the button leads. */
  backHref?: string;
  backLabel?: string;
  className?: string;
}

// A page level state, so its title is the page heading (role heading keeps the card look).
export function NotFoundState({
  title = "Không tìm thấy trang",
  backHref = "/",
  backLabel = "Về trang chủ",
  className,
}: NotFoundStateProps) {
  return (
    <Empty className={cn("border-0 py-16", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchXIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle role="heading" aria-level={1}>
          {title}
        </EmptyTitle>
        <EmptyDescription>
          Địa chỉ có thể đã đổi hoặc không còn nữa.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild size="lg">
          <Link href={backHref}>{backLabel}</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
