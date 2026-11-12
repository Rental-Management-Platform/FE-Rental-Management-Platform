"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { FailureNotice } from "@/components/form/failure-notice";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { AmenityCatalog } from "@/features/amenities/amenity-catalog";
import { AmenityField } from "@/features/property/components/amenity-field";
import { FeeRowsField } from "@/features/property/components/fee-rows-field";
import {
  AMENITY_REMOVED_MESSAGE,
  PROPERTY_FORM_FIELDS,
  zoneFocusTarget,
} from "@/features/property/form-failure";
import {
  createPropertySchema,
  toPropertyBody,
  type PropertyInput,
  type PropertyValues,
} from "@/features/property/schemas/property-schema";
import type { ApiError } from "@/lib/api/errors";
import { useFormFailure } from "@/lib/forms/use-form-failure";
import {
  EMPTY_CATALOG,
  ERROR_CATALOG,
  FULL_AMENITIES,
  LOADING_CATALOG,
  MANY_CATALOG,
  NO_ROWS,
  PREFILLED,
  READING_ROWS,
  READY_CATALOG,
  SAMPLE_FAILURES,
  SIX_ROWS,
  SOME_AMENITIES,
  THREE_ROWS,
} from "./property-form-sample";
import { Labeled, Section } from "./section";

// The sample has no ward boxes, so only the two city boxes apply to a pin.
const SAMPLE_SCHEMA = createPropertySchema([]);

interface DemoProps {
  /** What the form starts with. The two zones draw exactly this and set no default of their own. */
  initial: PropertyInput;
  catalog?: AmenityCatalog;
  showFees?: boolean;
  showAmenities?: boolean;
  /** Buttons that hand one fake backend error to the code the create form uses. */
  failures?: boolean;
  /** A button that plays the end of `AMENITY_UNKNOWN`: one amenity cleared and the message. */
  amenityRemoved?: boolean;
}

// One real form around the zones: the real schema, the real body builder and the real failure
// code, with fake data and no network. "Gửi thử" shows the body that would go to
// `POST /properties`, so what the zones hold can be read as the request.
function ZoneDemo({
  initial,
  catalog = READY_CATALOG,
  showFees = true,
  showAmenities = true,
  failures = false,
  amenityRemoved = false,
}: DemoProps) {
  const [body, setBody] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    setError,
    setValue,
    setFocus,
    getValues,
    clearErrors,
    formState: { errors },
  } = useForm<PropertyInput, unknown, PropertyValues>({
    resolver: zodResolver(SAMPLE_SCHEMA),
    defaultValues: initial,
  });
  const { failure, report, clear } = useFormFailure(
    setError,
    PROPERTY_FORM_FIELDS,
  );

  const simulate = (error: ApiError) => {
    clear();
    clearErrors();
    report(error);
    const target = zoneFocusTarget(error);
    if (target) setFocus(target);
  };

  const simulateRemoved = () => {
    clear();
    clearErrors();
    setValue(
      "amenityKeys",
      getValues("amenityKeys").filter((key) => key !== "wifi"),
      { shouldDirty: true },
    );
    setError(
      "amenityKeys",
      { type: "server", message: AMENITY_REMOVED_MESSAGE },
      { shouldFocus: true },
    );
  };

  return (
    <form
      noValidate
      className="flex min-w-0 flex-col gap-4"
      onSubmit={handleSubmit(
        (values) => {
          clear();
          setBody(JSON.stringify(toPropertyBody(values), null, 2));
        },
        () => setBody(null),
      )}
    >
      {showFees && <FeeRowsField control={control} setValue={setValue} />}
      {showAmenities && <AmenityField control={control} catalog={catalog} />}

      <FailureNotice failure={failure} message={errors.root?.server?.message} />

      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="outline">
          Gửi thử
        </Button>
        {failures &&
          SAMPLE_FAILURES.map(({ label, make }) => (
            <Button
              key={label}
              type="button"
              variant="outline"
              onClick={() => simulate(make())}
            >
              {label}
            </Button>
          ))}
        {amenityRemoved && (
          <Button type="button" variant="outline" onClick={simulateRemoved}>
            AMENITY_UNKNOWN · Wifi đã bị gỡ
          </Button>
        )}
      </div>

      {body !== null && (
        <pre className="overflow-x-auto rounded-lg border bg-muted p-3 text-xs">
          {body}
        </pre>
      )}
    </form>
  );
}

