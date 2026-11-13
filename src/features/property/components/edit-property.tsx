"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BreadcrumbTrail } from "@/components/layout/breadcrumb-trail";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/states/error-state";
import { ForbiddenState } from "@/components/states/forbidden-state";
import { LoadingState } from "@/components/states/loading-state";
import { NotFoundState } from "@/components/states/not-found-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi, useSession } from "@/lib/session/auth-provider";
import { can } from "@/lib/session/can";
import {
  propertyBlock,
  propertyDetailQuery,
  type PropertyBlock,
} from "../api/property-detail";
import { MY_PROPERTIES_PATH } from "../property-list";
import { EditPropertyForm } from "./edit-property-form";

const TIPS = [
  "Tên, địa chỉ, phí và tiện ích của nhà trọ hiện ở mọi tin đăng của nhà trọ này.",
  "Đổi phường thì vị trí đã ghim phải nằm trong phường mới, nếu không ghim bị bỏ và bạn ghim lại.",
  "Chỉ những ô bạn đổi mới được lưu. Nhà trọ không đổi gì thì không có gì được gửi đi.",
] as const;

// The edit property page. It reads the property first and shows one of four things: the loading
// skeleton, a page level state (not found, not mine, no permission), the error, or the form. It
// draws its own `PageHeader` because the state pages carry their own `h1`, so they stand alone and
// the page keeps one heading. The form shows whenever there is data: a refetch that fails later
// never replaces typed text.
export function EditProperty() {
  const api = useApi();
  const session = useSession();
  const { id } = useParams<{ id: string }>();
  const mayEdit =
    can(session, "property:update") && can(session, "property:read");
  const property = useQuery({
    ...propertyDetailQuery(api, id),
    enabled: mayEdit,
  });
  // Set by a save that was answered "gone" or "not yours": it replaces the form.
  const [blocked, setBlocked] = useState<PropertyBlock | null>(null);
  const blockRef = useRef<HTMLDivElement>(null);

  // The form and its focused button are gone, so focus would fall to the page. It goes to the
  // state instead, and a screen reader reads it. A block found while loading needs no move:
  // nothing had focus yet.
  useEffect(() => {
    if (blocked) blockRef.current?.focus();
  }, [blocked]);

  if (!mayEdit) {
    return <ForbiddenState message="Bạn không có quyền sửa nhà trọ." />;
  }

  const data = property.data;
  const block =
    blocked ??
    (data === undefined && property.isError
      ? propertyBlock(property.error)
      : null);

  if (block) {
    return (
      <div ref={blockRef} tabIndex={-1} className="outline-none">
        {block === "not-found" ? (
          <NotFoundState
            title="Không tìm thấy nhà trọ"
            backHref={MY_PROPERTIES_PATH}
            backLabel="Về danh sách nhà trọ"
          />
        ) : (
          <ForbiddenState message="Bạn không có quyền sửa nhà trọ này." />
        )}
      </div>
    );
  }

  const renderMain = () => {
    if (data !== undefined) {
      // A different property starts a different form.
      return (
        <EditPropertyForm
          key={data.id}
          property={data}
          onBlocked={setBlocked}
        />
      );
    }
    return property.isError ? (
      <ErrorState
        error={property.error}
        title="Không tải được nhà trọ"
        onRetry={() => void property.refetch()}
      />
    ) : (
      <LoadingState variant="form" fields={5} />
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={
          <BreadcrumbTrail
            parent={{ label: "Nhà trọ của tôi", href: MY_PROPERTIES_PATH }}
            current="Sửa nhà trọ"
          />
        }
        title="Sửa nhà trọ"
        description={
          <>
            <p>Thay đổi áp dụng cho mọi tin của nhà trọ này.</p>
            {data && (
              <p className="mt-1 text-sm break-words">
                Đang sửa:{" "}
                <span className="font-medium text-foreground">{data.name}</span>
              </p>
            )}
          </>
        }
      />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-6">{renderMain()}</div>
        <aside aria-label="Gợi ý sửa nhà trọ">
          <Card>
            <CardHeader>
              <CardTitle>
                <h2 className="text-base">Lưu ý khi sửa nhà trọ</h2>
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
    </div>
  );
}
