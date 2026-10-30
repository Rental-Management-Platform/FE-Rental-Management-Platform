# Landlord

Khu của chủ trọ: nhà trọ, tin đăng, ảnh, trạng thái dùng thử, mua gói. Máy tính trước. Xem [index](index.md) để biết thứ tự toàn bộ.

## Slice 1: Vòng lặp lõi

### 6. First property · done
Biểu mẫu tạo nhà trọ ở mức mỏng nhất: tên, số nhà và tên đường, phường hoặc xã chọn từ `GET /wards`. Chưa có phí, tiện ích, tọa độ. Không có ô quận huyện.
**Done when:** chủ trọ tạo được nhà trọ, địa chỉ đầy đủ hiện đúng như backend ghép sẵn, `WARD_UNKNOWN` và lỗi từng ô hiện đúng chỗ.
- [x] Build it: `/develop first property`
code in `src/features/property/`, `src/app/(landlord)/landlord/properties/new/`, `src/components/shells/nav-config.ts` (mục menu "Thêm nhà trọ")

### 7. Post a listing · needs a decision
Đăng tin từ một nhà trọ: tiêu đề, mô tả, giá, diện tích, tiền cọc và ngày vào ở (hai ô sau không bắt buộc). Tin hiện ngay, đăng xong mở được trang công khai. Cùng biểu mẫu này dùng để sửa tin (mở bằng `GET /me/listings/:id`, chỉ gửi ô đã đổi, sửa được ở mọi trạng thái kể cả tin bị admin ẩn; bỏ tiền cọc hoặc ngày vào ở thì gửi `null`). Việc chặn theo hạn mức làm ở Slice 4.
**Done when:** chủ trọ đăng được tin và sửa được tin, tin xuất hiện ngay ở trang tìm tin của khách, lỗi từng ô hiện đúng, chưa có nhà trọ thì dẫn đi tạo nhà trọ trước.
- [ ] Design it (spec): `/architect post a listing`

## Slice 2: Tin phong phú hơn

### 10. Listing photos
Thêm ảnh từng cái một (tối đa 5, JPEG, PNG hoặc WebP), xóa ảnh, ảnh bìa ở thẻ tin và thư viện ảnh ở trang chi tiết. Chưa có ảnh thì hiện ảnh thay thế.
**Done when:** tải lên và xóa ảnh được, nút thêm ẩn khi đủ 5 ảnh, `IMAGE_INVALID`, `LISTING_IMAGE_LIMIT` và `PAYLOAD_TOO_LARGE` hiện bằng `message` của backend, ảnh trả 404 thì ẩn ô ảnh chứ không báo lỗi.
- [ ] Build it: `/develop listing photos`

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
