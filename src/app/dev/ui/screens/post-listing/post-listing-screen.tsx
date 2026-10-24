"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm, type Path } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FailureNotice } from "@/components/form/failure-notice";
import { FormField } from "@/components/form/form-field";
import { PageHeader } from "@/components/layout/page-header";
import { WorkspaceShell } from "@/components/shells/workspace-shell";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createApiError, isApiError, type ApiError } from "@/lib/api/errors";
import { useFormFailure } from "@/lib/forms/use-form-failure";
import { SAMPLE_PROPERTIES } from "../sample-data";
import { formatMoney } from "../sample-format";
import { SampleControls } from "../sample-state";
import { LANDLORD_SCREENS_NAV, SCREENS_HOME } from "../screens";

const NUMBER = new Intl.NumberFormat("vi-VN");

const rangeMessage = (name: string, min: number, max: number, unit: string) =>
  `${name} từ ${NUMBER.format(min)} đến ${NUMBER.format(max)} ${unit}.`;

const WHOLE = /^\d+$/;
const WHOLE_MESSAGE = "Chỉ nhập chữ số, không dùng dấu chấm hay dấu phẩy.";
const AREA = /^\d+([.,]\d)?$/;

// Light checks only, mirroring the limits of `POST /properties/:propertyId/listings`
// (api-for-frontend.md, 6.18). The backend is the real validator, and its `errors[].field`
// lands on the same fields. The form holds text, so the schema turns it into numbers and
// `null`s: that is why `useForm` gets the output type as its third generic. Built once,
// outside the component.
const listingSchema = z.object({
  propertyId: z.string().min(1, "Chọn nhà trọ."),
  title: z
    .string()
    .trim()
    .min(5, "Tiêu đề cần từ 5 đến 120 ký tự.")
    .max(120, "Tiêu đề cần từ 5 đến 120 ký tự."),
  description: z
    .string()
    .trim()
    .min(10, "Mô tả cần từ 10 đến 5.000 ký tự.")
    .max(5000, "Mô tả cần từ 10 đến 5.000 ký tự."),
  price: z
    .string()
    .trim()
    .min(1, "Nhập giá thuê.")
    .refine((v) => WHOLE.test(v), WHOLE_MESSAGE)
    .transform(Number)
    .refine(
      (n) => n >= 100_000 && n <= 100_000_000,
      rangeMessage("Giá thuê", 100_000, 100_000_000, "đồng"),
    ),
  areaM2: z
    .string()
    .trim()
    .min(1, "Nhập diện tích.")
    .refine(
      (v) => AREA.test(v),
      "Chỉ nhập số, tối đa một chữ số sau dấu phẩy, ví dụ 22,5.",
    )
    .transform((v) => Number(v.replace(",", ".")))
    .refine(
      (n) => n >= 1 && n <= 1000,
      rangeMessage("Diện tích", 1, 1000, "m²"),
    ),
  deposit: z
    .string()
    .trim()
    .refine((v) => v === "" || WHOLE.test(v), WHOLE_MESSAGE)
    .transform((v) => (v === "" ? null : Number(v)))
    .refine(
      (n) => n === null || (n >= 0 && n <= 1_000_000_000),
      rangeMessage("Tiền cọc", 0, 1_000_000_000, "đồng"),
    ),
  availableFrom: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || z.iso.date().safeParse(v).success,
      "Chọn một ngày hợp lệ.",
    )
    .transform((v) => (v === "" ? null : v)),
});

type ListingFormInput = z.input<typeof listingSchema>;
type ListingFormOutput = z.output<typeof listingSchema>;

const FIELDS: readonly Path<ListingFormInput>[] = [
  "propertyId",
  "title",
  "description",
  "price",
  "areaM2",
  "deposit",
  "availableFrom",
];

