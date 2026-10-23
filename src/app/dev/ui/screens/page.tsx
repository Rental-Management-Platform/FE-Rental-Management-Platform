import { ArrowRightIcon } from "lucide-react";
import type { Metadata } from "next";
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
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GROUP_LABEL, SCREENS, type ScreenGroup } from "./screens";

export const metadata: Metadata = { title: "Màn hình mẫu" };

const GROUPS: readonly ScreenGroup[] = ["public", "auth", "landlord", "admin"];

const GROUP_NOTE: Record<ScreenGroup, string> = {
  public: "Xem ở 390 và 1280 px",
  auth: "Xem ở 390 và 1280 px",
  landlord: "Xem ở 1440 px",
  admin: "Xem ở 1440 px",
};

const RULES = [
  "Dữ liệu là các đối tượng cố định trong mã, có hình dạng như câu trả lời trong api-for-frontend.md. Không có lệnh gọi mạng, nên không cần chạy backend.",
  "Chưa có ảnh: coverImageUrl là null, nên các thẻ tin hiện khung thay thế.",
  "Giá, diện tích và ngày đều qua Intl với vi-VN và Asia/Ho_Chi_Minh.",
  "Khung nét đứt ở đầu mỗi màn hình chứa các nút giả lập. Nó chỉ có ở trang mẫu, không thuộc màn hình thật.",
] as const;

// An index of the seven sample screens (spec 0003, AC-14). Each one is built in code from the
// tokens, the base components, the shared states and the shells, on fixed sample data.
export default function ScreensIndexPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6">
      <header className="flex flex-col gap-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dev/ui">Thư viện giao diện</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Màn hình mẫu</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1>Màn hình mẫu</h1>
        <p className="max-w-2xl text-muted-foreground">
          Bảy màn hình dựng bằng mã trên hệ thiết kế có sẵn, để xem token, thành
          phần, trạng thái dùng chung và các khung trang hoạt động cùng nhau.
          Các tính năng thật sẽ nhấc phần cần dùng từ đây.
        </p>
      </header>

      {GROUPS.map((group) => (
        <section key={group} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl md:text-2xl">{GROUP_LABEL[group]}</h2>
            <p className="text-sm text-muted-foreground">{GROUP_NOTE[group]}</p>
          </div>
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {SCREENS.filter((screen) => screen.group === group).map(
              ({ href, title, description, icon: Icon }) => (
                <li key={href} className="grid">
                  <Card className="relative transition-shadow hover:shadow-md has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-offset-2">
                    <CardHeader>
                      <span
                        aria-hidden="true"
                        className="mb-2 flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"
                      >
                        <Icon className="size-5" />
                      </span>
                      <CardTitle>
                        <h3 className="text-lg">
                          <Link
                            href={href}
                            className="outline-hidden after:absolute after:inset-0"
                          >
                            {title}
                          </Link>
                        </h3>
                      </CardTitle>
                      <CardDescription>{description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="mt-auto text-sm font-medium text-primary">
                      Mở màn hình
                      <ArrowRightIcon
                        aria-hidden="true"
                        className="ml-1 size-4"
                      />
                    </CardFooter>
                  </Card>
                </li>
              ),
            )}
          </ul>
        </section>
      ))}

      <section className="flex flex-col gap-3 rounded-xl border bg-muted p-6">
        <h2 className="text-lg md:text-xl">Cách các màn hình này được dựng</h2>
        <ul className="flex list-disc flex-col gap-2 pl-5 text-sm">
          {RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
