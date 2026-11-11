# 0017. Phí và tiện ích trong biểu mẫu tạo nhà trọ

**Date**: 2026-11-11
**Status**: In Progress

## Summary

Biểu mẫu tạo nhà trọ hiện chỉ có tên, địa chỉ và phường. Spec này thêm hai vùng: "Các khoản phí ngoài tiền thuê" (tối đa 6 dòng, mỗi loại phí một dòng, có giá, đơn vị và ghi chú) và "Tiện ích" (lưới ô tích, tức checkbox, lấy từ danh mục của backend). Cả hai không bắt buộc, và màn kết quả sau khi tạo hiện lại đúng những gì vừa lưu. Hai vùng nhập được dựng để biểu mẫu sửa nhà trọ (#12) dùng lại; việc gửi PATCH không làm ở đây.

## Requirements

Seeded from scope item #11 and refined with the engineer. Phần hiển thị phí và tiện ích ở trang chi tiết tin đã xong (commit `644d557`, `PropertyZone`), nên spec này chỉ nói về biểu mẫu. Contract with the backend: `api-for-frontend.md` mục 6.16 (`GET /amenities`) và 6.17 (nhà trọ, các khoản phí, `amenityKeys`, các mã lỗi). Patterns to follow: spec 0003 và 0004 (thành phần, vùng, màu), spec 0006 (mẫu biểu mẫu của #6, mã trong `src/features/property`), spec 0011 (bản đồ nhà trọ, cùng sửa biểu mẫu này), spec 0015 (ô chọn phường, mẫu đọc danh mục), spec 0016 (`price-fields.tsx`, mẫu ô giá có dòng đọc số).

**Out of scope** (đã chốt với kỹ sư, không làm): trang sửa nhà trọ và việc gửi `PATCH /properties/:id` (#12), tọa độ và bản đồ (#33), danh sách và xóa nhà trọ (#12), lọc tin theo tiện ích (backend không có), admin sửa danh mục tiện ích (#22 và #23).

**User stories**:
- Là chủ trọ, tôi muốn khai các khoản phí ngoài tiền thuê (điện, nước, internet, giữ xe, dịch vụ, khác) ngay khi tạo nhà trọ, để người thuê thấy chi phí thật ở mọi tin của nhà trọ đó.
- Là chủ trọ, tôi muốn tích những tiện ích nhà trọ có, để người thuê biết nhà trọ có gì.
- Là chủ trọ dùng bàn phím hoặc điện thoại, tôi muốn thêm, đổi và xóa từng dòng phí mà không lạc chỗ.
- Là người làm #12, tôi muốn dùng lại hai vùng nhập này trong biểu mẫu sửa nhà trọ mà không phải viết lại.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: Hai vùng mới. Biểu mẫu tạo nhà trọ (`/landlord/properties/new`) có thêm hai vùng sau "Địa chỉ", theo thứ tự "Các khoản phí ngoài tiền thuê" rồi "Tiện ích" (khi vùng bản đồ của spec 0011 được làm, nó nằm giữa "Địa chỉ" và hai vùng này). Cả hai không bắt buộc: tạo nhà trọ không phí và không tiện ích vẫn chạy như trước, và gửi hai mảng rỗng.
- **AC-2**: Thêm dòng phí. Vùng phí lúc mở trống, có dòng "Chưa có khoản phí nào." và nút "Thêm khoản phí". Mỗi lần bấm thêm một dòng với loại đầu tiên (theo thứ tự `electricity`, `water`, `internet`, `parking`, `service`, `other`) mà chưa dòng nào giữ, đơn vị mặc định của loại đó, giá và ghi chú để trống, và tiêu điểm vào ô "Loại phí" của dòng mới. Khi đủ 6 dòng, nút tắt và có dòng chữ luôn hiện "Đã đủ 6 loại phí." gắn vào nút bằng `aria-describedby`.
- **AC-3**: Loại phí không lặp. Ô "Loại phí" của một dòng chỉ liệt kê loại của chính nó và những loại chưa dòng nào giữ (loại khác bị bỏ khỏi danh sách, không phải làm mờ). Đổi loại thì đơn vị chỉ đổi theo khi nó còn là đơn vị mặc định của loại cũ; đơn vị chủ trọ đã tự chọn được giữ. Xóa một dòng thì loại của nó được trả lại cho các dòng khác.
- **AC-4**: Bốn ô của dòng. "Loại phí" (chọn, chữ từ `feeKindLabel`), "Giá (đồng)" (chỉ nhận chữ số, tối đa 9 ký tự, bàn phím số trên điện thoại), "Đơn vị" (chọn một trong năm: mỗi kWh, mỗi m³, mỗi tháng, mỗi người mỗi tháng, mỗi xe mỗi tháng), "Ghi chú" (không bắt buộc, tối đa 100 ký tự). Dưới ô giá có một dòng mô tả: số đã gõ đọc thành tiền ("3.800 ₫"), "Miễn phí" khi là 0, không có gì khi chưa phải số; khi ô báo lỗi thì lỗi thay chỗ dòng này. Khi ô trống, dòng mô tả là "Nhập 0 nếu miễn phí."
- **AC-5**: Xóa và thông báo. Mỗi dòng có nút "Xóa" với tên truy cập "Xóa khoản phí {loại}". Sau khi xóa, tiêu điểm về nút "Thêm khoản phí". Một vùng trạng thái (`role="status"`, `aria-live="polite"`) đọc "Đã thêm khoản phí {loại}." và "Đã xóa khoản phí {loại}.". Mỗi dòng là một nhóm (`role="group"`) có nhãn "Khoản phí {số}: {loại}".
- **AC-6**: Lưới tiện ích. Vùng "Tiện ích" hiện mỗi tiện ích của `GET /amenities` thành một ô tích với nhãn là `name`, theo đúng thứ tự API trả (theo tên), hai cột trên điện thoại và nhiều cột hơn từ `sm`. Một dòng trạng thái đọc "Đã chọn {n} tiện ích". Khi đã chọn 30, các ô chưa tích bị tắt và dòng đó đọc "Đã chọn đủ 30 tiện ích.". Giá trị của trường giữ khóa theo thứ tự danh mục.
- **AC-7**: Kiểm nhẹ ở FE (backend là người kiểm thật). Mỗi lỗi hiện dưới đúng ô, tiêu điểm vào ô sai đầu tiên theo thứ tự trên màn hình: giá trống "Nhập giá, nhập 0 nếu miễn phí.", giá có ký tự không phải chữ số "Chỉ nhập chữ số, không dùng dấu chấm hay dấu phẩy.", giá ngoài 0 đến 100.000.000 "Giá từ 0 đến 100.000.000 đồng.", ghi chú quá dài "Ghi chú tối đa 100 ký tự.", hai dòng cùng loại "Mỗi loại phí chỉ khai một lần.", quá 6 dòng "Tối đa 6 khoản phí.", quá 30 tiện ích "Chọn tối đa 30 tiện ích.". Dòng có giá trống không bao giờ bị bỏ lặng lẽ.
- **AC-8**: Gửi đi. Một lần `POST /properties` mang `name`, `addressText`, `wardCode`, `fees` (mỗi khoản có `kind`, `price` là số nguyên, `unit`, `note` đã cắt khoảng trắng hoặc `null` khi trống, theo đúng thứ tự dòng trên màn hình) và `amenityKeys`. Hai mảng luôn được gửi, kể cả rỗng. Nhà trọ vừa tạo có đủ phí và tiện ích, và tin đăng sau đó vào nhà trọ này hiện chúng ở trang chi tiết.
- **AC-9**: Lỗi backend về trường. `fees.N.kind`, `fees.N.price`, `fees.N.unit`, `fees.N.note` hiện dưới đúng ô của dòng N (đúng chỉ số vì dòng được gửi theo thứ tự màn hình). `fees` (trùng loại, quá 6) và `amenityKeys` hiện ở dòng thông báo của vùng tương ứng, tiêu điểm vào ô đầu tiên của vùng đó. Trường lạ vẫn thành thông báo chung của biểu mẫu như hiện có.
- **AC-10**: `AMENITY_UNKNOWN`. Biểu mẫu đọc lại danh mục, bỏ chọn những khóa không còn trong danh mục, giữ nguyên mọi thứ khác đã nhập, và vùng tiện ích hiện "Một số tiện ích đã bị gỡ khỏi danh sách và đã được bỏ chọn. Hãy xem lại rồi bấm Tạo nhà trọ.", tiêu điểm vào ô tích đầu tiên.
- **AC-11**: Trạng thái danh mục tiện ích. Đang tải: khung chờ và vùng trạng thái "Đang tải danh sách tiện ích". Lỗi: thông báo lỗi của API kèm nút "Thử lại"; biểu mẫu vẫn gửi được, với `amenityKeys` rỗng, và "Thử lại" thành công thì hiện lưới. Danh mục rỗng: "Chưa có tiện ích nào để chọn."
- **AC-12**: Màn kết quả. "Đã tạo nhà trọ" có thêm hai phần "Các khoản phí ngoài tiền thuê" và "Tiện ích" dưới tên và địa chỉ, dựng từ thân 201 của backend bằng cùng `FeeList` và `AmenityList` với trang chi tiết tin (tiêu đề cấp `h3` ở đây), phần nào trống thì bỏ.
- **AC-13**: Dùng lại được cho #12. Hai vùng nhập nhận `control` và trạng thái danh mục từ biểu mẫu cha và không tự giữ giá trị mặc định, nên biểu mẫu cha có giá trị ban đầu thì hai vùng hiện đúng chúng. `/dev/ui` có một biểu mẫu điền sẵn (6 dòng phí và vài ô tích) để chứng minh điều này. Việc gửi PATCH không làm ở đây.
- **AC-14**: Điện thoại và trợ năng. Dùng được ở 320, 390 và 1280 px, không cuộn ngang; trên điện thoại các ô của một dòng xếp dọc; mọi nút và ô tích có vùng chạm từ 44 px; làm hết được bằng bàn phím; màu chỉ lấy từ token, cặp màu chữ mới (nếu có) thêm vào `scripts/check-contrast.mjs`.
- **AC-15**: Chữ hướng dẫn của trang. Khung "Lưu ý khi tạo nhà trọ" ở `property-create.tsx` bỏ ý "Phí, tiện ích và tọa độ chưa có ở bước này." và thay bằng hai dòng: "Phí và tiện ích không bắt buộc, nhưng giúp người thuê hiểu đúng chi phí." và "Tọa độ chưa có ở bước này." (dòng thứ hai bỏ khi #33 xong).
- **AC-16**: Mục `/dev/ui`. Có mục "Biểu mẫu nhà trọ: phí và tiện ích" cho thấy vùng phí (trống, ba dòng, sáu dòng với nút tắt, lỗi ở dòng từ `ApiError` giả, các dòng đọc số) và vùng tiện ích (đã tải, đang tải, lỗi, rỗng, đủ 30, điền sẵn). Dữ liệu giả nằm trong `property-form-sample.ts`, không gọi mạng.
- **AC-17**: Không hỏng thứ khác. `npm run check` và `npm run build` qua. Ô tên, địa chỉ và ô chọn phường chạy như cũ, tạo nhà trọ không phí và không tiện ích vẫn chạy.

## Decision

**Chosen option**: Option 1: dòng phí thêm bằng nút, lưới ô tích cho tiện ích, hai vùng nhập dùng lại được, chỉ nối vào biểu mẫu tạo.

Thêm hai vùng vào `PropertyForm` bằng `useFieldArray` (phí) và một trường `amenityKeys` (tiện ích), đọc danh mục tiện ích ở trình duyệt như danh mục phường, gửi cả hai mảng trong `POST /properties`, và để biểu mẫu sửa (#12) nối PATCH sau.

**Implementation skills**: `react-hook-form` (`pproenca/dot-skills`, `.agents/skills/react-hook-form/`) · `zod` (`pproenca/dot-skills`, `.agents/skills/zod/`) · `tanstack-query-best-practices` (`deckardger/tanstack-agent-skills`, `.agents/skills/tanstack-query-best-practices/`) · `shadcn` (`shadcn-ui/ui`, `.agents/skills/shadcn/`)

Theo skill `react-hook-form`: một `useFieldArray` duy nhất cho `fees` (nơi khác đọc dòng bằng `useWatch`), khóa của dòng là `field.id` chứ không phải chỉ số, không dùng tùy chọn `disabled` của `useFieldArray` (nó làm mọi thao tác thêm hoặc xóa lặng lẽ không chạy), và lỗi từ backend đi qua `setError` như `useFormFailure` đang làm.

**Design source**: `design.md` và các vùng hiện có của biểu mẫu (suy ra, vì đây là mở rộng một biểu mẫu đã có; không dùng công cụ thiết kế, theo quyết định code thẳng của dự án). Mỗi vùng là một `Card` có `CardHeader` viền dưới và `CardTitle`, nhóm có nhãn như hai vùng hiện có (spec 0004). Chỉ dùng token, không thêm màu.

## Feature design

**Data model sketch** (không có bảng mới, backend giữ dữ liệu; đây là giá trị của biểu mẫu và cách nó thành body):

| Lớp | Hình dạng |
|---|---|
| Biểu mẫu giữ (`PropertyInput`) | `name`, `addressText`, `wardCode` (đã có); `fees`: mảng 0 đến 6 `FeeRowInput`; `amenityKeys`: mảng 0 đến 30 chuỗi |
| `FeeRowInput` | `kind: FeeKind`, `price: string` (chữ số lúc gõ), `unit: FeeUnit`, `note: string` |
| Sau lược đồ (`PropertyValues`) | `price: number` (nguyên, 0 đến 100.000.000), `note` đã cắt khoảng trắng |
| Body (`PropertyBody`) | `fees: { kind, price, unit, note: string \| null }[]`, `amenityKeys: string[]`, cả hai luôn có mặt |

Bảng cố định trong mã (`src/features/property/fees.ts`):
- `FEE_KINDS`: `electricity`, `water`, `internet`, `parking`, `service`, `other` (thứ tự của API).
- `FEE_UNITS`: `per_kwh`, `per_m3`, `per_month`, `per_person_month`, `per_vehicle_month`.
- `DEFAULT_UNIT_BY_KIND`: `electricity` là `per_kwh`, `water` là `per_m3`, `parking` là `per_vehicle_month`, `internet`, `service` và `other` là `per_month`.

Hàm thuần (cùng file, không phụ thuộc React): `nextFreeKind(rows)`, `kindOptions(rows, index)`, `unitAfterKindChange(oldKind, newKind, unit)`, `toFeesBody(rows)`.

Luật của lược đồ (Zod, kiểm nhẹ, thông báo ở AC-7): `fees` tối đa 6 dòng và không hai dòng cùng `kind`; `price` là chuỗi chữ số, đổi thành số nguyên từ 0 đến 100.000.000; `note` cắt khoảng trắng, tối đa 100; `amenityKeys` tối đa 30 và không trùng.

**State transitions** (vùng tiện ích, theo danh mục): `loading` đến `loaded` hoặc `error`; `error` đến `loading` khi "Thử lại"; `loaded` đến `loading` khi đọc lại sau `AMENITY_UNKNOWN`, giữ các ô đã tích còn trong danh mục mới.

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/properties` | POST | `name`, `addressText`, `wardCode`, `fees[]`, `amenityKeys[]` | 201 `Property` (có `fees` theo thứ tự cố định, `amenities` theo tên) | bearer, `property:create` | 400 `VALIDATION_FAILED` (`fees.N.*`, `fees`, `amenityKeys`), 400 `AMENITY_UNKNOWN`, 400 `WARD_UNKNOWN`, 403 `PERMISSION_DENIED`, 429 `RATE_LIMITED` |
| `/amenities` | GET | không | `Amenity[]` (`key`, `name`), xếp theo tên | không (công khai) | lỗi mạng, 5xx |

`POST /properties` đã có trong `createProperty`, chỉ thêm hai trường vào body. `GET /amenities` là đường đọc mới.

**Value sourcing** (every value each action produces, computes, or displays names where it comes from):
| Action | Value produced / displayed | Source |
|---|---|---|
| Bấm "Thêm khoản phí" | `kind` của dòng mới | `nextFreeKind`: phần tử đầu của `FEE_KINDS` mà chưa dòng nào giữ |
| Bấm "Thêm khoản phí" | `unit` mặc định, `price` và `note` ban đầu | `DEFAULT_UNIT_BY_KIND` (quyết ở spec này); `price` và `note` là chuỗi rỗng |
| Mở ô "Loại phí" | các loại được liệt kê | `kindOptions`: `FEE_KINDS` trừ loại của các dòng khác |
| Hiện chữ loại và đơn vị | "Điện", "mỗi kWh"... | `feeKindLabel` (đã có) và `feeUnitLabel` (mới, xuất từ `format.ts`) |
| Đổi loại của một dòng | đơn vị mới | `unitAfterKindChange`: đơn vị mặc định của loại mới nếu đơn vị cũ còn là mặc định của loại cũ, ngược lại giữ |
| Dòng đọc số dưới ô giá | "3.800 ₫" hoặc "Miễn phí" | `formatFeePrice` (mới, `format.ts`), từ `price` đang gõ khi nó là số hợp lệ |
| Nút "Thêm khoản phí" tắt | điều kiện và dòng "Đã đủ 6 loại phí." | số dòng bằng `FEE_KINDS.length`; chữ cố định |
| Lưới tiện ích | `key`, `name`, thứ tự | `GET /amenities` qua `useAmenities` (key `["amenities"]`) |
| Dòng "Đã chọn n tiện ích" | `n` | độ dài của `amenityKeys` đang theo dõi |
| Nhãn nhóm và vùng trạng thái | "Khoản phí 2: Nước", "Đã xóa khoản phí Nước." | chỉ số dòng cộng một, và `feeKindLabel` của dòng |
| Body của `POST /properties` | `fees[]` | `toFeesBody`: theo thứ tự dòng, `price` là `Number` của chuỗi chữ số, `note` đã cắt hoặc `null` |
| Body của `POST /properties` | `amenityKeys` | giá trị trường, theo thứ tự danh mục |
| `AMENITY_UNKNOWN` | các khóa phải bỏ | khóa đang tích mà không có trong danh mục vừa đọc lại |
| Màn kết quả | phí và tiện ích đã lưu | `fees` và `amenities` của thân 201 (backend đã xếp thứ tự) |

**Key invariants**:
- Thứ tự dòng trên màn hình, thứ tự trong body và chỉ số `N` của lỗi `fees.N.*` là một. Không dòng nào bị bỏ hay đổi chỗ giữa biểu mẫu và body (dòng giá trống bị chặn bằng lỗi, không bị bỏ), nên lỗi của backend rơi đúng dòng.
- Một loại phí xuất hiện nhiều nhất một lần: ô chọn ẩn loại đã dùng, lược đồ chặn thêm, backend chặn nữa.
- Cả hai mảng luôn có mặt trong body, để cùng một hàm dựng body phục vụ cả tạo lẫn PATCH của #12 (mảng rỗng là xóa hết).
- `price` luôn là số nguyên, đi từ chuỗi chữ số, không bao giờ có phần lẻ.
- Biểu mẫu không giữ bản sao danh mục: tên tiện ích đến từ truy vấn, một khóa chỉ được gửi khi đã được tích từ danh mục (hoặc còn lại sau khi đọc lại).
- Hai vùng nhập không tự đặt giá trị mặc định, mọi giá trị đến từ `control` của biểu mẫu cha.

**Security model**: không đổi. Trang đã có cổng chủ trọ (spec 0005) và quyền `property:create`; người tìm trọ không vào được. `GET /amenities` công khai, gọi không kèm token (`auth: "none"`). Không dữ liệu cá nhân nào mới, không có compliance đặc biệt.

**Configuration required**: không có biến môi trường hay khóa mới.

**Critical test scenarios** (kiểm sống, vì dự án chưa có bộ chạy kiểm thử; mỗi ý ứng với một AC):
- Happy path: thêm Điện 3800 mỗi kWh và Nước 20000 mỗi m³ có ghi chú, tích Wifi và Máy lạnh, bấm "Tạo nhà trọ"; màn kết quả liệt kê đủ; đăng một tin vào nhà trọ đó và mở trang tin, thấy phí và tiện ích, verifies **AC-2**, **AC-4**, **AC-6**, **AC-8**, **AC-12**.
- Sáu dòng: thêm đủ 6, nút tắt kèm dòng lý do; xóa một dòng rồi thêm lại ra đúng loại vừa trả, verifies **AC-2**, **AC-3**, **AC-5**.
- Đổi loại: Điện (kWh) đổi sang Nước thì đơn vị thành m³; chọn "mỗi người mỗi tháng" trước rồi đổi loại thì đơn vị giữ nguyên, verifies **AC-3**.
- Lỗi kiểm nhẹ: giá trống, "3.800", 100000001, ghi chú 101 ký tự; mỗi lỗi hiện đúng chỗ và tiêu điểm vào ô sai đầu tiên, verifies **AC-7**.
- Lỗi backend về trường: `/dev/ui` đưa `ApiError` giả có `fees.1.price`, `fees` và `amenityKeys` vào hai vùng, verifies **AC-9**, **AC-16**.
- `AMENITY_UNKNOWN`: bằng tài khoản admin thêm một tiện ích tạm, mở biểu mẫu, tích nó và một tiện ích khác, xóa tiện ích tạm bằng admin, rồi gửi; ô đã gỡ bị bỏ chọn, ô kia còn, có dòng thông báo, verifies **AC-10**.
- Danh mục lỗi: chặn `**/amenities` bằng `network route --abort`, tải lại trang; thấy lỗi và "Thử lại", tạo nhà trọ không tiện ích vẫn chạy; bỏ chặn, "Thử lại" ra lưới, verifies **AC-11**.
- Hồi quy: tạo nhà trọ không phí và không tiện ích; ô chọn phường vẫn chạy, verifies **AC-1**, **AC-17**.
- Dùng lại: biểu mẫu điền sẵn ở `/dev/ui` hiện đúng 6 dòng và các ô tích, verifies **AC-13**.
- Điện thoại và bàn phím: 320 px không cuộn ngang, làm hết bằng Tab, Space và Enter, verifies **AC-14**.
- Auth/permission: người tìm trọ không vào được `/landlord/properties/new` (cổng cũ); danh mục tiện ích đọc được khi chưa có token, verifies **AC-17**.

**Where the code goes**:
| Chỗ | Việc |
|---|---|
| `src/lib/format.ts` | xuất `feeUnitLabel` (chữ "mỗi kWh"...), thêm `formatFeePrice`, `formatFee` dùng lại hai hàm đó |
| `src/features/amenities/api/amenities-query.ts`, `hooks/use-amenities.ts` | truy vấn `["amenities"]`, `auth: "none"`, `staleTime: Infinity`, theo mẫu của `wardsQuery` và `useWards` |
| `src/features/property/fees.ts` | bảng cố định và hàm thuần ở trên |
| `src/features/property/schemas/property-schema.ts` | `feesSchema`, `amenityKeysSchema` xuất riêng, `fees` và `amenityKeys` trong `propertySchema`, `EMPTY_PROPERTY`, `toPropertyBody` |
| `src/features/property/components/fee-rows-field.tsx`, `amenity-field.tsx` | hai vùng nhập (client), nhận `control` và trạng thái danh mục |
| `src/features/property/components/fee-list.tsx`, `amenity-list.tsx` | hai phần hiển thị tách khỏi `PropertyZone` (nhận cấp tiêu đề), `PropertyZone` và `PropertyCreated` cùng dùng |
| `src/features/property/components/property-form.tsx` | hai vùng mới, `FIELDS` thêm `fees` và `amenityKeys`, xử lý `AMENITY_UNKNOWN` |
| `src/features/property/components/property-created.tsx`, `property-create.tsx` | phí và tiện ích ở màn kết quả, chữ hướng dẫn |
| `src/app/dev/ui/property-form.tsx`, `property-form-sample.ts` | mục `/dev/ui` và dữ liệu giả |

## Build plan

Cách làm của dự án là Tracer Bullet: một sợi chỉ thật xuyên mọi lớp trước, rồi dày dần, mỗi bước vẫn chạy từ đầu đến cuối. Không có migration nào (không có bảng của FE).

- [x] M1 Sợi chỉ mỏng: tạo được một nhà trọ thật có một khoản phí và vài tiện ích, và thấy chúng ở màn kết quả
  1. `format.ts`: xuất `feeUnitLabel`, thêm `formatFeePrice`; `fees.ts` với bảng cố định và hàm thuần, satisfies **AC-4**
  2. `features/amenities`: `amenitiesQuery` và `useAmenities`, satisfies **AC-6**
  3. `property-schema.ts`: `fees`, `amenityKeys`, `EMPTY_PROPERTY`, `toPropertyBody` luôn gửi cả hai mảng, satisfies **AC-8**
  4. `FeeRowsField` (nút thêm, một dòng đủ bốn ô, xóa), `AmenityField` (trạng thái đã tải), hai vùng trong `property-form.tsx`, tạo thật một nhà trọ, satisfies **AC-1**, **AC-4**, **AC-6**, **AC-8**
  5. Tách `FeeList` và `AmenityList` khỏi `PropertyZone`, dùng ở `PropertyCreated`, satisfies **AC-12**
- [x] M2 Dòng phí đủ luật: ẩn loại đã dùng, trần 6 dòng, đơn vị mặc định, xóa và trợ năng
  6. Thêm dòng với loại đầu tiên chưa dùng, ẩn loại đã chọn, trần 6 với nút tắt và dòng lý do, đơn vị mặc định và luật đổi loại, satisfies **AC-2**, **AC-3**
  7. Ô giá chỉ nhận chữ số tối đa 9 ký tự, dòng đọc số, gợi ý ô ghi chú, satisfies **AC-4**
  8. Xóa: tên truy cập, chuyển tiêu điểm, vùng trạng thái, nhóm có nhãn, satisfies **AC-5**
- [x] M3 Luật và lỗi: đủ thông báo, lỗi backend vào đúng ô, các trạng thái của danh mục
  9. Lược đồ đủ thông báo của AC-7, `FIELDS` có `fees` và `amenityKeys` theo thứ tự màn hình, tiêu điểm vào ô sai đầu tiên, satisfies **AC-7**
  10. Lỗi backend vào đúng ô của dòng N, và vào dòng thông báo của vùng cho `fees` và `amenityKeys`, satisfies **AC-9**
  11. `AMENITY_UNKNOWN`: đọc lại danh mục, bỏ ô đã gỡ, dòng thông báo, tiêu điểm, satisfies **AC-10**
  12. Trạng thái danh mục: khung chờ, lỗi có "Thử lại" mà vẫn gửi được, rỗng, đủ 30 ô, satisfies **AC-6**, **AC-11**
- [ ] M4 Hoàn thiện: mục `/dev/ui`, chữ hướng dẫn, kiểm theo kích thước màn hình
  13. Mục `/dev/ui` "Biểu mẫu nhà trọ: phí và tiện ích" với `property-form-sample.ts` (dữ liệu giả, `ApiError` giả, bản điền sẵn), satisfies **AC-13**, **AC-16**
  14. Chữ hướng dẫn của `property-create.tsx`, satisfies **AC-15**
  15. Kiểm ở 320, 390 và 1280 px và bằng bàn phím, cặp tương phản mới (nếu có) vào `scripts/check-contrast.mjs`, `npm run check`, `npm run build`, satisfies **AC-14**, **AC-17**

## Consequences

**Positive**:
- Chủ trọ khai phí và tiện ích một lần ở nhà trọ, mọi tin sau đó dùng lại (backend giữ chúng ở nhà trọ).
- Trang chi tiết tin đã vẽ sẵn phí và tiện ích (`644d557`), nên vừa lưu là thấy ở trang công khai.
- Hai vùng nhập dùng lại cho #12 mà không viết lại, và không thêm thư viện nào.

**Negative / tradeoffs**:
- Chưa có đường sửa phí và tiện ích của nhà trọ đã tạo cho đến khi #12 xong. Điều kiện "sửa" trong "Done when" của #11 chỉ đủ khi #12 nối PATCH; scope cần ghi rõ.
- Đơn vị chọn tự do nên có cặp vô lý (internet tính mỗi kWh), vì backend cũng cho; FE chỉ đặt mặc định hợp lý.
- Ô giá chỉ nhận chữ số: dán "3.800" bị báo lỗi và chủ trọ phải xóa dấu chấm.
- Mỗi dòng phí có bốn ô, sáu dòng làm biểu mẫu dài trên điện thoại.
- Danh mục tiện ích đọc ở trình duyệt, nên vùng tiện ích hiện khung chờ ở lần vẽ đầu.
- #33 (spec 0011) cũng sửa `property-schema.ts` và `property-form.tsx`; bên nào làm sau phải gộp thay đổi.

**Neutral**:
- `PropertyZone` đổi để dùng `FeeList` và `AmenityList`; giao diện trang tin không đổi.
- Body của `POST /properties` có thêm hai trường; body cũ của #6 vẫn hợp lệ.
- Truy vấn `["amenities"]` là truy vấn mới; admin đổi danh mục thì chỉ thấy sau khi tải lại trang hoặc khi `AMENITY_UNKNOWN` buộc đọc lại.

## Follow-up

- [ ] #12 nối `FeeRowsField` và `AmenityField` vào biểu mẫu sửa nhà trọ: đọc `GET /properties/:id`, chuyển `Property` thành `PropertyInput` (`price` thành chuỗi, `note` là `null` thành chuỗi rỗng), PATCH gửi lại cả `fees` và `amenityKeys` đầy đủ (mảng rỗng là xóa hết), `AMENITY_UNKNOWN` xử lý như ở AC-10.
- [ ] Gộp với #33 (spec 0011): bên làm sau gộp `feesSchema` và `amenityKeysSchema` (xuất riêng để gộp bằng một dòng) vào lược đồ của bên kia; thứ tự `FIELDS` là `name`, `addressText`, `wardCode`, `latitude`, `longitude`, `fees`, `amenityKeys`; và chữ hướng dẫn của AC-15 bỏ dòng tọa độ khi #33 xong.
- [x] Ghi vào scope #11 rằng phần "sửa" của điều kiện hoàn thành chờ #12 (đã ghi khi nối spec vào scope).
- [ ] `/sync` sau khi xong: cập nhật `src/lib/AGENTS.md` (`feeUnitLabel`, `formatFeePrice`), nhắc `src/features/amenities` ở các tệp ngữ cảnh, nhắc mục mới trong `src/app/dev/AGENTS.md`, và tick dòng "#11 adds the fees and amenities zone" ở Follow-up của spec 0010 (phần hiển thị đã xong ở `644d557`).

## Rationale

Reasoning and options: see [rationale.md](rationale.md).
