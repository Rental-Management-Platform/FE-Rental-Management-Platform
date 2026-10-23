"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Section } from "./section";

// Toasts open at the top center. They are for short results only; a notice the person must
// act on is an Alert that stays on the page.
export function ToastDemo() {
  return (
    <Section
      title="Thông báo nhanh (toast)"
      description="Hiện ở giữa phía trên, tự biến mất sau vài giây."
    >
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => toast("Đã lưu")}>
          Mặc định
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.success("Đã lưu thay đổi", {
              description: "Tin đăng của bạn đã được cập nhật.",
            })
          }
        >
          Thành công
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.error("Không lưu được", {
              description: "Hãy thử lại sau ít phút.",
            })
          }
        >
          Lỗi
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.warning("Gần hết lượt đăng tin", {
              description: "Gói của bạn còn 1 lượt trong tháng này.",
            })
          }
        >
          Cảnh báo
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.info("Đã sao chép liên kết", {
              description: "Bạn có thể dán liên kết vào tin nhắn.",
            })
          }
        >
          Thông tin
        </Button>
      </div>
    </Section>
  );
}
