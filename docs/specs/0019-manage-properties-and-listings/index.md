# 0019. Quản lý nhà trọ và tin của tôi

**Date**: 2026-11-13
**Status**: Accepted

## Summary

Spec này thêm hai danh sách vào khu chủ trọ: "Nhà trọ của tôi" và "Tin của tôi". Từ đó chủ trọ lọc tin theo trạng thái, ẩn, hiện, sửa và xóa tin, sửa và xóa nhà trọ. Biểu mẫu sửa nhà trọ dùng lại các ô của #6, #11 và #33 và chỉ gửi những gì đã đổi. Hai thẻ dashboard tương ứng được bật, và các việc mà spec cũ để lại cho #12 được xử lý luôn.

## Requirements

Seeded from scope item #12 and refined with the engineer. Contract with the backend: `api-for-frontend.md` mục 6.17 (nhà trọ), 6.21 đến 6.23 (tin của tôi, sửa và xóa, ẩn và hiện) và mục 7 ("Quản lý nhà trọ", "Đăng và quản lý tin"). Patterns to follow: spec 0006 (biểu mẫu tin, `ListingStatusBadge`, định dạng), spec 0007 (hộp xác nhận xóa với `useReturnFocus`), spec 0008 (danh sách công cụ của khu chủ trọ), spec 0011 (ghim vị trí và luật đổi phường), spec 0015 (ô chọn phường), spec 0017 (vùng phí và tiện ích), và #14 yêu thích (khóa nút, không đổi trước, focus về tiêu đề khi một hàng biến; chỉ có dòng trong scope, không có spec).

