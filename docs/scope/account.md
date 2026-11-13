# Account

Đăng ký, đăng nhập, khôi phục mật khẩu và hồ sơ cá nhân, dùng chung cho mọi loại tài khoản. Xem [index](index.md) để biết thứ tự toàn bộ.

## Slice 1: Vòng lặp lõi

### 5. Sign up and sign in · done · Beta
Đăng ký (chọn người đăng bài hoặc người tìm trọ, chọn một lần không đổi được; người đăng bài bắt buộc có số điện thoại), đăng nhập, đăng xuất, khôi phục phiên khi tải lại trang, ẩn hoặc làm mờ nút theo `permissions` của `/auth/me`. Đây là sợi đăng nhập thật của vòng lặp lõi. Mang nhãn Beta vì lỗi phiên rất khó thấy bằng mắt.
**Done when:** đăng ký và đăng nhập được cả hai loại tài khoản, tải lại trang vẫn còn phiên, `EMAIL_TAKEN`, `PHONE_TAKEN` và `ACCOUNT_LOCKED` hiện đúng chỗ, đăng xuất xóa phiên.
- [x] Design it (spec): `/architect sign up and sign in`
- [x] Build it: `/develop sign up and sign in`
  - [x] M1 Sợi chỉ mỏng: đăng nhập thật từ đầu đến cuối: `safeNextPath`, `PasswordInput`, `LoginForm`, trang `/login` có thông báo thử lại khi không kiểm tra được phiên (AC-1, AC-2, AC-7, AC-8, AC-15, AC-16)
  - [x] M2 Đăng ký: chọn loại tài khoản trước, kiểm sơ bộ, `RegisterForm`, trang `/register`, thứ tự focus của lỗi máy chủ (AC-3 đến AC-6, AC-13)
  - [x] M3 Cổng chặn trang và trạng thái phiên: `RequireSession` ngoài khung trang của khu chủ trọ và admin, lời nhắn khi phiên mất, trạng thái "Không kiểm tra được tài khoản" kèm Thử lại, hai trang thử `dev-check`, đăng xuất và nút đầu trang mang `next` (AC-9 đến AC-13)
  - [x] M4 `Can` và dọn dẹp: thành phần `Can` (chỉ ẩn), xóa `/dev/session` cùng nút gỡ lỗi của phiên, ghi chú sửa spec 0002 và 0003 (AC-14, AC-17)
  - [x] M5 Cổng kiểm: `npm run check`, `npm run build`, console sạch ở `/login` và `/register` (AC-1, AC-17)
- [x] Verify it: `/check verify sign up and sign in` (cần backend chạy, thêm `ACCESS_TTL_SECONDS=60` cho phần phiên mất)
- [x] Test it: `/test sign up and sign in` (Beta: `safeNextPath`, các schema, các bước chuyển của cổng, `createSession` với `fetch` giả)
spec [0005](../specs/0005-sign-up-and-sign-in/index.md) · Chọn: một trang đăng ký (chọn loại trước), về trang đang muốn vào qua `?next=`, cổng chặn phía trình duyệt đặt ngoài khung trang, báo "Không kiểm tra được tài khoản" kèm Thử lại, nút hiện mật khẩu thay ô nhập lại, `Can` luôn ẩn theo quyền, đăng xuất ở nguyên trang công khai, xóa `/dev/session`. Code in `src/features/auth/`, `src/lib/next-path.ts`, `src/lib/session/messages.ts`, `src/components/can.tsx`, `src/components/form/password-input.tsx`, `src/app/(auth)/{login,register}/`, `src/app/(landlord)/` và `src/app/(admin)/` (layout có cổng và trang `dev-check`).

## Slice 6: Tài khoản và hoàn thiện

### 27. Password recovery
Hai trang: xin liên kết (`/forgot-password`) và đặt lại (`/reset-password?token=...`, đường dẫn này cố định vì email trỏ thẳng vào). Mã trong liên kết được đọc rồi xóa khỏi thanh địa chỉ.
**Done when:** xin liên kết hiện cùng một câu cho mọi email, đặt lại thành công thì về trang đăng nhập, liên kết hỏng (`RESET_TOKEN_INVALID`) có nút xin liên kết mới.
- [x] Build it: `/develop password recovery` (không có spec riêng: xây theo `api-for-frontend.md` mục 6.7, 6.8 và phần "Quên mật khẩu" của mục 7, cùng việc spec 0005 để lại cho dòng này)
code in `src/features/auth/` (`api/password-recovery.ts`, `schemas/fields.ts` (thêm `passwordField`, dùng chung với đăng ký), `schemas/forgot-password-schema.ts`, `schemas/reset-password-schema.ts`, `components/forgot-password-form.tsx`, `components/reset-password-form.tsx`, `components/reset-link-invalid.tsx`, `components/login-form.tsx` (dòng "Quên mật khẩu?")), `src/app/(auth)/forgot-password/page.tsx`, `src/app/(auth)/reset-password/page.tsx`
quyết định khi xây (không có spec): hai trang nằm trong nhóm `(auth)` nhưng không dùng `useAuthPage`, nên người đang đăng nhập vẫn mở được (liên kết trong email có thể mở ở trình duyệt đang đăng nhập); trang xin liên kết hiện đúng câu `message` của backend, thay biểu mẫu bằng một thông báo nhận focus, kèm "Gửi lại hoặc đổi email" (biểu mẫu quay lại với email còn nguyên) và không nói gì thêm về việc email có tài khoản hay không; 429 dùng chung đếm ngược của `FailureNotice`; mật khẩu mới dùng nút hiện mật khẩu thay ô nhập lại (cùng mẫu với đăng ký, spec 0005), dù hợp đồng gợi ý thêm một ô nhập lại.
  - [x] M1 Xin liên kết: trang `/forgot-password`, biểu mẫu email, thông báo cùng một câu cho mọi email, 429, dòng "Quên mật khẩu?" ở trang đăng nhập
  - [x] M2 Đặt lại mật khẩu: trang `/reset-password`, đọc mã rồi xóa khỏi thanh địa chỉ, mật khẩu mới, `RESET_TOKEN_INVALID` kèm nút xin liên kết mới, thành công thì về trang đăng nhập (chưa thử được nhánh thành công với một mã thật, vì mã chỉ có trong email; đã thử bằng mã giả: mã bị xóa khỏi thanh địa chỉ, `RESET_TOKEN_INVALID` thật từ backend, không có mã, kiểm tra ô mật khẩu)

### 28. My profile and change password
Trang tài khoản chung cho mọi loại: xem và sửa tên, số điện thoại (người đăng bài không được xóa số), đổi mật khẩu, đăng xuất mọi thiết bị. Email, loại tài khoản và ngày tham gia chỉ đọc.
**Done when:** lưu hồ sơ cập nhật ngay tên trên thanh trên cùng, `PHONE_TAKEN` hiện ở ô số, đổi mật khẩu báo rõ các thiết bị khác sẽ phải đăng nhập lại, `CURRENT_PASSWORD_WRONG` hiện ở ô mật khẩu hiện tại.
- [ ] Build it: `/develop my profile and change password`
