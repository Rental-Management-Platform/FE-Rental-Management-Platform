import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbTrailProps {
  /** The list the page belongs to, such as "Nhà trọ của tôi". It is a link. */
  parent: { label: string; href: string };
  /** The page itself. It is the current page, not a link. */
  current: string;
}

// A two step trail for the `breadcrumb` of `PageHeader`: back to the list, then where you are.
// The create and edit pages of the landlord area all use it (spec 0019, AC-17).
export function BreadcrumbTrail({ parent, current }: BreadcrumbTrailProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={parent.href}>{parent.label}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem className="min-w-0">
          <BreadcrumbPage className="truncate">{current}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
