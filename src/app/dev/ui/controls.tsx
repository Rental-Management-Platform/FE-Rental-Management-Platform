import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Labeled, Section } from "./section";

const INPUT_SIZES = ["sm", "default", "lg"] as const;
const SIZE_LABEL = { sm: "Nhỏ 32 px", default: "Vừa 40 px", lg: "Lớn 44 px" };

function AccountTypeSelect({
  size,
  label,
  defaultValue,
  invalid,
  disabled,
}: {
  size?: "sm" | "default" | "lg";
  label: string;
  defaultValue?: string;
  invalid?: boolean;
  disabled?: boolean;
}) {
  return (
    <Select defaultValue={defaultValue} disabled={disabled}>
      <SelectTrigger size={size} aria-label={label} aria-invalid={invalid}>
        <SelectValue placeholder="Chọn loại tài khoản" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="tenant">Người thuê</SelectItem>
          <SelectItem value="landlord">Chủ trọ</SelectItem>
          <SelectItem value="admin">Quản trị viên</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

// Radix draws a radio inside a group, so each cell gets its own one-item group.
function RadioCell({
  checked,
  invalid,
  disabled,
  label,
}: {
  checked: boolean;
  invalid?: boolean;
  disabled?: boolean;
  label: string;
}) {
  return (
    <RadioGroup defaultValue={checked ? "on" : undefined} className="w-auto">
      <RadioGroupItem
        value="on"
        aria-label={label}
        aria-invalid={invalid}
        disabled={disabled}
      />
    </RadioGroup>
  );
}

const CHOICE_STATES = [
  { key: "default", label: "Mặc định", invalid: false, disabled: false },
  { key: "invalid", label: "Không hợp lệ", invalid: true, disabled: false },
  { key: "disabled", label: "Bị khóa", invalid: false, disabled: true },
] as const;

// Every form control with its sizes and states. Focus shows when you press Tab.
export function ControlsSection() {
  return (
    <>
      <Section
        title="Ô nhập liệu"
        description="Chữ luôn 16 px để iPhone không phóng to khi bấm vào. Bấm Tab để xem vòng focus."
      >
        <div className="grid gap-6 md:grid-cols-3">
          {INPUT_SIZES.map((size) => (
            <Labeled key={size} label={`size="${size}" · ${SIZE_LABEL[size]}`}>
              <Input
                size={size}
                placeholder="Nhập email của bạn"
                aria-label={`Ô nhập ${SIZE_LABEL[size]}`}
              />
            </Labeled>
          ))}
          <Labeled label="Đã có giá trị">
            <Input
              defaultValue="an.nguyen@example.com"
              aria-label="Có giá trị"
            />
          </Labeled>
          <Labeled label="aria-invalid">
            <Input
              defaultValue="an.nguyen@example.com"
              aria-invalid
              aria-label="Không hợp lệ"
            />
          </Labeled>
          <Labeled label="disabled">
            <Input
              placeholder="Nhập email của bạn"
              disabled
              aria-label="Bị khóa"
            />
          </Labeled>
        </div>
      </Section>

      <Section title="Vùng văn bản">
        <div className="grid gap-6 md:grid-cols-3">
          <Labeled label="Mặc định">
            <Textarea
              placeholder="Mô tả ngắn về căn phòng"
              aria-label="Vùng văn bản mặc định"
            />
          </Labeled>
          <Labeled label="aria-invalid">
            <Textarea
              placeholder="Mô tả ngắn về căn phòng"
              aria-invalid
              aria-label="Vùng văn bản không hợp lệ"
            />
          </Labeled>
          <Labeled label="disabled">
            <Textarea
              placeholder="Mô tả ngắn về căn phòng"
              disabled
              aria-label="Vùng văn bản bị khóa"
            />
          </Labeled>
        </div>
      </Section>

      <Section
        title="Ô chọn"
        description="Bấm vào ô để mở danh sách, dùng phím mũi tên để chọn."
      >
        <div className="grid gap-6 md:grid-cols-3">
          {INPUT_SIZES.map((size) => (
            <Labeled key={size} label={`size="${size}" · ${SIZE_LABEL[size]}`}>
              <AccountTypeSelect
                size={size}
                label={`Ô chọn ${SIZE_LABEL[size]}`}
              />
            </Labeled>
          ))}
          <Labeled label="Đã chọn">
            <AccountTypeSelect label="Đã chọn" defaultValue="landlord" />
          </Labeled>
          <Labeled label="aria-invalid">
            <AccountTypeSelect label="Không hợp lệ" invalid />
          </Labeled>
          <Labeled label="disabled">
            <AccountTypeSelect label="Bị khóa" disabled />
          </Labeled>
        </div>
      </Section>

      <Section
        title="Hộp kiểm, nút chọn, công tắc"
        description="Hàng trên chưa chọn, hàng dưới đã chọn. Vùng bấm rộng 44 px quanh mỗi nút."
      >
        <div className="grid gap-8 md:grid-cols-3">
          <Labeled label="Checkbox">
            <div className="flex flex-col gap-4">
              {[false, true].map((checked) => (
                <div key={String(checked)} className="flex items-center gap-8">
                  {CHOICE_STATES.map((s) => (
                    <Checkbox
                      key={s.key}
                      defaultChecked={checked}
                      aria-invalid={s.invalid}
                      disabled={s.disabled}
                      aria-label={`Hộp kiểm ${s.label}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </Labeled>
          <Labeled label="RadioGroup">
            <div className="flex flex-col gap-4">
              {[false, true].map((checked) => (
                <div key={String(checked)} className="flex items-center gap-8">
                  {CHOICE_STATES.map((s) => (
                    <RadioCell
                      key={s.key}
                      checked={checked}
                      invalid={s.invalid}
                      disabled={s.disabled}
                      label={`Nút chọn ${s.label}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </Labeled>
          <Labeled label="Switch">
            <div className="flex flex-col gap-4">
              {[false, true].map((checked) => (
                <div key={String(checked)} className="flex items-center gap-8">
                  {CHOICE_STATES.map((s) => (
                    <Switch
                      key={s.key}
                      defaultChecked={checked}
                      aria-invalid={s.invalid}
                      disabled={s.disabled}
                      aria-label={`Công tắc ${s.label}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </Labeled>
        </div>
        <p className="text-sm text-muted-foreground">
          Mỗi cột có ba trạng thái: mặc định, không hợp lệ, bị khóa.
        </p>
      </Section>

      <Section
        title="Nhãn và thông báo của từng ô"
        description="Field gắn nhãn, ô nhập và thông báo lỗi. Biểu mẫu FormField ở phần dưới làm việc này tự động."
      >
        <FieldGroup className="max-w-md">
          <Field>
            <FieldLabel htmlFor="demo-email">Email</FieldLabel>
            <Input
              id="demo-email"
              placeholder="Nhập email của bạn"
              aria-describedby="demo-email-help"
            />
            <FieldDescription id="demo-email-help">
              Dùng để đăng nhập và nhận thông báo.
            </FieldDescription>
          </Field>
          <Field data-invalid>
            <FieldLabel htmlFor="demo-email-taken">Email</FieldLabel>
            <Input
              id="demo-email-taken"
              defaultValue="an.nguyen@example.com"
              aria-invalid
              aria-describedby="demo-email-taken-error"
            />
            <FieldError id="demo-email-taken-error">
              Email này đã được đăng ký.
            </FieldError>
          </Field>
          <Field orientation="horizontal" className="py-3">
            <Checkbox id="demo-terms" aria-describedby="demo-terms-help" />
            <FieldContent>
              <FieldLabel htmlFor="demo-terms">
                Tôi đã đọc và đồng ý với điều khoản
              </FieldLabel>
              <FieldDescription id="demo-terms-help">
                Nhãn nằm bên phải, cả dòng đều bấm được.
              </FieldDescription>
            </FieldContent>
          </Field>
        </FieldGroup>
      </Section>
    </>
  );
}
