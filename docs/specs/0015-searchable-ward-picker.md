# 0015. Ô chọn phường, xã có tìm kiếm cho biểu mẫu nhà trọ và bộ lọc tìm tin

**Date**: 2026-11-10
**Status**: Proposed

## Summary

Ô chọn phường hiện là danh sách thả xuống thường, nên người dùng phải lướt qua 168 mục. Spec này thay nó bằng một ô có thanh tìm kiếm: gõ "ben thanh" không dấu vẫn ra "Phường Bến Thành", và chọn được bằng bàn phím lẫn bằng chạm. Ô này dùng chung: biểu mẫu nhà trọ dùng ngay, bộ lọc tìm tin (#13) dùng lại sau. Nó dựng trên thành phần Command của shadcn (thêm một gói nhỏ tên `cmdk`), còn phần bỏ dấu và xếp kết quả do ta tự viết.

## Context

Danh sách phường, xã (`GET /wards`) trả hết một lần: 168 mục, mỗi mục có `code` 5 chữ số, `name` đầy đủ kèm loại đơn vị ("Phường Bến Thành", "Xã ...", "Đặc khu Côn Đảo") và tên tỉnh. API không có tìm kiếm hay phân trang. Máy chủ chỉ bỏ dấu cho ô từ khóa của danh sách tin, nên với ô chọn phường, việc bỏ dấu phải làm ở trình duyệt. Hợp đồng còn dặn: dùng `code` để lưu và so sánh, đừng so `name`, vì dấu thanh khác nhau theo nguồn ("Hoà" và "Hòa").

Ô chọn phường hiện có là `Select` của Radix trong biểu mẫu tạo nhà trọ (`property-form.tsx`). Nó chỉ nhảy theo chữ cái đầu và nhạy với dấu, nên gõ "ben" không tới được "Bến Thành". Bộ lọc tìm tin (#13) cần đúng ô này, nhưng ở đó phường không bắt buộc (phải bỏ chọn được), và trang công khai làm điện thoại trước: ô nhập cao 44 px, chữ nhập cỡ 16 px để iPhone không tự phóng to.

Còn mấy ràng buộc nữa. Ô nằm trong biểu mẫu nên phím Enter không được gửi biểu mẫu. Người Việt gõ bằng bộ gõ (Telex), nên Enter lúc đang ghép chữ không được chọn nhầm. Spec 0011 (bản đồ nhà trọ, chưa xây) đọc khung `bounds` của phường từ cùng truy vấn danh mục và phản ứng khi phường đổi, nên ô chọn không được đổi cách biểu mẫu giữ `wardCode`. Không quyết thì biểu mẫu vẫn bắt lướt 168 mục, và #13 không có ô để dùng.

## Requirements

**User stories**:
- Là chủ trọ, tôi muốn gõ một phần tên phường (kể cả không dấu) để chọn nhanh phường của nhà trọ, không phải lướt qua 168 mục.
- Là người tìm trọ (qua bộ lọc #13), tôi muốn gõ để chọn phường ngay trên điện thoại và bỏ chọn dễ dàng.
- Là người dùng bàn phím hoặc trình đọc màn hình, tôi muốn mở, gõ, di chuyển và chọn mà không cần chuột.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: Ô chọn. `WardPicker` (thành phần client, `src/features/wards/components/ward-picker.tsx`) là một nút `role="combobox"` có `aria-haspopup="listbox"` và `aria-expanded`, bấm vào mở một hộp nổi (Popover) ngay dưới nút, trong đó có ô gõ tìm và danh sách. Nhận `value` (mã phường `code`, chuỗi rỗng là chưa chọn) và `onChange(code)`. Nút hiện `name` của phường đã chọn, cắt bằng `truncate`. Cỡ theo `size`: `lg` cao 44 px (trang công khai), mặc định cao 40 px.
- **AC-2**: Dữ liệu. Chỉ một lần đọc `GET /wards` qua truy vấn dùng chung `wardsQuery` (khóa `["wards"]`, `staleTime: Infinity`), nay nằm ở `src/features/wards/api/wards-query.ts` kèm hook `useWards()`. Thư mục `property` không còn giữ nó. Không có API mới, không có kiểu mới: dùng `Ward` hiện có.
- **AC-3**: Bỏ dấu. Hàm thuần `foldWardText(text)`: chữ thường, tách dấu (NFD), xóa mọi dấu tổ hợp, đổi `đ` thành `d`, gộp khoảng trắng, cắt hai đầu. "Hoà", "Hòa" và "hoa" cho cùng một kết quả; "Đặc khu" thành "dac khu". Không bao giờ ném lỗi, với mọi chuỗi.
- **AC-4**: Luật khớp. Hàm thuần `matchWards(wards, text)`: chữ gõ được bỏ dấu rồi tách thành từ (tối đa 6 từ, từ thừa bỏ; mỗi từ cắt ở 50 ký tự). Một phường khớp khi **mọi từ gõ** đều là phần đầu của ít nhất một từ trong `name` đã bỏ dấu. Chữ gõ rỗng thì khớp tất cả. Ví dụ: "tan" ra "Phường Tân Định" và "Phường Bình Tân", không ra "Phường Phan Rang"; "ben thanh" ra "Phường Bến Thành".
- **AC-5**: Thứ tự. Chưa gõ gì thì giữ thứ tự của danh mục. Có chữ gõ thì xếp theo vị trí từ đầu tiên trong `name` mà từ gõ thứ nhất khớp (vị trí nhỏ trước), bằng nhau thì giữ thứ tự danh mục. Nên gõ "ben" thì "Phường Bến Thành" (từ khớp ở vị trí 1) đứng trước "Phường An Bên" (vị trí 2).
- **AC-6**: Mở và ô gõ. Mở bằng bấm, Enter, Space hoặc mũi tên xuống khi nút đang có focus. Lúc mở, con trỏ vào ô gõ ngay trên mọi thiết bị (kể cả điện thoại), ô gõ rỗng, dòng đang chọn được tô sáng và cuộn vào tầm nhìn (chưa chọn gì thì tô sáng dòng đầu). Sau mỗi lần gõ, dòng khớp đầu tiên được tô sáng. Ô gõ có `autoComplete="off"`, `autoCorrect="off"`, `autoCapitalize="none"`, `spellCheck={false}`, `enterKeyHint="done"`, giới hạn 60 ký tự, chữ cỡ `text-(length:--text-input)`.
- **AC-7**: Bàn phím. Mũi tên lên xuống đổi dòng tô sáng (đi vòng), Home và End về dòng đầu và cuối, Enter chọn dòng đang tô sáng, Escape đóng mà không đổi giá trị và trả focus về nút, Tab đóng hộp. Chọn xong thì đóng, xóa chữ đã gõ, trả focus về nút và gọi `onChange`. Enter không bao giờ gửi biểu mẫu bao quanh (hộp nổi nằm ngoài biểu mẫu trong cây DOM, và phím được chặn). Enter trong lúc bộ gõ đang ghép chữ (`isComposing` hoặc mã phím 229) không chọn gì.
- **AC-8**: Chạm và kích thước. Mỗi dòng cao ít nhất 44 px khi `size="lg"` (40 px ở cỡ mặc định). Chạm một dòng là chọn; kéo để cuộn danh sách không chọn nhầm. Danh sách cuộn bên trong hộp nổi, cao tối đa bằng nhỏ hơn của chỗ còn trống và 22 rem, rộng đúng bằng nút. Trang không cuộn ngang, dùng tốt ở 320 px.
- **AC-9**: Trình đọc màn hình. Ô gõ có tên "Tìm phường hoặc xã", danh sách có tên "Danh sách phường, xã", dòng đang chọn có `aria-selected` và biểu tượng dấu chọn (không chỉ dựa vào màu). Một dòng `role="status"` đọc số kết quả ("12 kết quả" hoặc "Không có kết quả") khi chữ gõ đổi. Tên của nút lấy từ nhãn của ô (`aria` do `FormField` đưa vào, hoặc `aria-label` của nơi gọi).
- **AC-10**: Dòng bỏ chọn. Có prop `allLabel` thì danh sách mở đầu bằng một dòng mang chữ đó (bộ lọc truyền "Tất cả phường, xã"), chọn nó thì gọi `onChange("")`. Dòng này chỉ hiện khi chữ gõ đang rỗng. Chưa chọn gì thì nút hiện `allLabel` (nếu có), nếu không thì hiện `placeholder` ("Chọn phường hoặc xã" là mặc định). Biểu mẫu nhà trọ (bắt buộc chọn) không truyền `allLabel` nên không có dòng này.
- **AC-11**: Không có kết quả. Gõ mà không phường nào khớp thì trong vùng danh sách hiện dòng "Không có phường, xã nào khớp “{chữ gõ}”. Thử gõ ít chữ hơn.", chữ gõ được cắt ở 40 ký tự. Dòng này vẽ từ số kết quả của `matchWards`, không dựa vào ô trống có sẵn của `cmdk`.
- **AC-12**: Mã lạ. Một `value` không có trong danh mục (sau khi đã tải xong) thì nút hiện "Mã {value} (không có trong danh sách)", danh sách vẫn dùng bình thường và không dòng nào được đánh dấu đã chọn.
- **AC-13**: Đang tải và lỗi. Trong lúc chờ, nút bị khóa (`disabled`), có `aria-busy` và hiện "Đang tải danh sách". Khi đọc lỗi, nút bị khóa và ngay dưới nút hiện một `Alert` kiểu `destructive` có tiêu đề "Không tải được danh sách phường, xã", câu từ `describeError` và nút "Thử lại" (tắt khi đang đọc lại). Biểu mẫu nhà trọ không còn tự vẽ `Alert` này.
- **AC-14**: Dùng trong biểu mẫu. Với React Hook Form qua `FormField`, nút nhận `id`, `ref`, `onBlur`, `aria-invalid` và `aria-describedby` từ ô, nên lỗi từ máy chủ đưa focus về đúng nút. Biểu mẫu nhà trọ dùng `WardPicker` thay `Select`, vẫn gửi `wardCode`, và `WARD_UNKNOWN` vẫn hiện dưới ô, rồi danh mục được đọc lại và ô bị xóa nếu mã không còn (như hiện nay). Với biểu mẫu gốc của trình duyệt (bộ lọc #13 dùng `next/form`), prop `name` vẽ thêm `<input type="hidden">` cạnh nút để gửi `wardCode`, và chỉ vẽ khi `value` khác rỗng, nên không bao giờ gửi `wardCode=` trống.
- **AC-15**: Dòng tỉnh. Ô "Tỉnh, thành phố" chỉ đọc của biểu mẫu nhà trọ giữ nguyên, vẫn lấy `provinceName` từ cùng danh mục theo `wardCode` của biểu mẫu.
- **AC-16**: Mẫu xem thử và bản dựng sạch. `/dev/ui` có phần "Ô chọn phường" trên dữ liệu giả, không gọi mạng: đóng chưa chọn, đã chọn, có `allLabel`, mã lạ, đang tải, lỗi, đang mở có kết quả, đang mở không có kết quả. Kiểm ở 320, 390 và 1280 px. Chỉ dùng màu có tên (token), không thêm cặp màu tương phản mới. `npm run check` và `npm run build` đều qua.

## Options considered

### Option 1: Command của shadcn trong Popover

Thêm thành phần `command` (gói `cmdk`) bằng shadcn CLI, đặt trong `Popover`, tắt bộ lọc có sẵn của `cmdk` (`shouldFilter={false}`) và tự lọc bằng `matchWards`.

**Pros**:
- Có sẵn mũi tên, Enter, Esc, tô sáng dòng đầu, đọc màn hình theo mẫu combobox; hợp cách dự án đã dùng shadcn.
- Hộp nổi dùng được trong biểu mẫu, thẻ bộ lọc và ngăn bộ lọc trên điện thoại.

**Cons**:
- Thêm một gói và một tệp shadcn cần giữ.
- Luật khớp và xếp phải tự viết, vì bộ lọc của `cmdk` không bỏ dấu tiếng Việt đúng ý ta.

### Option 2: Tự viết combobox theo chuẩn ARIA

Một ô `role="combobox"` và `listbox` viết tay, dùng `aria-activedescendant`.

**Pros**:
- Không thêm gói, kiểm soát từng chi tiết.

**Cons**:
- Phải tự lo mũi tên, cuộn dòng đang chọn, thông báo số kết quả, nhiều mã hơn và dễ sai phần trợ năng.

### Option 3: Ô nhập có gợi ý của trình duyệt (datalist)

Một `<input list>` với 168 `<option>`.

**Pros**:
- Ít mã nhất.

**Cons**:
- Mỗi trình duyệt và điện thoại hiện khác nhau, không kiểm soát được bỏ dấu hay giao diện, lệch bộ thiết kế; không ép được giá trị phải là một mã hợp lệ.

### Option 4: Giữ `Select` và thêm gõ nhảy chữ

Giữ `Select` hiện có, chỉ dựa vào tính năng nhảy theo chữ cái đầu của Radix.

**Pros**:
- Không đổi gì, không thêm gói.

**Cons**:
- Không lọc, nhạy với dấu, gõ "ben" không tới "Bến Thành"; đúng vấn đề cần giải quyết.

## Decision

**Chosen option**: Option 1: Command của shadcn trong Popover

Dựng một ô chọn dùng chung trên `Command` trong `Popover`, với phần bỏ dấu, luật khớp và thứ tự do ta tự viết.

Các lựa chọn nhỏ đã chốt cùng kỹ sư:
- Luật khớp: phần đầu từ, mọi từ gõ phải khớp, chỉ so với `name` (AC-4). Không so tên tỉnh.
- Trên điện thoại: vẫn là hộp nổi dưới ô, không đổi thành ngăn trượt (AC-8).
- Bỏ chọn khi dùng làm bộ lọc: dòng đầu danh sách (AC-10), không có nút X.
- Ô gõ nhận con trỏ ngay khi mở trên mọi thiết bị (AC-6).
- Mã lạ hiện "Mã {value} (không có trong danh sách)" (AC-12).
- Không tô đậm phần chữ khớp (xem Follow-up).

**Implementation skills**: `shadcn` (`shadcn-ui/ui`, `.agents/skills/shadcn/`) · `react-hook-form` (`pproenca/dot-skills`, `.agents/skills/react-hook-form/`) · `tanstack-query-best-practices` (`deckardger/tanstack-agent-skills`, `.agents/skills/tanstack-query-best-practices/`)

## Rationale

Lực chính là 168 mục không có tìm kiếm phía máy chủ và một yêu cầu rõ: gõ không dấu vẫn ra tên có dấu. Option 4 không giải quyết được điều đó. Option 3 giao giao diện và cách bỏ dấu cho từng trình duyệt, trong khi dự án đặt tiêu chuẩn cao về điện thoại và trợ năng. Option 2 làm được nhưng tự gánh phần bàn phím và đọc màn hình mà `cmdk` đã có sẵn và đã được dùng rộng. Option 1 là thứ ít mã nhất vẫn đạt chuẩn trợ năng, và vì dự án đã dùng shadcn trên Radix nên hộp nổi, focus và lớp phủ đã có cách làm.

Luật khớp theo phần đầu từ được chọn thay vì chuỗi con (như ô từ khóa của máy chủ) vì danh mục chỉ có 168 mục và người dùng thường gõ phần đầu của một từ: chuỗi con làm "an" ra cả "Tân", "Bình An", "Phan", rất nhiễu. Thứ tự theo vị trí từ khớp giữ cho "Bến Thành" đứng trước "An Bên" mà không cần chấm điểm phức tạp. Việc tự lọc (tắt bộ lọc của `cmdk`) là bắt buộc, vì hàm chấm điểm có sẵn không biết bỏ dấu `đ` và các dấu tổ hợp theo ý ta.

Ô gõ nhận focus ngay cả trên điện thoại: mục đích của ô là tránh lướt 168 mục, và danh sách thu hẹp theo chữ gõ nên dòng đầu vẫn thấy dù bàn phím ảo che một phần. Giữ một kiểu hộp nổi cho mọi màn hình để cùng một mã chạy được trong biểu mẫu, trong thẻ bộ lọc và trong ngăn bộ lọc, thay vì thêm nhánh ngăn trượt rồi thành ngăn chồng ngăn.

## Feature design

**Data model sketch**:
Không có dữ liệu mới và không lưu gì. Ô đọc `Ward { code, name, provinceCode, provinceName }` (kiểu đã có trong `src/lib/api/types.ts`). Chữ gõ và dòng tô sáng chỉ nằm trong trạng thái của thành phần.

**State transitions**:
- Hộp: đóng → mở (chữ gõ rỗng, tô sáng dòng đã chọn) → đóng (chọn một dòng, hoặc Escape, hoặc Tab, hoặc bấm ra ngoài). Đóng thì chữ gõ được xóa.
- Ô: đang tải → sẵn sàng hoặc lỗi. Lỗi → đang tải khi bấm "Thử lại". Khi sẵn sàng, `value` là: rỗng, có trong danh mục, hoặc mã lạ.

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| /wards | GET | không có | mảng `Ward` xếp theo tên tiếng Việt | none | 429 hiếm khi, lỗi mạng và 5xx đi vào trạng thái lỗi (AC-13) |

Giao diện của thành phần `WardPicker`:
| Prop | Kiểu | Luật |
|---|---|---|
| `value` | `string` | Mã phường, hoặc chuỗi rỗng khi chưa chọn |
| `onChange` | `(code: string) => void` | Gọi khi người dùng chọn một dòng; dòng bỏ chọn gọi với chuỗi rỗng |
| `allLabel` | `string` tùy chọn | Có thì thêm dòng bỏ chọn và dùng làm chữ khi chưa chọn (AC-10) |
| `placeholder` | `string` tùy chọn | Mặc định "Chọn phường hoặc xã" |
| `size` | `"default" or "lg"` | Cao 40 hoặc 44 px; dòng trong danh sách theo cỡ (AC-8) |
| `name` | `string` tùy chọn | Có thì vẽ `<input type="hidden">` khi `value` khác rỗng (AC-14) |
| `id`, `ref`, `onBlur`, `aria-*`, `disabled` | như nút | Đi thẳng vào nút, để `FormField` đặt nhãn, lỗi và focus (AC-14) |

**Value sourcing** (every value each action produces, computes, or displays names where it comes from):
| Action | Value produced / displayed | Source |
|---|---|---|
| Mở danh sách | Các dòng và thứ tự | Dữ liệu của `useWards()` (`GET /wards`), qua `matchWards(wards, text)` |
| Vẽ nút | Tên phường đã chọn | Mục danh mục có `code` bằng `value`; không có thì "Mã {value} (không có trong danh sách)" lấy từ `value`; `value` rỗng thì `allLabel` hoặc `placeholder` |
| Gõ chữ | Các từ đã bỏ dấu | `foldWardText` của chữ gõ, không dùng gì khác (không múi giờ, không ngôn ngữ trình duyệt) |
| Đọc số kết quả | Số trong "12 kết quả" | Độ dài kết quả của `matchWards` (không tính dòng bỏ chọn) |
| Mở danh sách | Dòng được tô sáng và cuộn tới | `value` (mã phường); chưa chọn thì dòng đầu |
| Gửi biểu mẫu gốc | Giá trị của `wardCode` | `value` của ô, chỉ khi khác rỗng |
| Dòng tỉnh của biểu mẫu | `provinceName` | Mục danh mục tìm theo `wardCode` của biểu mẫu (giữ như hiện nay) |

**Key invariants**:
- Giá trị của ô luôn là một mã phường hoặc chuỗi rỗng, không bao giờ là tên.
- Ô không tự đổi `value`; chỉ `onChange` sau một lựa chọn của người dùng.
- `foldWardText` và `matchWards` là hàm thuần, không ném lỗi với mọi chuỗi (kể cả chuỗi rỗng, rất dài, có biểu tượng cảm xúc).
- Gõ chữ không gửi yêu cầu nào lên mạng: danh mục đọc một lần cho cả lượt dùng.
- Enter không bao giờ gửi biểu mẫu bao quanh; focus luôn về nút khi hộp đóng.

**Security model**:
Danh mục phường là dữ liệu công khai, đọc không cần đăng nhập (`auth: "none"`), không có dữ liệu cá nhân. Tên phường được vẽ thành chữ (React tự thoát ký tự), không bao giờ là HTML. Chữ người dùng gõ ở ô tìm chỉ ở trong trình duyệt.

**Configuration required**:
- Không có biến môi trường mới. Có một phụ thuộc mới là `cmdk`, vào cùng lúc với `npx shadcn@latest add command`.

**Critical test scenarios** (each maps to an acceptance criterion in ## Requirements):
- Happy path: chủ trọ mở "Thêm nhà trọ", mở ô phường, gõ "ben thanh", thấy "Phường Bến Thành" đứng đầu, nhấn Enter, nút hiện tên phường, dòng tỉnh hiện thành phố, lưu thì gửi đúng `wardCode`, verifies **AC-3**, **AC-4**, **AC-5**, **AC-7**, **AC-14**, **AC-15**.
- Bỏ dấu: gõ "hoa" thấy cả tên viết "Hòa" lẫn "Hoà" nếu danh mục có cả hai, verifies **AC-3**.
- Chỉ bàn phím: Tab tới nút, Enter mở, gõ, mũi tên, Enter chọn, Escape đóng, focus về nút, verifies **AC-6**, **AC-7**.
- Bộ gõ: gõ "Tân" bằng Telex, nhấn Enter trong lúc chữ còn đang ghép thì không chọn gì, verifies **AC-7**.
- Điện thoại 320 px: chạm một dòng thì chọn, kéo để cuộn thì không chọn, trang không cuộn ngang, verifies **AC-8**.
- Lỗi đọc danh mục (chặn `GET /wards`): nút khóa, có `Alert` và "Thử lại"; bấm lại khi mạng có thì ô dùng được, verifies **AC-13**.
- `WARD_UNKNOWN` từ máy chủ hiện dưới ô và ô bị xóa khi mã không còn, verifies **AC-14**.
- Mã lạ và dòng bỏ chọn: `value` là "99999" hiện "Mã 99999 (không có trong danh sách)"; với `allLabel`, chọn dòng đầu gọi `onChange("")`, verifies **AC-10**, **AC-12**.
- Không có kết quả: gõ "zzzz" hiện dòng không khớp và trình đọc màn hình đọc "Không có kết quả", verifies **AC-9**, **AC-11**.
- Quyền: không có (dữ liệu công khai); biểu mẫu nhà trọ vẫn nằm sau lớp chặn của chủ trọ.

## Build plan

Theo Tracer Bullet: M1 là một sợi chỉ mỏng nhưng thật, đi từ danh mục tới biểu mẫu nhà trọ thật. M2 dày lên. M3 hoàn thiện.

**M1, sợi chỉ mỏng: gõ không dấu và lưu một nhà trọ thật**
1. Chuyển `wardsQuery` và `wardsKey` sang `src/features/wards/api/wards-query.ts`, thêm `useWards()` ở `src/features/wards/hooks/use-wards.ts`, xóa `src/features/property/api/wards.ts` và sửa chỗ nhập trong `property-form.tsx`, satisfies **AC-2**
2. Viết `foldWardText` và `matchWards` (kèm luật thứ tự) ở `src/features/wards/ward-match.ts`, chỉ nhập kiểu bằng `import type` để chạy được thẳng bằng Node khi kiểm, satisfies **AC-3**, **AC-4**, **AC-5**
3. Thêm `command` bằng `npx shadcn@latest add command` (kéo theo `cmdk`), rồi áp các sửa đổi của spec 0003: vòng focus `ring-2 ring-ring ring-offset-2`, chữ ô gõ `text-(length:--text-input)`, độ cao dòng 40 và 44 px, bỏ `CommandDialog` vì không dùng, dịch mọi chữ tiếng Anh, bỏ lớp `dark:`, satisfies **AC-1**, **AC-8**
4. Viết `WardPicker` mỏng: nút, Popover, ô gõ, danh sách từ `matchWards`, chọn thì đóng và gọi `onChange`; thay `Select` trong biểu mẫu nhà trọ, nối `id`, `ref`, `onBlur`, `aria-*` từ `FormField`, giữ `WARD_UNKNOWN` và dòng tỉnh; tạo được một nhà trọ thật bằng cách gõ không dấu, satisfies **AC-1**, **AC-6**, **AC-14**, **AC-15**

**M2, chiều sâu**
5. Bàn phím và bộ gõ: mở bằng Enter, Space, mũi tên xuống; Home, End, đi vòng; Escape và Tab; Enter bị chặn khi `isComposing`; trả focus về nút; cuộn dòng đã chọn vào tầm nhìn; tô sáng dòng khớp đầu, satisfies **AC-6**, **AC-7**
6. Chạm và kích thước: dòng 44 px ở `lg`, chiều rộng bằng nút, chiều cao tối đa theo chỗ còn trống, kéo cuộn không chọn nhầm, kiểm ở 320 px, satisfies **AC-8**
7. Trợ năng: tên cho ô gõ và danh sách, `aria-selected` kèm dấu chọn, dòng `role="status"` đọc số kết quả, satisfies **AC-9**
8. Dòng bỏ chọn với `allLabel`, `<input type="hidden">` với `name`, nhãn mã lạ, dòng không có kết quả vẽ từ độ dài `matchWards`, satisfies **AC-10**, **AC-11**, **AC-12**, **AC-14**
9. Đang tải và lỗi nằm trong ô (`Alert` và "Thử lại"), bỏ `Alert` riêng của biểu mẫu nhà trọ, tách `WardPickerView` (chỉ vẽ) khỏi `WardPicker` (đọc dữ liệu), satisfies **AC-13**, **AC-16**

**M3, hoàn thiện**
10. Phần "Ô chọn phường" trong `/dev/ui` (`src/app/dev/ui/ward-picker.tsx` và `ward-picker-sample.ts`, dữ liệu giả có các tên có dấu thanh khác nhau), kiểm ở 320, 390 và 1280 px, `npm run check` và `npm run build`, satisfies **AC-16**

## Consequences

**Positive**:
- Chủ trọ và (sau này) người tìm trọ chọn phường bằng cách gõ, không cần dấu.
- Một ô dùng chung cho biểu mẫu nhà trọ, form sửa nhà trọ (#12) và bộ lọc (#13), nên hành vi và trợ năng đều một chỗ.
- Danh mục phường có chỗ ở riêng (`src/features/wards`), nên trang công khai không phải nhập từ thư mục của chủ trọ.

**Negative / tradeoffs**:
- Thêm gói `cmdk` và một tệp shadcn cần giữ cập nhật.
- Luật khớp, thứ tự và chống Enter khi đang gõ bộ gõ do ta sở hữu, cần kiểm tay ở điện thoại thật.
- Không tô đậm phần chữ khớp: người gõ không dấu có thể chưa thấy ngay vì sao một dòng khớp.
- Bàn phím ảo trên điện thoại che một phần danh sách khi ô gõ đang nhận focus.
- Hộp nổi bên trong ngăn bộ lọc trên điện thoại (của #13) chưa được kiểm; để #13 kiểm.

**Neutral**:
- `wardsQuery` đổi chỗ, nên spec 0011 phải đổi đường dẫn ghi trong đó (xem Follow-up).
- Chuỗi tiếng Việt của ô (nhãn, thông báo, "Mã ... không có trong danh sách") nằm ở `src/features/wards/texts.ts`.

## Follow-up

- [ ] Spec 0011 (`docs/specs/0011-property-location-map/index.md`, dòng 92, 105 và 155) ghi `src/features/property/api/wards.ts` và `useQuery(wardsQuery(api))`: sau khi #32 xong, cập nhật đường dẫn thành `src/features/wards/api/wards-query.ts` (chỉ đổi đường dẫn, không đổi quyết định). Kiểu `CatalogWard` có `bounds` vẫn do #33 thêm.
- [ ] #13 dùng `<WardPicker name="wardCode" allLabel="Tất cả phường, xã" size="lg" />` trong `next/form` của nó. #13 phải quyết cách danh mục tới được lần vẽ đầu và cách xử lý khi tắt JavaScript (ô chọn là thành phần client; một `<select>` gốc trong `<noscript>` cần danh mục đọc ở máy chủ), và kiểm hộp nổi bên trong ngăn bộ lọc trên điện thoại.
- [ ] #12 (sửa nhà trọ) dùng lại cùng ô này, kèm ràng buộc đổi phường phải gửi tọa độ mới của spec 0011.
- [ ] Tô đậm phần chữ khớp trong các dòng kết quả được cố ý bỏ qua. Xem lại nếu người dùng gõ không dấu rồi bối rối.
- [ ] Sau khi xong, `/sync` thêm khu mới `src/features/wards` vào ngữ cảnh dự án và ghi thành phần `command` vào `src/components/AGENTS.md`.
