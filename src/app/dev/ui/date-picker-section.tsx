"use client";

import { useState } from "react";
import { DatePicker } from "@/components/form/date-picker";
import { Labeled, Section } from "./section";

function DateDemo({
  label,
  name,
  initial = "",
  invalid,
  disabled,
}: {
  label: string;
  name: string;
  initial?: string;
  invalid?: boolean;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(initial);

  return (
    <Labeled label={label}>
      <DatePicker
        aria-label={name}
        aria-invalid={invalid}
        disabled={disabled}
        value={value}
        onChange={setValue}
      />
      <p className="text-sm text-muted-foreground">
        Giá trị gửi đi: <code>{value === "" ? "(trống)" : value}</code>
      </p>
    </Labeled>
  );
}

// The shared date field of spec 0006 (AC-5). It shows `dd/MM/yyyy`, opens a Vietnamese calendar
// that starts on Monday, and hands back `YYYY-MM-DD` built from the local day, never through UTC.
export function DatePickerSection() {
  return (
    <Section
      title="Chọn ngày"
      description="Bấm vào ô hoặc nhấn Enter để mở lịch. Mũi tên đổi ngày, Enter chọn, Esc đóng và trả tiêu điểm về ô. Lịch cho chọn từ đầu năm ngoái đến cuối năm thứ ba tính từ nay."
    >
      <div className="grid gap-6 md:grid-cols-3">
        <DateDemo label="Chưa chọn" name="Ngày mẫu chưa chọn" />
        <DateDemo
          label="Đã chọn"
          name="Ngày mẫu đã chọn"
          initial="2026-11-01"
        />
        <DateDemo
          label="Ngoài các năm cho chọn, vẫn được giữ"
          name="Ngày mẫu ngoài khoảng"
          initial="2019-03-15"
        />
        <DateDemo label="aria-invalid" name="Ngày mẫu không hợp lệ" invalid />
        <DateDemo
          label="disabled"
          name="Ngày mẫu bị khóa"
          initial="2026-11-01"
          disabled
        />
      </div>
    </Section>
  );
}
