# Scope: Nền tảng quản lý và cho thuê nhà trọ (giao diện)

Giao diện web cho một chợ tin nhà trọ có ba nhóm người dùng: khách và người tìm trọ, chủ trọ, và admin. Backend đã xong toàn bộ, hợp đồng nằm ở `api-for-frontend.md`.

**Build approach:** Tracer Bullet (chạy một sợi chỉ thật, mỏng, xuyên qua mọi tầng trước, rồi dày dần từng đoạn, mỗi lần vẫn chạy trọn vẹn).
**Workflow:** Alpha (sau `/develop` chạy `/check verify`). Mức kỹ càng mặc định của dự án. `/architect` là chỗ nên ghé đầu tiên khi một tính năng có quyết định thật sự, nhưng bỏ qua được nếu bạn đã biết cách làm. Mỗi tính năng có thể mang nhãn riêng (ví dụ `· Beta`) để làm kỹ hơn hay nhẹ hơn.

_Đây là gợi ý để việc xây có thứ tự, không phải bắt buộc. Bỏ qua bất cứ gì không hợp: nếu bạn đã biết cách làm một tính năng, cứ dùng `/develop` và bỏ `/architect`. Bạn quyết định khi nào một tính năng là `done`._

## Điều đã chốt

* Hợp đồng với backend: `api-for-frontend.md` ở thư mục gốc, đội backend cập nhật cùng mỗi thay đổi API.
* Mục đích: demo hoặc đồ án có hạn nộp. Thanh toán chỉ là thanh toán thử.
* Thiết bị: điện thoại trước cho phần công khai, máy tính trước cho khu chủ trọ và khu admin.
* Ngôn ngữ: chỉ tiếng Việt, không làm đa ngôn ngữ.
* Trang công khai (trang chủ, danh sách tin, chi tiết tin, hồ sơ chủ trọ) cần SEO. Mục tiêu trợ năng mặc định là WCAG AA, đổi được.
* Thiết kế: Figma (qua MCP) chỉ dùng đến hết mốc M2 của tính năng 4, cho màu, chữ, nút, đầu trang công khai, ô nhập và các trạng thái. Từ mốc M3, viết mã thẳng trên hệ thiết kế đó, không vẽ thêm Figma. Giao diện vẫn làm đủ, chỉ đổi cách làm. Bố cục từng màn do `/develop` tự quyết dựa trên hệ thiết kế đã có, không cần bạn duyệt từng màn.
* Phạm vi giao diện bám đúng `api-for-frontend.md`: mọi tính năng hợp đồng mô tả đều có dòng riêng, cái gì hợp đồng không mô tả thì không làm (đã đối chiếu 69 API ngày 2026-10-24; chat với 7 API và đánh giá chủ trọ với 8 API được đối chiếu ngày 2026-11-07 và nay có dòng riêng là #34, #35 và #36; đánh giá từng phòng với 8 API, mục 6.41, được đối chiếu ngày 2026-11-10: phần người tìm trọ là #37, phần admin ẩn và gỡ ẩn nằm trong #36 thành một tab riêng). Biểu đồ doanh thu cho admin nằm trong hợp đồng nên giữ. Trang chủ giới thiệu và bản đồ một điểm không có trong hợp đồng nên đã bỏ. Chế độ tối để sau.
* Chat, hồ sơ chủ trọ và đánh giá làm theo mạch người tìm trọ nhắn, chủ trọ trả lời, rồi người tìm trọ đánh giá (vì chỉ người đã được chủ trọ trả lời mới đánh giá được): chat (#34) trước, rồi hồ sơ chủ trọ (#15), rồi đánh giá (#35), và kiểm duyệt đánh giá (#36) ở khu admin sau cùng. Đánh giá từng phòng (#37) xây sau #35 vì dùng lại nhiều phần của khu đánh giá chủ trọ; điều kiện viết cũng là chủ trọ đã trả lời trong chat, nhưng về chính tin đó, không phải về bất kỳ tin nào của họ; tab kiểm duyệt của nó nằm trong #36. Hồ sơ chủ trọ nằm ở `/chu-tro/[id]`, hộp thư và cuộc trò chuyện nằm ở `/tin-nhan` và `/tin-nhan/[id]`, dùng chung cho người tìm trọ và chủ trọ.

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | Stack & architecture | Foundation | done |
| 2 | Coding standards & tooling | Foundation | done |
| 3 | API client & session layer | Foundation | done |
| 4 | Design system & UI foundation | Foundation | done |
| 30 | Type and layout refinement | Foundation | done |
| 5 | Sign up and sign in | Slice 1 | done |
| 6 | First property | Slice 1 | done |
| 7 | Post a listing | Slice 1 | done |
| 31 | Landlord and admin dashboards | Slice 1 | done |
| 8 | Find listings | Slice 1 | done |
| 9 | Listing detail | Slice 1 | done |
| 32 | Searchable ward picker | Slice 1 | planned |
| 13 | Search filters and sort | Slice 1 | planned |
| 10 | Listing photos | Slice 2 | done |
| 11 | Property fees and amenities | Slice 2 | planned |
| 33 | Property location map | Slice 2 | in-progress |
| 12 | Manage my properties and listings | Slice 2 | planned |
| 14 | Favorites | Slice 3 | done |
| 34 | Chat with landlords | Slice 3 | done |
| 15 | Landlord profile and follow | Slice 3 | done |
| 35 | Landlord reviews | Slice 3 | done |
| 37 | Listing reviews | Slice 3 | done |
| 16 | Home page | Slice 3 | dropped |
| 17 | Membership status and quota notices | Slice 4 | planned |
| 18 | Pricing page | Slice 4 | planned |
| 19 | Checkout and order history | Slice 4 | planned |
| 20 | Admin shell and users | Slice 5 | planned |
| 21 | Listing moderation | Slice 5 | planned |
| 36 | Review moderation | Slice 5 | planned |
| 22 | Plans and trial settings | Slice 5 | planned |
| 23 | Wards and amenities catalog | Slice 5 | planned |
| 24 | Permissions by account type | Slice 5 | planned |
| 25 | Orders of all landlords | Slice 5 | planned |
| 26 | Revenue statistics | Slice 5 | planned |
| 27 | Password recovery | Slice 6 | planned |
| 28 | My profile and change password | Slice 6 | planned |
| 29 | Location pin on listing detail | Slice 6 | dropped |

## Các nhóm

Mỗi nhóm có file riêng. Số là số định danh, còn thứ tự xây là thứ tự các dòng trong bảng At a glance (dòng 30 được xếp sau dòng 4 vì xây trước dòng 5), nên trong một file các số không liền nhau.

* [Foundations](foundations.md): nền tảng kỹ thuật và thiết kế (#1 đến #4, và #30). 5 done.
* [Account](account.md): đăng ký, đăng nhập, khôi phục mật khẩu, hồ sơ (#5, #27, #28). 1 done, 2 planned.
* [Public](public.md): khách và người tìm trọ, kể cả nhắn tin với chủ trọ, đánh giá chủ trọ, đánh giá phòng và bảng giá (#8, #9, #13, #14, #34, #15, #35, #37, #16, #18, #29). 7 done, 2 planned, 2 dropped (#16, #29).
* [Landlord](landlord.md): nhà trọ, tin, gói và đơn của chủ trọ (#6, #7, #10, #11, #12, #17, #19, #32, #33). 3 done, 1 in-progress, 5 planned.
* [Admin](admin.md): khu quản trị (#20 đến #26, và #36). 8 planned.
* [Dashboard](dashboard.md): trang tổng quan của khu chủ trọ và khu admin (#31). 1 done.

## Các giai đoạn

* **Foundation**: nền tảng trước khi có tính năng nào.
* **Slice 1, vòng lặp lõi**: chủ trọ đăng ký, tạo nhà trọ, đăng tin; khách tìm thấy tin (kể cả lọc theo phường, khoảng giá và sắp xếp, #13) và mở xem. Sợi chỉ mỏng nhưng thật, đã là bộ khung chạy được. Thêm dashboard của hai khu (#31) để vào các trang quản lý bằng cách bấm.
* **Slice 2, tin phong phú hơn**: ảnh, phí, tiện ích, vị trí trên bản đồ, và khu quản lý tin của chủ trọ.
* **Slice 3, tìm và gắn bó**: yêu thích, nhắn tin với chủ trọ, hồ sơ chủ trọ, đánh giá chủ trọ, đánh giá từng phòng (bộ lọc đã chuyển lên Slice 1, trang chủ đã bỏ).
* **Slice 4, gói và thanh toán thử**: trạng thái dùng thử, bảng giá, mua gói.
* **Slice 5, khu admin**: người dùng, kiểm duyệt tin và đánh giá, gói, danh mục, quyền, đơn, doanh thu.
* **Slice 6, tài khoản và hoàn thiện**: khôi phục mật khẩu, hồ sơ cá nhân (bản đồ đã bỏ).

Hết giờ giữa chừng thì dừng ở bất kỳ giai đoạn nào cũng còn một bản demo chạy được.

## Deferred

Ngoài phạm vi lần này, giữ lại để kế hoạch còn trung thực.

* **Chế độ tối**: giao diện tối cho mọi màn hình · needs a decision
* **Chọn cỡ chữ (thường hoặc lớn)**: cho người muốn chữ to hơn mà không phải phóng trình duyệt; sinh ra từ spec 0004 · needs a decision
* **Kéo thả tệp vào khối ảnh**: chủ trọ kéo ảnh từ máy thả vào khối ảnh của tin; cần thêm trạng thái kéo qua và cách dùng bằng bàn phím; sinh ra từ spec 0007 · needs a decision
* **Chọn nơi chạy khi demo trên mạng (hosting)**: chọn nơi đặt FE và API trước khi demo online. Cookie đăng nhập là `SameSite=Strict`, nên hai nơi khác site cần proxy; xem mục "If hosting changes" trong spec 0001. Sau khi chọn, dán thử một liên kết tin vào Zalo và Telegram để xem thẻ xem trước; nếu không có thẻ thì đặt `htmlLimitedBots` (spec 0010) · needs a decision
* **Cứng hóa lớp phiên khi hai tab đổi tài khoản**: tab B còn là khách ở `/login` trong khi tab A đã đăng nhập, rồi B đăng nhập tài khoản khác thì cookie làm mới đổi, còn tab A vẫn hiện người cũ. Sau mỗi lần làm mới cần gọi `/auth/me` và so `user.id`. Phải sửa spec 0002; sinh ra từ spec 0005 · needs a decision
* **Liên kết về dashboard từ trang "không có quyền"**: người của loại tài khoản khác mở nhầm `/landlord` hay `/admin` thấy trang báo không có quyền, nên có thêm nút về dashboard của chính họ; sinh ra từ spec 0008 · needs a decision
* **Ảnh chia sẻ mặc định cho trang tìm tin**: trang `/` chưa có ảnh trong thẻ chia sẻ (Open Graph chỉ có chữ); #9 (spec 0010) làm thẻ chia sẻ cho từng tin bằng ảnh đầu của tin, nên tin chưa có ảnh vẫn chỉ có chữ; một ảnh mặc định cho trang này và cho các tin đó cần một ảnh đã được thiết kế sẵn; sinh ra từ spec 0009 và 0010 · needs a decision
* **Đổi nhà cung cấp bản đồ trước khi có người dùng thật**: bản đồ và tìm địa chỉ của #33 dùng hình bản đồ OpenStreetMap và Nominatim công cộng (không khóa, không đảm bảo, một yêu cầu mỗi giây cho cả trang), hợp với bản demo nhưng không hợp với lượng truy cập thật; khi cần thì chọn nhà cung cấp có điều khoản cho phép (MapTiler và Goong đã được cân nhắc, xem rationale của spec 0011); chỉ phải đổi `config.ts` và `api/nominatim.ts`; sinh ra từ spec 0011 · needs a decision
* **Chờ backend, chưa có API nên đừng dựng màn hình**: lịch sử kiểm duyệt, kháng nghị khi bị ẩn tin, danh sách đang theo dõi, thông báo, thống kê cho chủ trọ (kể cả lượt lưu tin), đổi email, ảnh đại diện, xóa tài khoản, đổi thứ tự ảnh, chi tiết một tài khoản và sắp xếp ở danh sách người dùng, tìm đơn theo mã hoặc email chủ trọ, xuất file, doanh thu theo từng chủ trọ, hoàn tiền, đổi gói giữa kỳ, lọc tin công khai theo diện tích, tiện ích, tiền cọc hay ngày vào ở (hợp đồng mục 6.19 chỉ có từ khóa, phường, khoảng giá và sắp xếp). Với đánh giá chủ trọ (mục 6.40): báo cáo một đánh giá, chủ trọ trả lời đánh giá, phân bố số sao, lọc hoặc sắp xếp theo số sao, ảnh trong đánh giá, bình chọn "hữu ích", tìm theo chữ trong nhận xét, lịch sử kiểm duyệt đánh giá, đánh giá ẩn danh. Với đánh giá phòng (mục 6.41): các mục vừa kể cũng chưa có ở đây, và thêm sao trên thẻ tin (bốn danh sách thẻ tin là trang tìm tin, tin đã lưu, tin dưới hồ sơ chủ trọ và tin của chủ trọ chưa có `reviewCount` và `ratingAverage`, nên thẻ chưa hiện được sao). Với chat (mục 6.39): sửa hoặc xóa tin nhắn, chặn một người, ảnh hoặc tệp trong tin nhắn, thông báo qua email hoặc đẩy, dấu "đã xem" cho bên kia, màn hình chat cho admin.
* **Hộp thư hai cột trên máy tính**: danh sách cuộc trò chuyện bên trái và nội dung bên phải trên màn hình rộng, trong khi điện thoại vẫn là hai màn riêng (`/tin-nhan` và `/tin-nhan/[id]`); sinh ra từ #34 · needs a decision
* **Tự biến liên kết trong tin nhắn thành bấm được**: tin chat hiện là chữ thô nên người dùng phải tự chép liên kết; muốn bấm được thì chỉ cho `http` và `https`, thêm `rel="noopener noreferrer"`, tuyệt đối không dùng HTML, và cần một quyết định riêng về an toàn; sinh ra từ spec 0012 · needs a decision
* **Backend đã bỏ khỏi kế hoạch, đừng làm**: duyệt tin trước khi hiện, VNPay, xác thực chủ trọ bằng giấy tờ, báo cáo tin xấu, liên hệ chủ trọ có giới hạn mỗi ngày, đẩy tin và tin nổi bật, kiểm tra tại chỗ, quảng cáo, dashboard thu chi, tìm quanh một địa điểm, đổi loại tài khoản.

## Legend

**The decision box.** Mỗi tính năng có đúng một ô quyết định, là bước con có nhãn kết thúc bằng `(spec)`. Cách viết đổi theo chỗ (`Design it (spec)` thường gặp, `Decide the stack (spec)` ở Stack & architecture), nên các skill tìm theo đuôi `(spec)`, không so nhãn chính xác. Mọi ô khác là ô thực thi, `/architect` không bao giờ tick chúng.

**Vòng đời của một tính năng**: kế hoạch cập nhật khi tính năng đi tới; mỗi dòng cho biết trạng thái và ai đặt:

| State | Set by | The feature shows |
|---|---|---|
| `planned` · needs a decision | `/scope` | một ô: `Design it (spec): /architect <feature>` |
| `planned` (không cần quyết định) | `/scope` | một ô: `Build it: /develop <feature>` |
| `in-progress` (đã thiết kế) | **`/architect` khi ghi spec** | `Design it` đã tick; spec được liên kết; `Build it: /develop <feature>` kèm **2 đến 5 mốc**; ô kết thúc theo mức (`Verify it` từ Alpha trở lên, `Test it` từ Beta, `Review it` và `Document it` ở GA) |
| `in-progress` (đang xây) | `/develop` | các mốc con được tick dần; con trỏ tới mã được điền |
| `in-progress` (đã kiểm chứng) | `/check verify` | `Build it` và các mốc đã tick; `Verify it` đã tick |
| `done` | **bạn, khi bạn thấy xong** (skill nào cũng đặt được khi bạn nói); `/sync` đối chiếu | các ô đã chạy được tick, ô bỏ qua được đánh dấu bỏ qua; ô cuối của mức (`Prototype` sau `/develop`; `Alpha` sau `/check verify`; `Beta` và `GA` sau `/test`) là chỗ gợi ý để gọi là xong |

* **Bước kế tiếp** là ô chưa tick đầu tiên, luôn là một lệnh hoặc một mốc có theo dõi.
* **needs a decision** nghĩa là chạy `/architect` trước; ngược lại đi thẳng `/develop` (hoặc `/audit` với chuẩn mã và công cụ). Nhãn biến mất sau khi spec được ghi.
* **Các việc xây nhỏ nằm trong `## Build plan` của spec**, không nằm ở đây: kế hoạch chỉ giữ phần tóm tắt các mốc.
* **Status**: `planned` rồi `in-progress` rồi `done`, thêm `existing` (có trước quy trình) và `dropped` (bỏ khỏi phạm vi, giữ lại để có lịch sử).
* **Nhãn mức quy trình** cạnh tiêu đề (ví dụ `· Beta`) đặt mức kỹ càng của riêng tính năng đó cao hay thấp hơn mặc định; không có nhãn là theo mặc định.
* **Workflow** (dòng đầu file) là mức mặc định cho phần chạy sau `/develop`: **Prototype** không chạy gì (tin vào bước tự kiểm của develop); **Alpha** chạy `/check verify`; **Beta** thêm `/test`; **GA** thêm `/check review` bằng mô hình khác rồi `/document`. Một tính năng xây trên quyết định chưa được xác nhận (spec `Assumed`) vẫn được gắn cờ, nhưng không chặn `done`.
* **Dòng con trỏ** (`spec <n> · code in <path>`): liên kết spec do `/architect` thêm, đường dẫn mã do `/develop` thêm.
