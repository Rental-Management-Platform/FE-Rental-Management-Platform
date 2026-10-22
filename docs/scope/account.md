# Account

Đăng ký, đăng nhập, khôi phục mật khẩu và hồ sơ cá nhân, dùng chung cho mọi loại tài khoản. Xem [index](index.md) để biết thứ tự toàn bộ.

## Slice 1: Vòng lặp lõi

### 5. Sign up and sign in · needs a decision · Beta
Đăng ký (chọn người đăng bài hoặc người tìm trọ, chọn một lần không đổi được; người đăng bài bắt buộc có số điện thoại), đăng nhập, đăng xuất, khôi phục phiên khi tải lại trang, ẩn hoặc làm mờ nút theo `permissions` của `/auth/me`. Đây là sợi đăng nhập thật của vòng lặp lõi. Mang nhãn Beta vì lỗi phiên rất khó thấy bằng mắt.
**Done when:** đăng ký và đăng nhập được cả hai loại tài khoản, tải lại trang vẫn còn phiên, `EMAIL_TAKEN`, `PHONE_TAKEN` và `ACCOUNT_LOCKED` hiện đúng chỗ, đăng xuất xóa phiên.
- [ ] Design it (spec): `/architect sign up and sign in`

## Slice 6: Tài khoản và hoàn thiện

### 27. Password recovery
Hai trang: xin liên kết (`/forgot-password`) và đặt lại (`/reset-password?token=...`, đường dẫn này cố định vì email trỏ thẳng vào). Mã trong liên kết được đọc rồi xóa khỏi thanh địa chỉ.
**Done when:** xin liên kết hiện cùng một câu cho mọi email, đặt lại thành công thì về trang đăng nhập, liên kết hỏng (`RESET_TOKEN_INVALID`) có nút xin liên kết mới.
- [ ] Build it: `/develop password recovery`

### 28. My profile and change password
Trang tài khoản chung cho mọi loại: xem và sửa tên, số điện thoại (người đăng bài không được xóa số), đổi mật khẩu, đăng xuất mọi thiết bị. Email, loại tài khoản và ngày tham gia chỉ đọc.
**Done when:** lưu hồ sơ cập nhật ngay tên trên thanh trên cùng, `PHONE_TAKEN` hiện ở ô số, đổi mật khẩu báo rõ các thiết bị khác sẽ phải đăng nhập lại, `CURRENT_PASSWORD_WRONG` hiện ở ô mật khẩu hiện tại.
- [ ] Build it: `/develop my profile and change password`