// What the post call can answer. Each button hands one fake error to the same code a real
// form uses: field messages go under their inputs, the rest becomes the form level notice.
const FAKE_ERRORS: { label: string; make: () => ApiError }[] = [
  {
    label: "400 · giá và diện tích sai",
    make: () =>
      createApiError({
        status: 400,
        code: "VALIDATION_FAILED",
        message: "Dữ liệu chưa hợp lệ.",
        errors: [
          {
            field: "price",
            code: "OUT_OF_RANGE",
            message: "Giá thuê từ 100.000 đến 100.000.000 đồng.",
          },
          {
            field: "areaM2",
            code: "TOO_MANY_DECIMALS",
            message: "Diện tích chỉ được một chữ số thập phân.",
          },
        ],
      }),
  },
  {
    label: "403 · đủ hạn mức tin",
    make: () =>
      createApiError({
        status: 403,
        code: "LISTING_QUOTA_REACHED",
        message:
          "Bạn đã hiện đủ số tin của hạn mức hiện tại. Ẩn bớt một tin hoặc mua gói để đăng thêm.",
      }),
  },
  {
    label: "403 · hết dùng thử",
    make: () =>
      createApiError({
        status: 403,
        code: "MEMBERSHIP_REQUIRED",
        message: "Kỳ dùng thử đã kết thúc. Hãy mua gói để tiếp tục đăng tin.",
      }),
  },
  {
    label: "429 · chờ 20 giây",
    make: () =>
      createApiError({
        status: 429,
        code: "RATE_LIMITED",
        message: "Bạn đăng tin quá nhanh.",
        retryAfterSeconds: 20,
        retryAfterExact: true,
      }),
  },
  {
    label: "500 · có mã hỗ trợ",
    make: () =>
      createApiError({
        status: 500,
        code: "INTERNAL_ERROR",
        message: "Đã có lỗi xảy ra. Vui lòng thử lại sau.",
        requestId: "7f3a2c91-4b1e",
      }),
  },
];

const TIPS = [
  "Nêu rõ khu vực và điểm nổi bật trong tiêu đề, ví dụ có gác hoặc gần chợ.",
  "Mô tả giờ giấc, chỗ để xe và các khoản phí ngoài tiền thuê.",
  "Tin hiện ngay khi đăng, không có bước duyệt.",
  "Ảnh được thêm sau khi tin đã đăng.",
] as const;

const MY_LISTINGS_HREF = `${SCREENS_HOME}/my-listings`;
const PRICING_HREF = `${SCREENS_HOME}/pricing`;

