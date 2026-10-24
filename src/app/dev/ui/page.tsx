import { Menu, Search } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ColorsSection } from "./colors";
import { ControlsSection } from "./controls";
import { DataDisplaySection } from "./data-display";
import { FeedbackSection } from "./feedback";
import { FormDemo } from "./form-demo";
import { OverlaysSection } from "./overlays";
import { Section } from "./section";
import { ShellsSection } from "./shells-section";
import { StatesSection } from "./states";
import { ToastDemo } from "./toast-demo";

// The line from spec 0004 (AC-1): stacked marks must show whole at heading and body sizes.
const VIETNAMESE_TEST_LINE =
  "Nguyễn Thị Hồng Nhung, đường Lê Văn Việt, phường Hiệp Phú";

const VARIANTS = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
] as const;
const SIZES = ["sm", "default", "lg"] as const;

// The scale of spec 0004 with the role of each step. Full class names, so Tailwind sees them.
const TYPE_SCALE = [
  { token: "text-4xl", size: "28 px", className: "text-4xl", role: "h1 từ md" },
  {
    token: "text-3xl",
    size: "24 px",
    className: "text-3xl",
    role: "h1 trên điện thoại, giá gói",
  },
  { token: "text-2xl", size: "22 px", className: "text-2xl", role: "h2 từ md" },
  {
    token: "text-xl",
    size: "20 px",
    className: "text-xl",
    role: "h2 trên điện thoại",
  },
  {
    token: "text-lg",
    size: "17 px",
    className: "text-lg",
    role: "h3, tiêu đề hộp thoại",
  },
  {
    token: "text-base",
    size: "15 px",
    className: "text-base",
    role: "chữ thân, tên vùng",
  },
  {
    token: "text-sm",
    size: "13 px",
    className: "text-sm",
    role: "chữ giao diện: nhãn, nút, ô bảng",
  },
  { token: "text-xs", size: "12 px", className: "text-xs", role: "chú thích" },
] as const;

const WEIGHTS = [
  {
    weight: "400",
    className: "font-normal",
    use: "Chữ thân, mô tả, giá trị trong ô nhập",
  },
  {
    weight: "500",
    className: "font-medium",
    use: "Nhãn ô, nút, thẻ chuyển, huy hiệu, đầu cột",
  },
  {
    weight: "600",
    className: "font-semibold",
    use: "Tiêu đề, tên vùng, giá",
  },
] as const;

function SpecimenRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:gap-6">
      <code className="shrink-0 text-sm text-muted-foreground md:w-60">
        {label}
      </code>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

