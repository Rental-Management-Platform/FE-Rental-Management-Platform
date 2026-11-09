# 0012. Chat với chủ trọ: lý do và các lựa chọn đã cân nhắc

Đây là phần ghi lại vì sao (decision record) của spec [0012](index.md). `/develop` không đọc file này khi xây.

## Context

Backend đã xong bảy API chat (hợp đồng mục 6.39): mở cuộc trò chuyện từ một tin, gửi tin, đọc tin theo con trỏ `seq`, chi tiết một cuộc, hộp thư, đếm chưa đọc, đánh dấu đã đọc. Mỗi cặp (tin, người nhắn) là một cuộc trò chuyện riêng. Tin nhắn là chữ thô từ 1 đến 1000 ký tự, không sửa, không xóa. Điều quan trọng nhất cho giao diện: **chưa có kênh đẩy thời gian thực**, nên mọi thứ "mới" phải được giao diện tự hỏi lại, trong khi mỗi API đọc chỉ cho 120 lần mỗi phút và API gửi tin chỉ 30 lần mỗi phút (mở cuộc trò chuyện chỉ 20 lần mỗi giờ).

Có hai loại người dùng với hai khung trang khác nhau. Người tìm trọ (tài khoản `tenant`) chỉ có khung công khai, ưu tiên điện thoại. Chủ trọ có khu làm việc với menu bên trái, ưu tiên máy tính. Chỉ người tìm trọ mở được cuộc trò chuyện; chủ trọ chỉ trả lời. Admin giữ mọi quyền nhưng bảy API luôn trả 403 cho admin, nên giao diện không được gọi.

Phần giao diện đã có sẵn nhiều thứ để dựa vào: client API với token trong bộ nhớ và xử lý 429, lớp phiên tự xóa bộ nhớ truy vấn khi phiên đổi, lớp chặn đăng nhập `RequireSession` (chỉ nhận một loại tài khoản), hai khung (`PublicShell`, `WorkspaceShell`), `ListPagination`, các trạng thái dùng chung, thẻ liên hệ của trang chi tiết tin (spec 0010), và danh sách công cụ của khu chủ trọ cùng thẻ dashboard (spec 0008). Không có thứ nào trong số đó biết gì về chat. Nếu không quyết, các màn hình sẽ tự chọn mỗi nơi một kiểu hỏi lại và một kiểu gộp tin, và danh sách tin sẽ có lúc trùng hoặc mất tin khi hỏi lại, gửi tin và xem tin cũ chạy chồng nhau.

## Options considered

Tính năng có bốn quyết định nhỏ có ảnh hưởng lớn tới cách xây. Mỗi cái được cân nhắc riêng.

### D1. Cách lấy tin mới và giữ danh sách đúng

**Option 1: một query theo cuộc trò chuyện, hỏi phần tăng thêm bằng `afterSeq`, gộp bằng hàm thuần (chọn).** Bộ nhớ `["chat","messages",id]` giữ danh sách tăng dần; mỗi lần hỏi lại gọi `afterSeq=<seq lớn nhất>`, và mọi nguồn ghi (hỏi lại, gửi tin, xem tin cũ) đi qua `mergeMessages` trong một hàm cập nhật dạng hàm của `setQueryData`.

**Pros**:
- Đúng cách hợp đồng mô tả (cuộn tới `afterSeq` và `beforeSeq`), mỗi lần hỏi chỉ kéo phần mới.
- Một đường ghi duy nhất nên không có chuyện ghi đè khi các nguồn chạy chồng nhau.
- Hàm gộp thuần nên dễ kiểm thử.

**Cons**:
- Phải tự viết vòng hỏi phần tăng thêm (kể cả vòng `hasMore`) thay vì dùng sẵn một kiểu của thư viện.
- Phải đặt `gcTime: 0` để không bắt đầu từ dữ liệu cũ có thể thiếu tin.

**Option 2: `useInfiniteQuery` theo trang.** Dùng cơ chế trang của TanStack, kéo lên bằng `fetchPreviousPage`.

