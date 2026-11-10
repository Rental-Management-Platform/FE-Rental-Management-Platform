# 0016. Bộ lọc và sắp xếp ở trang tìm tin: lý do và các phương án

Bản ghi quyết định của [spec 0016](index.md). Bản dựng không cần đọc tệp này.

## Context

Trang `/` (#8, spec 0009) đọc danh sách ở máy chủ với tư cách khách, không bộ nhớ đệm, và địa chỉ mang đúng hai thứ: từ khóa `q` và số trang `page`. Mỗi lần vào hay đổi địa chỉ là một lần gọi `GET /listings`. Mọi lần dựng ở máy chủ chung một IP nên chung giới hạn 300 lần một phút, và `robots.txt` đã chặn các địa chỉ có `q` để trình thu thập không tiêu hết giới hạn đó. Khi tắt JavaScript, ô từ khóa vẫn gửi được nhưng kết quả nằm trong khung ẩn chỉ hiện khi có script (khoảng trống đã biết, ghi ở `verify.md` của 0009).

Hợp đồng (mục 6.19) cho thêm đúng ba thứ: phường (`wardCode`, 5 chữ số), khoảng giá (`minPrice`, `maxPrice`, số nguyên từ 0 đến 100000000) và sắp xếp (`sort`: `newest`, `price_asc`, `price_desc`). Không có lọc theo diện tích, tiện ích hay tiền cọc. `minPrice` lớn hơn `maxPrice` là 400, tham số lạ cũng là 400, còn mã phường đúng dạng mà không có trong danh mục thì trả danh sách rỗng chứ không báo lỗi. Spec 0009 để lại cho #13 hai quyết định: cách thêm trường vào bộ phân tích địa chỉ, và địa chỉ có bộ lọc nào được lập chỉ mục.

Các lực khác. Trang làm điện thoại trước: ô cao 44 px, chữ nhập 16 px, và năm ô điều khiển (từ khóa, phường, hai giá, nút) không thể xếp dọc hết trên màn 320 px mà vẫn cho thấy kết quả. Ô chọn phường của spec 0015 (#32, chưa xây) là thành phần client dựa trên hộp nổi và danh mục 168 mục, còn spec 0001 đã cho phép ghi nhớ danh mục này ở máy chủ vì nó gần như không đổi, khác với danh sách tin phải biến mất ngay khi bị ẩn. Lớp tim (#14) đọc lại đúng lời gọi danh sách kèm token, nên mọi tham số mới phải đi qua một hàm dựng truy vấn duy nhất. Kết quả phải chia sẻ được qua địa chỉ.

Không quyết thì #13 sẽ tự đặt tên tham số, tự chọn lúc áp dụng và tự viết luật `robots.txt`, và mỗi tổ hợp bộ lọc có thể trở thành một trang riêng trong chỉ mục tìm kiếm.

## Options considered

### Option 1: Trạng thái trên địa chỉ, form client có bản nháp và nút áp dụng, liên kết cho sắp xếp (chosen)

Giữ đọc ở máy chủ của #8. Địa chỉ mang sáu tham số, một hàm thuần làm sạch và một hàm thuần dựng địa chỉ. Bộ lọc là một form client (React Hook Form và Zod) giữ bản nháp và chỉ chuyển địa chỉ khi gửi. Sắp xếp và thẻ bỏ bộ lọc là liên kết thật.

**Pros**:
- Giữ nguyên mô hình đã chạy của #8 (máy chủ đọc, khung chờ theo khóa địa chỉ, lớp tim), thêm ít thành phần mới nhất.
- Một lần gọi cho cả bộ lọc, không gọi khi giá mới gõ nửa chừng, tiết kiệm giới hạn dùng chung.
- Kiểm tra khoảng giá trước khi gọi API, và địa chỉ chia sẻ được.

**Cons**:
- Bộ lọc cần JavaScript, và một thanh có hai bản của các ô lọc (trong thẻ và trong Sheet) dùng chung một bản nháp.
- Mỗi lần bấm là một lần đọc trên giới hạn dùng chung.

### Option 2: Lọc ngay khi đổi, `router.replace` có chờ ngắn cho ô giá

Không có nút áp dụng. Mỗi lần chọn phường hoặc sắp xếp đổi địa chỉ ngay, ô giá đổi khi dừng gõ.

**Pros**:
- Ít thao tác hơn, cảm giác nhanh.

**Cons**:
- Nhiều lần gọi API hơn trên giới hạn dùng chung, và giá nửa chừng ("2" rồi "20" rồi "200") sinh lần gọi thừa.
- Trong Sheet, trang phía sau đổi liên tục khi người dùng còn đang chọn; lịch sử trình duyệt đầy mục.
- Không giúp gì cho trường hợp tắt JavaScript.

### Option 3: Danh sách dựng ở trình duyệt với TanStack Query, như màn mẫu

Lọc, sắp xếp và phân trang chạy trong trình duyệt, danh sách không còn do máy chủ vẽ.

**Pros**:
- Đổi bộ lọc tức thì, không dùng IP chung của máy chủ.

**Cons**:
- Bỏ lựa chọn của spec 0009 (danh sách là HTML thật cho công cụ tìm kiếm và dùng chung với #14), và phải làm lại khung chờ, metadata và địa chỉ.
- Thêm một đường đọc dữ liệu thứ hai cho cùng một danh sách.

### Option 4: Form GET thuần với ô gốc cho mọi thứ

Mọi bộ lọc là ô gốc của trình duyệt trong một form GET (`<select>` cho phường, `<details>` cho điện thoại), chạy cả khi tắt JavaScript.

**Pros**:
- Không cần JavaScript để gửi form.

**Cons**:
- Khi tắt JavaScript, kết quả vẫn ẩn (khoảng trống đã biết), nên công sức mua được rất ít.
- Một `<select>` 168 phường chính là vấn đề mà #32 sinh ra để giải, và không có Sheet hay lời lỗi khoảng giá trước khi gửi.

## Rationale

Option 1 là lựa chọn duy nhất khớp các lực cùng lúc. Giới hạn 300 lần một phút dùng chung loại Option 2, vì lọc tức thì nhân số lần gọi lên mà người dùng không được gì thêm. Lựa chọn của spec 0009 (danh sách là HTML thật, một đường đọc dùng chung với lớp tim) loại Option 3. Option 4 mua một cam kết mà khoảng trống đã biết của #8 làm cho gần như vô nghĩa: người tắt JavaScript gửi được form nhưng chỉ thấy khung chờ.

Kỹ sư ban đầu chọn giữ bộ lọc chạy được khi tắt JavaScript. Sau khi mình nói rõ khoảng trống đã biết (kết quả ẩn khi không có script), kỹ sư đổi sang giữ như #8: chỉ ô từ khóa gửi được, bộ lọc cần JavaScript. Phần giá trị còn lại của lựa chọn cũ vẫn được giữ: danh mục phường vẫn đọc ở máy chủ để lần vẽ đầu có sẵn tên phường.

React Hook Form được chọn vì luật của `AGENTS.md` (biểu mẫu dùng React Hook Form và Zod cho các kiểm tra nhẹ), vì `FormField` có sẵn đã nối nhãn, lỗi và focus, và vì một `useForm` cho phép hai bản của các ô lọc (trong thẻ và trong Sheet) dùng chung một bản nháp mà không phải đồng bộ tay.

## Các lựa chọn nhỏ chốt cùng kỹ sư

| Chủ đề | Chọn | Phương án thay thế |
|---|---|---|
| Vị trí và cách gọn | Chung thẻ với ô tìm kiếm, Sheet dưới `md` (theo `design.md`) | Bung gập tại chỗ; luôn hiện xếp dọc; cột bên trái trên máy tính |
| Lúc áp dụng | Có nút "Tìm trọ" và "Áp dụng" | Áp dụng ngay khi chọn; lai (ô chọn ngay, ô gõ có nút) |
| Cách nhập khoảng giá | Hai ô số "Giá từ" và "Giá đến" | Thêm các mức bấm nhanh; chỉ các mức có sẵn; thanh trượt hai đầu |
| Chữ trong ô giá | Chỉ chữ số kèm dòng đọc số | Tự chèn dấu chấm khi gõ; gõ theo triệu |
| Khi tắt JavaScript | Bộ lọc cần JavaScript, giữ như #8 | Ô gốc đầy đủ cho mọi bộ lọc (cho `<select>` và `<noscript>`) |
| Sắp xếp | Ba liên kết trên đầu kết quả | Một `Select` trên đầu kết quả; nằm trong form bộ lọc |
| Tên tham số | Đúng tên của API | Tên ngắn tiếng Anh; tên tiếng Việt không dấu |
| Chỉ mục | Chỉ trang thường và `?page=N` | Thêm trang theo từng phường; chỉ `noindex` mà không chặn trong `robots.txt` |
| Thấy và bỏ bộ lọc | Thẻ nhỏ có dấu X cùng nút "Xóa bộ lọc" | Chỉ số trên nút "Bộ lọc"; chỉ nút xóa trong form |
| "Xóa bộ lọc" xóa gì | Chỉ phường và giá | Xóa tất cả về `/`; phường, giá và sắp xếp |
| Sheet trượt từ đâu | Từ dưới lên | Từ phải sang, cao bằng màn hình |
| Ngữ pháp địa chỉ | Như AC-1 và AC-2, đã xác nhận | không |
| References | Không có | Chỉ nêu nguồn |

## Các điểm do kiến trúc sư chốt (RECOMMEND)

1. **React Hook Form với `zodResolver` và `FormField` cho thanh lọc.** Vì luật của dự án và để hai bản ô lọc dùng chung bản nháp. Thay thế: `useState` thường (ít gói hơn nhưng phải tự nối lỗi và focus).
2. **Gửi bằng `router.push(listingsHref(...))` trong `startTransition`, không dùng `next/form`.** Vì cần kiểm tra khoảng giá trước khi chuyển trang và một hàm gửi duy nhất cho cả thẻ lẫn Sheet. Thay thế: `next/form` với thuộc tính `form="..."` trên các ô trong Sheet (hộp nổi của Sheet nằm ngoài form trong cây DOM), phải lo ô ẩn của 0015 và không kiểm tra được trước.
3. **Hai bản của các ô lọc, CSS quyết định bản nào thấy (thẻ từ `md`, Sheet dưới `md`).** Vì bố cục theo CSS không nhảy ở lần vẽ đầu trên điện thoại, thiết bị chính của dự án. Thay thế: dùng `matchMedia` để chỉ vẽ một bản (bị nhảy bố cục khi trang chạy script, hoặc phải đoán thiết bị).
4. **Sắp xếp không phải bộ lọc.** Áp dụng bộ lọc giữ sắp xếp, liên kết sắp xếp giữ bộ lọc, "Xóa bộ lọc" không đụng tới sắp xếp. Vì sắp xếp là cách xem, và đặt lại thứ tự khi người dùng chỉ đổi phường sẽ làm họ bất ngờ. Thay thế: đặt lại `sort` mỗi khi áp dụng.
5. **Danh mục phường đọc ở máy chủ bằng `use cache` rồi truyền xuống bằng prop `initialWards`.** Vì spec 0001 đã quy định cách ghi nhớ danh mục, và để địa chỉ có `wardCode` hiện sẵn tên phường ở lần vẽ đầu (cả nút lẫn thẻ). Thay thế: chỉ đọc ở trình duyệt (nhanh làm xong nhưng có chữ "Đang tải danh sách" và thẻ phường phải chờ).
6. **Chỉ mục: `noindex, follow` cộng canonical là chính địa chỉ cộng tám dòng `robots.txt` cùng kiểu `/*?q=`.** Vì `robots.txt` giữ trình thu thập khỏi tiêu giới hạn 300 lần một phút, còn thẻ `noindex, follow` vẫn đứng đó cho những nơi không theo `robots.txt`. Hai việc này không chồng thành hai lớp: trình thu thập bị chặn thì không đọc được thẻ, nên một địa chỉ lọc có liên kết từ ngoài vẫn có thể hiện trong chỉ mục chỉ với địa chỉ mà không có nội dung. Chấp nhận được vì mục tiêu là giữ giới hạn, không phải xóa mọi dấu vết. Thay thế: canonical về `/` (gom tín hiệu về trang gốc nhưng nói sai về nội dung trang).
7. **`minPrice` bằng 0 bị bỏ khỏi trạng thái, `maxPrice` bằng 0 được giữ, số quá 9 chữ số hoặc quá 100000000 bị bỏ chứ không bị cắt.** Vì 0 ở `minPrice` đồng nghĩa không chặn dưới (một địa chỉ cho một trạng thái), còn 0 ở `maxPrice` là một yêu cầu thật mà API xử lý được. Bỏ lặng lẽ khớp với luật "giá trị lạ về mặc định" của #8. Thay thế: cắt về 100000000 (đổi ý nghĩa của địa chỉ mà người dùng không biết).
8. **Khoảng giá ngược: báo bằng lời và không gọi API, không tự đổi chỗ hai số.** Vì scope yêu cầu báo bằng lời, và tự đổi chỗ che mất lỗi của người dùng. Thay thế: đổi chỗ lặng lẽ (kết quả có mà người dùng không hiểu vì sao hai ô đã khác).
9. **Phần dự phòng có các khối giữ chỗ cùng cỡ.** Vì giữ chiều cao thẻ ổn định khi thanh thật thay vào. Thay thế: để thẻ nhảy chiều cao (ít mã hơn).
10. **Thứ tự xây: phía máy chủ và liên kết sắp xếp trước (M1), thanh trên máy tính sau (M2).** Vì M1 không phụ thuộc #32 và cho một lát cắt thật kiểm được bằng địa chỉ gõ tay. Thay thế: làm toàn bộ giao diện trước (phải chờ #32 mới có gì để xem).
11. **Thẻ phường theo danh mục, có hai lời dự phòng ("Mã {code} (không có trong danh sách)" khi danh mục đã có mà thiếu mã, "Mã {code}" khi chưa có danh mục).** Vì không bao giờ được đoán tên phường từ mã, và danh mục có thể thiếu trong lúc máy chủ chưa đọc được. Thay thế: ẩn thẻ khi chưa có danh mục (người dùng mất dấu bộ lọc đang bật).

### Điểm bổ sung sau lượt kiểm chéo (cùng mô hình, chỉ đọc, 2026-11-10)

Kỹ sư chọn áp dụng các sửa đề xuất. Mỗi điểm dưới đây là một quyết định đã thêm vào spec:

12. **Danh mục phường: ném lỗi khi đang dựng, nuốt lỗi khi chạy thật, giới hạn 3 giây.** Vì nuốt lỗi lúc dựng đóng một danh mục rỗng vào khung tĩnh và không tự lành, còn một API bị treo không nên giữ thanh ở khung dự phòng 10 giây. Thay thế: đọc danh mục sau khi `await searchParams` (thành đọc theo yêu cầu, không chạy lúc dựng, nhưng mất việc kiểm "bản dựng thất bại khi tắt API" mà spec 0001 hẹn).
13. **Bỏ `key` theo địa chỉ, đặt lại bản nháp tại chỗ.** Vì dựng lại thanh làm focus rơi về `body` sau Enter và sau khi đóng Sheet. Thay thế: giữ `key` rồi tự trả focus (dễ sót từng chỗ).
14. **`onInvalid` mở Sheet khi lỗi nằm ở bản ô đã ẩn (dưới `md`).** Vì một địa chỉ có khoảng giá ngược khiến "Tìm trọ" thất bại mà người dùng không thấy lỗi. Thay thế: cho gửi chỉ từ khóa và bỏ qua bản nháp đã ẩn (đổi nghĩa của "Tìm trọ" theo từng bề ngang).
15. **Hộp nổi của ô chọn phường gắn vào nội dung Sheet (`portalContainer`).** Vì Radix Dialog khóa cuộn với nội dung nằm ngoài nó, danh sách 168 dòng sẽ không cuộn được bằng cảm ứng. Thay thế: để Sheet không modal (mất khóa focus và lớp phủ).
16. **Focus vào tiêu đề Sheet khi mở, chân ngăn dính đáy, `dvh` và `scrollIntoView` cho ô đang focus.** Vì iOS không có phím Return cho `inputMode="numeric"`, nên nút "Áp dụng" phải luôn thấy được. Thay thế: ngăn từ phải sang cao bằng màn hình (giữ làm phương án dự phòng).
17. **Focus về `h2` kết quả sau mỗi lần chuyển trong chỗ.** Vì khung chờ có khóa gỡ liên kết vừa bấm khỏi trang. Việc này cũng sửa khoảng trống cũ của liên kết trang ở #8. Thay thế: đưa các liên kết sắp xếp ra ngoài khung chờ (mất khả năng ẩn khi không có tin).
18. **Các quyết định nhỏ khác:** gửi đúng địa chỉ hiện tại thì không chuyển trang, chỉ đóng Sheet; `isPending` khóa nút; hai ô giá khai `deps` của nhau; cắt khoảng trắng và chỉ nhận chữ số; một lần `useWards(initialWards)` dùng chung cho thẻ và hai ô chọn; hàng thẻ hiện ở mọi bề ngang, thẻ phường trước thẻ giá; `fieldset` cho hai ô giá; `cache()` trên sáu giá trị đơn; liên kết đang chọn đậm 600 và gạch chân; Sheet đóng khi bề ngang vượt `md`; đo tải trước bằng `next build` rồi `next start`.