// The fees and amenities zones of the create property form (spec 0017), on fake data. It shows
// the fee zone empty, with three rows, with six (the add button off and its reason), with a
// message from the backend on a row and on the zone, and with every reading of the line under the
// price; the amenity zone loaded, loading, failed, empty and full at 30; and one form that starts
// with values, as the edit form of #12 will use the same two zones (AC-13 and AC-16).
//
// With Cache Components Next also prerenders Client Components, and `useFieldArray` makes the id
// of each row with `crypto.randomUUID()`, which the prerender refuses. So the samples sit behind
// a <Suspense>, the way the search filters section does: the heading is in the static page and
// the forms are drawn in the browser.
export function PropertyFormSection() {
  return (
    <Section
      bare
      title="Biểu mẫu nhà trọ: phí và tiện ích"
      description="Hai vùng nhập của biểu mẫu tạo nhà trọ, dựng từ dữ liệu giả và không gọi mạng. Mỗi mẫu là một biểu mẫu thật: bấm Gửi thử để xem phần body sẽ gửi đi, hoặc bấm một lỗi giả để thấy nó rơi vào đâu."
    >
      <Suspense fallback={<Skeleton aria-hidden="true" className="h-96" />}>
        <div className="grid gap-x-6 gap-y-8 lg:grid-cols-2">
          <Labeled label="vùng phí · trống">
            <ZoneDemo initial={NO_ROWS} showAmenities={false} />
          </Labeled>
          <Labeled label="vùng phí · ba dòng">
            <ZoneDemo initial={THREE_ROWS} showAmenities={false} />
          </Labeled>
          <Labeled label="vùng phí · sáu dòng, nút thêm tắt kèm lý do">
            <ZoneDemo initial={SIX_ROWS} showAmenities={false} />
          </Labeled>
          <Labeled label="vùng phí · các dòng đọc số (trống, 3800, 0, 3.8)">
            <ZoneDemo initial={READING_ROWS} showAmenities={false} />
          </Labeled>
          <Labeled label="vùng phí · lỗi từ máy chủ (ApiError giả)">
            <ZoneDemo initial={THREE_ROWS} showAmenities={false} failures />
          </Labeled>

          <Labeled label="vùng tiện ích · đã tải, hai ô tích">
            <ZoneDemo
              initial={SOME_AMENITIES}
              showFees={false}
              failures
              amenityRemoved
            />
          </Labeled>
          <Labeled label="vùng tiện ích · đang tải">
            <ZoneDemo
              initial={NO_ROWS}
              catalog={LOADING_CATALOG}
              showFees={false}
            />
          </Labeled>
          <Labeled label="vùng tiện ích · lỗi đọc danh mục, kèm Thử lại">
            <ZoneDemo
              initial={NO_ROWS}
              catalog={ERROR_CATALOG}
              showFees={false}
            />
          </Labeled>
          <Labeled label="vùng tiện ích · danh mục rỗng">
            <ZoneDemo
              initial={NO_ROWS}
              catalog={EMPTY_CATALOG}
              showFees={false}
            />
          </Labeled>
          <Labeled label="vùng tiện ích · đủ 30 (danh mục có 32)">
            <ZoneDemo
              initial={FULL_AMENITIES}
              catalog={MANY_CATALOG}
              showFees={false}
            />
          </Labeled>

          <div className="min-w-0 lg:col-span-2">
            <Labeled label="biểu mẫu điền sẵn · sáu dòng phí và bốn tiện ích (cho #12)">
              <ZoneDemo initial={PREFILLED} failures amenityRemoved />
            </Labeled>
          </div>
        </div>
      </Suspense>
    </Section>
  );
}