// Landlord screen: the post listing form, as two zones on the canvas with the notice and the
// submit row under them, and a tips zone at the side from `xl`. The date is a plain date input,
// because the date picker waits for the item that needs it.
export function PostListingScreen() {
  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<ListingFormInput, unknown, ListingFormOutput>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      propertyId: SAMPLE_PROPERTIES[0].id,
      title: "",
      description: "",
      price: "",
      areaM2: "",
      deposit: "",
      availableFrom: "",
    },
  });
  const { failure, secondsLeft, report, clear } = useFormFailure(
    setError,
    FIELDS,
  );

  const clearFailure = () => {
    clear();
    clearErrors("root.server");
  };
  // A fresh start for each pretend answer, so the field messages of the last one go too.
  const simulate = (error: ApiError) => {
    clearFailure();
    clearErrors();
    report(error);
  };
  const onSubmit = (values: ListingFormOutput) => {
    clearFailure();
    toast.success("Đã đăng tin mẫu", {
      description: `${values.title} · ${formatMoney(values.price)} mỗi tháng`,
    });
  };

  const needsPlan =
    isApiError(failure) &&
    (failure.code === "LISTING_QUOTA_REACHED" ||
      failure.code === "MEMBERSHIP_REQUIRED");

  return (
    <WorkspaceShell title="Khu chủ trọ (mẫu)" items={LANDLORD_SCREENS_NAV}>
      <div className="flex flex-col gap-6">
        <SampleControls className="md:items-start">
          <p className="text-sm font-medium">Giả lập câu trả lời của máy chủ</p>
          <div className="flex flex-wrap gap-2">
            {FAKE_ERRORS.map(({ label, make }) => (
              <Button
                key={label}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => simulate(make())}
              >
                {label}
              </Button>
            ))}
          </div>
        </SampleControls>

        <PageHeader
          breadcrumb={
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={MY_LISTINGS_HREF}>Tin của tôi</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Đăng tin mới</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          }
          title="Đăng tin mới"
          description="Điền thông tin phòng cho thuê. Tin hiện ngay khi đăng, không có bước duyệt."
        />

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <form
            noValidate
            aria-label="Đăng tin mới"
            onSubmit={handleSubmit(onSubmit, clearFailure)}
            className="flex flex-col gap-6"
          >
            {/* Each zone is a labelled group, like the fieldset it replaces. The hairline under
                the title row is there because a form follows it. */}
            <Card role="group" aria-labelledby="main-info-title">
              <CardHeader className="border-b">
                <CardTitle id="main-info-title">Thông tin chính</CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <FormField
                    control={control}
                    name="propertyId"
                    label="Nhà trọ"
                    description="Địa chỉ, phí và tiện ích lấy từ nhà trọ bạn chọn."
                  >
                    {({ field, aria }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          ref={field.ref}
                          size="lg"
                          className="w-full"
                          onBlur={field.onBlur}
                          {...aria}
                        >
                          <SelectValue placeholder="Chọn nhà trọ" />
                        </SelectTrigger>
                        <SelectContent>
                          {SAMPLE_PROPERTIES.map((property) => (
                            <SelectItem key={property.id} value={property.id}>
                              {property.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </FormField>
                  <FormField
                    control={control}
                    name="title"
                    label="Tiêu đề"
                    description="Từ 5 đến 120 ký tự."
                  >
                    {({ field, aria }) => (
                      <Input
                        size="lg"
                        placeholder="Phòng đẹp có gác gần chợ Bến Thành"
                        {...field}
                        {...aria}
                      />
                    )}
                  </FormField>
                  <FormField
                    control={control}
                    name="description"
                    label="Mô tả"
                    description="Từ 10 đến 5.000 ký tự, văn bản thường."
                  >
                    {({ field, aria }) => (
                      <Textarea
                        rows={6}
                        placeholder="Giờ giấc, chỗ để xe, nội thất, quy định chung"
                        {...field}
                        {...aria}
                      />
                    )}
                  </FormField>
                </FieldGroup>
              </CardContent>
            </Card>

            <Card role="group" aria-labelledby="price-info-title">
              <CardHeader className="border-b">
                <CardTitle id="price-info-title">
                  Giá, diện tích và ngày vào ở
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup className="md:grid md:grid-cols-2">
                  <FormField
                    control={control}
                    name="price"
                    label="Giá thuê (đồng mỗi tháng)"
                    description="Từ 100.000 đến 100.000.000."
                  >
                    {({ field, aria }) => (
                      <Input
                        size="lg"
                        inputMode="numeric"
                        placeholder="3500000"
                        {...field}
                        {...aria}
                      />
                    )}
                  </FormField>
                  <FormField
                    control={control}
                    name="areaM2"
                    label="Diện tích (m²)"
                    description="Tối đa một chữ số sau dấu phẩy."
                  >
                    {({ field, aria }) => (
                      <Input
                        size="lg"
                        inputMode="decimal"
                        placeholder="22,5"
                        {...field}
                        {...aria}
                      />
                    )}
                  </FormField>
                  <FormField
                    control={control}
                    name="deposit"
                    label="Tiền cọc (đồng)"
                    description="Để trống nếu không thu cọc."
                  >
                    {({ field, aria }) => (
                      <Input
                        size="lg"
                        inputMode="numeric"
                        placeholder="3500000"
                        {...field}
                        {...aria}
                      />
                    )}
                  </FormField>
                  <FormField
                    control={control}
                    name="availableFrom"
                    label="Ngày vào ở"
                    description="Để trống nếu có thể vào ở ngay."
                  >
                    {({ field, aria }) => (
                      <Input type="date" size="lg" {...field} {...aria} />
                    )}
                  </FormField>
                </FieldGroup>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              <FailureNotice
                failure={failure}
                message={errors.root?.server?.message}
              />
              {needsPlan && (
                <Button asChild variant="outline" className="self-start">
                  <Link href={PRICING_HREF}>Xem bảng giá</Link>
                </Button>
              )}
              <div className="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting || secondsLeft > 0}
                >
                  Đăng tin
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href={MY_LISTINGS_HREF}>Hủy</Link>
                </Button>
              </div>
            </div>
          </form>

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
        </div>
      </div>
    </WorkspaceShell>
  );
}