// A development only gallery of the design system (specs 0003 and 0004). The /dev layout
// answers 404 in a production build.
export default function DevUiPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 md:px-6 md:py-8">
      <PageHeader
        title="Thư viện giao diện"
        description="Trang dành cho nhà phát triển, chỉ chạy khi phát triển. Mỗi thành phần hiện đủ biến thể, kích cỡ và trạng thái."
        actions={
          <Button asChild variant="outline" size="lg">
            <Link href="/dev/ui/screens">Mở các màn hình mẫu</Link>
          </Button>
        }
      />

      <Section
        title="Chữ tiếng Việt"
        description="Inter, ba độ đậm 400, 500 và 600. Thân 15 px, chữ giao diện 13 px, chữ gõ trong ô nhập 16 px. Dòng thử dấu ở từng cỡ cho thấy dấu chồng không bị cắt."
      >
        <div className="flex flex-col gap-4">
          <SpecimenRow label="h1 · 600 · 24 px, 28 px từ md">
            <p className="text-3xl font-semibold md:text-4xl">
              {VIETNAMESE_TEST_LINE}
            </p>
          </SpecimenRow>
          <SpecimenRow label="h2 · 600 · 20 px, 22 px từ md">
            <p className="text-xl font-semibold md:text-2xl">
              {VIETNAMESE_TEST_LINE}
            </p>
          </SpecimenRow>
          <SpecimenRow label="h3 · 600 · 17 px">
            <h3>{VIETNAMESE_TEST_LINE}</h3>
          </SpecimenRow>
          <SpecimenRow label="h4 · 600 · 15 px">
            <h4>{VIETNAMESE_TEST_LINE}</h4>
          </SpecimenRow>
          <SpecimenRow label="chữ thân · 400 · 15 px">
            <p className="text-base">{VIETNAMESE_TEST_LINE}</p>
          </SpecimenRow>
          <SpecimenRow label="chữ giao diện · 400 · 13 px">
            <p className="text-sm">{VIETNAMESE_TEST_LINE}</p>
          </SpecimenRow>
        </div>

        <div className="grid gap-4 border-t pt-4 md:grid-cols-3">
          {WEIGHTS.map(({ weight, className, use }) => (
            <div key={weight} className="flex flex-col gap-1">
              <span className={`text-lg ${className}`}>Độ đậm {weight}</span>
              <span className="text-sm text-muted-foreground">{use}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t pt-4">
          {TYPE_SCALE.map(({ token, size, className, role }) => (
            <SpecimenRow key={token} label={`${token} · ${size}`}>
              <span className={className}>
                Phòng trọ gần trường, có gác lửng
              </span>
              <span className="block text-sm text-muted-foreground">
                {role}
              </span>
            </SpecimenRow>
          ))}
          <SpecimenRow label="text-input · 16 px">
            <Input
              aria-label="Ô nhập mẫu cho cỡ chữ gõ vào"
              defaultValue="Chữ gõ trong ô nhập luôn 16 px"
              className="max-w-md"
            />
          </SpecimenRow>
        </div>
      </Section>

      <Section
        bare
        title="Nền, vùng và đầu trang"
        description="Trang đứng trên nền canvas, xám rất nhạt. Mỗi vùng là một thẻ trắng viền mảnh, bo 12 px, không đổ bóng. Phần đầu của trang này là một PageHeader: tiêu đề, mô tả, đường dẫn phía trên và nút ở bên phải từ md."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Vùng có hàng tiêu đề</CardTitle>
              <CardDescription>
                Đường kẻ mảnh dưới hàng tiêu đề khi vùng chứa bảng hoặc biểu
                mẫu.
              </CardDescription>
              <CardAction>
                <Button size="sm" variant="outline">
                  Thao tác
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <p>
                Đệm 20 px quanh vùng, 16 px giữa các khối trong vùng, 24 px giữa
                hai vùng.
              </p>
              <p className="text-sm text-muted-foreground">
                Không kẻ đường giữa hai vùng: khoảng nền canvas đã làm việc đó.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div
                role="search"
                aria-label="Vùng bộ lọc mẫu"
                className="flex flex-col gap-3"
              >
                <Input
                  type="search"
                  aria-label="Từ khóa mẫu"
                  placeholder="Vùng không có hàng tiêu đề, như vùng bộ lọc"
                />
                <div>
                  <Button type="button">Tìm</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>

      <ColorsSection />

      <Section title="Nút bấm">
        <div className="flex flex-col gap-6">
          {VARIANTS.map((variant) => (
            <div key={variant} className="flex flex-col gap-3">
              <code className="text-sm text-muted-foreground">{variant}</code>
              <div className="flex flex-wrap items-center gap-3">
                {SIZES.map((size) => (
                  <Button key={size} variant={variant} size={size}>
                    Đăng tin
                  </Button>
                ))}
                <Button variant={variant} disabled>
                  Không dùng được
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Nút có biểu tượng">
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg">
            <Search data-icon="inline-start" />
            Tìm trọ
          </Button>
          <Button variant="outline" size="icon-lg" aria-label="Tìm trọ">
            <Search />
          </Button>
          <Button variant="ghost" size="icon-lg" aria-label="Mở menu">
            <Menu />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Mở menu">
            <Menu />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Mở menu">
            <Menu />
          </Button>
        </div>
      </Section>

      <ControlsSection />
      <FeedbackSection />
      <StatesSection />
      <FormDemo />
      <ToastDemo />
      <OverlaysSection />
      <DataDisplaySection />
      <ShellsSection />

      <Section
        title="Màn hình mẫu"
        description="Bảy màn hình dựng bằng mã từ các thành phần ở trên, với dữ liệu giả và không gọi mạng."
      >
        <div>
          <Button asChild size="lg">
            <Link href="/dev/ui/screens">Mở các màn hình mẫu</Link>
          </Button>
        </div>
      </Section>
    </main>
  );
}
