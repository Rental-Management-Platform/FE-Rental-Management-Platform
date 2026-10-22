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
* Thiết kế: dựng trong Figma qua MCP đã kết nối, chốt ở tính năng 4.
* Đưa vào ngoài những gì backend đã có: biểu đồ doanh thu cho admin, bản đồ một điểm ở trang chi tiết, trang chủ giới thiệu. Chế độ tối để sau.

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | Stack & architecture | Foundation | done |
| 2 | Coding standards & tooling | Foundation | in-progress |
| 3 | API client & session layer | Foundation | planned |
| 4 | Design system & UI foundation | Foundation | planned |
| 5 | Sign up and sign in | Slice 1 | planned |
| 6 | First property | Slice 1 | planned |
| 7 | Post a listing | Slice 1 | planned |
| 8 | Find listings | Slice 1 | planned |
| 9 | Listing detail | Slice 1 | planned |
| 10 | Listing photos | Slice 2 | planned |
| 11 | Property fees and amenities | Slice 2 | planned |
| 12 | Manage my properties and listings | Slice 2 | planned |
| 13 | Search filters and sort | Slice 3 | planned |
| 14 | Favorites | Slice 3 | planned |
| 15 | Landlord profile and follow | Slice 3 | planned |
| 16 | Home page | Slice 3 | planned |
| 17 | Membership status and quota notices | Slice 4 | planned |
| 18 | Pricing page | Slice 4 | planned |
| 19 | Checkout and order history | Slice 4 | planned |
| 20 | Admin shell and users | Slice 5 | planned |
| 21 | Listing moderation | Slice 5 | planned |
| 22 | Plans and trial settings | Slice 5 | planned |
| 23 | Wards and amenities catalog | Slice 5 | planned |
| 24 | Permissions by account type | Slice 5 | planned |
| 25 | Orders of all landlords | Slice 5 | planned |
| 26 | Revenue statistics | Slice 5 | planned |
| 27 | Password recovery | Slice 6 | planned |
| 28 | My profile and change password | Slice 6 | planned |
| 29 | Location pin on listing detail | Slice 6 | planned |

## Các nhóm

Mỗi nhóm có file riêng. Số thứ tự là thứ tự xây trên toàn kế hoạch, nên trong một file các số không liền nhau.

* [Foundations](foundations.md): nền tảng kỹ thuật và thiết kế (#1 đến #4). 1 done, 1 in-progress, 2 planned.
* [Account](account.md): đăng ký, đăng nhập, khôi phục mật khẩu, hồ sơ (#5, #27, #28). 3 planned.
* [Public](public.md): khách và người tìm trọ, kể cả bảng giá (#8, #9, #13, #14, #15, #16, #18, #29). 8 planned.
* [Landlord](landlord.md): nhà trọ, tin, gói và đơn của chủ trọ (#6, #7, #10, #11, #12, #17, #19). 7 planned.
* [Admin](admin.md): khu quản trị (#20 đến #26). 7 planned.

## Các giai đoạn

* **Foundation**: nền tảng trước khi có tính năng nào.
* **Slice 1, vòng lặp lõi**: chủ trọ đăng ký, tạo nhà trọ, đăng tin; khách tìm thấy tin và mở xem. Sợi chỉ mỏng nhưng thật, đã là bộ khung chạy được.
* **Slice 2, tin phong phú hơn**: ảnh, phí, tiện ích, và khu quản lý tin của chủ trọ.
* **Slice 3, tìm và gắn bó**: lọc, yêu thích, hồ sơ chủ trọ, trang chủ.
* **Slice 4, gói và thanh toán thử**: trạng thái dùng thử, bảng giá, mua gói.
* **Slice 5, khu admin**: người dùng, kiểm duyệt, gói, danh mục, quyền, đơn, doanh thu.
* **Slice 6, tài khoản và hoàn thiện**: khôi phục mật khẩu, hồ sơ cá nhân, bản đồ.

Hết giờ giữa chừng thì dừng ở bất kỳ giai đoạn nào cũng còn một bản demo chạy được.

## Deferred

Ngoài phạm vi lần này, giữ lại để kế hoạch còn trung thực.

* **Chế độ tối**: giao diện tối cho mọi màn hình · needs a decision
* **Chọn nơi chạy khi demo trên mạng (hosting)**: chọn nơi đặt FE và API trước khi demo online. Cookie đăng nhập là `SameSite=Strict`, nên hai nơi khác site cần proxy; xem mục "If hosting changes" trong spec 0001 · needs a decision
* **Chờ backend, chưa có API nên đừng dựng màn hình**: lịch sử kiểm duyệt, kháng nghị khi bị ẩn tin, danh sách đang theo dõi, thông báo, thống kê cho chủ trọ, đổi email, ảnh đại diện, xóa tài khoản, đổi thứ tự ảnh.
* **Backend đã bỏ khỏi kế hoạch, đừng làm**: duyệt tin trước khi hiện, VNPay, xác thực chủ trọ bằng giấy tờ, báo cáo tin xấu, đẩy tin và tin nổi bật, quảng cáo, dashboard thu chi, tìm quanh một địa điểm.

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
