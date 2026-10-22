# Public

Phần dành cho khách và người tìm trọ: tìm tin, xem tin, lưu tin, hồ sơ chủ trọ, bảng giá. Điện thoại trước, cần SEO. Xem [index](index.md) để biết thứ tự toàn bộ.

## Slice 1: Vòng lặp lõi

### 8. Find listings · needs a decision
Trang danh sách tin công khai, điện thoại trước: ô tìm kiếm theo từ khóa, thẻ tin (ảnh bìa, tiêu đề, giá, diện tích, `fullAddress`), phân trang. Là nơi khách vào đầu tiên, tạm làm trang gốc cho tới khi có trang chủ. Có metadata cho SEO.
**Done when:** khách tìm theo từ khóa và chuyển trang được, địa chỉ URL phản ánh tìm kiếm, trạng thái trống, lỗi và 429 hiển thị đúng, trang có metadata SEO và dùng mượt trên điện thoại.
- [ ] Design it (spec): `/architect find listings`

### 9. Listing detail · needs a decision
Trang `/<slug>-<code>`: nội dung tin, địa chỉ, giá, nhà trọ. Số điện thoại chỉ hiện khi đã đăng nhập, khách thấy nút "Đăng nhập để xem số điện thoại". Nếu `slug` trả về khác địa chỉ thì sửa lại thanh địa chỉ. Ảnh, phí và tiện ích được thêm ở Slice 2. Có metadata và thẻ chia sẻ cho SEO.
**Done when:** khách mở được tin và không thấy số điện thoại, người đã đăng nhập thấy số, `slug` sai tự sửa trên thanh địa chỉ, tin không còn báo 404 dễ hiểu, metadata và thẻ chia sẻ đầy đủ.
- [ ] Design it (spec): `/architect listing detail`

## Slice 3: Tìm và gắn bó

### 13. Search filters and sort
Thêm vào trang tìm tin: chọn phường hoặc xã (từ `GET /wards`), khoảng giá, kiểu sắp xếp. Bộ lọc đóng mở gọn trên điện thoại.
**Done when:** lọc theo phường, khoảng giá và sắp xếp chạy cùng từ khóa, địa chỉ URL giữ bộ lọc để chia sẻ được, đổi bộ lọc thì về trang 1, bỏ bộ lọc được.
- [ ] Build it: `/develop search filters and sort`

### 14. Favorites
Nút tim trên thẻ tin và trang chi tiết (tim đầy, tim rỗng, và tim rỗng dẫn khách tới đăng nhập), cùng trang "Tin đã lưu" có phân trang và ngày lưu. Chỉ người tìm trọ có nút tim. Gửi kèm token khi gọi danh sách và chi tiết để có `isFavorite`.
**Done when:** bấm tim lưu và bỏ lưu được, nút khóa lúc đang gửi, trang Tin đã lưu bỏ thẻ khi bỏ tim, lưu tin vừa biến mất thì báo "tin không còn", chủ trọ và admin không thấy tim.
- [ ] Build it: `/develop favorites`

### 15. Landlord profile and follow
Hồ sơ công khai của chủ trọ, mở từ tên chủ trọ: tên (không có tên thì ghi "Chủ trọ"), ngày tham gia, số người theo dõi, tổng lượt xem, số tin đang hiện, nút theo dõi, và danh sách tin đang hiện dùng đúng thẻ tin của trang tìm tin.
**Done when:** hồ sơ và danh sách tin hiện cùng lúc, bấm theo dõi thì trạng thái và số người theo dõi đổi ngay, khách bấm thì dẫn tới đăng nhập, nút ẩn với chủ trọ, admin và hồ sơ của chính mình, `LANDLORD_NOT_FOUND` báo "không tìm thấy chủ trọ".
- [ ] Build it: `/develop landlord profile and follow`

### 16. Home page
Trang chủ giới thiệu đặt trước ô tìm kiếm: lời giới thiệu ngắn, ô tìm kiếm nổi bật, tin mới đăng, lời mời đăng ký cho chủ trọ. Khi có trang này, nó thay trang gốc tạm.
**Done when:** trang gốc hiện phần giới thiệu, ô tìm kiếm đưa vào trang kết quả, có lối đi rõ cho khách, người tìm trọ và chủ trọ, tải nhanh trên điện thoại.
- [ ] Build it: `/develop home page`

## Slice 4: Gói và thanh toán thử

### 18. Pricing page
Bảng giá công khai từ `GET /plans`: mỗi gói một thẻ (tên, giá, số tin tối đa, số ngày). Nút "Mua" chỉ cho chủ trọ đã đăng nhập; khách được dẫn đi đăng nhập; người tìm trọ và admin không có nút.
**Done when:** thẻ gói đúng dữ liệu và xếp giá tăng dần, nút Mua đúng theo vai trò, bấm Mua tạo đơn và chuyển sang bước xác nhận đơn.
- [ ] Build it: `/develop pricing page`

## Slice 6: Tài khoản và hoàn thiện

### 29. Location pin on listing detail · needs a decision
Bản đồ nhỏ ở trang chi tiết, hiện đúng một điểm từ tọa độ của nhà trọ. Backend chưa có tìm quanh một vị trí, nên chỉ một điểm, không có bản đồ tìm kiếm. Ẩn cả khối khi nhà trọ chưa có tọa độ. Cần chọn cách hiện bản đồ.
**Done when:** có tọa độ thì hiện bản đồ một điểm, không có thì ẩn cả khối, bản đồ không làm chậm việc tải trang trên điện thoại.
- [ ] Design it (spec): `/architect location pin on listing detail`
