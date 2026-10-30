"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CircleAlertIcon } from "lucide-react";
import { useId } from "react";
import { useForm, useWatch, type Path } from "react-hook-form";
import { toast } from "sonner";
import { FailureNotice } from "@/components/form/failure-notice";
import { FormField } from "@/components/form/form-field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { isAbortError } from "@/lib/api/abort";
import { describeError, isApiError } from "@/lib/api/errors";
import type { Property, PropertyBody } from "@/lib/api/types";
import { useFormFailure } from "@/lib/forms/use-form-failure";
import { useApi } from "@/lib/session/auth-provider";
import { createProperty } from "../api/create-property";
import { wardsQuery } from "../api/wards";
import {
  EMPTY_PROPERTY,
  propertySchema,
  toPropertyBody,
  type PropertyInput,
  type PropertyValues,
} from "../schemas/property-schema";

// The form's own paths in screen order. A message the backend sends for a field this form
// lacks is shown as the form level message, and focus goes to the first field in this order.
const FIELDS: readonly Path<PropertyInput>[] = [
  "name",
  "addressText",
  "wardCode",
];

// The create property form: two zones on the canvas with the notice and the submit row under
// them (api-for-frontend.md, 6.17). Fees, amenities and coordinates join with #11.
export function PropertyForm({
  onCreated,
}: {
  onCreated: (property: Property) => void;
}) {
  const api = useApi();
  const wards = useQuery(wardsQuery(api));
  const create = useMutation({
    mutationFn: (body: PropertyBody) => createProperty(api, body),
  });
  const provinceId = useId();
  const {
    control,
    handleSubmit,
    setError,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<PropertyInput, unknown, PropertyValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: EMPTY_PROPERTY,
  });
  const { failure, secondsLeft, report, clear } = useFormFailure(
    setError,
    FIELDS,
  );
  const wardCode = useWatch({ control, name: "wardCode" });

  // The province is not typed: it follows the ward that was chosen.
  const provinceName =
    wards.data?.find((ward) => ward.code === wardCode)?.provinceName ?? "";

  const clearFailure = () => {
    clear();
    clearErrors("root.server");
  };

  const onSubmit = async (values: PropertyValues) => {
    clearFailure();
    try {
      const property = await create.mutateAsync(toPropertyBody(values));
      toast.success("Đã tạo nhà trọ", { description: property.name });
      onCreated(property);
    } catch (error) {
      // The session changed under the request (a sign out in this tab): there is nothing to show.
      if (isAbortError(error)) return;
      report(error);
      // The catalog changed under the form: read it again, and drop a choice that is gone, so
      // the person picks a ward from the list as it is now.
      if (isApiError(error) && error.code === "WARD_UNKNOWN") {
        void wards.refetch().then(({ data }) => {
          if (!data?.some((ward) => ward.code === values.wardCode)) {
            setValue("wardCode", "");
          }
        });
      }
    }
  };

  return (
    <form
      noValidate
      method="post"
      aria-label="Thêm nhà trọ"
      onSubmit={handleSubmit(onSubmit, clearFailure)}
      className="flex flex-col gap-6"
    >
      {/* Each zone is a labelled group, like the fieldset it replaces. The hairline under the
          title row is there because a form follows it. */}
      <Card role="group" aria-labelledby="property-general-title">
        <CardHeader className="border-b">
          <CardTitle id="property-general-title">Thông tin chung</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <FormField
              control={control}
              name="name"
              label="Tên nhà trọ"
              description="Từ 2 đến 100 ký tự."
            >
              {({ field, aria }) => (
                <Input
                  size="lg"
                  autoComplete="off"
                  placeholder="Nhà trọ Hoa Hồng"
                  {...field}
                  {...aria}
                />
              )}
            </FormField>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card role="group" aria-labelledby="property-address-title">
        <CardHeader className="border-b">
          <CardTitle id="property-address-title">Địa chỉ</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <FormField
              control={control}
              name="addressText"
              label="Số nhà và tên đường"
              description="Chỉ nhập số nhà và tên đường, không nhập phường, xã hay tỉnh."
            >
              {({ field, aria }) => (
                <Input
                  size="lg"
                  autoComplete="off"
                  placeholder="12 Lê Lợi"
                  {...field}
                  {...aria}
                />
              )}
            </FormField>

            {wards.isError && (
              <Alert variant="destructive">
                <CircleAlertIcon />
                <AlertTitle>Không tải được danh sách phường, xã</AlertTitle>
                <AlertDescription>
                  <p>{describeError(wards.error).message}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={wards.isFetching}
                    onClick={() => void wards.refetch()}
                  >
                    {wards.isFetching && <Spinner size="sm" />}
                    Thử lại
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={control}
              name="wardCode"
              label="Phường, xã hoặc đặc khu"
              description="Chọn từ danh sách. Địa chỉ không có cấp quận, huyện."
            >
              {({ field, aria }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!wards.data}
                >
                  <SelectTrigger
                    ref={field.ref}
                    size="lg"
                    className="w-full"
                    onBlur={field.onBlur}
                    aria-busy={wards.isPending}
                    {...aria}
                  >
                    <SelectValue
                      placeholder={
                        wards.isPending
                          ? "Đang tải danh sách"
                          : "Chọn phường hoặc xã"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {wards.data?.map((ward) => (
                      <SelectItem key={ward.code} value={ward.code}>
                        {ward.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>

            <Field>
              <FieldLabel htmlFor={provinceId}>Tỉnh, thành phố</FieldLabel>
              <Input
                id={provinceId}
                size="lg"
                readOnly
                className="bg-muted"
                value={provinceName}
                placeholder="Tự điền theo phường hoặc xã"
                aria-describedby={`${provinceId}-description`}
              />
              <FieldDescription id={`${provinceId}-description`}>
                Đi theo phường hoặc xã đã chọn.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <FailureNotice
          failure={failure}
          message={errors.root?.server?.message}
        />
        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting || secondsLeft > 0}
            aria-busy={isSubmitting}
          >
            {isSubmitting && <Spinner size="sm" />}
            {isSubmitting ? "Đang tạo nhà trọ" : "Tạo nhà trọ"}
          </Button>
        </div>
      </div>
    </form>
  );
}
