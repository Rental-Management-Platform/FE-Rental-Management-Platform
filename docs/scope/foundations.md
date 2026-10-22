# Foundations

Nền tảng kỹ thuật và thiết kế mà mọi tính năng sau dựa vào. Xem [index](index.md) để biết thứ tự toàn bộ.

## Foundation

### 1. Stack & architecture · done
Khung `create-next-app` đã có (Next.js 16.4.2, React 19.3, Tailwind 4, TypeScript, ESLint) nhưng quyết định chưa được ghi lại. Cần chốt cách trang lấy dữ liệu và giữ phiên khi access token chỉ nằm trong bộ nhớ: trang công khai cần SEO, nhưng số điện thoại, nút tim và nút theo dõi cần biết người dùng là ai. Cũng chốt cổng chạy của FE khác cổng 3000 mặc định của API, và dùng `localhost` ở cả hai bên.
**Done when:** quyết định được ghi vào spec, `next dev` chạy ở cổng khớp `ALLOWED_ORIGINS` của backend, trình duyệt gọi được API không bị chặn CORS, và build sạch.
- [x] Decide the stack (spec): `/architect stack & architecture`
- [x] Scaffold from the decision: `/develop stack & architecture`
- [x] Verify it: `/check verify stack & architecture` (12 trên 15 bước đạt, 3 bước chờ tính năng 3, 8 và cách đọc API từ server; đã ghi trong `verify.md`, đóng `done` theo ý bạn)
spec [0001](../specs/0001-stack-and-architecture/index.md) · code in `./`. `AGENTS.md` nhắc bản Next.js này có thay đổi lớn so với những gì bạn quen, hãy đọc docs đi kèm trong `node_modules/next/dist/docs/` trước khi viết code.

### 2. Coding standards & tooling · in-progress
Ghi quy ước và công cụ kiểm tra mã vào `AGENTS.md` từ dự án thật, rồi cài đặt. Hiện `AGENTS.md` mới chỉ có lời nhắc về Next.js.
**Done when:** `AGENTS.md` phản ánh đúng stack thật, lint và format chạy sạch.
- [ ] Capture conventions + tooling choices: `/audit`
- [x] Install the tooling: `/develop tooling` (Prettier + Tailwind class sorting, `eslint-config-prettier`, scripts `typecheck`, `format`, `format:check`, `check`; hook `husky` chạy `npm run check` trước mỗi commit, đã thử chặn một commit lỗi lint; `npm run check` đạt)
- [x] Check it runs clean: `/check verify tooling` (đạt: lint, typecheck, format, build, hook, clone sạch; còn một dòng cũ trong mục Tooling của `AGENTS.md` cần `/sync`)
code in `./` (`.prettierrc.json`, `.prettierignore`, `.gitattributes`, `eslint.config.mjs`, `.husky/pre-commit`, `package.json`). Chưa có spec: đây là việc công cụ, không cần quyết định. `/audit` đã chạy và `AGENTS.md` đã có quy ước, ô của nó chờ bạn tick (hoặc `/sync` đối chiếu).

### 3. API client & session layer · in-progress
Một lớp gọi API duy nhất cho cả ứng dụng: đọc lỗi thống nhất theo `code` và `errors[].field`, giữ access token trong bộ nhớ, tự refresh đúng một lần khi gặp `TOKEN_EXPIRED` rồi gửi lại, đọc `Retry-After` khi gặp 429, lấy quyền từ `GET /auth/me`. Đây là phần tương đương mô hình dữ liệu của FE: dữ liệu thật nằm ở backend, hợp đồng là `api-for-frontend.md`.
**Done when:** một màn hình gọi được API công khai và API cần đăng nhập qua cùng một client, token hết hạn thì refresh đúng một lần dù nhiều request cùng lỗi, lỗi 400 hiện theo từng ô, 429 hiện thời gian chờ.
- [x] Design it (spec): `/architect API client & session layer`
- [ ] Build it: `/develop API client & session layer`
  - [x] M1 Luồng gọi API công khai: kiểu dữ liệu, lỗi, client chế độ `none`, trang thử `/dev/session` gọi `GET /plans` (AC-1, AC-2, AC-9, AC-10, AC-14)
  - [x] M2 Luồng đăng nhập: phiên giữ token trong closure, `signIn` và `signUp`, `AuthProvider`, `useSession`, `useApi`, chế độ `required` (AC-1, AC-3, AC-12, AC-13, AC-14)
  - [x] M3 Giữ phiên sống: refresh dùng chung, thử lại đúng một lần, khôi phục khi mở trang, chế độ `optional`, bảng `session.debug` cho dev (AC-4 đến AC-7)
  - [ ] M4 Lỗi người dùng nhìn thấy: lỗi 400 hiện theo từng ô, thời gian chờ 429 đếm ngược, chính sách thử lại của query (AC-8 đến AC-10)
  - [ ] M5 Kết thúc phiên gọn gàng: `signOut`, `signOutAll`, lý do mất phiên, xóa cache khi đổi người (AC-11, AC-12, AC-14)
- [ ] Verify it: `/check verify API client & session layer` (cần backend chạy với `ACCESS_TTL_SECONDS=60`)
spec [0002](../specs/0002-api-client-and-session-layer/index.md) · code in `src/lib/api/`, `src/lib/session/`, `src/app/dev/session/`. Trang `/dev/session` là trang thử tạm, xóa khi tính năng 5 có đăng nhập thật.

### 4. Design system & UI foundation · needs a decision
Ngôn ngữ nhìn, màu, chữ (hiện đúng tiếng Việt có dấu), khoảng cách, các thành phần nền, và ba khung trang: công khai (điện thoại trước), khu chủ trọ và khu admin (máy tính trước). Thiết kế dựng trong Figma qua MCP rồi mới viết mã. Điểm xuất phát đã tra được: Simple Design System (bảng, phân trang, thẻ thống kê, thẻ bảng giá) và Material 3 Design Kit (ô tìm kiếm, chip lọc, thẻ tin, thanh dưới). Biểu đồ, bản đồ, ô tải ảnh và ô chọn ngày chưa có sẵn nên phải tự thiết kế.
**Done when:** Figma có token, thành phần nền và bốn màn hình mẫu (danh sách tin, chi tiết tin, quản lý tin của chủ trọ, bảng người dùng admin) đã được bạn duyệt; mã có token và thành phần khớp; độ tương phản đạt WCAG AA; có trạng thái trống, đang tải, lỗi và bị giới hạn tần suất.
- [ ] Design it (spec): `/architect design system & UI foundation`
Figma https://www.figma.com/design/cdrAcD1PywM8IWdVRt7X0o
