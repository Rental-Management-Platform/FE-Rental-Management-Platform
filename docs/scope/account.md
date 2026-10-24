# Account

Đăng ký, đăng nhập, khôi phục mật khẩu và hồ sơ cá nhân, dùng chung cho mọi loại tài khoản. Xem [index](index.md) để biết thứ tự toàn bộ.

## Slice 1: Vòng lặp lõi

### 5. Sign up and sign in · in-progress · Beta
Đăng ký (chọn người đăng bài hoặc người tìm trọ, chọn một lần không đổi được; người đăng bài bắt buộc có số điện thoại), đăng nhập, đăng xuất, khôi phục phiên khi tải lại trang, ẩn hoặc làm mờ nút theo `permissions` của `/auth/me`. Đây là sợi đăng nhập thật của vòng lặp lõi. Mang nhãn Beta vì lỗi phiên rất khó thấy bằng mắt.
**Done when:** đăng ký và đăng nhập được cả hai loại tài khoản, tải lại trang vẫn còn phiên, `EMAIL_TAKEN`, `PHONE_TAKEN` và `ACCOUNT_LOCKED` hiện đúng chỗ, đăng xuất xóa phiên.
- [x] Design it (spec): `/architect sign up and sign in`
- [ ] Build it: `/develop sign up and sign in`
  - [x] M1 Sợi chỉ mỏng: đăng nhập thật từ đầu đến cuối: `safeNextPath`, `PasswordInput`, `LoginForm`, trang `/login` có thông báo thử lại khi không kiểm tra được phiên (AC-1, AC-2, AC-7, AC-8, AC-15, AC-16)
  - [x] M2 Đăng ký: chọn loại tài khoản trước, kiểm sơ bộ, `RegisterForm`, trang `/register`, thứ tự focus của lỗi máy chủ (AC-3 đến AC-6, AC-13)
  - [x] M3 Cổng chặn trang và trạng thái phiên: `RequireSession` ngoài khung trang của khu chủ trọ và admin, lời nhắn khi phiên mất, trạng thái "Không kiểm tra được tài khoản" kèm Thử lại, hai trang thử `dev-check`, đăng xuất và nút đầu trang mang `next` (AC-9 đến AC-13)
  - [ ] M4 `Can` và dọn dẹp: thành phần `Can` (chỉ ẩn), xóa `/dev/session` cùng nút gỡ lỗi của phiên, ghi chú sửa spec 0002 và 0003 (AC-14, AC-17)
  - [ ] M5 Cổng kiểm: `npm run check`, `npm run build`, console sạch ở `/login` và `/register` (AC-1, AC-17)
- [ ] Verify it: `/check verify sign up and sign in` (cần backend chạy, thêm `ACCESS_TTL_SECONDS=60` cho phần phiên mất)
- [ ] Test it: `/test sign up and sign in` (Beta: `safeNextPath`, các schema, các bước chuyển của cổng, `createSession` với `fetch` giả)
spec [0005](../specs/0005-sign-up-and-sign-in/index.md) · Chọn: một trang đăng ký (chọn loại trước), về trang đang muốn vào qua `?next=`, cổng chặn phía trình duyệt đặt ngoài khung trang, báo "Không kiểm tra được tài khoản" kèm Thử lại, nút hiện mật khẩu thay ô nhập lại, `Can` luôn ẩn theo quyền, đăng xuất ở nguyên trang công khai, xóa `/dev/session`. Đường dẫn mã do `/develop` thêm.

## Slice 6: Tài khoản và hoàn thiện

### 27. Password recovery
Hai trang: xin liên kết (`/forgot-password`) và đặt lại (`/reset-password?token=...`, đường dẫn này cố định vì email trỏ thẳng vào). Mã trong liên kết được đọc rồi xóa khỏi thanh địa chỉ.
**Done when:** xin liên kết hiện cùng một câu cho mọi email, đặt lại thành công thì về trang đăng nhập, liên kết hỏng (`RESET_TOKEN_INVALID`) có nút xin liên kết mới.
- [ ] Build it: `/develop password recovery`

### 28. My profile and change password
Trang tài khoản chung cho mọi loại: xem và sửa tên, số điện thoại (người đăng bài không được xóa số), đổi mật khẩu, đăng xuất mọi thiết bị. Email, loại tài khoản và ngày tham gia chỉ đọc.
**Done when:** lưu hồ sơ cập nhật ngay tên trên thanh trên cùng, `PHONE_TAKEN` hiện ở ô số, đổi mật khẩu báo rõ các thiết bị khác sẽ phải đăng nhập lại, `CURRENT_PASSWORD_WRONG` hiện ở ô mật khẩu hiện tại.
- [ ] Build it: `/develop my profile and change password`
