# 0019. Rationale: Quản lý nhà trọ và tin của tôi

Build spec: [index.md](index.md).

## Context

> ⚠️ Premise note: scope #12 gom ba việc có thể giao riêng: danh sách tin, danh sách nhà trọ và trang sửa nhà trọ. Spec này giữ chúng chung vì chúng dùng chung cách giữ khóa bộ nhớ truy vấn, cách báo lỗi và bộ ô nhập. Mốc được xếp để mỗi mốc chạy trọn vẹn, nên dừng sau mốc 2 hoặc mốc 4 vẫn còn một bản dùng được. Dòng scope cũng ghi #12 là "khung trang cho cả khu", nhưng khung và dashboard đã có từ spec 0003 và 0008, nên #12 chỉ thêm trang và bật công cụ.

Chủ trọ hiện đăng được tin kèm ảnh, sửa tin, quản lý ảnh và tạo nhà trọ có phí, tiện ích và ghim vị trí, nhưng không có chỗ nào để thấy những gì mình đã đăng. Không có cách ẩn một tin khi hết phòng, xóa một tin hay một nhà trọ, hay sửa một nhà trọ đã tạo. Backend đã đủ API cho tất cả. Bốn spec cũ (0006, 0007, 0008, 0017) và hai spec khác (0011, 0015) còn những việc ghi là "để #12".

Có những ràng buộc từ backend quyết định cách làm. Số tin được hiện cùng lúc có hạn mức, nên `isPublic` của một tin phụ thuộc vào các tin khác của cùng chủ trọ: ẩn một tin có thể làm tin khác hiện lại với khách. "Ẩn" không bao giờ bị hạn mức chặn nhưng "Hiện" thì có, và admin có thể ẩn một tin ngay lúc chủ trọ bấm. `GET /me/listings` chỉ lọc được theo trạng thái, không có số đếm theo trạng thái (chỉ có `total` của đúng truy vấn) và dòng tin không mang id nhà trọ. Ảnh của tin không công khai trả 404. Xóa nhà trọ bị chặn khi còn tin. `PATCH` nhà trọ thay cả danh sách phí và tiện ích, và đổi phường kéo theo kiểm tọa độ.

Thêm vào đó chủ trọ dùng điện thoại nhiều, nhưng scope chọn máy tính trước cho khu này, và mẫu "Tin của tôi" trong `/dev/ui/screens` mới chỉ kiểm ở 1440 px với dữ liệu trong bộ nhớ. Nếu không quyết, hạn mức, lọc, báo lỗi và cách sửa nhà trọ sẽ bị mỗi người làm một kiểu khi xây.

## Options considered

### Option 1: Hai trang danh sách riêng, trạng thái ở địa chỉ, ô nhập tách ra dùng chung

`/landlord/properties` và `/landlord/listings`, bộ lọc và trang nằm trong `?status=` và `?page=`, sửa nhà trọ ở `/landlord/properties/[id]/edit` dùng một lớp ô nhập tách khỏi biểu mẫu tạo. Mỗi hàng đổi từ câu trả lời của máy chủ rồi FE đọc lại trang.

**Pros**:
- Khớp địa chỉ phẳng đã dùng ở #6 và #7, và khớp hai thẻ "Nhà trọ của tôi", "Tin của tôi" của spec 0008, mỗi thẻ một địa chỉ.
- Địa chỉ chia sẻ được, nút Back và tải lại giữ nguyên bộ lọc và trang.
- Tách ô nhập làm một chỗ cho tạo và sửa, theo đúng cách `listing-form.tsx` đã làm cho tin.

**Cons**:
- Hai trang, hai khóa truy vấn, hai hộp xóa.
- Không có số đếm trên bộ lọc (API không cho).

### Option 2: Một trang quản lý hai tab

Một trang `/landlord/manage` có tab Nhà trọ và tab Tin, trạng thái lọc giữ trong bộ nhớ như mẫu `/dev/ui/screens`.

**Pros**:
- Một mục menu, đổi qua lại không rời trang.
- Giống mẫu đã có.

**Cons**:
- Hai thẻ dashboard phải trỏ cùng một chỗ, mất nghĩa của hai công cụ.
- Tab trong bộ nhớ không chia sẻ được và mất khi tải lại; số đếm trong mẫu đến từ dữ liệu giả, API thật không có.
- Làm cả hai danh sách nặng trên một trang, khó vừa điện thoại.

### Option 3: Trang chi tiết nhà trọ chứa các tin của nó

Bấm một nhà trọ thì thấy các tin của nó, sửa và xóa từ đó.

**Pros**:
- Đúng quan hệ một nhà trọ nhiều tin.

**Cons**:
- `GET /me/listings` chưa lọc theo nhà trọ và dòng tin không mang id nhà trọ, nên chỉ làm được bằng cách tải hết rồi lọc ở FE, hỏng khi có nhiều tin.
- Thêm một trang chi tiết mà hợp đồng không đòi, và chủ trọ vẫn cần một danh sách tin chung để lọc theo trạng thái.

## Rationale

