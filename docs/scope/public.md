# Public

Phần dành cho khách và người tìm trọ: tìm tin, xem tin, lưu tin, hồ sơ chủ trọ, bảng giá. Điện thoại trước, cần SEO. Xem [index](index.md) để biết thứ tự toàn bộ.

## Slice 1: Vòng lặp lõi

### 8. Find listings · done
Trang danh sách tin công khai, điện thoại trước: ô tìm kiếm theo từ khóa, thẻ tin (ảnh bìa lấy từ `coverImageUrl`, tiêu đề, giá, diện tích, `fullAddress`), phân trang. Chưa có ảnh bìa thì hiện ảnh thay thế, ảnh trả 404 thì ẩn ô ảnh chứ không báo lỗi. Cách ghép địa chỉ ảnh dùng chung với #9 và #10 (xem AC-12 của spec 0007); mục nào xây trước thì tạo ra nó. Là nơi khách vào đầu tiên và là trang gốc của trang web (hợp đồng không có trang chủ riêng). Có metadata cho SEO.
**Done when:** khách tìm theo từ khóa và chuyển trang được, địa chỉ URL phản ánh tìm kiếm, thẻ tin hiện ảnh bìa thật (chưa có ảnh thì hiện ảnh thay thế, ảnh lỗi thì ẩn ô ảnh), trạng thái trống, lỗi và 429 hiển thị đúng, trang có metadata SEO và dùng mượt trên điện thoại.
- [x] Design it (spec): `/architect find listings`
- [x] Build it: `/develop find listings`
code in `src/features/listing-search/` (`api/get-listings.ts`, `schemas/search-params.ts`, `search-href.ts`, `text.ts`, `components/search-box.tsx`, `components/results-boundary.tsx`, `components/results.tsx`, `components/listings-failure.tsx`), `src/components/listing-card.tsx`, `src/components/listing-photo.tsx`, `src/lib/api/server.ts`, `src/app/(public)/page.tsx`, `src/app/robots.ts`, `src/app/dev/ui/listing-cards.tsx` (các trạng thái của thẻ tin)
  - [x] M1 Sợi chỉ mỏng: đọc `GET /listings` ở máy chủ với tư cách khách (`src/lib/api/server.ts`), bộ phân tích địa chỉ cho `q` và `page`, trang `/` hiện các tin thật kèm liên kết trang thật (AC-1 đến AC-3, AC-5, AC-7, AC-14)
  - [x] M2 Thẻ tin: thẻ dùng chung lấy từ thẻ mẫu, ô ảnh bìa (chưa có ảnh thì ảnh thay thế, ảnh lỗi thì ẩn ô), lưới ba cột, khung chờ mỗi lần đổi từ khóa hoặc trang (AC-6 đến AC-9, AC-15)
  - [x] M3 Tìm kiếm và trạng thái: ô tìm kiếm `next/form`, không có tin, trang quá cuối, lỗi và 429 có nút "Thử lại" (AC-4, AC-10, AC-11)
  - [x] M4 Công cụ tìm kiếm và hoàn thiện: metadata, `robots.txt`, các trạng thái của thẻ trong `/dev/ui`, kiểm ở 320 và 390 px, `npm run check` và `npm run build` (AC-12, AC-13, AC-15, AC-16)
- [ ] Verify it: `/check verify find listings` (bỏ qua theo quyết định của chủ dự án ngày 2026-11-03: chưa chạy `/check verify`, chỉ có các bước tự kiểm của `/develop` ghi trong `verify.md`)
spec [0009](../specs/0009-find-listings/index.md) · Chọn: đọc danh sách ở máy chủ với tư cách khách, không bộ nhớ đệm (tin bị ẩn biến ngay), mỗi lần vào là một lần gọi API; từ khóa và số trang nằm trong địa chỉ (`?q=` và `?page=`), địa chỉ lạ thì lặng lẽ về trang 1, không chuyển hướng; ô tìm kiếm là biểu mẫu `next/form` gửi bằng Enter hoặc nút, chạy được khi tắt JavaScript; 12 thẻ mỗi trang, thẻ lấy nguyên từ thẻ mẫu và dùng chung (`src/components/listing-card.tsx`, `listing-photo.tsx`), chưa là liên kết cho đến khi #9 truyền địa chỉ; ảnh chưa có thì ảnh thay thế, ảnh lỗi thì ẩn ô ảnh; chỉ trang danh sách thường được lập chỉ mục, trang có từ khóa là `noindex, follow` và bị chặn trong `robots.txt`; không có JSON-LD ở trang này; sitemap và thẻ chia sẻ để #9.

