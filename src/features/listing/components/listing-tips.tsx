import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TIPS = [
  "Nêu rõ khu vực và điểm nổi bật trong tiêu đề, ví dụ có gác hoặc gần chợ.",
  "Mô tả giờ giấc, chỗ để xe và các khoản phí ngoài tiền thuê.",
  "Tin hiện ngay khi đăng, không có bước duyệt.",
  "Ảnh chưa thêm được ở bước này.",
] as const;

// The tips zone at the side from `xl`, shared by the post page and the edit page.
export function ListingTips() {
  return (
    <aside aria-label="Gợi ý viết tin">
      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-base">Mẹo để tin được xem nhiều</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm">
            {TIPS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </aside>
  );
}