Option 1 hợp với các ràng buộc ở Context. Backend không cho lọc tin theo nhà trọ và không đếm theo trạng thái, nên Option 3 không làm được và Option 2 phải bỏ số đếm của mẫu mà vẫn giữ trạng thái trong bộ nhớ, thứ không chia sẻ được. Hai danh sách riêng, mỗi danh sách một thẻ dashboard, cho địa chỉ ổn định để #17 và #18 sau này trỏ tới. Việc tách ô nhập thay vì thêm một cờ chế độ vào `PropertyForm` theo đúng cách #7 đã làm với biểu mẫu tin, nên người đọc code gặp một mẫu quen.

Hai quyết định nhỏ nhưng lớn về hậu quả đều đến từ hạn mức. Sau mỗi lần ghi, FE không chỉ vá hàng đã bấm mà đọc lại cả trang, vì `isPublic` của các tin khác có thể đổi; vá một hàng sẽ cho nhãn sai ở các hàng còn lại. Và "Ẩn" không hỏi xác nhận dù "Hiện" có thể bị chặn: rủi ro (hết dùng thử thì ẩn xong không hiện lại được) hiếm hơn nhiều so với số lần ẩn và hiện hằng ngày, và #17 sẽ cho chủ trọ thấy hạn mức ngay trên trang.

## Các quyết định nhỏ

| Decision | Pick | Why | Runner up |
|---|---|---|---|
| Bộ lọc tin | Bốn liên kết `?status=`, không số đếm | Một lần gọi API mỗi lần mở; số đếm cần thêm ba lần gọi | Có số đếm (ba lần gọi thêm) |
| Hàng không còn khớp bộ lọc sau khi ẩn, hiện, xóa | Rời danh sách ngay, focus về tiêu đề | Danh sách luôn đúng với bộ lọc, như trang Tin đã lưu của #14 | Giữ tại chỗ đổi nhãn |
| Lỗi hạn mức của "Hiện" | Dòng báo tại hàng, `message` của backend, #17 nâng cấp | Trang bảng giá chưa có để dẫn tới | Làm luôn phần của #17 (nút dẫn tới 404) |
| Hỏi xác nhận khi Ẩn | Không | Thao tác hằng ngày, thuận nghịch; rủi ro ghi ở Consequences | Có hộp xác nhận |
| Xóa nhà trọ còn tin | Nút tắt kèm lời và liên kết, vẫn xử lý 409 | Backend rõ ràng và `listingCount` đã có sẵn; cùng cách với nút xóa ảnh cuối ở #10 | Luôn cho bấm rồi báo 409 |
| Sau khi lưu bản sửa | Ở lại trang, có breadcrumb về danh sách | Trang sửa tin đã làm vậy (#7) và có khối ảnh cần ở lại | Tự về danh sách |
| Bấm tiêu đề tin | Mở trang sửa; "Xem trang công khai" chỉ khi `isPublic` | Chủ trọ vào đây để quản lý; tin ẩn thì trang công khai báo không tìm thấy | Đích đổi theo trạng thái |
| Điện thoại | Bảng từ `md`, khối dọc dưới `md` | Nút 44 px và không cuộn ngang; spec 0017 ghi chủ trọ dùng điện thoại nhiều | Chỉ bảng cuộn ngang |
| Nội dung hàng nhà trọ | Thêm ngày tạo và nhãn "Chưa ghim vị trí" | Trang chi tiết tin chỉ hiện bản đồ khi nhà trọ có tọa độ (#29); nhãn không tốn lần gọi | Chỉ tên, địa chỉ, số tin |
| Trang quá cuối | Tự lùi về trang cuối có hàng | Quản lý tin không cần màn "hết trang" | Dòng "Trang này không còn tin" như #8 và #14 |
| Cách cập nhật sau ghi | Hàng đổi từ câu trả lời, rồi đọc lại trang | `isPublic` của tin khác phụ thuộc hạn mức | Chỉ vá hàng; chỉ đọc lại |
| Biểu mẫu sửa nhà trọ | Tách `property-fields.tsx`, hai biểu mẫu mỏng | Cùng cách với biểu mẫu tin của #7 | Một `PropertyForm` có cờ chế độ; chép biểu mẫu |
| Nội dung PATCH | Chỉ ô đã đổi; mỗi danh sách gửi đủ khi có đổi; đổi phường luôn gửi tọa độ | Giảm ghi đè từ tab khác; đúng luật của hợp đồng và spec 0011 | Luôn gửi mọi trường |
| Số hàng mỗi trang | 10, cho cả hai danh sách | Hàng có ảnh và nhiều nút, 10 đủ ngắn để rà soát | 20 (mặc định của API) |
| Làm mới sau ghi | Hàm chung `refreshAfterListingWrite`, đánh dấu cũ các tin đã nạp sau khi lưu nhà trọ | Một chỗ để #17 thêm hạn mức; tên nhà trọ nằm trong tin | Rải `invalidateQueries` ở từng nơi |
| Ảnh bìa của tin không công khai | Không xin, hiện khung thay thế | Backend trả 404 cho ảnh đó | Xin rồi ẩn khi lỗi |
| `/landlord/dev-check` | Xóa trong mốc 5 | Đã có trang thật sau lớp chặn (spec 0005 và 0008 hẹn xóa ở #12) | Giữ |
| Mục `/dev/ui` mới | Không | Kỹ sư chốt từ 2026-11-12: viết trang thật, kiểm bằng backend demo | Thêm mục xem thử |
