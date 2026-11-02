# Landlord

Khu của chủ trọ: nhà trọ, tin đăng, ảnh, trạng thái dùng thử, mua gói. Máy tính trước. Xem [index](index.md) để biết thứ tự toàn bộ.

## Slice 1: Vòng lặp lõi

### 6. First property · done
Biểu mẫu tạo nhà trọ ở mức mỏng nhất: tên, số nhà và tên đường, phường hoặc xã chọn từ `GET /wards`. Chưa có phí, tiện ích, tọa độ. Không có ô quận huyện.
**Done when:** chủ trọ tạo được nhà trọ, địa chỉ đầy đủ hiện đúng như backend ghép sẵn, `WARD_UNKNOWN` và lỗi từng ô hiện đúng chỗ.
- [x] Build it: `/develop first property`
code in `src/features/property/`, `src/app/(landlord)/landlord/properties/new/`, `src/components/shells/nav-config.ts` (mục menu "Thêm nhà trọ")

### 7. Post a listing · done
Đăng tin từ một nhà trọ: tiêu đề, mô tả, giá, diện tích, tiền cọc và ngày vào ở (hai ô sau không bắt buộc). Tin hiện ngay, đăng xong mở được trang công khai. Cùng biểu mẫu này dùng để sửa tin (mở bằng `GET /me/listings/:id`, chỉ gửi ô đã đổi, sửa được ở mọi trạng thái kể cả tin bị admin ẩn; bỏ tiền cọc hoặc ngày vào ở thì gửi `null`). Việc chặn theo hạn mức làm ở Slice 4. Từ 2026-11-02 backend bắt buộc đăng tin kèm 1 đến 5 ảnh trong cùng một lần gọi, nên ô chọn ảnh nằm ngay trong biểu mẫu đăng tin này (M5); việc thêm và xóa ảnh của tin đã đăng do #10 làm.
**Done when:** chủ trọ đăng được tin kèm 1 đến 5 ảnh và sửa được tin, tin xuất hiện ngay ở trang tìm tin của khách, lỗi từng ô hiện đúng, chưa có nhà trọ thì dẫn đi tạo nhà trọ trước.
- [x] Design it (spec): `/architect post a listing`
- [x] Build it: `/develop post a listing`
code in `src/features/listing/`, `src/app/(landlord)/landlord/listings/new/`, `src/app/(landlord)/landlord/listings/[id]/edit/`, `src/lib/format.ts`, `src/components/shells/nav-config.ts` (mục menu "Đăng tin"), `src/components/form/date-picker.tsx`, `src/components/ui/popover.tsx`, `src/components/ui/calendar.tsx`, `src/features/property/api/properties-key.ts`, `src/features/property/components/property-created.tsx` (nút "Đăng tin cho nhà trọ này")
  - [x] M1 Sợi chỉ mỏng: đăng được một tin thật với bốn ô bắt buộc, chọn nhà trọ, màn kết quả tại chỗ, nhãn trạng thái, đổi định dạng tiền và ngày sang `src/lib/format.ts`, mục menu "Đăng tin" (AC-1 đến AC-3, AC-6, AC-7, AC-11, AC-12, AC-13)
  - [x] M2 Đủ biểu mẫu: tiền cọc, dòng xem trước tiền, bộ chọn ngày của shadcn kèm sửa file, cặp tương phản và mục trong `/dev/ui` (AC-3 đến AC-6, AC-15)
  - [x] M3 Sửa tin: tải tin, so ô đã đổi, PATCH, trạng thái không tìm thấy hay không có quyền, tin bị admin ẩn, nút "Sửa tin này" (AC-6, AC-8, AC-9)
  - [x] M4 Nối với #6 và hoàn thiện: nút "Đăng tin cho nhà trọ này", làm mới danh sách nhà trọ, cảnh báo khi rời trang, `npm run check` và `npm run build` (AC-10, AC-12, AC-14, AC-16)
  - [x] M5 Ảnh trong biểu mẫu đăng tin (làm trước M3 và M4 của #10): ô chọn 1 đến 5 ảnh và đổi thứ tự, gửi một lần dạng `multipart`, lỗi từng ảnh, kiểm tra tin đã lên chưa khi mất phản hồi, khối ảnh dưới màn kết quả (AC-6, AC-7, AC-10 đến AC-12, AC-15 đến AC-18)
- [x] Verify it: `/check verify post a listing` (bỏ qua theo quyết định của chủ dự án ngày 2026-11-02, vì là dự án demo: chưa chạy `/check verify`, chỉ có các bước tự kiểm của `/develop` ghi trong `verify.md`; ô "tin xuất hiện ở trang tìm tin" chỉ kiểm bằng `GET /listings` cho tới khi #8 xong)
spec [0006](../specs/0006-post-a-listing/index.md) · Chọn: một biểu mẫu dùng chung cho đăng và sửa, địa chỉ phẳng `/landlord/listings/new` và `/landlord/listings/[id]/edit`, nhà trọ chọn trong biểu mẫu (hoặc gắn sẵn bằng `?propertyId=`, tối đa 50 nhà trọ), kết quả hiện tại chỗ với đường dẫn công khai dạng chữ cho tới khi có #9, tiền nhập bằng chữ số kèm dòng xem trước, ngày vào ở bằng bộ chọn ngày của shadcn, trang sửa hiện nhà trọ chỉ đọc và lý do khi bị admin ẩn, hỏi khi đóng tab lúc đang gõ dở. Cập nhật 2026-11-02: ô chọn 1 đến 5 ảnh nằm ngay trong biểu mẫu đăng tin (đổi thứ tự bằng hai nút, ảnh đầu là ảnh bìa), gửi cùng tin trong một lần, và nếu mất phản hồi thì đọc lại danh sách tin của tôi trước khi cho gửi lần hai.

## Slice 2: Tin phong phú hơn

### 10. Listing photos · in-progress
Khối ảnh của chủ trọ cho tin đã có (những ảnh đầu được chọn ở biểu mẫu đăng tin của #7 và gửi cùng tin), đặt ngay dưới màn kết quả sau khi đăng tin và trên trang sửa tin, nằm ngoài biểu mẫu và lưu từng ảnh ngay khi tải lên. Chọn nhiều ảnh một lần (JPEG, PNG hoặc WebP, mỗi ảnh tối đa 5 MiB, tối đa 5 ảnh), FE gửi lần lượt từng ảnh một, mỗi ảnh có nút xóa kèm hỏi xác nhận. Chưa có API đổi thứ tự: muốn đổi ảnh bìa thì xóa ảnh bìa, ảnh kế tiếp thành bìa. Tin phải giữ ít nhất 1 ảnh: nút xóa ảnh cuối cùng bị tắt kèm lời giải thích (backend trả 409 `LISTING_IMAGE_REQUIRED`). Ảnh bìa ở thẻ tin và thư viện ảnh ở trang chi tiết do #8 và #9 vẽ.
**Done when:** đăng tin xong thấy ngay các ảnh đã đăng kèm và thêm được ảnh, sửa tin thì thấy, thêm và xóa được ảnh (trừ ảnh cuối cùng); nút thêm khóa lúc đang gửi và ẩn khi đủ 5 ảnh; `IMAGE_INVALID`, `LISTING_IMAGE_LIMIT`, `PAYLOAD_TOO_LARGE` và `RATE_LIMITED` hiện bằng `message` của backend; ảnh quá giờ không bị tải trùng; tin đang ẩn thì ảnh không xem được vẫn xóa được và có lời giải thích.
- [x] Design it (spec): `/architect listing photos`
- [ ] Build it: `/develop listing photos`
code in `src/features/listing/` (`api/listing-images.ts`, `hooks/use-photo-uploads.ts`, `hooks/use-delete-photo.ts`, `schemas/photo-rules.ts`, `components/listing-photos.tsx`, `components/photo-tile.tsx`, `components/delete-photo-dialog.tsx`), `src/lib/media.ts`, `src/lib/api/client.ts` (`timeoutMs`)
  - [x] M1 Sợi chỉ mỏng: một ảnh tải lên thật và hiện ở trang sửa tin, kèm `mediaUrl`, luật kiểm tệp và giới hạn giờ riêng cho ảnh (AC-1 đến AC-5, AC-12, AC-13)
  - [x] M2 Hàng đợi và lỗi: chọn nhiều ảnh, gửi lần lượt, thử lại và bỏ, dừng hàng đợi đúng lúc, đọc lại tin sau khi quá giờ, cảnh báo khi đóng tab (AC-3, AC-4, AC-7, AC-8, AC-9, AC-11, AC-14)
  - [x] M3 Xóa ảnh và ảnh không tải được: hộp xác nhận, luật ảnh cuối cùng (nút tắt, xử lý 409), chuyển tiêu điểm, khung thay thế cho tin đang ẩn (AC-5, AC-6, AC-10, AC-14)
  - [ ] M4 Hoàn thiện: kiểm khối ảnh dưới màn kết quả (phần xây nằm ở M5 của #7), các trạng thái trong `/dev/ui`, `npm run check` và `npm run build` (AC-1, AC-8, AC-10, AC-14, AC-15)
- [ ] Verify it: `/check verify listing photos` (cần backend chạy)
spec [0007](../specs/0007-listing-photos/index.md) · Chọn: một khối ảnh dùng chung cho màn kết quả và trang sửa tin, ảnh lưu ngay và tách khỏi nút Lưu, chọn nhiều ảnh nhưng gửi lần lượt từng ảnh một, kiểm loại và dung lượng ở FE (backend vẫn là người quyết), quá giờ thì đọc lại tin trước khi cho thử lại để không tải trùng, giới hạn giờ 60 giây chỉ cho ảnh, xóa có hỏi xác nhận, tin đang ẩn thì hiện khung thay thế và giữ bản xem trước trên máy, có một dòng nhắc về thông tin kèm theo ảnh, không kéo thả. Cập nhật 2026-11-02: ảnh đầu chọn ở biểu mẫu đăng tin (spec 0006), ảnh cuối cùng của tin không xóa được.

### 11. Property fees and amenities
Thêm vào biểu mẫu nhà trọ: tối đa 6 khoản phí (mỗi loại một lần), tiện ích chọn từ `GET /amenities`, tọa độ không bắt buộc (đủ cả hai hoặc không có). Hiện phí và tiện ích ở trang chi tiết tin. Khi sửa thì gửi lại toàn bộ danh sách.
**Done when:** thêm, sửa, xóa phí và tiện ích được, loại phí đã chọn bị ẩn khỏi danh sách chọn, lỗi dạng `fees.0.price` hiện đúng ô, phí và tiện ích hiện ở trang chi tiết.
- [ ] Build it: `/develop property fees and amenities`

### 12. Manage my properties and listings · needs a decision
Khu chủ trọ đầu tiên, cũng là khung trang cho cả khu này. Danh sách nhà trọ (sửa, xóa, `PROPERTY_HAS_LISTINGS`) và danh sách tin của tôi lọc theo trạng thái, với nhãn rõ cho tin bị ẩn bởi chủ trọ, tin bị admin ẩn kèm lý do, và tin đang `visible` nhưng `isPublic` là false. Có nút ẩn, hiện, sửa, xóa; sửa nhà trọ và sửa tin mở lại biểu mẫu của #6, #11 và #7.
**Done when:** tin bị admin ẩn không có nút Hiện nhưng hiện lý do, tin `isPublic` false có nhãn khác tin chạy bình thường, xóa có hỏi xác nhận, `LISTING_STATE_INVALID` thì tải lại tin.
- [ ] Design it (spec): `/architect manage my properties and listings`

## Slice 4: Gói và thanh toán thử

### 17. Membership status and quota notices
Dải trạng thái đầu khu quản lý tin từ `GET /me/membership`: còn bao nhiêu ngày dùng thử, đang hiện X trên Y tin, gói đang chạy, hết hạn thì mời mua gói, cảnh báo `overLimitCount`. Xử lý `MEMBERSHIP_REQUIRED` và `LISTING_QUOTA_REACHED` ở nút đăng và nút hiện tin: không coi là lỗi hệ thống, giữ nguyên biểu mẫu. Không tự tính hạn ở FE.
**Done when:** dải trạng thái đúng ở cả ba trạng thái (dùng thử, gói, hết hạn), hai lỗi chặn hiện đúng thông báo kèm nút "Mua gói" hoặc gợi ý ẩn bớt tin, biểu mẫu không mất chữ, dải cập nhật sau mỗi lần đăng, ẩn, hiện, xóa.
- [ ] Build it: `/develop membership status and quota notices`

### 19. Checkout and order history
Bước xác nhận đơn (bản chốt của gói, nút "Thanh toán thử" và "Hủy đơn", nhắc kỳ mới nối vào cuối khi đang có gói), lịch sử đơn có phân trang và lọc theo trạng thái (chờ, đã trả, đã hủy), đơn chờ có "Tiếp tục thanh toán". Ghi rõ đây là thanh toán thử.
**Done when:** chọn gói, tạo đơn, thanh toán thử thì `GET /me/membership` thành `plan` và chủ trọ đăng được ngay, `PLAN_INACTIVE` cho chọn lại gói, hủy đơn đã trả báo `ORDER_STATE_INVALID`.
- [ ] Build it: `/develop checkout and order history`
