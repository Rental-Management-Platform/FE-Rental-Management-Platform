# Admin

Khu quản trị: người dùng, kiểm duyệt tin, gói, danh mục, quyền, đơn và doanh thu. Máy tính trước. Mọi số tiền ở đây là tiền của thanh toán thử. Xem [index](index.md) để biết thứ tự toàn bộ.

## Slice 5: Khu admin

### 20. Admin shell and users · needs a decision
Khung khu admin và trang người dùng đầu tiên, nơi định ra mẫu bảng, bộ lọc và hộp nhập lý do để các màn sau dùng lại. Bảng từ `GET /users` (tìm theo email, tên, số điện thoại; lọc theo loại tài khoản và trạng thái), khóa và mở khóa kèm lý do bắt buộc.
**Done when:** admin tìm và lọc được, khóa rồi mở khóa kèm lý do được, nút khóa ẩn ở dòng của chính mình (`CANNOT_LOCK_SELF`), trạng thái dòng cập nhật sau thao tác, 403 `ACCOUNT_LOCKED` hay 401 thì đưa về trang đăng nhập.
- [ ] Design it (spec): `/architect admin shell and users`

### 21. Listing moderation
Bảng tin cho admin từ `GET /moderation/listings` (tìm, lọc theo trạng thái và chủ trọ), ẩn hoặc gỡ ẩn kèm lý do 1 đến 500 ký tự. Nhắc rằng gỡ ẩn không tự hiện tin, chủ trọ phải bấm Hiện.
**Done when:** ẩn và gỡ ẩn thay dòng bằng kết quả mới, lý do bắt buộc, `LISTING_STATE_INVALID` thì tải lại dòng, lý do ẩn gần nhất hiện ở tin bị ẩn.
- [ ] Build it: `/develop listing moderation`

### 22. Plans and trial settings
Quản lý gói (bảng gồm cả gói đã tắt, biểu mẫu tạo và sửa dùng chung, công tắc đang bán, xóa có xác nhận) và hai tham số dùng thử (số ngày, số tin) với giới hạn `min` và `max` lấy từ phản hồi. Ghi chú đổi số ngày chỉ áp cho chủ trọ đăng ký sau đó.
**Done when:** tạo, sửa, tắt, xóa gói được, `PLAN_IN_USE` gợi ý tắt thay vì xóa, `PLAN_NAME_TAKEN` hiện ở ô tên, đổi được hai tham số và hiện người sửa cuối cùng.
- [ ] Build it: `/develop plans and trial settings`

### 23. Wards and amenities catalog
Hai bảng nhỏ (phường, xã, đặc khu và tiện ích) có thêm, đổi tên, xóa. Mã chỉ nhập lúc tạo (phường 5 chữ số, tỉnh 2 chữ số, khóa tiện ích gồm chữ thường, số và gạch dưới). Không có ô quận huyện.
**Done when:** thêm, đổi tên, xóa được, `CATALOG_CODE_TAKEN` hiện ở ô mã, `CATALOG_IN_USE` báo đang có nhà trọ dùng và gợi ý đổi tên thay vì xóa.
- [ ] Build it: `/develop wards and amenities catalog`

### 24. Permissions by account type
Ma trận hành động theo module cho người đăng bài và người tìm trọ, lấy từ `GET /permissions` và `GET /account-types`. Hành động chỉ dành cho admin bị khóa không cho chọn; lưu thì gửi toàn bộ danh sách đã chọn. Ghi chú quyền mới có hiệu lực trong tối đa 15 phút.
**Done when:** đổi và lưu quyền được, hành động chỉ dành cho admin không chọn được, loại admin không sửa được, thông báo về độ trễ 15 phút hiển thị.
- [ ] Build it: `/develop permissions by account type`

### 25. Orders of all landlords
Bảng từ `GET /orders/all`: lọc theo trạng thái, chủ trọ, gói và khoảng ngày tạo; hai ô tổng "Số đơn đã trả" và "Tổng tiền đã trả" của đúng bộ lọc đang chọn, kèm nhãn "thanh toán thử".
**Done when:** đổi bộ lọc thì về trang 1 và tổng đổi theo, chủ trọ không có tên thì hiện email, nhãn thanh toán thử rõ ràng.
- [ ] Build it: `/develop orders of all landlords`

### 26. Revenue statistics · needs a decision
Trang doanh thu từ `GET /orders/revenue`: ô tổng, doanh thu theo gói, biểu đồ theo ngày hoặc tháng. Chuỗi trả về thưa nên tự điền 0 cho ngày hay tháng trống. Ghi chú vì sao con số có thể khác ô tổng ở màn đơn (ngày trả so với ngày tạo). Cần chọn cách vẽ biểu đồ.
**Done when:** chọn khoảng ngày và cách gom thì biểu đồ và bảng cập nhật, ngày trống là 0, ba tổng khớp nhau, nhãn thanh toán thử và ghi chú về hai loại ngày hiển thị.
- [ ] Design it (spec): `/architect revenue statistics`