**Pros**:
- Ít mã tự viết cho việc xem tin cũ.

**Cons**:
- Hỏi lại định kỳ của `useInfiniteQuery` tải lại **toàn bộ** các trang đã có mỗi lần, không chỉ phần mới (tốn lượt hỏi và dễ chạm giới hạn 120 mỗi phút khi đã kéo nhiều trang).
- Phần tin mới ở cuối không khớp với mô hình trang theo con trỏ lùi.

**Option 3: một kho tự viết ngoài TanStack (reducer riêng).** Giữ danh sách trong `useReducer` và tự lên lịch hỏi lại.

**Pros**:
- Toàn quyền kiểm soát việc hỏi lại.

**Cons**:
- Tự làm lại những thứ đã có: hủy yêu cầu theo tín hiệu, dừng khi tab ẩn, hỏi lại khi tab hiện, xóa khi phiên đổi. Trái hướng "dùng TanStack Query" của spec 0001 và 0002.

### D2. Đường dẫn và khung trang

**Option 1: hai bộ đường dẫn, mỗi bên một khung, màn hình dùng chung (chọn).** Người tìm trọ ở `/tin-nhan` (nhóm `(tenant)` với `RequireSession accountType="tenant"` bọc `PublicShell`), chủ trọ ở `/landlord/tin-nhan` (nhóm `(landlord)` đã có).

**Pros**:
- Không phải sửa lớp chặn đăng nhập (spec 0005): mỗi nhóm dùng nó đúng như đã có, và admin tự bị chặn ở cả hai.
- Chủ trọ giữ menu bên trái và thanh trên của khu làm việc khi trả lời, đúng thiết kế máy tính trước của khu đó; mục "Tin nhắn" trong menu sáng đúng chỗ.
- Khung không đổi giữa chừng khi phiên vừa khôi phục.

**Cons**:
- Hai tập địa chỉ, nên mọi liên kết chat phải đi qua `chatBasePath`.
- Khác câu "dùng chung `/tin-nhan`" trong scope, nên phải sửa scope.

**Option 2: một `/tin-nhan` cho cả hai (đúng như scope ban đầu).**

**Pros**:
- Một tập địa chỉ, một cây thư mục, đúng với câu chữ trong scope.

**Cons**:
- Chủ trọ rời khu làm việc và mất menu bên trái khi đang trả lời khách.
- Phải mở rộng `RequireSession` để nhận hai loại tài khoản cùng lúc (động tới lớp chặn của spec 0005), và vẽ trạng thái chờ sao cho khỏi đè hai khung lên nhau (lớp chặn tự vẽ `AuthShell` cho trạng thái của nó).
- Chọn khung theo loại tài khoản sau khi phiên khôi phục sẽ làm khung đổi giữa chừng.

### D3. Gửi tin đầu tiên từ trang chi tiết tin

**Option 1: hộp thoại ở giữa màn hình, mọi cỡ (chọn).** Dùng `Dialog` có sẵn mở bằng chính nút "Nhắn cho chủ trọ".

**Pros**:
- Có sẵn, có tiêu đề và khóa focus, Radix tự trả focus về nút khi đóng.
- Một cách làm cho mọi cỡ màn hình.

**Cons**:
- Trên điện thoại, hộp thoại giữa màn hình không đẹp bằng ngăn trượt khi bàn phím mở (cần kiểm trên màn hình 390 px).

**Option 2: ngăn trượt từ dưới lên (`Sheet`).**

**Pros**:
- Hợp điện thoại hơn khi bàn phím mở.

**Cons**:
- Trên máy tính trông lạ; muốn tử tế phải làm hai kiểu theo cỡ màn hình.

**Option 3: ô soạn nằm ngay trong thẻ liên hệ.**

**Pros**:
- Không có lớp phủ.