### 9. Listing detail
Trang `/<slug>-<code>`: nội dung tin, địa chỉ, giá, nhà trọ. Số điện thoại chỉ hiện khi đã đăng nhập, khách thấy nút "Đăng nhập để xem số điện thoại". Nếu `slug` trả về khác địa chỉ thì sửa lại thanh địa chỉ. Thư viện ảnh lấy từ `images[]` (tối đa 5 ảnh; chưa có ảnh thì hiện ảnh thay thế, ảnh trả 404 thì ẩn ô ảnh chứ không báo lỗi), dùng chung cách ghép địa chỉ ảnh với #8 (xem AC-12 của spec 0007). Phí và tiện ích được thêm ở Slice 2 (#11). Có metadata và thẻ chia sẻ cho SEO.
**Done when:** khách mở được tin và không thấy số điện thoại, người đã đăng nhập thấy số, tin có ảnh thì xem được thư viện ảnh (chưa có ảnh thì hiện ảnh thay thế), `slug` sai tự sửa trên thanh địa chỉ, tin không còn báo 404 dễ hiểu, metadata và thẻ chia sẻ đầy đủ.
- [x] Design it (spec): `/architect listing detail`
- [x] Build it: `/develop listing detail`
code in `src/lib/listing-path.ts`, `src/features/listing-detail/` (`text.ts`, `share-image.ts`, `json-ld.ts`, `metadata.ts`, `api/get-listing.ts`, `api/listing-detail-query.ts`, `components/listing-detail.tsx`, `components/listing-detail-skeleton.tsx`, `components/listing-gallery.tsx`, `components/listing-contact.tsx`, `components/contact-panel.tsx`, `components/contact-view.ts`, `components/guest-view-counter.tsx`, `components/address-fix.tsx`), `src/app/(public)/[slugCode]/` (`page.tsx` có `generateMetadata`, `not-found.tsx`), `src/app/sitemap.ts`, `src/app/robots.ts` (dòng sitemap), `src/features/listing-search/components/results.tsx` (liên kết của thẻ tin), `src/features/listing-search/components/listings-failure.tsx` (thêm `title`), `src/lib/format.ts` (`formatPhone`), `src/app/dev/ui/listing-detail.tsx` (thư viện ảnh, thẻ liên hệ, khung chờ và lỗi)
  - [x] M1 Sợi chỉ mỏng: bộ phân tích địa chỉ `src/lib/listing-path.ts`, đọc tin ở máy chủ với tư cách khách (`getListing`), trang `/[slugCode]` hiện tin thật, kiểm mã rác không gọi API, trang "Không tìm thấy tin này", và thẻ tin ở trang tìm kiếm thành liên kết (AC-1 đến AC-4, AC-12, AC-18)
  - [x] M2 Trang đầy đủ: các khu lấy từ trang mẫu, `formatPhone`, bố cục hai cột, khung chờ, thư viện ảnh (ảnh lớn không cắt, dải ảnh nhỏ), khối báo lỗi khi đọc tin (AC-5, AC-6, AC-13, AC-19, AC-20)
  - [x] M3 Lớp theo người xem: thẻ liên hệ cho khách và cho người đã đăng nhập, các trạng thái lỗi của số điện thoại, đếm lượt xem của khách, sửa `slug` trên thanh địa chỉ (AC-7 đến AC-11)
  - [x] M4 Công cụ tìm kiếm và hoàn thiện: metadata, ảnh chia sẻ, JSON-LD, `sitemap.ts` và dòng sitemap trong `robots.txt`, phần của trang này trong `/dev/ui`, kiểm ở 320 và 390 px, `npm run check` và `npm run build` (AC-14 đến AC-17, AC-20)
- [ ] Verify it: `/check verify listing detail`
spec [0010](../specs/0010-listing-detail/index.md) · Chọn: máy chủ đọc tin với tư cách khách, không bộ nhớ đệm; số điện thoại do trình duyệt thêm cho người đã đăng nhập (khóa truy vấn `["listing-detail", code]`, #14 dùng lại cho `isFavorite`) nên không bao giờ nằm trong HTML; khách thấy nút đăng nhập kèm liên kết đăng ký, chủ tin xem tin của mình thấy dòng "Đây là tin của bạn."; thư viện ảnh là ảnh lớn không cắt (khung 4:3) với dải ảnh nhỏ, vuốt bằng CSS scroll snap, không thêm gói, ảnh lỗi bị bỏ khỏi thư viện; `slug` sai được sửa lặng lẽ bằng `history.replaceState`; tin không còn hiện trang "Không tìm thấy tin này" (trạng thái 200 cộng `noindex`, vì trang phát luồng); thẻ chia sẻ lấy ảnh đầu của tin qua trình tối ưu ảnh (chưa có ảnh thì chỉ có chữ); JSON-LD chỉ có breadcrumb; sitemap đọc tươi mỗi lần, tối đa 20 lần đọc; phí và tiện ích để #11, trái tim để #14, liên kết chủ trọ để #15.

### 13. Search filters and sort · needs a decision
Thêm vào trang tìm tin (#8): chọn phường hoặc xã (từ `GET /wards`, dùng ô chọn phường có tìm kiếm của #32), khoảng giá và kiểu sắp xếp, dùng cùng với ô từ khóa. Hợp đồng (mục 6.19) chỉ có ba thứ này, không có lọc theo diện tích, tiện ích hay tiền cọc, nên không làm những thứ đó. Bộ lọc đóng mở gọn trên điện thoại, đứng cạnh ô tìm kiếm. Spec 0009 để lại hai quyết định cho dòng này: địa chỉ có bộ lọc nào được lập chỉ mục và bị chặn trong `robots.txt`, và cách thêm các trường mới vào bộ phân tích địa chỉ của #8.
**Done when:** lọc theo phường, khoảng giá và sắp xếp chạy cùng từ khóa, địa chỉ URL giữ bộ lọc để chia sẻ được, đổi bộ lọc thì về trang 1, bỏ bộ lọc được, khoảng giá sai (từ lớn hơn đến) báo bằng lời thay vì gọi API, không có kết quả thì có nút xóa bộ lọc, giá trị lạ trong địa chỉ lặng lẽ về mặc định như #8, và dùng mượt trên điện thoại.
- [ ] Design it (spec): `/architect search filters and sort`

## Slice 3: Tìm và gắn bó

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
