# 0016. Bộ lọc và sắp xếp ở trang tìm tin

**Date**: 2026-11-10
**Status**: In Progress

## Summary

Spec này thêm phường, khoảng giá và cách sắp xếp vào trang tìm tin (#8), dùng chung với ô từ khóa. Trên máy tính các ô lọc nằm cùng thẻ tìm kiếm, còn trên điện thoại chỉ có ô từ khóa và nút "Bộ lọc" mở một ngăn trượt từ dưới lên. Bộ lọc chỉ đổi kết quả khi bấm "Tìm trọ" hoặc "Áp dụng", còn sắp xếp là ba liên kết bấm là đổi ngay. Mọi lựa chọn nằm trên địa chỉ nên chia sẻ được, và chỉ trang gốc cùng `?page=N` được lập chỉ mục. Không thêm gói hay biến môi trường nào.

## Requirements

Dựa trên mục #13 của scope, tinh chỉnh cùng kỹ sư. Hợp đồng với backend: `api-for-frontend.md` mục 6.19 (`GET /listings`) và `GET /wards`. Mẫu cần theo: spec 0009 (địa chỉ là trạng thái tìm kiếm, đọc ở máy chủ với tư cách khách, trạng thái kết quả), spec 0015 (ô chọn phường), spec 0001 (danh mục dùng `use cache`, địa chỉ máy chủ chung), spec 0003 và 0004 (thành phần, vùng thẻ trên nền `canvas`), `design.md` (bộ lọc là một vùng trên đầu danh sách, Sheet cho bộ lọc trên điện thoại).

Spec này sửa vài điểm của spec 0009, và 0009 vẫn là bản ghi cách #8 được xây: AC-2 (địa chỉ chỉ có `q` và `page`), AC-3 (tham số khác bị bỏ qua, nay chỉ tham số lạ), AC-4 (form `next/form` nay là form client gửi bằng `router.push`, và liên kết "Xóa tìm kiếm" về `/` nay giữ bộ lọc), AC-10 (lời của trạng thái trống), AC-12 (chỉ mục: nay mọi địa chỉ có bộ lọc hoặc sắp xếp đều `noindex`), AC-13 (thêm dòng cho `robots.txt`), và AC-5, AC-14 (`getListings(q, page)` nhận cả trạng thái).

**User stories**:
- Là người tìm trọ trên điện thoại, tôi muốn chọn phường và khoảng giá rồi xem đúng những phòng hợp, mà không phải cuộn qua một dãy ô trước khi thấy kết quả.
- Là người tìm trọ, tôi muốn đổi thứ tự (mới đăng, giá tăng, giá giảm) bằng một lần chạm, và biết bộ lọc nào đang bật để bỏ từng cái.
- Là người gửi liên kết cho bạn, tôi muốn địa chỉ giữ nguyên bộ lọc để bạn thấy đúng danh sách tôi thấy.
- Là chủ trang web, tôi muốn các tổ hợp bộ lọc không làm cạn giới hạn 300 lần một phút dùng chung, và không bị lập chỉ mục thành vô số trang gần giống nhau.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: Trạng thái trên địa chỉ. Địa chỉ mang sáu tham số: `q`, `wardCode`, `minPrice`, `maxPrice`, `sort`, `page`. `ListingSearch` thành `{ q: string; wardCode: string; minPrice: number | null; maxPrice: number | null; sort: ListingSort; page: number }`, với `ListingSort` là `"newest" | "price_asc" | "price_desc"`, `wardCode` bằng `""` là không lọc phường và giá bằng `null` là không giới hạn. `parseListingSearch` làm sạch từng giá trị, không bao giờ ném lỗi và không bao giờ đòi chuyển hướng: `wardCode` phải đúng 5 chữ số, nếu không là `""` (mã đúng dạng mà không có trong danh mục vẫn được giữ); `minPrice` và `maxPrice` chỉ gồm 1 đến 9 chữ số và có giá trị từ 0 đến 100000000, nếu không là `null`, riêng `minPrice` bằng 0 thành `null` (0 nghĩa là không chặn dưới); `sort` phải là một trong ba giá trị, nếu không là `newest`; `q` và `page` giữ luật của AC-3 spec 0009. Tham số lặp lấy giá trị đầu. Tham số lạ vẫn bị bỏ qua và không bao giờ được gửi đi. Một trạng thái sạch đi qua `listingsHref` rồi `parseListingSearch` cho lại đúng trạng thái đó.
- **AC-2**: Dựng địa chỉ. `listingsHref(search)` chỉ viết giá trị khác mặc định, theo thứ tự `q`, `wardCode`, `minPrice`, `maxPrice`, `sort`, `page`: bỏ `q` rỗng, `wardCode` rỗng, giá `null`, `sort` là `newest` và `page` là 1, nên trang thường vẫn là `/`. Ví dụ: `/?q=tan+dinh&wardCode=26743&minPrice=2000000&maxPrice=4000000&sort=price_asc&page=2` (khoảng trắng của từ khóa viết thành `+`, như `URLSearchParams` làm). Các hàm thuần đổi trạng thái đều trả `page` bằng 1: bỏ phường, bỏ giá, bỏ cả hai (`withoutFilters`, giữ `q` và `sort`), bỏ từ khóa (`withoutKeyword`, giữ bộ lọc và `sort`), đổi `sort` (`withSort`, giữ `q` và bộ lọc). Mọi liên kết và địa chỉ của thanh lọc, thẻ, nút xóa, liên kết sắp xếp, liên kết trang, canonical và khóa khung chờ đều đi qua `listingsHref`.
- **AC-3**: Lần đọc. `listingsQuery(search)` trả `q`, `wardCode`, `minPrice`, `maxPrice`, `sort`, `page`, `pageSize`, trong đó giá trị chưa đặt (`""`, `null`) và `sort` bằng `newest` được bỏ, để `buildUrl` không gửi. Giá `0` ở `maxPrice` vẫn được gửi. `getListings(search)` vẫn đọc ở máy chủ với tư cách khách, không bộ nhớ đệm, trong `<Suspense>` (AC-5, AC-14 của 0009), và vẫn bọc `cache()` của React trên sáu giá trị đơn (`q`, `wardCode`, `minPrice`, `maxPrice`, `sort`, `page`), vì một đối tượng không bao giờ trùng nhau. Lần đọc lại của lớp tim (#14, `ListFavorites`) dùng đúng `listingsQuery(search)` này. Một trạng thái đã làm sạch không bao giờ gây 400, vì trạng thái duy nhất mà API sẽ từ chối (`minPrice` lớn hơn `maxPrice`) không bao giờ đi tới API (AC-4).
- **AC-4**: Khoảng giá ngược. Khi cả hai giá hợp lệ mà `minPrice` lớn hơn `maxPrice` (chỉ đến được bằng địa chỉ gõ tay hoặc liên kết cũ, vì biểu mẫu chặn trước ở AC-8), `Results` không gọi API. Dưới `h2` "Kết quả tìm kiếm" hiện một `Alert` (không phải kiểu `destructive`) có tiêu đề "Khoảng giá chưa hợp lệ", mô tả "Giá từ đang lớn hơn giá đến, nên chưa tìm được. Hãy sửa lại khoảng giá.", và liên kết "Bỏ khoảng giá" (địa chỉ không có hai giá, giữ phần còn lại). Trang trả 200, không có liên kết sắp xếp, không có phân trang. Hai ô giá của thanh vẫn hiện đúng hai số trong địa chỉ để người dùng sửa.
- **AC-5**: Thanh tìm kiếm từ `md` (768 px). Trong thẻ vùng của #8 có ô từ khóa (giữ nguyên các thuộc tính của AC-4 spec 0009), ô chọn phường, hai ô giá "Giá từ" và "Giá đến", nút "Tìm trọ", và dưới đó hàng thẻ bộ lọc đang bật (AC-11). Xếp theo màn mẫu `/dev/ui/screens/listings`: một hàng từ `lg`, hai hàng ở `md` (từ khóa và nút ở hàng trên, phường và hai ô giá ở hàng dưới). Thanh là `role="search"` có tên "Tìm phòng trọ".
- **AC-6**: Thanh tìm kiếm dưới `md`. Thẻ chỉ hiện ô từ khóa chiếm hết bề ngang, dưới nó hai nút bằng nhau "Tìm trọ" và "Bộ lọc" (kiểu viền, có `Badge` số nhóm bộ lọc đang bật, ẩn khi là 0). Ô phường và ô giá không hiện trong thẻ, còn hàng thẻ bộ lọc đang bật (AC-11) vẫn hiện ở mọi bề ngang, ngay dưới hai nút. Bấm "Bộ lọc" mở `Sheet` trượt từ dưới lên (`side="bottom"`), tiêu đề "Bộ lọc", cao tối đa khoảng 85% màn hình và cuộn bên trong. Trong đó có một `<form>` riêng với ô chọn phường và hai ô giá, và chân ngăn có "Xóa bộ lọc" (chỉ hiện khi địa chỉ đang có bộ lọc, bấm là đóng ngăn và bỏ bộ lọc) và "Áp dụng" (gửi form). Đóng ngăn bằng Escape, chạm ra ngoài hay nút đóng thì ba ô lọc về giá trị đang áp dụng (ô từ khóa giữ chữ đã gõ). "Áp dụng" hợp lệ thì đóng ngăn và trả focus về nút "Bộ lọc". "Áp dụng" không hợp lệ thì ngăn vẫn mở và focus vào ô sai đầu tiên. Khi Sheet mở, focus vào tiêu đề của ngăn (`tabIndex={-1}`, qua `onOpenAutoFocus`) chứ không vào ô đầu tiên. Chân ngăn dính đáy vùng nhìn thấy, nội dung cuộn bên trong, chiều cao tối đa tính bằng `dvh`, và ô đang nhận focus được `scrollIntoView({ block: "center" })`, để bàn phím ảo không che ô và nút "Áp dụng" (iOS không có phím Return cho `inputMode="numeric"`, nên nút này phải luôn thấy được). Nếu bề ngang vượt `md` khi Sheet đang mở (xoay màn hình) thì Sheet đóng. Phương án dự phòng nếu bàn phím vẫn che: ngăn từ phải sang cao bằng màn hình.
- **AC-7**: Một bản nháp, áp dụng bằng nút. Một `useForm` của React Hook Form với `zodResolver` giữ bản nháp gồm `q`, `wardCode`, `minPrice` và `maxPrice` (hai giá là chuỗi). Ô từ khóa, các ô lọc nằm trong thẻ và các ô lọc trong Sheet cùng đọc và ghi bản nháp này (Sheet nằm cạnh form của thẻ, không nằm trong nó). Gửi form (Enter ở ô từ khóa hoặc ô giá, "Tìm trọ", "Áp dụng") thì kiểm tra bằng schema Zod. Hợp lệ: nếu `listingsHref` của kết quả đúng bằng địa chỉ hiện tại thì không `router.push`, không đọc API, chỉ đóng Sheet (nếu đang mở); nếu khác thì chạy `router.push(listingsHref(...))` trong `startTransition` với `{ q, wardCode, minPrice, maxPrice, sort: sort đang áp dụng, page: 1 }`, và cờ `isPending` khóa nút "Tìm trọ" và "Áp dụng" cho tới khi xong, để bấm đúp không gửi hai lần. Không hợp lệ: không chuyển trang, không gọi API, hiện lỗi ở ô, rồi `onInvalid` đưa focus về ô sai đầu tiên đang hiện; nếu ô đó là ô lọc mà màn đang dưới `md` (kiểm bằng `matchMedia` lúc có sự kiện) và Sheet đang đóng thì mở Sheet rồi đưa focus vào bản ô đang hiện, để lỗi không nằm trong bản đã ẩn. Hai ô giá kiểm chéo nhau: `minPrice` và `maxPrice` khai `deps` của nhau, nên sửa "Giá từ" sau lỗi ở "Giá đến" thì lỗi được kiểm lại. Không có gì được gửi khi đang gõ hay đang chọn. Thanh không có `key` theo địa chỉ, để focus không rơi về `body` khi thanh bị dựng lại. Thay vào đó bản nháp được đặt lại tại chỗ bằng `form.reset(draftFromSearch(search))` mỗi khi phần `q`, phường và giá của địa chỉ đã làm sạch đổi (nút lùi và tiến, thẻ bỏ bộ lọc, nút xóa), và không đặt lại khi chỉ `sort` hoặc `page` đổi. Đóng Sheet sau một lần gửi hợp lệ cũng không đặt lại ba ô lọc về giá trị cũ. Áp dụng bộ lọc giữ `sort` đang chọn.
- **AC-8**: Hai ô giá. Mỗi ô là `Input` `size="lg"`, `type="text"`, `inputMode="numeric"`, `autoComplete="off"`, `maxLength={9}`, `enterKeyHint="search"`, có tên "Giá từ" và "Giá đến", nhãn nhìn thấy, và cả hai nằm trong một `fieldset` có `legend` nhìn thấy "Giá thuê mỗi tháng (₫)". Khi chữ trong ô là một số nguyên từ 0 đến 100000000, dưới ô hiện dòng đọc số bằng `formatMoney` (ví dụ "2.000.000 ₫"), nối với ô bằng `aria-describedby`, không phải vùng đọc tự động. Ô trống là không giới hạn, và `minPrice` bằng 0 là hợp lệ (áp dụng xong thì ô trống). Chữ trong ô được cắt khoảng trắng hai đầu rồi mới kiểm và chỉ nhận chữ số, nên dán "2.000.000" (dạng mà dòng đọc số hiện) vẫn báo lỗi. Lỗi chỉ hiện sau lần gửi đầu tiên, rồi cập nhật khi gõ: không phải chữ số "Chỉ nhập chữ số, không dấu chấm hay khoảng trắng, ví dụ 2000000."; lớn hơn giới hạn "Giá tối đa là 100.000.000 ₫." (số lấy từ `formatMoney(MAX_PRICE)`); cả hai hợp lệ mà từ lớn hơn đến thì lỗi ở ô "Giá đến": "Giá đến phải lớn hơn hoặc bằng giá từ.". Lỗi nối với ô bằng `FormField` (`aria-invalid`, `aria-describedby`).
- **AC-9**: Ô phường. Dùng `WardPicker` của spec 0015 với `allLabel="Tất cả phường, xã"` và `size="lg"`, nhãn nhìn thấy "Phường, xã". Giá trị là `wardCode` của bản nháp, `onChange` ghi vào bản nháp, chọn dòng "Tất cả phường, xã" ghi `""`. Nhận danh mục đã đọc ở máy chủ qua prop `initialWards` (AC-10), nên nút hiện sẵn tên phường ngay lần vẽ đầu của một địa chỉ có `wardCode`. Không có danh mục từ máy chủ thì ô tự tải ở trình duyệt, kèm trạng thái đang tải và lỗi của 0015. Mã không có trong danh mục hiện "Mã {code} (không có trong danh sách)" (AC-12 của 0015). Hai ô chọn phường có thể cùng có mặt (một trong thẻ, ẩn dưới `md` bằng CSS, và một trong Sheet khi Sheet đang mở) và cùng ghi vào một bản nháp. Trong Sheet, hộp nổi của ô chọn phường được gắn vào chính phần tử nội dung của Sheet (prop `portalContainer` của `WardPicker`, truyền xuống `PopoverContent`), để việc khóa cuộn của Radix Dialog không chặn danh sách 168 dòng khi cuộn bằng cảm ứng; ngoài Sheet thì gắn vào `body` như mặc định.
- **AC-10**: Danh mục phường ở máy chủ. `getWards()` ở `src/features/wards/api/get-wards.ts` dùng `use cache` với `cacheLife('hours')` và `cacheTag('catalog')` (đúng bảng bộ nhớ đệm của spec 0001), đọc `GET /wards` bằng `serverGet` với tư cách khách. Một thành phần máy chủ bất đồng bộ đọc nó rồi vẽ thanh tìm kiếm (thành phần client) với danh mục là prop. Khi chạy thật, một lần đọc lỗi (một `ApiError`) không làm hỏng trang: truyền `undefined` và ô chọn tự tải; thứ gì không phải `ApiError` thì ném tiếp. Khi đang dựng (`process.env.NEXT_PHASE` là `phase-production-build`) mọi lỗi đều được ném tiếp, để `npm run build` khi tắt API thất bại thay vì đóng một danh mục rỗng vào khung tĩnh, nơi nó không tự lành cho tới lần dựng sau (việc kiểm mà spec 0001 đã hẹn cho tính năng đầu tiên thêm `use cache`). Hàm ném lỗi nên một lần đọc lỗi không được ghi nhớ. `getWards` có giới hạn thời gian 3 giây, ngắn hơn 10 giây của `serverGet` (thêm một tùy chọn thời gian cho `serverGet` nếu chưa có), để một API bị treo không giữ thanh ở khung dự phòng lâu.
- **AC-11**: Thẻ bộ lọc đang bật. Dưới các ô trong thẻ, một danh sách (`ul` có tên "Bộ lọc đang bật") có một thẻ cho mỗi nhóm đang bật, đọc từ địa chỉ đã làm sạch (không phải bản nháp). Thẻ phường: tên phường theo danh mục, hoặc "Mã {code} (không có trong danh sách)" khi danh mục đã có mà thiếu mã đó, hoặc "Mã {code}" khi chưa có danh mục. Danh mục lấy từ một lần gọi `useWards(initialWards)` trong thanh, dùng chung cho thẻ và cả hai ô chọn, nên thẻ tự đổi từ "Mã {code}" sang tên khi danh mục ở trình duyệt về. Thẻ giá: cả hai đầu "{formatMoney(min)} đến {formatMoney(max)}", chỉ đầu dưới "Từ {formatMoney(min)}", chỉ đầu trên "Đến {formatMoney(max)}". Thẻ phường đứng trước thẻ giá. Mỗi thẻ là một liên kết có biểu tượng đóng, trỏ tới địa chỉ không có nhóm đó (trang 1), tên đọc cho trình đọc màn hình là "Bỏ lọc {chữ của thẻ}". Khi có cả hai nhóm, sau các thẻ có liên kết "Xóa bộ lọc" tới địa chỉ không có cả hai. Không có nhóm nào thì không có hàng này. Từ khóa và sắp xếp không phải thẻ.
- **AC-12**: Các nút xóa. "Xóa bộ lọc" (ở hàng thẻ, chân Sheet, trạng thái trống) chỉ bỏ phường và giá, giữ `q` và `sort`. "Xóa tìm kiếm" (cạnh ô từ khóa, trạng thái trống) chỉ bỏ `q`, giữ phường, giá và `sort` (đổi AC-4 spec 0009, nơi liên kết này về `/`). Tất cả là liên kết thật dùng các hàm thuần của AC-2 và đưa về trang 1.
- **AC-13**: Sắp xếp. Trong `Results`, cùng hàng với `h2` (xuống dòng khi hẹp) có `nav` tên "Sắp xếp" với ba liên kết "Mới đăng trước", "Giá tăng dần", "Giá giảm dần" tương ứng `newest`, `price_asc`, `price_desc`. Liên kết đang chọn có `aria-current="true"` và dáng đã chọn không chỉ dựa vào màu: chữ đậm 600 (`font-semibold`) cộng gạch chân. Mỗi `href` là `listingsHref(withSort(search, sort))`, nên giữ từ khóa và bộ lọc, về trang 1. Chỉ hiện khi trang có tin. Vùng bấm cao ít nhất 44 px dưới `md`. Là liên kết thật nên không cần JavaScript để bấm.
- **AC-14**: Các trạng thái của kết quả. Tiêu đề "N tin phù hợp" (và ` với “q”` khi có từ khóa) giữ nguyên, không có chữ nào về bộ lọc vì đã có các thẻ. Không có tin: tiêu đề "Không có tin nào phù hợp", lời mô tả theo thứ đang đặt, chỉ từ khóa "Thử đổi từ khóa để xem thêm phòng.", chỉ bộ lọc "Thử bỏ bớt bộ lọc để xem thêm phòng.", cả hai "Thử đổi từ khóa hoặc bỏ bớt bộ lọc để xem thêm phòng."; nút "Xóa bộ lọc" khi có nhóm đang bật và "Xóa tìm kiếm" khi có từ khóa, mỗi nút chỉ hiện khi đúng. Khi không có từ khóa lẫn bộ lọc (kể cả sắp xếp khác mặc định) thì vẫn là "Chưa có tin nào được đăng" và không nút. Trang quá cuối: "Trang này không có tin" với "Xem trang cuối" tới trang cuối của cùng bộ lọc, và các liên kết trang giữ bộ lọc. 429 và lỗi khác như AC-11 của 0009, thanh tìm kiếm vẫn dùng được. Khoảng giá ngược: AC-4.
- **AC-15**: Khung chờ. Mỗi lần áp dụng, bấm thẻ bỏ bộ lọc, bấm nút xóa, bấm liên kết sắp xếp hay liên kết trang đều hiện `LoadingState variant="cards"` cho tới khi kết quả mới về, và kết quả cũ không nằm lại. `ResultsBoundary` lấy khóa từ `listingsHref` của trạng thái đầy đủ. Sau mỗi lần chuyển trong chỗ (áp dụng, thẻ, nút xóa, liên kết sắp xếp, liên kết trang) focus về `h2` của kết quả (`tabIndex={-1}`), vì khung chờ có khóa làm mất liên kết vừa bấm và focus sẽ rơi về `body`; không làm vậy khi tải trang lần đầu hay tải lại (cách nhận biết để `/develop` chọn, ví dụ một cờ đặt khi bắt đầu chuyển). Việc này sửa luôn khoảng trống cũ ở liên kết trang của #8.
- **AC-16**: Metadata và chỉ mục. `generateMetadata` đọc chỉ trạng thái đã làm sạch và không gọi API. Trang thường (không `q`, không phường, không giá, `sort` là `newest`): giữ AC-12 của 0009, được lập chỉ mục (kể cả `?page=N`). Mọi địa chỉ có `q`, phường, giá hoặc `sort` khác `newest`: `robots` là `noindex, follow`, canonical là chính địa chỉ đã làm sạch. Có `q` thì tiêu đề và mô tả như 0009 (`Kết quả cho “q”`). Không có `q` mà có bộ lọc hoặc sắp xếp thì tiêu đề "Kết quả lọc phòng trọ" (thêm ", trang N" khi trang trên 1) và mô tả "Danh sách phòng trọ đã lọc hoặc sắp xếp trên {SITE_NAME}.". Open Graph theo cùng tiêu đề, mô tả và địa chỉ. Tên phường không dùng trong metadata.
- **AC-17**: `robots.txt`. `src/app/robots.ts` thêm tám dòng `Disallow`, hai dòng cho mỗi tham số mới, cùng kiểu với `/*?q=` và `/*&q=`: `/*?wardCode=`, `/*&wardCode=`, `/*?minPrice=`, `/*&minPrice=`, `/*?maxPrice=`, `/*&maxPrice=`, `/*?sort=`, `/*&sort=`. Các dòng cũ giữ nguyên, và `?page=N` vẫn được vào.
- **AC-18**: Bản dự phòng và khi tắt JavaScript. Phần dự phòng của `<Suspense>` quanh thanh (lần vào đầu tiên, và khi tắt JavaScript) là form GET thường của #8 (ô từ khóa và nút "Tìm trọ", `action="/"`), cộng các khối giữ chỗ `Skeleton` cùng cỡ với các ô lọc (từ `md`: hàng phường và giá; dưới `md`: nút "Bộ lọc"), để thẻ không đổi chiều cao khi thanh thật thay vào. Khi tắt JavaScript thì ô lọc, Sheet và thẻ không có; ô từ khóa vẫn gửi được, liên kết sắp xếp vẫn là liên kết, còn kết quả vẫn ẩn cho tới khi có script (khoảng trống đã biết của spec 0009, spec này không sửa).
- **AC-19**: Trợ năng (WCAG AA). Mỗi ô có tên: "Từ khóa: tên đường, phường hoặc tiêu đề tin", "Phường, xã", "Giá từ", "Giá đến". Lỗi nối với ô bằng `aria-invalid` và `aria-describedby`. Sheet có tiêu đề "Bộ lọc", một mô tả chỉ cho trình đọc màn hình ("Chọn phường và khoảng giá cho tin cần tìm."), khóa focus bên trong, Escape đóng, và trả focus về nút "Bộ lọc". Nút "Bộ lọc" có tên "Bộ lọc, N đang bật" khi N lớn hơn 0. Danh sách thẻ có tên, `nav` sắp xếp có tên và `aria-current`. Tiêu đề kết quả vẫn là vùng đọc lịch sự và đọc số mới một lần. Vòng focus lấy từ `FOCUS_RING`. Thứ tự đầu mục vẫn `h1`, `h2`, `h3`.
- **AC-20**: Bố cục. Ở 320 px không cuộn ngang. Mọi ô và nút `size="lg"` (cao 44 px) ở mọi bề ngang, chữ nhập 16 px. Thẻ bộ lọc và liên kết sắp xếp cao ít nhất 44 px dưới `md`. Hai ô giá nằm hai cột khi mỗi ô rộng ít nhất 140 px, nếu không thì một cột, và lời lỗi xuống dòng chứ không bị cắt. Chỉ dùng màu có tên (token), mọi cặp màu chữ hoặc ô mới thêm vào `PAIRS` của `scripts/check-contrast.mjs` trong cùng thay đổi. Thanh nằm trong thẻ vùng của #8, các thẻ tin vẫn nằm thẳng trên nền `canvas`. Sheet cuộn bên trong khi cao hơn cửa sổ (`design.md`).
- **AC-21**: Mẫu xem thử. `/dev/ui` có phần "Bộ lọc tìm tin" trên dữ liệu giả, không gọi mạng: thanh không có bộ lọc, thanh có bộ lọc và thẻ, ô giá có lỗi, Sheet mở (ô phường đóng và mở), thông báo khoảng giá ngược, ba liên kết sắp xếp với từng cái đang chọn, trạng thái trống có bộ lọc. Dữ liệu giả nằm ở `search-filters-sample.ts` cạnh phần đó (bỏ qua được nếu hết giờ).
- **AC-22**: Bản dựng sạch và số lần gọi. `npm run check` và `npm run build` đều qua. Không có cảnh báo hydration và không có lỗi console ở `/`, `/?wardCode=26743`, `/?minPrice=2000000&maxPrice=1000000`, `/?sort=price_desc&page=2`. Không có `any`. Mở một trang là đúng một lần đọc `GET /listings` ở máy chủ, và khách không gọi API nào từ trình duyệt cho danh sách (cho danh mục phường cũng không, khi máy chủ đã đọc được nó; nếu không thì ô chọn tự gọi `GET /wards`). Các liên kết sắp xếp và thẻ bỏ bộ lọc không gây lần đọc danh sách nào khi chúng hiện vào tầm nhìn. Kiểm bằng `next build` rồi `next start` và đếm `GET /listings` trong nhật ký API, vì `next dev` không bao giờ tải trước; nếu có lần đọc thì đặt `prefetch={false}`.

## Decision

**Chosen option**: Option 1: Trạng thái nằm trên địa chỉ, bộ lọc là một form client có bản nháp và nút áp dụng, sắp xếp và thẻ bỏ bộ lọc là liên kết thật

Máy chủ vẫn đọc danh sách với tư cách khách và không bộ nhớ đệm như #8. Chỉ danh mục phường (dữ liệu gần như không đổi) được ghi nhớ ở máy chủ theo spec 0001. Một hàm làm sạch và một hàm dựng địa chỉ sở hữu toàn bộ trạng thái.

**Implementation skills**: `zod` (`pproenca/dot-skills`, `.agents/skills/zod/`) · `react-hook-form` (`pproenca/dot-skills`, `.agents/skills/react-hook-form/`) · `shadcn` (`shadcn-ui/ui`, `.agents/skills/shadcn/`) · `tailwind-design-system` (`wshobson/agents`, `.agents/skills/tailwind-design-system/`) · `next-dev-loop` (`vercel/next.js`, `.agents/skills/next-dev-loop/`)

Tài liệu Next.js trong `node_modules/next/dist/docs/` thắng các skill khi chúng khác nhau (luật của `AGENTS.md`). Đọc các trang về `use cache`, `cacheLife`, `cacheTag`, `Link` (tải trước), `useSearchParams` và `generateMetadata` trước khi viết mã. Không tìm thêm skill hay máy chủ MCP vì không chọn công cụ mới.

Các lựa chọn đã chốt cùng kỹ sư (chi tiết và phương án thay thế ở `rationale.md`):
- Bộ lọc chung thẻ với ô tìm kiếm, Sheet từ dưới lên dưới `md` (AC-5, AC-6).
- Có nút áp dụng, không áp dụng ngay (AC-7).
- Khoảng giá là hai ô số "Giá từ" và "Giá đến", chỉ nhận chữ số kèm dòng đọc số (AC-8).
- Bộ lọc cần JavaScript, giữ như #8 cho ô từ khóa (AC-18).
- Sắp xếp là ba liên kết trên đầu kết quả (AC-13).
- Tên tham số đúng tên của API (AC-1).
- Chỉ mục: chỉ trang thường và `?page=N`, mọi địa chỉ có `q`, bộ lọc hoặc sắp xếp là `noindex` và bị chặn (AC-16, AC-17).
- Thẻ bỏ bộ lọc và nút "Xóa bộ lọc" chỉ xóa phường và giá (AC-11, AC-12).
- Ngữ pháp địa chỉ ở AC-1 và AC-2 đã được kỹ sư xác nhận.

## Feature design

**Data model sketch**: không có bảng, không lưu gì ở trình duyệt. Có ba hình dạng:

```ts
// Trạng thái tìm kiếm, thứ duy nhất địa chỉ mang.
// src/features/listing-search/schemas/search-params.ts
export const MAX_PRICE = 100_000_000; // hợp đồng 6.19
export const LISTING_SORTS = ["newest", "price_asc", "price_desc"] as const;
export type ListingSort = (typeof LISTING_SORTS)[number];
export type ListingSearch = {
  q: string; // như spec 0009
  wardCode: string; // 5 chữ số, "" là không lọc
  minPrice: number | null; // 1 đến 100000000, null là không chặn dưới
  maxPrice: number | null; // 0 đến 100000000, null là không chặn trên
  sort: ListingSort; // mặc định "newest"
  page: number; // như spec 0009
};

// Bản nháp của form (chuỗi, đúng thứ ô đang giữ), và kết quả sau khi Zod kiểm.
// src/features/listing-search/filter-form.ts
export type FilterFormInput = {
  q: string;
  wardCode: string;
  minPrice: string;
  maxPrice: string;
};
// FilterFormValues: q đã làm sạch, wardCode, minPrice và maxPrice là number | null.
```

Câu trả lời vẫn là `Page<PublicListingSummary>` có sẵn trong `src/lib/api/types.ts`. Danh mục phường dùng kiểu `Ward` có sẵn. Không cần kiểu API mới.

**State of the results area** (theo địa chỉ): như spec 0009 (`loading`, `results`, `empty`, `past last`, `failed`) cộng một trạng thái `invalid range` (AC-4), không có lần đọc API nào, nhưng khung chờ vẫn hiện cho tới khi máy chủ trả lời trang.

**State of the bar**:
- Bản nháp: bằng giá trị đang áp dụng khi mới vẽ (và được đặt lại tại chỗ mỗi khi phần `q`, phường, giá của địa chỉ đổi, AC-7), đổi khi gõ hoặc chọn. Gửi hợp lệ chuyển địa chỉ, gửi không hợp lệ giữ nguyên bản nháp và hiện lỗi.
- Sheet: đóng, mở. Đóng không áp dụng thì ba ô lọc về giá trị đang áp dụng, ô từ khóa giữ nguyên.

**API surface**:

| Endpoint | Method | Key inputs | Key outputs used | Auth | Key errors |
|---|---|---|---|---|---|
| `/listings` | GET | `q`, `wardCode`, `minPrice`, `maxPrice`, `sort` (mỗi cái chỉ khi có đặt), `page`, `pageSize=12` | `items[]`, `total`, `page`, `pageSize` | không (máy chủ, tư cách khách) | 429 `RATE_LIMITED`; 5xx; `TIMEOUT`, `NETWORK_ERROR`, `INVALID_RESPONSE`. 400 không thể xảy ra từ trạng thái đã làm sạch |
| `/wards` | GET | không | mảng `Ward` | không (máy chủ, `use cache`) | mọi `ApiError` đi vào đường dự phòng của AC-10 |

Đường dẫn của frontend: chỉ `/` (`src/app/(public)/page.tsx`) và `/robots.txt`. Không có đường dẫn mới.

**Value sourcing** (every value each action produces, computes, or displays names where it comes from):

| Action | Value produced / displayed | Source |
|---|---|---|
| Đọc danh sách | `wardCode`, `minPrice`, `maxPrice` gửi đi | trạng thái đã làm sạch của `parseListingSearch` (AC-1), bỏ khi chưa đặt |
| Đọc danh sách | `sort` gửi đi | `sort` đã làm sạch, bỏ khi là `newest` |
| Đọc danh sách | `pageSize` | hằng `LISTING_PAGE_SIZE` (12) của spec 0009 |
| Áp dụng | địa chỉ mới | giá trị của form sau khi Zod kiểm, `sort` của địa chỉ đang áp dụng, `page` là 1 |
| Áp dụng | `q` | ô từ khóa, làm sạch bằng đúng luật `q` của bộ phân tích |
| Ô giá | dòng đọc số | `formatMoney` của số đang gõ |
| Ô giá | giới hạn 9 chữ số và 100000000 | hằng `MAX_PRICE` (hợp đồng 6.19) |
| Ô giá | lời lỗi | các chuỗi trong `text.ts`; giới hạn dùng `formatMoney(MAX_PRICE)` |
| Ô phường | các dòng và tên trên nút | `GET /wards` do `getWards()` đọc ở máy chủ (prop `initialWards`), hoặc lần đọc ở trình duyệt của spec 0015 |
| Thẻ phường | chữ của thẻ | mục danh mục có `code` bằng `wardCode`; thiếu thì "Mã {code} (không có trong danh sách)" (đã có danh mục) hoặc "Mã {code}" (chưa có) |
| Thẻ giá | chữ của thẻ | `formatMoney` của `minPrice` và `maxPrice` |
| Nút "Bộ lọc" | số trên huy hiệu | số nhóm đang bật trong trạng thái đã làm sạch (phường, giá: 0 đến 2) |
| Thẻ, nút xóa, liên kết sắp xếp, liên kết trang | địa chỉ | `listingsHref` của trạng thái đã đổi bằng hàm thuần ở AC-2, `page` là 1 (liên kết trang giữ số trang của nó) |
| Liên kết sắp xếp | cái nào đang chọn | `sort` đã làm sạch |
| Trạng thái trống | lời mô tả và nút nào hiện | `q` có đặt không, và có nhóm phường hoặc giá đang bật không |
| Thông báo khoảng giá ngược | có hiện không | cả hai giá khác `null` và `minPrice` lớn hơn `maxPrice` |
| Tiêu đề tab, mô tả, canonical, `robots` | chữ, địa chỉ, có `noindex` không | trạng thái đã làm sạch, chữ cố định ở AC-16, `NEXT_PUBLIC_SITE_URL` qua `metadataBase` |
| Đặt lại bản nháp | khi nào | phần `q`, `wardCode`, `minPrice`, `maxPrice` của trạng thái đã làm sạch đổi (không tính `sort` và `page`) |
| Khung chờ | khi nào đặt lại | cùng `listingsHref(search)` |
| Tiêu đề kết quả | N | `total` của câu trả lời |

**Key invariants**:
- Địa chỉ chỉ mang sáu tham số. Mọi thay đổi trạng thái (áp dụng, thẻ, nút xóa, sắp xếp) trả về trang 1; chỉ liên kết trang giữ số trang.
- API không bao giờ nhận giá trị ngoài hợp đồng, không bao giờ nhận `minPrice` lớn hơn `maxPrice` (trang bỏ qua lần đọc ở trạng thái đó), và không nhận tham số nó không biết (tham số lạ là 400).
- Sắp xếp không phải bộ lọc: không có thẻ, không tính vào số trên nút, không bị "Xóa bộ lọc" xóa; áp dụng bộ lọc giữ nó, liên kết sắp xếp giữ bộ lọc.
- Giá trị của ô phường luôn là mã 5 chữ số hoặc `""`, không bao giờ là tên.
- Thẻ và nút xóa phản ánh địa chỉ đang áp dụng, không phải bản nháp.
- Máy chủ không giữ token, nên danh sách giống nhau cho mọi người. Bộ nhớ đệm chỉ giữ danh mục phường công khai.

**Security model**: trang công khai, không đăng nhập. Mọi giá trị trên địa chỉ được làm sạch bằng một hàm thuần, và đều là chữ số hoặc giá trị trong danh sách đóng (trừ từ khóa, vốn đã là chữ thuần như 0009). Tên phường và từ khóa chỉ được vẽ như chữ (React tự thoát ký tự), không bao giờ là HTML. Giới hạn: `GET /listings` cho 300 lần một phút dùng chung cho mọi lần dựng ở máy chủ (spec 0001); mỗi lần áp dụng, bấm thẻ hoặc bấm liên kết sắp xếp là một lần đọc, và `robots.txt` chặn mọi tổ hợp để trình thu thập không tiêu hết giới hạn. Không có dữ liệu bị quản lý theo luật.

**Configuration required**: không có biến môi trường mới và không có gói mới (`react-hook-form`, `@hookform/resolvers`, `zod` và `Sheet` đã có; gói `cmdk` đi cùng spec 0015). Thanh này cần ô chọn phường của spec 0015 (#32), và `WardPicker` phải nhận hai prop mới `initialWards` và `portalContainer` (xem Follow-up).

**Where the code goes** (tên là bắt buộc cho các hàm thuần và `getWards`, tự do cho phần còn lại):

| Path | Gì |
|---|---|
| `src/features/listing-search/schemas/search-params.ts` | `MAX_PRICE`, `LISTING_SORTS`, `ListingSort`, `ListingSearch` và `parseListingSearch` (mở rộng), `searchFromParams` (đọc từ `URLSearchParams`, dùng chung cho thanh và khung chờ) |
| `src/features/listing-search/search-href.ts` | `listingsHref` (mở rộng), `withoutWard`, `withoutPrice`, `withoutFilters`, `withoutKeyword`, `withSort` |
| `src/features/listing-search/filter-form.ts` | schema Zod của form, `FilterFormInput`, `draftFromSearch`, `searchFromFilterForm` (hàm thuần) |
| `src/features/listing-search/filter-chips.ts` | các nhóm đang bật và chữ của từng thẻ (hàm thuần) |
| `src/features/listing-search/api/get-listings.ts` | `listingsQuery(search)`, `getListings(search)` |
| `src/features/wards/api/get-wards.ts` | `getWards()` với `use cache` (thư mục `src/features/wards` do spec 0015 tạo) |
| `src/features/listing-search/components/search-box.tsx` | thanh sống (client): form, bản nháp, ô từ khóa, nút "Tìm trọ" và "Bộ lọc", liên kết "Xóa tìm kiếm"; kèm `SearchBoxFallback` |
| `src/features/listing-search/components/filter-fields.tsx`, `price-fields.tsx` | ô phường và hai ô giá, dùng chung cho thẻ và Sheet |
| `src/features/listing-search/components/filter-sheet.tsx`, `filter-chips.tsx` | Sheet từ dưới lên và hàng thẻ bộ lọc đang bật |
| `src/features/listing-search/components/sort-links.tsx`, `price-range-notice.tsx` | ba liên kết sắp xếp và thông báo khoảng giá ngược (máy chủ) |
| `src/features/listing-search/components/results.tsx`, `results-boundary.tsx` | mở rộng: đọc cả trạng thái, bỏ qua lần đọc khi giá ngược, sắp xếp, trạng thái trống, khóa khung chờ, đưa focus về `h2` kết quả sau mỗi lần chuyển trong chỗ |
| `src/features/listing-search/text.ts` | chữ mới: lỗi giá, tiêu đề và mô tả cho trang đã lọc, lời trống |
| `src/app/(public)/page.tsx` | `generateMetadata` và thành phần máy chủ bất đồng bộ đọc danh mục phường |
| `src/app/robots.ts` | tám dòng mới |
| `src/app/dev/ui/search-filters.tsx`, `search-filters-sample.ts` | phần xem thử (AC-21), gắn vào `src/app/dev/ui/page.tsx` |

**Critical test scenarios** (each maps to an acceptance criterion in ## Requirements):
- Đường chính: mở `/`, chọn "Phường Bến Thành", gõ 2000000 và 4000000, bấm "Tìm trọ": địa chỉ thành `/?wardCode=26743&minPrice=2000000&maxPrice=4000000`, khung chờ hiện, rồi chỉ những tin của phường đó trong khoảng giá, tiêu đề đúng số, hai thẻ bỏ bộ lọc hiện, verifies **AC-1**, **AC-2**, **AC-3**, **AC-7**, **AC-11**, **AC-15**.
- Điện thoại 320 và 390 px: thẻ chỉ có ô từ khóa, "Tìm trọ", "Bộ lọc"; mở Sheet, chọn phường, gõ giá, "Áp dụng": Sheet đóng, focus về nút "Bộ lọc", huy hiệu hiện 2; bàn phím ảo không che nút "Áp dụng", verifies **AC-6**, **AC-19**, **AC-20**.
- Khoảng giá ngược trong biểu mẫu: gõ từ 5000000, đến 2000000, bấm "Tìm trọ": không đổi địa chỉ, không gọi API, lỗi dưới "Giá đến", focus vào đó, verifies **AC-7**, **AC-8**.
- Khoảng giá ngược gõ tay: mở `/?minPrice=5000000&maxPrice=2000000`: trả 200, thông báo "Khoảng giá chưa hợp lệ", không lần đọc `GET /listings` nào, hai ô giữ 5000000 và 2000000, `noindex`, "Bỏ khoảng giá" về `/`, verifies **AC-4**, **AC-16**.
- Địa chỉ lạ: `/?wardCode=abc`, `/?minPrice=-5`, `/?maxPrice=1e6`, `/?minPrice=9999999999`, `/?sort=hot` đều trả 200 như không có tham số đó, không chuyển hướng; `/?minPrice=0` coi như không chặn dưới; `/?wardCode=99999` cho "Không có tin nào phù hợp" và thẻ "Mã 99999 (không có trong danh sách)", verifies **AC-1**, **AC-11**, **AC-14**.
- Sắp xếp: bấm "Giá tăng dần" khi đang lọc phường và trang 3: địa chỉ giữ `wardCode`, thêm `sort=price_asc`, bỏ `page`, giá tăng dần từ trên xuống; áp dụng thêm một khoảng giá thì `sort` vẫn còn, verifies **AC-7**, **AC-13**.
- Nút xóa: có từ khóa, phường và giá; "Xóa bộ lọc" bỏ phường và giá, giữ từ khóa và sắp xếp; "Xóa tìm kiếm" bỏ từ khóa, giữ phần còn lại, verifies **AC-12**.
- Không có tin: phường và khoảng giá không khớp tin nào cho "Thử bỏ bớt bộ lọc để xem thêm phòng." và nút "Xóa bộ lọc"; thêm từ khóa thì có cả "Xóa tìm kiếm"; `/?wardCode=26743&page=99` cho "Trang này không có tin" và "Xem trang cuối" giữ phường, verifies **AC-14**.
- Chỉ mục: `/` và `/?page=2` có thẻ cho lập chỉ mục; `/?sort=price_asc`, `/?wardCode=26743`, `/?minPrice=1000000` có `noindex, follow` và canonical là chính nó; `/robots.txt` có đủ dòng của AC-17, verifies **AC-16**, **AC-17**.
- Danh mục phường: mở `/?wardCode=26743`: nút phường hiện sẵn "Phường Bến Thành" ở lần vẽ đầu, không chữ "Đang tải danh sách"; tắt API rồi mở lại: trang vẫn chạy và ô chọn tự tải; `npm run build` khi tắt API thất bại, verifies **AC-9**, **AC-10**.
- Tắt JavaScript: ô từ khóa vẫn gửi được, các khối giữ chỗ không đổi chiều cao thẻ, liên kết sắp xếp là liên kết, kết quả vẫn ẩn (khoảng trống đã biết), verifies **AC-18**.
- Số lần gọi: mở một trang lọc là đúng một lần đọc danh sách ở máy chủ, khách không gọi API từ trình duyệt, và các liên kết sắp xếp và thẻ không gây lần đọc nào khi hiện vào tầm nhìn (đo trên bản `next build` rồi `next start`), verifies **AC-22**.

## Build plan

Theo Tracer Bullet (mặc định của dự án, `AGENTS.md`): một sợi chỉ mỏng nhưng thật đi qua mọi tầng trước, rồi dày lên. M1 làm toàn bộ phía máy chủ và các liên kết, kiểm bằng địa chỉ gõ tay, không cần chờ #32. Chỉ M2 phụ thuộc ô chọn phường của spec 0015.

**M1, sợi chỉ mỏng: địa chỉ đến API đến kết quả, và sắp xếp**
1. Mở rộng `search-params.ts` (`ListingSearch`, `MAX_PRICE`, `LISTING_SORTS`, `parseListingSearch`, `searchFromParams`) và `search-href.ts` (`listingsHref` cùng các hàm đổi trạng thái), cả hai thuần và gọi được thẳng bằng Node khi kiểm, satisfies **AC-1**, **AC-2**
2. `listingsQuery(search)` và `getListings(search)` (bọc `cache()` trên sáu giá trị đơn); `Results` đọc cả trạng thái, bỏ qua lần đọc và hiện thông báo khi giá ngược, liên kết trang và "Xem trang cuối" giữ bộ lọc; `ResultsBoundary` lấy khóa từ trạng thái đầy đủ và đưa focus về `h2` kết quả sau mỗi lần chuyển trong chỗ; các lời trống theo AC-14. `/?wardCode=…&minPrice=…&sort=…` gõ tay trả tin thật đã lọc, satisfies **AC-3**, **AC-4**, **AC-14**, **AC-15**
3. `SortLinks` trong `Results`, satisfies **AC-13**
4. `generateMetadata` (noindex, canonical, tiêu đề và mô tả cho trang đã lọc) và tám dòng của `robots.ts`, satisfies **AC-16**, **AC-17**

**M2, thanh tìm kiếm trên máy tính** (cần #32 xong; nếu chưa có `initialWards` thì thêm vào `WardPicker` và `useWards` ở bước này)
5. `getWards()` với `use cache`, `cacheLife('hours')`, `cacheTag('catalog')` và giới hạn 3 giây, thành phần máy chủ đọc nó và truyền `initialWards` (nuốt `ApiError` khi chạy thật, ném tiếp khi `NEXT_PHASE` là `phase-production-build`); kiểm `npm run build` khi tắt API thì thất bại thay vì đóng một danh mục rỗng vào khung tĩnh (spec 0001, verify), satisfies **AC-10**
6. `filter-form.ts` (schema Zod, `draftFromSearch`, `searchFromFilterForm`) và các chuỗi trong `text.ts`, satisfies **AC-7**, **AC-8**
7. Thanh sống từ `md`: một `useForm` (hai ô giá khai `deps` của nhau), ô từ khóa, `WardPicker` (một lần `useWards(initialWards)` dùng chung), hai ô giá trong `fieldset` với dòng đọc số, "Tìm trọ", gửi hợp lệ thì `router.push` (bỏ qua khi cùng địa chỉ, `isPending` khóa nút), đặt lại bản nháp tại chỗ khi phần `q`, phường, giá của địa chỉ đổi (không dùng `key`); `SearchBoxFallback` với các khối giữ chỗ, satisfies **AC-5**, **AC-7**, **AC-8**, **AC-9**, **AC-18**

**M3, điện thoại và thẻ bộ lọc**
8. Nút "Bộ lọc" với huy hiệu và Sheet từ dưới lên dùng lại `filter-fields`: chân ngăn dính đáy, focus vào tiêu đề khi mở, đóng thì bỏ bản nháp của ba ô lọc (trừ khi đóng sau một lần gửi hợp lệ), đóng khi bề ngang vượt `md`, `onInvalid` mở Sheet khi lỗi nằm ở bản ô đã ẩn; gắn hộp nổi của ô chọn phường vào nội dung Sheet bằng `portalContainer` (sửa `src/components/ui/popover.tsx` và `WardPicker`), rồi kiểm danh sách cuộn được bằng cảm ứng và bàn phím ảo ở 320 và 390 px (việc spec 0015 để lại cho #13), satisfies **AC-6**, **AC-7**, **AC-9**, **AC-19**, **AC-20**
9. Hàng thẻ bộ lọc đang bật, "Xóa bộ lọc", và liên kết "Xóa tìm kiếm" giữ bộ lọc, satisfies **AC-11**, **AC-12**

**M4, hoàn thiện**
10. Phần "Bộ lọc tìm tin" trong `/dev/ui` (`search-filters.tsx` và `search-filters-sample.ts`), satisfies **AC-21**
11. Kiểm ở 320, 390, 768 và 1280 px, thứ tự đầu mục, vòng focus, số lần gọi và tải trước của liên kết (đặt `prefetch={false}` nếu có lần đọc), cặp màu mới trong `PAIRS`, console sạch ở bốn địa chỉ của AC-22, `npm run check` và `npm run build`, satisfies **AC-19**, **AC-20**, **AC-22**

## Consequences

**Positive**:
- Người tìm trọ lọc theo phường và giá, đổi thứ tự bằng một lần chạm, và thấy bộ lọc nào đang bật dù Sheet đã đóng.
- Địa chỉ giữ trọn trạng thái nên chia sẻ được, nút lùi và tiến chạy đúng, và một hàm làm sạch cùng một hàm dựng địa chỉ sở hữu tất cả (kể cả lớp tim của #14).
- Không lần đọc nào khi đang gõ hay đang chọn, nên giới hạn 300 lần một phút dùng chung được giữ. Các tổ hợp bộ lọc không bị lập chỉ mục thành vô số trang gần giống nhau.
- Danh mục phường được đọc ở máy chủ một lần cho cả giờ, nên địa chỉ có `wardCode` hiện sẵn tên phường và thẻ không phải chờ.

**Negative / tradeoffs**:
- Bộ lọc cần JavaScript. Khi tắt JavaScript chỉ ô từ khóa gửi được, và kết quả vẫn ẩn như khoảng trống đã biết của spec 0009.
- Mỗi lần áp dụng, bấm thẻ, bấm nút xóa hay bấm liên kết sắp xếp là một lần đọc `GET /listings` trên giới hạn dùng chung. Nếu giới hạn bị chạm thì thêm một `use cache` ngắn cho `getListings` (spec 0001), không xin nâng giới hạn.
- Trên điện thoại, ô chọn phường trong thẻ vẫn nằm trong cây (ẩn bằng CSS) và thêm một ô nữa khi Sheet mở; hai bản của các ô lọc cùng ghi vào một bản nháp. Chi phí nhỏ, nhưng là hai thành phần cần giữ đồng bộ về giao diện.
- Không có trang phường riêng cho công cụ tìm kiếm: mọi địa chỉ có bộ lọc đều `noindex`, nên "phòng trọ phường X" không trở thành trang để tìm thấy. Tin vẫn vào chỉ mục qua sitemap của #9.
- Bản nháp chưa áp dụng mất khi phần `q`, phường hoặc giá của địa chỉ đổi (bấm thẻ, nút xóa, nút lùi), vì thanh đặt lại bản nháp theo địa chỉ; bấm trang hay đổi sắp xếp thì không mất.
- Danh mục phường có thể cũ tới một giờ nếu admin sửa mà chưa gọi `updateTag('catalog')` (spec 0001). Bản dựng sạch cần API chạy để đọc danh mục.
- Sheet từ dưới lên có thể bị bàn phím ảo che nút "Áp dụng" khi gõ giá; cần kiểm trên máy thật ngoài 320 và 390 px.
- Lần vẽ đầu của một địa chỉ đã lọc hiện bản dự phòng (ô từ khóa trống) trước khi thanh thật thay vào, như #8; hàng thẻ bộ lọc có thể làm thẻ cao thêm một chút khi xuất hiện.

**Neutral**:
- Spec này sửa vài điểm của spec 0009 (xem đầu `## Requirements`), và thay chỗ spec 0015 hẹn dùng `<WardPicker name="wardCode" />` trong `next/form` bằng bản nháp của React Hook Form (prop `name` và ô ẩn của 0015 không dùng ở đây, vẫn giữ cho chỗ khác).
- Màn mẫu `/dev/ui/screens/listings` vẫn giữ bản của nó và có thể lệch với trang thật.
- Thêm thư mục con vào `src/features/wards` (do spec 0015 tạo) và thêm một lần đọc có `use cache` đầu tiên của dự án.

## Follow-up

- [ ] Spec 0015 (`docs/specs/0015-searchable-ward-picker.md`): thêm prop `initialWards` cho `WardPicker` và tham số cho `useWards(initialWards)` (làm `initialData` của truy vấn danh mục, không gọi lại ngay), thêm prop `portalContainer` (phần tử để gắn hộp nổi, truyền xuống `PopoverContent`, nên `src/components/ui/popover.tsx` cũng phải nhận `container`, sửa theo cách của spec 0003), và ghi chú ở mục Follow-up của nó rằng #13 dùng bản nháp của React Hook Form thay vì `name` cùng `next/form`. Chạy lại `/architect` để sửa tại chỗ khi muốn, trước khi `/develop` làm #32.
- [ ] Spec 0009: thêm một dòng đầu trang trỏ tới spec này cho các điểm đã đổi (AC-2, AC-3, AC-4, AC-5, AC-10, AC-12, AC-13, AC-14), sau khi #13 xong.
- [ ] Kiểm Sheet từ dưới lên với bàn phím ảo trên một máy iPhone và một máy Android thật: nút "Áp dụng" phải còn thấy khi đang gõ giá. Nếu không thì đổi sang ngăn từ phải sang cao bằng màn hình (phương án thay thế trong `rationale.md`).
- [ ] Nếu liên kết sắp xếp hoặc thẻ bỏ bộ lọc gây lần đọc danh sách khi tải trước, đặt `prefetch={false}` và ghi vào `verify.md`.
- [ ] Ý tưởng để quyết sau, không thuộc #13: trang phường riêng được lập chỉ mục (`?wardCode=` đứng một mình, có tiêu đề, mô tả và canonical riêng, kèm sitemap) để tìm kiếm theo khu vực; cần đọc tên phường ở `generateMetadata` và tính lại giới hạn 300 lần một phút. `/scope` có thể ghi thành mục "needs a decision".
- [ ] Khoảng trống chung của spec 0009: kết quả vẫn ẩn khi tắt JavaScript. Spec này không sửa; nếu muốn sửa thì cần quyết định riêng.
- [ ] Sau khi xong, `/sync` ghi các thành phần mới của `src/features/listing-search` và thư mục `src/features/wards/api/get-wards.ts` vào ngữ cảnh dự án.

## Rationale

Lý do và các phương án: xem [rationale.md](rationale.md).
