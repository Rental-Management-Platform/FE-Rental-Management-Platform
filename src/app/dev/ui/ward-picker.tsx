"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  WardPanel,
  WardPickerView,
} from "@/features/wards/components/ward-picker-view";
import { Labeled, Section } from "./section";
import { SAMPLE_CODES, SAMPLE_WARDS } from "./ward-picker-sample";

const ALL_LABEL = "Tất cả phường, xã";
const FAKE_ERROR =
  "Không kết nối được tới máy chủ. Hãy kiểm tra mạng rồi thử lại.";

type CatalogState = "ready" | "loading" | "error";

// One picker on the fake catalog, with the value it would send shown under it.
function PickerDemo({
  label,
  name,
  initial = "",
  size = "lg",
  allLabel,
  catalog = "ready",
  retrying,
  invalid,
  disabled,
}: {
  label: string;
  name: string;
  initial?: string;
  size?: "default" | "lg";
  allLabel?: string;
  catalog?: CatalogState;
  retrying?: boolean;
  invalid?: boolean;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(initial);

  return (
    <Labeled label={label}>
      <WardPickerView
        aria-label={name}
        aria-invalid={invalid}
        disabled={disabled}
        size={size}
        allLabel={allLabel}
        wards={catalog === "ready" ? SAMPLE_WARDS : undefined}
        errorMessage={catalog === "error" ? FAKE_ERROR : undefined}
        retrying={retrying}
        value={value}
        onChange={setValue}
      />
      <p className="text-sm text-muted-foreground">
        Giá trị gửi đi: <code>{value === "" ? "(trống)" : value}</code>
      </p>
    </Labeled>
  );
}

// The box with its search row, drawn open and still, so the gallery shows it without a click.
function OpenBox({ label, typed }: { label: string; typed: string }) {
  return (
    <Labeled label={label}>
      <div className="w-full max-w-sm overflow-hidden rounded-lg border bg-popover shadow-md">
        <WardPanel
          wards={SAMPLE_WARDS}
          value={SAMPLE_CODES.benThanh}
          size="lg"
          onPick={() => undefined}
          onClose={() => undefined}
          initialText={typed}
        />
      </div>
    </Labeled>
  );
}

// A plain browser form with `name`: the picker adds a hidden input, and Enter in the search row
// picks a ward but never sends the form. The send button reads the fields the browser would send.
function NativeFormDemo() {
  const [value, setValue] = useState<string>(SAMPLE_CODES.benThanh);
  const [sent, setSent] = useState<string | null>(null);

  return (
    <Labeled label="trong một biểu mẫu gốc, có name">
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setSent(
            Array.from(
              new FormData(event.currentTarget),
              ([key, entry]) => `${key}=${String(entry)}`,
            ).join("&"),
          );
        }}
      >
        <WardPickerView
          aria-label="Phường mẫu trong biểu mẫu gốc"
          size="lg"
          allLabel={ALL_LABEL}
          wards={SAMPLE_WARDS}
          name="wardCode"
          value={value}
          onChange={setValue}
        />
        <div>
          <Button type="submit" variant="outline">
            Gửi thử
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Đã gửi:{" "}
          <code>{sent === null ? "(chưa gửi)" : sent || "(trống)"}</code>
        </p>
      </form>
    </Labeled>
  );
}

// The picker inside a Sheet, the way the search filters use it on a phone. A Sheet locks the
// scroll of everything outside its content, so the box is drawn into the content: the caller
// keeps the element with a callback ref and `useState`, and passes it as `portalContainer`.
function SheetDemo() {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [value, setValue] = useState("");
  const fieldId = useId();

  return (
    <Labeled label="trong ngăn trượt, có portalContainer">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="lg" className="self-start">
            Mở ngăn bộ lọc mẫu
          </Button>
        </SheetTrigger>
        <SheetContent side="right" ref={setContainer}>
          <SheetHeader>
            <SheetTitle>Bộ lọc mẫu</SheetTitle>
            <SheetDescription>
              Thử cuộn danh sách phường bằng ngón tay ngay trong ngăn. Esc chỉ
              đóng danh sách, ngăn vẫn mở.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 px-4">
            <Field>
              <FieldLabel htmlFor={fieldId}>Phường, xã</FieldLabel>
              <WardPickerView
                id={fieldId}
                size="lg"
                allLabel={ALL_LABEL}
                wards={SAMPLE_WARDS}
                value={value}
                onChange={setValue}
                portalContainer={container}
              />
            </Field>
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button size="lg">Xong</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Labeled>
  );
}

// The shared ward field of spec 0015 on fake data, with no network call: it uses `WardPickerView`,
// which reads nothing, so these samples never touch the shared `["wards"]` query. It filters while
// you type (accents ignored), and every state of the button and of the open box is shown.
export function WardPickerSection() {
  return (
    <Section
      title="Ô chọn phường"
      description="Bấm vào ô, nhấn Enter, Space hoặc mũi tên xuống để mở. Gõ để lọc, không cần dấu: thử “hoa” (ra cả Hoà và Hòa), “dac khu” hoặc “ben”. Mũi tên đổi dòng, Home và End về đầu và cuối, Enter chọn, Esc đóng và trả tiêu điểm về ô, Tab đóng hộp."
    >
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <PickerDemo label="đóng, chưa chọn" name="Phường mẫu chưa chọn" />
        <PickerDemo
          label="đã chọn"
          name="Phường mẫu đã chọn"
          initial={SAMPLE_CODES.benThanh}
        />
        <PickerDemo
          label="có allLabel (dòng đầu bỏ chọn)"
          name="Phường mẫu có dòng tất cả"
          allLabel={ALL_LABEL}
        />
        <PickerDemo
          label="mã không có trong danh sách"
          name="Phường mẫu có mã lạ"
          initial={SAMPLE_CODES.unknown}
        />
        <PickerDemo
          label="size default (40 px)"
          name="Phường mẫu cỡ thường"
          size="default"
          initial={SAMPLE_CODES.benThanh}
        />
        <PickerDemo
          label="aria-invalid"
          name="Phường mẫu không hợp lệ"
          invalid
        />
        <PickerDemo label="disabled" name="Phường mẫu bị khóa" disabled />
        <PickerDemo
          label="đang tải danh sách"
          name="Phường mẫu đang tải"
          catalog="loading"
        />
        <PickerDemo
          label="lỗi tải, có nút Thử lại"
          name="Phường mẫu lỗi tải"
          catalog="error"
        />
        <PickerDemo
          label="lỗi tải, đang thử lại"
          name="Phường mẫu đang thử lại"
          catalog="error"
          retrying
        />
      </div>

      <div className="grid gap-6 border-t pt-4 md:grid-cols-2">
        <OpenBox label="đang mở, có kết quả (gõ “ben”)" typed="ben" />
        <OpenBox label="đang mở, không có kết quả (gõ “zzzz”)" typed="zzzz" />
      </div>

      <div className="grid gap-6 border-t pt-4 md:grid-cols-2">
        <NativeFormDemo />
        <SheetDemo />
      </div>
    </Section>
  );
}
