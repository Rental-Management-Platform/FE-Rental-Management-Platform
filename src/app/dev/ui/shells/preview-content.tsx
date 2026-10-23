import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const SAMPLE_CARDS = [
  { title: "Tin đang hiển thị", value: "12" },
  { title: "Lượt xem tuần này", value: "1.248" },
  { title: "Liên hệ mới", value: "7" },
] as const;

interface PreviewContentProps {
  title: string;
  // Public pages keep their content inside `max-w-6xl`; the workspace fills the space.
  contained?: boolean;
}

// Stand in page content, so a shell preview shows how real content sits inside the frame.
export function PreviewContent({ title, contained }: PreviewContentProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        contained && "mx-auto w-full max-w-6xl px-4 py-8 md:px-6",
      )}
    >
      <div className="flex flex-col gap-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dev/ui">Thư viện giao diện</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1>{title}</h1>
        <p className="max-w-2xl text-muted-foreground">
          Đây là nội dung mẫu để xem cách trang thật nằm trong khung. Thử thu
          nhỏ cửa sổ, nhấn Tab để thấy liên kết bỏ qua, và mở menu.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {SAMPLE_CARDS.map((card) => (
          <Card key={card.title}>
            <CardHeader>
              <CardDescription>{card.title}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {card.value}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Số liệu mẫu, không lấy từ API.
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
