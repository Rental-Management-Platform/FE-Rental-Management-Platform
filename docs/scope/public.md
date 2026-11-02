# Public

Phần dành cho khách và người tìm trọ: tìm tin, xem tin, lưu tin, hồ sơ chủ trọ, bảng giá. Điện thoại trước, cần SEO. Xem [index](index.md) để biết thứ tự toàn bộ.

## Slice 1: Vòng lặp lõi

### 8. Find listings · in-progress
Trang danh sách tin công khai, điện thoại trước: ô tìm kiếm theo từ khóa, thẻ tin (ảnh bìa lấy từ `coverImageUrl`, tiêu đề, giá, diện tích, `fullAddress`), phân trang. Chưa có ảnh bìa thì hiện ảnh thay thế, ảnh trả 404 thì ẩn ô ảnh chứ không báo lỗi. Cách ghép địa chỉ ảnh dùng chung với #9 và #10 (xem AC-12 của spec 0007); mục nào xây trước thì tạo ra nó. Là nơi khách vào đầu tiên và là trang gốc của trang web (hợp đồng không có trang chủ riêng). Có metadata cho SEO.
**Done when:** khách tìm theo từ khóa và chuyển trang được, địa chỉ URL phản ánh tìm kiếm, thẻ tin hiện ảnh bìa thật (chưa có ảnh thì hiện ảnh thay thế, ảnh lỗi thì ẩn ô ảnh), trạng thái trống, lỗi và 429 hiển thị đúng, trang có metadata SEO và dùng mượt trên điện thoại.
- [x] Design it (spec): `/architect find listings`
- [ ] Build it: `/develop find listings`
  - [x] M1 Sợi chỉ mỏng: đọc `GET /listings` ở máy chủ với tư cách khách (`src/lib/api/server.ts`), bộ phân tích địa chỉ cho `q` và `page`, trang `/` hiện các tin thật kèm liên kết trang thật (AC-1 đến AC-3, AC-5, AC-7, AC-14)
  - [x] M2 Thẻ tin: thẻ dùng chung lấy từ thẻ mẫu, ô ảnh bìa (chưa có ảnh thì ảnh thay thế, ảnh lỗi thì ẩn ô), lưới ba cột, khung chờ mỗi lần đổi từ khóa hoặc trang (AC-6 đến AC-9, AC-15)
  - [x] M3 Tìm kiếm và trạng thái: ô tìm kiếm `next/form`, không có tin, trang quá cuối, lỗi và 429 có nút "Thử lại" (AC-4, AC-10, AC-11)
  - [ ] M4 Công cụ tìm kiếm và hoàn thiện: metadata, `robots.txt`, các trạng thái của thẻ trong `/dev/ui`, kiểm ở 320 và 390 px, `npm run check` và `npm run build` (AC-12, AC-13, AC-15, AC-16)
- [ ] Verify it: `/check verify find listings`
spec [0009](../specs/0009-find-listings/index.md) · Chọn: đọc danh sách ở máy chủ với tư cách khách, không bộ nhớ đệm (tin bị ẩn biến ngay), mỗi lần vào là một lần gọi API; từ khóa và số trang nằm trong địa chỉ (`?q=` và `?page=`), địa chỉ lạ thì lặng lẽ về trang 1, không chuyển hướng; ô tìm kiếm là biểu mẫu `next/form` gửi bằng Enter hoặc nút, chạy được khi tắt JavaScript; 12 thẻ mỗi trang, thẻ lấy nguyên từ thẻ mẫu và dùng chung (`src/components/listing-card.tsx`, `listing-photo.tsx`), chưa là liên kết cho đến khi #9 truyền địa chỉ; ảnh chưa có thì ảnh thay thế, ảnh lỗi thì ẩn ô ảnh; chỉ trang danh sách thường được lập chỉ mục, trang có từ khóa là `noindex, follow` và bị chặn trong `robots.txt`; không có JSON-LD ở trang này; sitemap và thẻ chia sẻ để #9.

### 9. Listing detail · needs a decision
Trang `/<slug>-<code>`: nội dung tin, địa chỉ, giá, nhà trọ. Số điện thoại chỉ hiện khi đã đăng nhập, khách thấy nút "Đăng nhập để xem số điện thoại". Nếu `slug` trả về khác địa chỉ thì sửa lại thanh địa chỉ. Thư viện ảnh lấy từ `images[]` (tối đa 5 ảnh; chưa có ảnh thì hiện ảnh thay thế, ảnh trả 404 thì ẩn ô ảnh chứ không báo lỗi), dùng chung cách ghép địa chỉ ảnh với #8 (xem AC-12 của spec 0007). Phí và tiện ích được thêm ở Slice 2 (#11). Có metadata và thẻ chia sẻ cho SEO.
**Done when:** khách mở được tin và không thấy số điện thoại, người đã đăng nhập thấy số, tin có ảnh thì xem được thư viện ảnh (chưa có ảnh thì hiện ảnh thay thế), `slug` sai tự sửa trên thanh địa chỉ, tin không còn báo 404 dễ hiểu, metadata và thẻ chia sẻ đầy đủ.
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

### 16. Home page · dropped
Bỏ ngày 2026-10-24: `api-for-frontend.md` không mô tả trang chủ, nên trang tìm tin (#8) là trang gốc. Nội dung cũ giữ lại để có lịch sử.
Trang chủ giới thiệu đặt trước ô tìm kiếm: lời giới thiệu ngắn, ô tìm kiếm nổi bật, tin mới đăng, lời mời đăng ký cho chủ trọ. Khi có trang này, nó thay trang gốc tạm.
**Done when:** trang gốc hiện phần giới thiệu, ô tìm kiếm đưa vào trang kết quả, có lối đi rõ cho khách, người tìm trọ và chủ trọ, tải nhanh trên điện thoại.
- [ ] Build it: `/develop home page`

## Slice 4: Gói và thanh toán thử

### 18. Pricing page
Bảng giá công khai từ `GET /plans`: mỗi gói một thẻ (tên, giá, số tin tối đa, số ngày). Nút "Mua" chỉ cho chủ trọ đã đăng nhập; khách được dẫn đi đăng nhập; người tìm trọ và admin không có nút.
**Done when:** thẻ gói đúng dữ liệu và xếp giá tăng dần, nút Mua đúng theo vai trò, bấm Mua tạo đơn và chuyển sang bước xác nhận đơn.
- [ ] Build it: `/develop pricing page`

## Slice 6: Tài khoản và hoàn thiện

### 29. Location pin on listing detail · dropped
Bỏ ngày 2026-10-24: `api-for-frontend.md` không mô tả bản đồ. Hợp đồng chỉ có hai ô tọa độ không bắt buộc ở biểu mẫu nhà trọ (làm ở #11), và việc tìm quanh một địa điểm đã bị backend bỏ. Nội dung cũ giữ lại để có lịch sử.
Bản đồ nhỏ ở trang chi tiết, hiện đúng một điểm từ tọa độ của nhà trọ. Backend chưa có tìm quanh một vị trí, nên chỉ một điểm, không có bản đồ tìm kiếm. Ẩn cả khối khi nhà trọ chưa có tọa độ. Cần chọn cách hiện bản đồ.
**Done when:** có tọa độ thì hiện bản đồ một điểm, không có thì ẩn cả khối, bản đồ không làm chậm việc tải trang trên điện thoại.
- [ ] Design it (spec): `/architect location pin on listing detail`
