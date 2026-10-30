"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Property } from "@/lib/api/types";
import { PropertyCreated } from "./property-created";
import { PropertyForm } from "./property-form";

const TIPS = [
  "Ô địa chỉ chỉ cần số nhà và tên đường, ví dụ 12 Lê Lợi.",
  "Phường, xã hoặc đặc khu chọn từ danh sách. Từ 01/07/2025 địa chỉ không còn cấp quận, huyện.",
  "Bạn tạo nhà trọ một lần, rồi đăng nhiều tin phòng vào đó.",
  "Phí, tiện ích và tọa độ chưa có ở bước này.",
] as const;

// The create property page below its `PageHeader`: the form or, once the property exists, the
// result, with a tips zone at the side from `xl`.
export function PropertyCreate() {
  const [created, setCreated] = useState<Property | null>(null);

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      {created ? (
        <PropertyCreated
          property={created}
          onAddAnother={() => setCreated(null)}
        />
      ) : (
        <PropertyForm onCreated={setCreated} />
      )}

      <aside aria-label="Gợi ý nhập nhà trọ">
        <Card>
          <CardHeader>
            <CardTitle>
              <h2 className="text-base">Lưu ý khi tạo nhà trọ</h2>
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
    </div>
  );
}
