import {
  CircleAlertIcon,
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Labeled, Section } from "./section";

const BADGES = [
  { variant: "default", label: "Tin mới" },
  { variant: "secondary", label: "Chủ trọ đã ẩn" },
  { variant: "outline", label: "Tất cả" },
  { variant: "destructive", label: "Admin đã ẩn" },
  { variant: "success", label: "Đang hiển thị" },
  { variant: "warning", label: "Chưa công khai" },
  { variant: "info", label: "Thông tin" },
] as const;

export function FeedbackSection() {
  return (
    <>
      <Section
        title="Thông báo trên trang"
        description="Dùng cho điều người dùng cần đọc và làm theo (hết lượt đăng tin, hết dùng thử, thanh toán thử). Kết quả ngắn như “Đã lưu” dùng toast."
      >
        <div className="grid max-w-5xl gap-4 md:grid-cols-2">
          <Alert>
            <InfoIcon />
            <AlertTitle>Lưu ý</AlertTitle>
            <AlertDescription>
              Số điện thoại chỉ hiện với người đã đăng nhập.
            </AlertDescription>
          </Alert>
          <Alert variant="info">
            <InfoIcon />
            <AlertTitle>Thanh toán thử</AlertTitle>
            <AlertDescription>
              Dự án demo, thanh toán chỉ là thanh toán thử.
            </AlertDescription>
          </Alert>
          <Alert variant="success">
            <CircleCheckIcon />
            <AlertTitle>Đã lưu thay đổi</AlertTitle>
            <AlertDescription>
              Tin đăng của bạn đã được cập nhật.
            </AlertDescription>
          </Alert>
          <Alert variant="warning">
            <TriangleAlertIcon />
            <AlertTitle>Gần hết lượt đăng tin</AlertTitle>
            <AlertDescription>
              Gói của bạn còn 1 lượt đăng tin trong tháng này.
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertTitle>Không thể lưu tin đăng</AlertTitle>
            <AlertDescription>
              Hãy kiểm tra các ô báo lỗi bên dưới rồi thử lại.
            </AlertDescription>
          </Alert>
        </div>
      </Section>

      <Section
        title="Nhãn trạng thái"
        description="Trạng thái luôn có chữ, không chỉ dựa vào màu."
      >
        <div className="flex flex-wrap items-center gap-3">
          {BADGES.map(({ variant, label }) => (
            <Badge key={variant} variant={variant}>
              {label}
            </Badge>
          ))}
        </div>
      </Section>

      <Section title="Khung chờ, vòng xoay, đường kẻ">
        <div className="grid gap-8 md:grid-cols-3">
          <Labeled label="Skeleton">
            <div className="flex items-center gap-4">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </Labeled>
          <Labeled label='Spinner · size="sm", "default", "lg"'>
            <div className="flex items-center gap-4">
              <Spinner size="sm" />
              <Spinner />
              <Spinner size="lg" />
            </div>
          </Labeled>
          <Labeled label="Separator">
            <div className="flex h-10 items-center gap-4">
              <span className="text-sm">Ngang</span>
              <Separator orientation="vertical" />
              <span className="text-sm">Dọc</span>
            </div>
            <Separator />
          </Labeled>
        </div>
      </Section>
    </>
  );
}