**Cons**:
- Thẻ liên hệ của spec 0010 đã có nhiều trạng thái (kiểm phiên, khách, tin của mình, số điện thoại, lỗi); thêm ô soạn làm trạng thái nhân lên, và thẻ nằm trong cột dính bên phải ở máy tính nên chiều cao thay đổi gây giật.

### D4. Biết người xem đã nhắn tin này chưa

**Option 1: đọc dò ngay khi trang mở (chọn).** `GET /me/conversations?listingId=&pageSize=1` khi người xem đủ điều kiện.

**Pros**:
- Nút ghi đúng "Xem tin nhắn của bạn" hay "Nhắn cho chủ trọ" từ đầu, bấm là mở ngay không phải chờ.
- Gửi qua hộp thoại vẫn an toàn nếu lần dò lỗi (backend nối vào cuộc cũ nếu đã có), nên lỗi của lần dò chỉ làm nút ghi chưa chuẩn.

**Cons**:
- Thêm một lần gọi cho mỗi người tìm trọ đã đăng nhập mỗi lần xem tin (rất nhẹ so với giới hạn 120 mỗi phút).

**Option 2: đọc khi bấm nút (đúng như hợp đồng mô tả).**

**Pros**:
- Không tốn lần gọi nếu người xem không bấm.

**Cons**:
- Nút luôn ghi "Nhắn cho chủ trọ" dù đã có cuộc trò chuyện; bấm xong phải chờ một nhịp mới biết mở trang cũ hay hộp thoại, và có thêm trạng thái "đang dò" cùng lỗi của nó ngay trong nút.

## Rationale

Lực lớn nhất định hình thiết kế là **không có kênh đẩy**: mọi thứ phải hỏi lại, nên chi phí và độ đúng của việc hỏi lại là cốt lõi. Vì vậy D1 chọn hỏi phần tăng thêm bằng `afterSeq` thay vì tải lại cả danh sách, và dồn mọi lần ghi qua một hàm gộp thuần. `seq` liên tiếp và không hở (hợp đồng bảo đảm) cho phép suy ra "còn tin cũ hơn" chỉ từ `items[0].seq > 1` và bỏ trùng chỉ bằng `seq`, nên không cần cờ phụ hay so nội dung. TanStack Query đã được chọn từ spec 0001 và đã lo hủy yêu cầu, dừng khi tab ẩn và xóa khi phiên đổi; tự viết kho riêng chỉ để làm lại những thứ đó.

D2 dựa vào hai thực tế của mã hiện có. `RequireSession` chỉ nhận một loại tài khoản, và các khung là tĩnh (không đọc phiên, theo spec 0003), nên một đường dẫn chung buộc phải mở rộng lớp chặn hoặc đổi khung giữa chừng. Hai đường dẫn dùng đúng những gì đã có, đổi lại chỉ là một hàm `chatBasePath` và một lần sửa scope. Người dùng phải trả lời khách nhiều sẽ là chủ trọ trên máy tính, và họ đáng được ở lại trong khu làm việc của mình.

D3 và D4 là chọn đơn giản và dùng thứ đã có: `Dialog` đã có, nút ghi đúng ngay từ đầu rẻ hơn thêm trạng thái "đang dò". Cả hai đều là quyết định của người làm dự án (hộp thoại; đọc dò khi mở).

Các quyết định mình tự đưa ra (RECOMMEND), mỗi cái kèm lý do và phương án còn lại:

| Quyết định | Chọn | Vì sao | Còn lại |
|---|---|---|---|
| Nhịp hỏi lại | cuộc trò chuyện 4 giây, hộp thư 10 giây, chỉ báo 20 giây | khoảng 15, 6 và 3 lần mỗi phút, thấp xa mức 120; hợp đồng cho 3 đến 5 giây, 15 đến 30 giây | 3 giây cho cuộc trò chuyện: nhanh hơn một giây mà tốn thêm 5 lần mỗi phút |
| Khi lỗi | 429 chờ `retryAfterSeconds` rồi chạy tiếp; lỗi khác nhân đôi tới 30 giây, hiện dòng báo sau 2 lần liên tiếp | hợp đồng nói "giãn ra, đừng thử lại ngay"; im lặng khi lỗi trông giống chủ trọ không trả lời | giữ khoảng cố định và chỉ thử lại: dồn thêm tải đúng lúc backend đang yếu |
| `gcTime` của tin nhắn | `0` | luôn mở bằng 30 tin mới nhất như hợp đồng; tránh danh sách cũ thiếu tin hay hỏi bù hàng trăm tin | giữ 5 phút mặc định và hỏi bù: có thể kéo rất nhiều tin sau khi vắng lâu |
| Đánh dấu đã đọc | gọi khi tab hiện, dính đáy, có tin bên kia mới hơn mốc đã gọi | đúng "chỉ khi tab đang hiện" của hợp đồng; tin chưa nhìn thấy thì chưa đọc | gọi mỗi lần hỏi lại có tin mới: tính tin chưa thấy là đã đọc |
| Gửi lạc quan | không | tin không sửa, không xóa, và POST không an toàn khi lặp; chờ máy chủ chỉ mất dưới một giây | hiện bong bóng tạm: phải xử lý bong bóng ma và gửi lỗi |
| Ô soạn | React Hook Form với Zod; đếm ký tự Unicode; bỏ qua Enter khi đang gõ bằng bộ gõ; tự cao tới khoảng 5 dòng không cần thư viện | đúng quy tắc biểu mẫu của dự án; Telex và VNI dùng Enter để chốt chữ | `react-textarea-autosize`: thêm một thư viện chỉ để chỉnh chiều cao |
| Liên kết trong tin | không tự gắn | chữ thô, tránh rủi ro an toàn (giả mạo, `javascript:`) | tự gắn có kiểm `http` và `https`: để sau (Deferred) |
| Người kia bị khóa | khóa ô soạn kèm nút "Thử gửi lại" | hợp đồng nói mở khóa thì gửi lại được, mà người dùng cần cách thử lại | khóa tới khi tải lại trang: buộc rời trang chỉ để thử |
| Chỉ báo trên điện thoại | nằm ngoài ngăn menu, cạnh nút menu | một chỉ báo giấu trong ngăn thì không còn là chỉ báo | đặt trong ngăn menu: mất tác dụng cảnh báo |
| Tự focus ô soạn | chỉ khi có con trỏ chuột | tự focus trên cảm ứng làm bàn phím bật lên che nội dung | luôn focus: bàn phím ảo che tin vừa mở |
| Thẻ dashboard dùng số chưa đọc | một khóa chung với chỉ báo, `select` để đổi dạng | một yêu cầu cho hai nơi | khóa riêng `["dashboard","unreadChat"]`: thêm một yêu cầu chỉ ở dashboard (bỏ, vì kiểm chéo cho thấy nên mở rộng kiểu của `sourceQuery` thay vì có hai khóa) |

Do người làm dự án chọn trong buổi thiết kế (không phải RECOMMEND): hai đường dẫn (D2), hộp thoại (D3), đọc dò khi mở (D4), Enter gửi trên chuột và xuống dòng trên cảm ứng, cuộn theo vị trí kèm nút "Tin mới", giờ gọn theo ngữ cảnh, số trang cho hộp thư, thẻ dashboard có số, chuyển sang cuộc trò chuyện sau khi gửi tin đầu, biểu tượng bong bóng thay cho cái chuông (cái chuông gợi ý thông báo chung và danh sách thả xuống, mà backend chưa có thông báo nào khác), màn xem thử ở mốc cuối, không có mục Tham khảo. D1 do `/architect` đề xuất.

Một điều cần nói thẳng cho người đọc: spec **sửa câu chữ của scope** (một `/tin-nhan` chung thành hai bộ đường dẫn) vì đó là cách ít đụng chạm nhất tới mã đã xong. Nếu về sau muốn quay lại một đường dẫn chung, phần phải đổi là `chatBasePath`, lớp chặn và các trang route; màn hình và bộ nhớ truy vấn không đổi.
