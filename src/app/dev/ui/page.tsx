import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ControlsSection } from "./controls";
import { FeedbackSection } from "./feedback";
import { FormDemo } from "./form-demo";
import { Section } from "./section";
import { StatesSection } from "./states";
import { ToastDemo } from "./toast-demo";

// The line from AC-3: stacked marks must show whole at heading and body sizes.
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

const TYPE_SCALE = [
  { token: "text-4xl", className: "text-4xl" },
  { token: "text-3xl", className: "text-3xl" },
  { token: "text-2xl", className: "text-2xl" },
  { token: "text-xl", className: "text-xl" },
  { token: "text-lg", className: "text-lg" },
  { token: "text-base", className: "text-base" },
  { token: "text-sm", className: "text-sm" },
  { token: "text-xs", className: "text-xs" },
] as const;

// A development only gallery of the design system (spec 0003). The /dev layout answers
// 404 in a production build.
export default function DevUiPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-8 md:px-6">
      <header className="flex flex-col gap-2">
        <h1>Thư viện giao diện</h1>
        <p className="text-muted-foreground">
          Trang dành cho nhà phát triển, chỉ chạy khi phát triển. Mỗi thành phần
          hiện đủ biến thể, kích cỡ và trạng thái.
        </p>
      </header>

      <Section title="Chữ tiếng Việt">
        <p className="text-3xl font-bold md:text-4xl">{VIETNAMESE_TEST_LINE}</p>
        <p className="text-base">{VIETNAMESE_TEST_LINE}</p>
        <div className="flex flex-col gap-2 border-t pt-4">
          {TYPE_SCALE.map(({ token, className }) => (
            <div
              key={token}
              className="flex flex-col gap-1 md:flex-row md:items-baseline md:gap-6"
            >
              <code className="w-24 shrink-0 text-sm text-muted-foreground">
                {token}
              </code>
              <span className={className}>
                Phòng trọ gần trường, có gác lửng
              </span>
            </div>
          ))}
        </div>
      </Section>

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
    </main>
  );
}
