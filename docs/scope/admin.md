# Admin

Khu quản trị: người dùng, kiểm duyệt tin và đánh giá, gói, danh mục, quyền, đơn và doanh thu. Máy tính trước. Mọi số tiền ở đây là tiền của thanh toán thử. Xem [index](index.md) để biết thứ tự toàn bộ.

## Slice 5: Khu admin

### 20. Admin shell and users · needs a decision
Khung khu admin và trang người dùng đầu tiên, nơi định ra mẫu bảng, bộ lọc và hộp nhập lý do để các màn sau dùng lại. Bảng từ `GET /users` (tìm theo email, tên, số điện thoại; lọc theo loại tài khoản và trạng thái), khóa và mở khóa kèm lý do bắt buộc, và thu hồi mọi phiên của một người (`POST /users/:id/revoke-sessions`, quyền `user:revoke`): nút ở mỗi dòng, hỏi xác nhận, buộc người đó đăng nhập lại mà không đổi trạng thái tài khoản.
**Done when:** admin tìm và lọc được, khóa rồi mở khóa kèm lý do được, thu hồi phiên có hỏi xác nhận và báo `USER_NOT_FOUND` nếu người đó không còn, nút khóa ẩn ở dòng của chính mình (`CANNOT_LOCK_SELF`), trạng thái dòng cập nhật sau thao tác, 403 `ACCOUNT_LOCKED` hay 401 thì đưa về trang đăng nhập.
- [ ] Design it (spec): `/architect admin shell and users`

### 21. Listing moderation
Bảng tin cho admin từ `GET /moderation/listings` (tìm, lọc theo trạng thái và chủ trọ), ẩn hoặc gỡ ẩn kèm lý do 1 đến 500 ký tự. Nhắc rằng gỡ ẩn không tự hiện tin, chủ trọ phải bấm Hiện.
**Done when:** ẩn và gỡ ẩn thay dòng bằng kết quả mới, lý do bắt buộc, `LISTING_STATE_INVALID` thì tải lại dòng, lý do ẩn gần nhất hiện ở tin bị ẩn.
- [ ] Build it: `/develop listing moderation`