**Out of scope** (đã chốt với kỹ sư, không làm): ẩn, hiện, xóa hàng loạt; ô tìm kiếm trong danh sách; lọc tin theo nhà trọ (API không có `propertyId` ở `GET /me/listings` và dòng tin không mang id nhà trọ); số đếm trên bộ lọc; dải trạng thái dùng thử và hạn mức (#17); nút "Mua gói" và trang bảng giá (#18, #19); trang chi tiết nhà trọ riêng; kháng nghị khi bị admin ẩn (API chưa có); khôi phục tin hay nhà trọ đã xóa; đổi thứ tự ảnh.

**User stories**:
- Là chủ trọ, tôi muốn thấy mọi tin của mình kèm trạng thái thật (đang hiện với khách, bị ẩn bớt, tôi đã ẩn, admin đã ẩn) để biết tin nào khách đang xem được.
- Là chủ trọ, tôi muốn ẩn một tin khi hết phòng và hiện lại khi còn phòng, bằng một lần bấm.
- Là chủ trọ, tôi muốn sửa hoặc xóa một nhà trọ, và hiểu vì sao chưa xóa được khi nhà trọ còn tin.
- Là chủ trọ, tôi muốn đổi phí, tiện ích hay vị trí của một nhà trọ đã tạo mà không phải nhập lại mọi thứ.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: `/landlord/listings` đọc `GET /me/listings` và hiện tin của chính chủ trọ, mới đăng xếp trước, 10 hàng mỗi trang. Mỗi hàng có ảnh bìa (hoặc khung thay thế), tiêu đề, `fullAddress`, giá và diện tích, `viewCount`, ngày đăng và nhãn trạng thái. Thẻ "Tin của tôi" ở dashboard và mục menu cùng được bật và trỏ tới trang này.
- **AC-2**: Nhãn trạng thái luôn là chữ kèm biểu tượng, bốn kiểu: `visible` với `isPublic` true ("Đang hiện với khách"); `visible` với `isPublic` false (nhãn cảnh báo "đang bị ẩn bớt khỏi khách", không trình bày như tin chạy bình thường); `hidden_by_owner` ("Bạn đã ẩn"); `hidden_by_admin` ("Admin đã ẩn" kèm `moderationReason`). Tin `hidden_by_admin` không có nút "Hiện", thay bằng dòng hướng dẫn liên hệ quản trị viên; vẫn có "Sửa" và "Xóa".
- **AC-3**: Bộ lọc là bốn liên kết (Tất cả, Đang hiện, Bạn đã ẩn, Admin đã ẩn) đặt `?status=` (Tất cả thì không có tham số), không có số đếm. Liên kết đang chọn có `aria-current`. Đổi bộ lọc thì về trang 1. `status` lạ lặng lẽ về Tất cả. Một mục lọc không có tin hiện "Chưa có tin nào ở mục này" kèm liên kết về Tất cả.
- **AC-4**: Phân trang bằng `?page=` (`ListPagination` kiểu liên kết), `page` lạ về trang 1. Trang quá cuối (gõ tay, hoặc sau khi một hàng biến) tự chuyển bằng `router.replace` về trang cuối có hàng. `total` là 0 thì hiện trạng thái trống ("Bạn chưa có tin nào" kèm nút "Đăng tin", hoặc lời của AC-3). Tiêu đề danh sách (`h2`, focus được bằng mã) đọc số tin.
- **AC-5**: Mỗi hàng có một nút đổi trạng thái: "Ẩn" ở tin `visible`, "Hiện" ở tin `hidden_by_owner`, không hỏi xác nhận. Nút khóa lúc đang gửi (kể cả bấm đúp) và không đổi trước: hàng chỉ đổi khi máy chủ trả tin mới. Thành công: hàng nhận `status` và `isPublic` từ câu trả lời, có thông báo ngắn; nếu hàng không còn khớp bộ lọc thì rời danh sách và focus về tiêu đề danh sách. Sau đó FE đọc lại trang danh sách, vì ẩn hay hiện một tin có thể đổi `isPublic` của tin khác.
- **AC-6**: "Hiện" bị 403 `MEMBERSHIP_REQUIRED` hoặc 403 `LISTING_QUOTA_REACHED`: `message` của backend hiện ngay tại hàng, tin giữ "Bạn đã ẩn", không thử lại tự động, không coi là lỗi hệ thống, và chưa có nút "Mua gói" (#17 và #18 thêm sau).
- **AC-7**: Các lỗi còn lại của ẩn và hiện. 409 `LISTING_STATE_INVALID` hoặc 403 `LISTING_HIDDEN_BY_ADMIN`: đọc lại `GET /me/listings/:id`, cập nhật hàng theo trạng thái thật và nói rõ lý do (admin vừa ẩn thì hiện `moderationReason`). 404 `LISTING_NOT_FOUND`: hàng rời danh sách kèm "Tin này không còn." 403 `NOT_RESOURCE_OWNER` hoặc `PERMISSION_DENIED`: báo tại hàng. 429: đếm ngược tại hàng, nút khóa đến hết. Lỗi mạng: báo tại hàng, nút mở lại, không thử lại tự động.
- **AC-8**: Xóa tin hỏi xác nhận bằng hộp thoại (tên tin ở tiêu đề, nói rõ không hoàn tác), làm được ở mọi trạng thái kể cả `hidden_by_admin`. Thành công: hàng rời, có thông báo, focus về tiêu đề danh sách, danh sách đọc lại, `listingCount` của nhà trọ được làm mới. 404 coi như đã xóa. Lỗi khác (429, mạng, 403) hiện trong hộp và hộp giữ nguyên. Focus trả về qua `useReturnFocus`.
- **AC-9**: Tiêu đề tin và nút "Sửa" mở `/landlord/listings/[id]/edit`. Liên kết "Xem trang công khai" (`/<slug>-<code>`) chỉ có khi `isPublic` là true. Nút "Đăng tin mới" ở đầu trang dẫn tới `/landlord/listings/new`.
- **AC-10**: Ảnh bìa chỉ được xin khi `isPublic` là true (backend trả 404 cho ảnh của tin không công khai). Tin khác, tin chưa có ảnh và ảnh lỗi đều hiện khung thay thế, không báo lỗi và không làm vỡ hàng.
- **AC-11**: `/landlord/properties` đọc `GET /properties`, 10 hàng mỗi trang, `?page=` theo luật của AC-4. Mỗi hàng có tên, `fullAddress`, số tin (`listingCount`), ngày tạo, nhãn "Chưa ghim vị trí" khi `latitude` và `longitude` là `null`, và ba hành động: "Đăng tin" (tới `/landlord/listings/new?propertyId=<id>`), "Sửa", "Xóa". Chưa có nhà trọ nào thì mời tạo nhà trọ đầu tiên. Thẻ "Nhà trọ của tôi" và mục menu cùng được bật.
- **AC-12**: Xóa nhà trọ. Khi `listingCount` lớn hơn 0 nút bị tắt, kèm dòng "Hãy xóa các tin của nhà trọ này trước" và liên kết sang "Tin của tôi"; bằng 0 thì hỏi xác nhận. 409 `PROPERTY_HAS_LISTINGS` (hai tab lệch nhau) hiện `message` của backend và đọc lại danh sách. 404 `PROPERTY_NOT_FOUND` coi như đã xóa. Thành công: hàng rời, có thông báo, focus về tiêu đề, danh sách nhà trọ và ô chọn nhà trọ ở biểu mẫu đăng tin được làm mới.
- **AC-13**: `/landlord/properties/[id]/edit` đọc `GET /properties/:id` và hiện biểu mẫu cùng năm vùng với trang tạo (chung, địa chỉ, vị trí, phí, tiện ích), điền sẵn. Vùng vị trí mở sẵn khi nhà trọ có ghim (spec 0011). Có breadcrumb về danh sách và một dòng nói thay đổi áp dụng cho mọi tin của nhà trọ này.
- **AC-14**: Lưu chỉ gửi ô đã đổi: `name`, `addressText`, `wardCode`; `fees` cả danh sách khi danh sách có đổi; `amenityKeys` cả danh sách khi có đổi; tọa độ khi có đổi (hai số, hoặc hai `null` để xóa ghim). Không có gì đổi thì không gửi gì và báo "Chưa có gì thay đổi". Thành công: có thông báo, ở lại trang, biểu mẫu nạp lại giá trị đã lưu, các khóa chi tiết, danh sách và ô chọn nhà trọ được cập nhật.
- **AC-15**: Đổi phường luôn gửi kèm tọa độ của biểu mẫu: hai số nằm trong phường mới, hoặc hai `null` khi không còn ghim (luật bỏ ghim của spec 0011 AC-10 giữ nguyên). Ghim cũ nằm sai chỗ hiện cảnh báo "hãy ghim lại" (spec 0011 AC-12) và không bị gửi lại nếu chủ trọ không đổi nó.
- **AC-16**: Lỗi khi lưu: lỗi từng ô theo `errors[].field` (kể cả `fees.N.price`); `AMENITY_UNKNOWN` (đọc lại danh mục, bỏ ô đã gỡ), `WARD_UNKNOWN`, `COORDINATE_OUT_OF_AREA` và `COORDINATE_FAR_FROM_WARD` xử lý như spec 0017 và 0011; 429 đếm ngược và khóa nút Lưu; 404 `PROPERTY_NOT_FOUND` hoặc 400 `INVALID_ID` thay biểu mẫu bằng "Không tìm thấy nhà trọ"; 403 `NOT_RESOURCE_OWNER` thay bằng trạng thái không có quyền. Đang sửa dở mà đóng tab thì trình duyệt hỏi.
- **AC-17**: Các màn cũ nối vào danh sách. Màn kết quả của #6 và #7 có liên kết sang "Nhà trọ của tôi" và "Tin của tôi". Bốn trang tạo và sửa (nhà trọ, tin) có breadcrumb về danh sách. Tạo nhà trọ, đăng tin, lưu tin, thêm hoặc xóa ảnh (#10) làm cho danh sách (và ảnh bìa trong đó) được đọc lại; lưu nhà trọ đánh dấu cũ các tin đã nạp, vì tên và địa chỉ nhà trọ nằm trong chúng.
- **AC-18**: Quyền. Hai danh sách cần `property:read` và `listing:read` (thiếu thì hiện trạng thái không có quyền). Mỗi nút ẩn đi khi thiếu quyền của nó (`property:create`, `property:update`, `property:delete`, `listing:create`, `listing:update`, `listing:delete`). Mọi trang `noindex`. Trang `/landlord/dev-check` bị xóa.
- **AC-19**: Điện thoại và trợ năng. Từ `md` là bảng, dưới `md` mỗi hàng là một khối dọc với nút cao 44 px. Nút chỉ có biểu tượng có `aria-label` nêu tên tin hoặc nhà trọ. Trạng thái luôn là chữ kèm biểu tượng. Mỗi trang một `h1`. Ở 320, 390, 768 và 1280 px trang không cuộn ngang.

## Decision

**Chosen option**: Option 1: Hai trang danh sách riêng, trạng thái nằm ở địa chỉ, ô nhập nhà trọ tách ra dùng chung cho tạo và sửa.

Danh sách nhà trọ ở `/landlord/properties`, danh sách tin ở `/landlord/listings`, sửa nhà trọ ở `/landlord/properties/[id]/edit`. Mọi thao tác chờ máy chủ trả lời rồi mới đổi giao diện; sau mỗi lần ghi có thể đổi hạn mức, FE đọc lại cả trang danh sách.

**Implementation skills**: `tanstack-query-best-practices` (`deckardger/tanstack-agent-skills`, `.agents/skills/tanstack-query-best-practices/`) · `react-hook-form` (`pproenca/dot-skills`, `.agents/skills/react-hook-form/`) · `zod` (`pproenca/dot-skills`, `.agents/skills/zod/`) · `shadcn` (`shadcn-ui/ui`, `.agents/skills/shadcn/`)

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

## Feature design

**Data model sketch**: FE không lưu thêm gì lên backend. Kiểu đang dùng (đều đã có trong `src/lib/api/types.ts`): `PropertyListItem` (danh sách nhà trọ, có `listingCount`), `Property` (để sửa), `OwnerListingSummary` (hàng tin, có `status`, `moderationReason`, `viewCount`, `isPublic`, không có `propertyId`), `OwnerListingDetail` (câu trả lời của `hide`, `show` và `GET /me/listings/:id`), `Page<T>`. Kiểu mới nhỏ của FE: `ListingFilter` (`"all"` hoặc một `ListingStatus`) và `PropertyPatch` (phần của `PropertyBody` đã đổi). Quan hệ: một nhà trọ có nhiều tin, nhưng dòng tin không mang id nhà trọ.

**Trạng thái nằm ở**: địa chỉ (`?status=`, `?page=`), và mỗi hàng giữ riêng một trạng thái tạm (đang gửi, dòng báo của hàng). Mỗi danh sách chỉ có một hộp xóa dùng chung cho mọi hàng.

**Khóa bộ nhớ truy vấn** (chỗ giữ dữ liệu đã đọc, xóa khi phiên đổi):

| Khóa | Giữ gì | Ghi chú |
|---|---|---|
| `["properties","mine",{page,pageSize}]` | một trang danh sách nhà trọ | khóa này có từ #7 (ô chọn nhà trọ dùng trang 1 cỡ 50); danh sách mới dùng cỡ 10 nên có mục riêng |
| `["properties","detail",id]` | một nhà trọ để sửa | mới; `refetchOnWindowFocus` và `refetchOnReconnect` tắt như `ownerListingQuery`, để biểu mẫu không bị dựng lại khi đang gõ |
| `["listing","mine","list",{status,page,pageSize}]` | một trang danh sách tin | mới |
| `["listing","mine",id]` | một tin để sửa | có từ #7 và #10 |

**State transitions** (tin, từ mục 6.23, bảng này là của backend, FE chỉ đọc kết quả):

| Trạng thái hiện tại | Ẩn | Hiện |
|---|---|---|
| `visible` | thành `hidden_by_owner` | 409 `LISTING_STATE_INVALID` |
| `hidden_by_owner` | 409 `LISTING_STATE_INVALID` | thành `visible`, có thể bị 403 `MEMBERSHIP_REQUIRED` hoặc `LISTING_QUOTA_REACHED` |
| `hidden_by_admin` | 409 `LISTING_STATE_INVALID` | 403 `LISTING_HIDDEN_BY_ADMIN` |

**API surface** (tất cả có sẵn, gọi ở trình duyệt với token, qua một client chung):

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/properties` | GET | `page`, `pageSize=10` | `Page<PropertyListItem>` | bearer, `property:read` | 403 `PERMISSION_DENIED` |
| `/properties/:id` | GET | id | `Property` | bearer, `property:read`, chủ sở hữu | 404 `PROPERTY_NOT_FOUND`, 403 `NOT_RESOURCE_OWNER`, 400 `INVALID_ID` |
| `/properties/:id` | PATCH | các trường đã đổi (`name`, `addressText`, `wardCode`, `latitude` và `longitude`, `fees`, `amenityKeys`) | `Property` | bearer, `property:update`, chủ sở hữu | 400 `VALIDATION_FAILED`, `WARD_UNKNOWN`, `AMENITY_UNKNOWN`, `COORDINATE_OUT_OF_AREA`, `COORDINATE_FAR_FROM_WARD`, 404, 403, 429 |
| `/properties/:id` | DELETE | id | 204 | bearer, `property:delete`, chủ sở hữu | 409 `PROPERTY_HAS_LISTINGS`, 404, 403, 429 |
| `/me/listings` | GET | `status` (tùy chọn), `page`, `pageSize=10` | `Page<OwnerListingSummary>` | bearer, `listing:read` | 400 `VALIDATION_FAILED`, 403 |
| `/me/listings/:id` | GET | id | `OwnerListingDetail` | bearer, `listing:read`, chủ sở hữu | 404 `LISTING_NOT_FOUND`, 403 |
| `/listings/:id/hide` | POST | không có body | `OwnerListingDetail` | bearer, `listing:update`, chủ sở hữu | 409 `LISTING_STATE_INVALID`, 404, 403, 429 |
| `/listings/:id/show` | POST | không có body | `OwnerListingDetail` | bearer, `listing:update`, chủ sở hữu | 409 `LISTING_STATE_INVALID`, 403 `LISTING_HIDDEN_BY_ADMIN`, 403 `MEMBERSHIP_REQUIRED`, 403 `LISTING_QUOTA_REACHED`, 404, 429 |
| `/listings/:id` | DELETE | id | 204 | bearer, `listing:delete`, chủ sở hữu | 404 `LISTING_NOT_FOUND`, 403, 429 |

Mọi mã lỗi ở trên đã có trong `ERROR_CODES` của `src/lib/api/types.ts`. Thời gian chặn sau 429 của sáu lời gọi ghi đã có trong `rate-limits.ts` (một giờ); hai lời đọc danh sách rơi vào mặc định 60 giây, đúng như hợp đồng.

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| Danh sách tin | bộ lọc `status` | `?status=`, chỉ nhận `visible`, `hidden_by_owner`, `hidden_by_admin`; giá trị khác về Tất cả (không gửi tham số) |
| Danh sách tin | trang | `?page=` qua `parsePageParam` (`src/features/listing-search/schemas/search-params.ts`); `pageSize` cố định 10 |
| Danh sách tin | nhãn trạng thái | `status` và `isPublic` của hàng (không suy `isPublic` từ `status`) |
| Danh sách tin | ảnh bìa | `mediaUrl(coverImageUrl)`, chỉ xin khi `isPublic` là true |
| Danh sách tin | liên kết công khai | `listingPath(slug, code)` khi `isPublic` là true |
| Danh sách tin | lý do admin ẩn | `moderationReason` |
| Danh sách tin, nhà trọ | số ở tiêu đề danh sách | `total` của câu trả lời |
| Ẩn hoặc hiện | trạng thái mới của hàng | thân trả về của `POST` (`status`, `isPublic`), không tự suy |
| Ẩn hoặc hiện, xóa | `isPublic` của các tin khác | lần đọc lại trang danh sách sau khi ghi |
| Ẩn hoặc hiện, xóa, sửa | thời gian chờ khi 429 | `Retry-After`, không đọc được thì bảng `rate-limits.ts` |
| Xóa tin | tên tin trong hộp xác nhận | hàng đang chọn |
| Danh sách nhà trọ | số tin | `listingCount` |
| Danh sách nhà trọ | nhãn "Chưa ghim vị trí" | `latitude` và `longitude` đều `null` |
| Danh sách nhà trọ | liên kết "Đăng tin" | `/landlord/listings/new?propertyId=<id>` (spec 0006) |
| Danh sách nhà trọ | nút Xóa bị tắt | `listingCount` lớn hơn 0 |
| Sửa nhà trọ | giá trị đầu của biểu mẫu | `Property` đổi sang `PropertyInput`: `price` thành chuỗi, `note` là `null` thành chuỗi rỗng, tọa độ thành chuỗi (rỗng khi `null`), `amenities[].key`, `ward.code` (spec 0017) |
| Sửa nhà trọ | các ô đã đổi | so giá trị hiện tại với ảnh chụp ban đầu, cả hai chuẩn hóa cùng một cách: tọa độ làm tròn 6 số lẻ (`roundPin`), tiện ích so như tập, phí so qua `toFeesBody` |
| Sửa nhà trọ | hộp ranh giới phường, ghim | `useWardBounds` và `useLocationPin` (spec 0011) |
| Sửa nhà trọ | tên tỉnh chỉ đọc | danh sách phường (như trang tạo) |

**Key invariants**:
- Giao diện chỉ đổi từ câu trả lời của máy chủ: không đổi trước. Mỗi hàng chỉ có một lời gọi ghi chạy tại một lúc, chặn bằng `useRef` cộng `aria-disabled` (state chậm hơn một lần vẽ so với cú bấm đúp, như `useDeletePhoto`).
- Tin nằm trong danh sách vì `status` và `isPublic` của chính nó; không bao giờ suy ra "khách đang thấy" từ `status`.
- Sau mọi lần ghi có thể đổi hạn mức (ẩn, hiện, xóa tin, và đăng tin) FE chạy một hàm chung `refreshAfterListingWrite`: đọc lại trang danh sách đang mở, đánh dấu cũ các trang tin khác và khóa `dashboardKey` (không đọc ngay). #17 sẽ thêm việc đọc lại hạn mức vào đúng hàm này.
- Lưu nhà trọ không bao giờ gửi `propertyId`, trường không đổi, hay một tọa độ đứng một mình. Đổi phường thì tọa độ của biểu mẫu luôn đi kèm. Không có gì đổi thì không gửi.
- Nút xóa nhà trọ tắt khi `listingCount` lớn hơn 0, nhưng backend vẫn là người quyết (409 vẫn được xử lý).
- Ảnh của tin không công khai không bao giờ được xin (tránh 404 hàng loạt trong danh sách).
- Dữ liệu danh sách chỉ nằm trong bộ nhớ truy vấn của trình duyệt và mất khi phiên đổi; không có gì trong HTML của máy chủ.

**Security model**:
- Cả khu nằm sau `RequireSession accountType="landlord"` (spec 0005), nên admin không vào được; người tìm trọ không có quyền `property:*` và `listing:*` nên mọi API trả 403.
- Mỗi nút ẩn đi khi thiếu quyền của nó (`Can`, chỉ ẩn); backend là người quyết. Thiếu `property:read` hay `listing:read` thì trang hiện trạng thái không có quyền.
- Chủ trọ chỉ thao tác trên dữ liệu của mình: mở nhầm nhà trọ của người khác bằng địa chỉ gõ tay nhận 403 `NOT_RESOURCE_OWNER` và thấy trạng thái không có quyền.
- Không có dữ liệu cá nhân của người khác trong các màn này. Mọi trang `noindex` và `/landlord` đã bị chặn trong `robots.txt`.
- Không thuộc phạm vi tuân thủ nào (không có thanh toán, không dữ liệu y tế).

**Configuration required**: không có biến môi trường hay khóa mới, và không thêm thư viện.

**Cấu trúc mã** (gợi ý, `/develop` được đổi tên cho hợp):
- `src/features/listing/`: `api/my-listings.ts` (khóa, truy vấn, đọc trang), `api/listing-actions.ts` (hide, show, delete, đọc lại một tin), `api/refresh-after-write.ts` (`refreshAfterListingWrite`), `hooks/use-listing-row-actions.ts`, `listing-filter.ts` (đọc `?status=`, dựng địa chỉ), `components/my-listings.tsx`, `listings-table.tsx` (bảng từ `md`), `listing-row-card.tsx` (khối dưới `md`), `status-filter.tsx`, `delete-listing-dialog.tsx`, `row-notice.tsx`. Lấy lại phần HTML bảng, hộp xóa và nhãn từ `src/app/dev/ui/screens/my-listings/my-listings-screen.tsx`, và dùng lại `ListingStatusBadge` (có thể thêm một prop gọn cho ô bảng).
- `src/features/property/`: `api/my-properties.ts`, `api/property-detail.ts`, `api/update-property.ts`, `api/delete-property.ts`, `components/my-properties.tsx`, `delete-property-dialog.tsx`, `edit-property.tsx`, `edit-property-form.tsx`, `property-fields.tsx` (năm vùng tách khỏi `PropertyForm`, dùng cho tạo và sửa, theo cách `listing-form.tsx` làm cho tin), `schemas/property-patch.ts` (`toPropertyInput`, `toPropertyPatch`).
- Trang: `src/app/(landlord)/landlord/listings/page.tsx`, `properties/page.tsx`, `properties/[id]/edit/page.tsx`, đều `instant = false` và `noindex` như các trang sửa hiện có. Xóa `src/app/(landlord)/landlord/dev-check/`.
- `src/components/shells/workspace-tools.ts`: đổi `property.mine` và `listing.mine` từ `soon` sang `ready` với hai địa chỉ trên, xem lại nhãn và mô tả.
- Phần `/dev/ui` đang dùng `FeeRowsField`, `AmenityField`, `property-schema` và `form-failure` (không dùng `PropertyForm`), nên việc tách `property-fields.tsx` không làm nó hỏng. Không thêm mục `/dev/ui` hay màn mẫu mới (kỹ sư chốt từ 2026-11-12: viết trang thật, kiểm bằng backend demo).

**Critical test scenarios** (each maps to an acceptance criterion in ## Requirements):
- Happy path: mở `/landlord/listings` thấy tin thật kèm nhãn đúng; bấm "Ẩn" một tin `visible`, hàng đổi sang "Bạn đã ẩn" rồi bấm "Hiện" thì về lại, verifies **AC-1**, **AC-2**, **AC-5**
- Happy path: chọn bộ lọc "Admin đã ẩn" thấy lý do và không có nút "Hiện"; đổi bộ lọc về trang 1; địa chỉ giữ `?status=` và `?page=` khi chia sẻ, verifies **AC-2**, **AC-3**, **AC-4**
- Happy path: sửa phí, tiện ích và phường của một nhà trọ có ghim, lưu, tải lại trang thấy giá trị đã lưu và chỉ những trường đổi được gửi (xem lời gọi mạng), verifies **AC-13**, **AC-14**, **AC-15**
- Failure case: ở chế độ "Đang hiện" bấm "Ẩn" thì hàng rời danh sách, focus về tiêu đề, và `isPublic` của tin khác đúng sau lần đọc lại, verifies **AC-5**
- Failure case: "Hiện" khi hết hạn mức hoặc hết dùng thử hiện `message` của backend tại hàng, tin giữ nguyên, verifies **AC-6**
- Failure case: admin ẩn tin ở tab khác rồi chủ trọ bấm "Ẩn" hoặc "Hiện" thì hàng đọc lại và hiện đúng trạng thái và lý do; tin bị xóa ở tab khác thì hàng biến, verifies **AC-7**
- Failure case: xóa trang cuối của danh sách thì tự lùi về trang trước; `?page=9` tự về trang cuối có hàng, verifies **AC-4**, **AC-8**
- Failure case: xóa nhà trọ còn tin thì nút tắt kèm lời; hai tab lệch thì 409 hiện `message` và đọc lại, verifies **AC-12**
- Failure case: lưu nhà trọ gặp lỗi từng ô, `AMENITY_UNKNOWN`, `COORDINATE_FAR_FROM_WARD`, 429 và nhà trọ đã bị xóa ở tab khác, verifies **AC-16**
- Auth/permission: người thiếu `listing:update` không thấy nút Ẩn, Hiện, Sửa; người tìm trọ hoặc admin mở `/landlord/listings` thấy trang chặn của khu; mở nhà trọ của người khác thấy trạng thái không có quyền, verifies **AC-18**, **AC-16**
- Layout: ở 320, 390, 768 và 1280 px mỗi danh sách dùng được, nút đủ lớn, không cuộn ngang, verifies **AC-19**

## Build plan

Cách làm là Tracer Bullet (theo scope): mốc 1 chạy một sợi thật qua mọi tầng, các mốc sau dày dần, mỗi mốc vẫn chạy trọn vẹn.

1. **Mốc 1, sợi chỉ mỏng: một tin thật được thấy và ẩn rồi hiện.** Khóa và truy vấn `["listing","mine","list",...]`, đọc `GET /me/listings` trang đầu, trang `/landlord/listings` với bảng lấy từ mẫu `/dev/ui/screens`, `ListingStatusBadge`, tiêu đề dẫn tới trang sửa tin, một nút Ẩn hoặc Hiện chờ máy chủ, cập nhật hàng từ câu trả lời, `refreshAfterListingWrite` bản đầu, bật công cụ `listing.mine` ở `workspace-tools.ts`, satisfies **AC-1**, **AC-2**, **AC-5** (đường thành công), **AC-9** (tiêu đề), **AC-18** (menu và thẻ)
2. **Mốc 2, danh sách tin đủ.** Bốn liên kết lọc và `?status=`, `?page=` với `ListPagination` và tự lùi về trang cuối, trạng thái trống, tiêu đề nhận focus, khi hàng rời thì focus về tiêu đề, luật ảnh bìa, liên kết công khai và nút "Đăng tin mới", hộp xóa tin với `useReturnFocus`, mọi lỗi của ẩn, hiện, xóa (409, 403, 404, 429, mạng), dòng báo tại hàng, bố cục khối dưới `md`, satisfies **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**, **AC-8**, **AC-9**, **AC-10**, **AC-19** (danh sách tin)
3. **Mốc 3, danh sách nhà trọ.** `/landlord/properties`, truy vấn `["properties","mine",{page,pageSize:10}]`, hàng với tên, địa chỉ, số tin, ngày tạo, nhãn "Chưa ghim vị trí", "Đăng tin", "Sửa", "Xóa", trạng thái trống, nút xóa tắt khi còn tin, hộp xóa, 409 và 404, làm mới danh sách nhà trọ và ô chọn, bật công cụ `property.mine`, satisfies **AC-11**, **AC-12**, **AC-18** (menu và thẻ), **AC-19** (danh sách nhà trọ)
4. **Mốc 4, sửa nhà trọ.** Tách `property-fields.tsx` khỏi `PropertyForm` (trang tạo giữ nguyên hành vi), `["properties","detail",id]`, `toPropertyInput` và `toPropertyPatch` kèm luật đổi phường, `PATCH /properties/:id`, `EditProperty` với trạng thái không tìm thấy và không có quyền, vùng vị trí mở sẵn, cảnh báo khi rời trang, mọi lỗi ở AC-16, satisfies **AC-13**, **AC-14**, **AC-15**, **AC-16**
5. **Mốc 5, nối và hoàn thiện.** Breadcrumb ở bốn trang tạo và sửa, liên kết từ màn kết quả của #6 và #7, `refreshAfterListingWrite` gọi từ đăng tin, lưu tin và các hook ảnh, đánh dấu cũ các tin đã nạp sau khi lưu nhà trọ, quyền ẩn nút (`Can`), `noindex`, xóa `dev-check`, kiểm ở 320, 390, 768 và 1280 px, `npm run check` và `npm run build`, satisfies **AC-17**, **AC-18**, **AC-19**

## Consequences

**Positive**:
- Chủ trọ lần đầu quản lý được những gì đã đăng: thấy trạng thái thật, ẩn khi hết phòng, sửa và xóa tin và nhà trọ.
- Khu chủ trọ có đủ vòng lặp: tạo, đăng, xem, sửa, ẩn, xóa. Dashboard bật hai thẻ còn lại.
- Biểu mẫu nhà trọ có một bộ ô dùng chung cho tạo và sửa, nên #11 và #33 không bị làm hai lần.
- Bốn việc spec cũ để lại cho #12 được đóng cùng lúc (xem Follow-up).

**Negative / tradeoffs**:
- Không lọc tin theo nhà trọ được và bộ lọc không có số đếm, vì API không hỗ trợ; muốn xem số tin từng trạng thái chủ trọ phải bấm từng liên kết.
- Nhãn "đang bị ẩn bớt khỏi khách" chưa nói được là vì vượt hạn mức hay vì hết dùng thử (backend không nói cho tới khi #17 đọc hạn mức).
- Mỗi lần ẩn, hiện hoặc xóa tốn hai lời gọi (ghi rồi đọc lại trang), đổi lại `isPublic` của các hàng khác luôn đúng.
- Hai cách vẽ một danh sách (bảng từ `md`, khối dưới `md`) là hai khối mã dùng chung một hàm xử lý.
- Lỗi hạn mức tạm thời chỉ là một dòng tại hàng, không có nút "Mua gói" cho tới khi #17 và #18 xong.
- Mẫu `/dev/ui/screens/my-listings` có tab đếm và dữ liệu trong bộ nhớ; bản thật khác ở hai điểm đó (liên kết, không số đếm), nên mẫu và trang thật lệch nhau.

**Neutral**:
- Hai khóa truy vấn mới và một khóa dùng thêm tham số; không bảng mới, không biến môi trường, không thư viện.
- `/landlord/dev-check` bị xóa (spec 0005 và 0006 còn nhắc tới nó).
- Admin thấy `/admin/dev-check` cho tới #20.

## Follow-up

- [ ] #17 thay dòng báo tại hàng của `MEMBERSHIP_REQUIRED` và `LISTING_QUOTA_REACHED` bằng dải hạn mức và nút "Mua gói", và thêm việc đọc lại hạn mức vào `refreshAfterListingWrite`.
- [ ] `/sync` tick các việc spec cũ để lại cho #12: spec 0006 (đường cụt của màn kết quả, breadcrumb, xóa `dev-check`), spec 0007 (danh sách đọc lại khi ảnh đổi), spec 0008 (bật hai công cụ, xóa `dev-check`), spec 0011 (nối ghim vào biểu mẫu sửa), spec 0015 (ô chọn phường ở biểu mẫu sửa), spec 0017 (nối `FeeRowsField` và `AmenityField`), và ghi chú trong scope #11 rằng phần "sửa" của nó đóng ở đây.
- [ ] Khi backend thêm lọc theo `propertyId` cho `GET /me/listings` (hoặc dòng tin mang id nhà trọ), hàng nhà trọ có thể dẫn tới "Xem N tin của nhà trọ này". Ghi vào mục chờ backend của scope qua `/scope`.
- [ ] Spec 0005 và 0006 còn nhắc `/landlord/dev-check`; `/sync` sửa các câu đó sau khi trang bị xóa.
- [ ] Nhãn "đang bị ẩn bớt khỏi khách" của `ListingStatusBadge` có đoạn giải thích dài: `/develop` quyết thêm prop gọn cho ô bảng hay giữ nguyên.