### 36. Review moderation
Trang `/admin/reviews` từ `GET /moderation/reviews`, với bộ lọc `status`, `landlordId` và `authorId` nằm trong địa chỉ. Bảng có số sao, nhận xét, người viết, chủ trọ, ngày viết và nhãn trạng thái; dòng bị ẩn hiện thêm `hiddenReason`. Ẩn và Gỡ ẩn mở hộp nhập lý do bắt buộc (1 đến 500 ký tự), hộp dùng chung với #21 theo mẫu #20 định ra. Bấm tên người viết thì đặt bộ lọc `authorId`, bấm tên chủ trọ thì mở hồ sơ công khai `/chu-tro/[id]` (#15). Thêm mục `reviews` (quyền `review:moderate`) vào `ADMIN_TOOLS`. Cần #20 (khung admin và mẫu bảng) làm trước.
Trang có hai tab, thêm ngày 2026-11-10 khi hợp đồng có đánh giá từng phòng (#37): tab "Chủ trọ" là phần trên, tab "Phòng" lấy từ `GET /moderation/listing-reviews` (mục 6.41) với bộ lọc `status`, `listingId` và `authorId`, không có `landlordId` (tham số lạ là 400). Mỗi dòng của tab Phòng có số sao, nhận xét, người viết, tiêu đề tin (bấm mở chi tiết công khai bằng `listing.code`; tin đang ẩn thì chi tiết 404, nên báo "tin không còn hiện công khai"), ngày viết và nhãn trạng thái; dòng bị ẩn hiện thêm `hiddenReason`. Ẩn và Gỡ ẩn gọi `POST /moderation/listing-reviews/:id/hide` và `/unhide` qua cùng hộp nhập lý do. `:id` ở đây là id của đánh giá, không phải id của tin. Hai tab dùng khóa truy vấn và bảng riêng vì id của hai loại khác bảng, gọi nhầm route là 404.
**Done when:** ẩn và gỡ ẩn thay dòng bằng phần tử trả về, lý do bắt buộc, `REVIEW_STATE_INVALID` thì tải lại dòng, `REVIEW_NOT_FOUND` thì bỏ dòng và báo người viết vừa xóa, bộ lọc nằm trong địa chỉ và đổi bộ lọc thì về trang 1, giá trị lạ trong địa chỉ về mặc định, có dòng nhắc rằng gỡ ẩn đưa đánh giá thẳng về hiện; tab Phòng làm đúng như vậy với `LISTING_REVIEW_STATE_INVALID` và `LISTING_REVIEW_NOT_FOUND`, có tên tin bấm được, không có bộ lọc chủ trọ, và đổi tab không làm lẫn dữ liệu hay khóa truy vấn của hai bên.
- [ ] Build it: `/develop review moderation`

### 22. Plans and trial settings
Quản lý gói (bảng gồm cả gói đã tắt, biểu mẫu tạo và sửa dùng chung, công tắc đang bán, xóa có xác nhận) và hai tham số dùng thử (số ngày, số tin) với giới hạn `min` và `max` lấy từ phản hồi. Ghi chú đổi số ngày chỉ áp cho chủ trọ đăng ký sau đó.
**Done when:** tạo, sửa, tắt, xóa gói được, `PLAN_IN_USE` gợi ý tắt thay vì xóa, `PLAN_NAME_TAKEN` hiện ở ô tên, đổi được hai tham số và hiện người sửa cuối cùng.
- [ ] Build it: `/develop plans and trial settings`

### 23. Wards and amenities catalog
Hai bảng nhỏ (phường, xã, đặc khu và tiện ích) có thêm, đổi tên, xóa. Mã chỉ nhập lúc tạo (phường 5 chữ số, tỉnh 2 chữ số, khóa tiện ích gồm chữ thường, số và gạch dưới). Không có ô quận huyện. Phường trong danh mục có thêm `bounds` (hộp bao dùng để giới hạn chỗ ghim tọa độ nhà trọ, #33): phường admin thêm qua API luôn có `bounds: null` và admin không sửa được trường này, nên biểu mẫu thêm phường không có ô nhập hộp.
**Done when:** thêm, đổi tên, xóa được, `CATALOG_CODE_TAKEN` hiện ở ô mã, `CATALOG_IN_USE` báo đang có nhà trọ dùng và gợi ý đổi tên thay vì xóa.
- [ ] Build it: `/develop wards and amenities catalog`

### 24. Permissions by account type
Ma trận hành động theo module cho người đăng bài và người tìm trọ, lấy từ `GET /permissions` và `GET /account-types`. Hành động chỉ dành cho admin bị khóa không cho chọn; lưu thì gửi toàn bộ danh sách đã chọn. Ghi chú quyền mới có hiệu lực trong tối đa 15 phút.
**Done when:** đổi và lưu quyền được, hành động chỉ dành cho admin không chọn được, loại admin không sửa được, thông báo về độ trễ 15 phút hiển thị.
- [ ] Build it: `/develop permissions by account type`

### 25. Orders of all landlords
Bảng từ `GET /orders/all`: lọc theo trạng thái, chủ trọ, gói và khoảng ngày tạo; hai ô tổng "Số đơn đã trả" và "Tổng tiền đã trả" của đúng bộ lọc đang chọn, kèm nhãn "thanh toán thử".
**Done when:** đổi bộ lọc thì về trang 1 và tổng đổi theo, chủ trọ không có tên thì hiện email, nhãn thanh toán thử rõ ràng.
- [x] Build it: `/develop orders of all landlords` (không cần spec riêng: dùng lại mẫu bảng, thẻ trạng thái và phân trang của #19, theo `api-for-frontend.md` mục 6.37)
  - [x] M1 Sợi chỉ mỏng: địa chỉ `/admin/orders`, đọc `GET /orders/all` với tài khoản admin, bảng các dòng đơn kèm chủ trọ (tên hoặc email), hai ô tổng, công cụ "Đơn của mọi chủ trọ" thành `ready`
  - [x] M2 Bộ lọc: thẻ trạng thái, ô chọn gói và chủ trọ, hai ô ngày tạo đơn, tất cả nằm trong địa chỉ, đổi bộ lọc thì về trang 1, giá trị lạ trong địa chỉ về mặc định
  - [x] M3 Trạng thái và hoàn thiện: rỗng, rỗng theo bộ lọc, trang quá cuối, đang tải, lỗi kèm "Thử lại", 429, thiếu quyền, khối xếp ở điện thoại, kiểm ở 320, 390, 768 và 1280 px, `npm run check` và `npm run build`
code in `src/features/admin-orders/` (`admin-orders-path.ts`, `admin-order-filter.ts` là các hàm thuần `parseAdminOrderFilters`, `parseDay`, `rangeIsBackwards`, `adminOrdersHref`, `admin-orders-text.ts`, `api/` gồm `fetchAdminOrders`, `adminOrdersListQuery` và hai truy vấn cho ô chọn, `components/` gồm `AdminOrdersPage`, `AdminOrderFilterBar`, `AdminOrderTotals`, `AdminOrderStatusTabs`, `AdminOrdersTable`, `AdminOrderCards`, `LandlordCell`), `src/app/(admin)/admin/orders/page.tsx`, và chỗ nối ở `src/components/shells/workspace-tools.ts` (công cụ `orders.all` thành `ready` với `ADMIN_ORDERS_PATH`, thẻ và mục menu cùng sáng)
quyết định khi xây (không có spec): địa chỉ `/admin/orders`; trang gồm bốn vùng theo thứ tự vùng lọc (gói, chủ trọ, từ ngày, đến ngày), vùng tổng (hai ô của `summary` kèm nhãn "Thanh toán thử"), rồi vùng bảng có thẻ trạng thái làm hàng tiêu đề; mọi bộ lọc nằm trong địa chỉ, đổi bộ lọc về trang 1, giá trị lạ (trạng thái lạ, id không phải UUID, ngày không có thật hoặc ngoài 2000 đến 2100) coi như không có và không bao giờ được gửi; hai ngày ngược nhau thì không gọi API, báo lỗi dưới "Đến ngày" đúng như API báo; mười dòng mỗi trang như lịch sử đơn của chủ trọ; tổng lấy nguyên từ `summary`, không cộng từ các dòng; ô chọn gói đọc `GET /plans/all` (có cả gói đã tắt, ghi "đã tắt") và ô chọn chủ trọ đọc 50 chủ trọ đầu của `GET /users?accountType=landlord`, cả hai chỉ giữ id, tên và email trong bộ nhớ, ẩn khi thiếu quyền `plan:read` hay `user:read`, và lỗi của một ô chọn không chặn danh sách; id trong địa chỉ mà ô chọn không có (chủ trọ thứ 51 trở đi) hiện là "Chủ trọ đã chọn"; tên chủ trọ trong bảng là liên kết lọc theo người đó (giữ các bộ lọc khác, về trang 1), cũng là cách lọc cho chủ trọ ngoài 50 người đầu; mã đơn là chữ thường chứ không liên kết vì admin không có trang đơn của chủ trọ khác (API trả 403) và bảng không có nút nào; bảng từ `md`, khối xếp ở dưới `md`.
Đã chạy thật với backend demo (tài khoản admin của seed): thẻ ở `/admin` sáng và liên kết sang trang, 26 đơn với 17 đơn đã trả và 3.183.000 ₫ (3.084.000 ₫ của seed cộng 99.000 ₫ của đơn mai.dang đã trả ở #19), lọc theo gói Nâng cao cho 8 đơn, 6 đã trả, 1.194.000 ₫ (6 nhân 199.000 ₫), thêm chủ trọ Khoa cho 2 đơn, 398.000 ₫, bấm thẻ "Chờ thanh toán" giữ hai bộ lọc kia và cho trạng thái rỗng kèm "Xóa bộ lọc", nút xóa bộ lọc về địa chỉ sạch, chọn ngày từ lịch thật (`from=2026-11-10`), khoảng ngày ngược (không có yêu cầu nào tới `/orders/all`, lỗi dưới "Đến ngày", ô có `aria-invalid`), giá trị lạ trong địa chỉ (yêu cầu chỉ có `page=1&pageSize=10`), `page=99` tự lùi về trang 3, UUID đúng dạng của người không có thật cho rỗng theo bộ lọc, bấm tên chủ trọ giữ `status=paid`, chặn `**/orders/all**` (chỉ vùng bảng báo lỗi, bỏ chặn rồi "Thử lại" thì số liệu về), chặn `**/plans/all**` (chỉ ô gói báo lỗi, đơn vẫn hiện), không có lỗi console, không cuộn ngang và điều khiển cao 44 px ở 320, 390, 768 và 1280 px (ở 768 bảng cuộn trong vùng của nó, cột "Kỳ gói" phải cuộn mới thấy, như lịch sử đơn của #19), `npm run check` và `npm run build` đạt. Chưa kiểm: 429 thật (nhánh 429 chép từ lịch sử đơn của #19), tài khoản không phải admin vào địa chỉ này (cổng của khu admin đã có từ #31), admin thiếu quyền `order:report`, `plan:read` hay `user:read`, danh sách chủ trọ dài hơn 50, cảm ứng thật, trình đọc màn hình.

### 26. Revenue statistics · needs a decision
Trang doanh thu từ `GET /orders/revenue`: ô tổng, doanh thu theo gói, biểu đồ theo ngày hoặc tháng. Chuỗi trả về thưa nên tự điền 0 cho ngày hay tháng trống. Ghi chú vì sao con số có thể khác ô tổng ở màn đơn (ngày trả so với ngày tạo). Cần chọn cách vẽ biểu đồ.
**Done when:** chọn khoảng ngày và cách gom thì biểu đồ và bảng cập nhật, ngày trống là 0, ba tổng khớp nhau, nhãn thanh toán thử và ghi chú về hai loại ngày hiển thị.
- [ ] Design it (spec): `/architect revenue statistics`
