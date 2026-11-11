# 0017. Rationale: Phí và tiện ích trong biểu mẫu tạo nhà trọ

Build spec nằm ở [index.md](index.md). File này giữ phần lý do: bối cảnh, các phương án đã cân nhắc, và những quyết định tôi tự chốt.

## Context

> ⚠️ Premise note: Scope #11 ghi "thêm, sửa, xóa phí và tiện ích được", nhưng biểu mẫu sửa nhà trọ chưa tồn tại, vì nó thuộc #12. Spec này chỉ làm biểu mẫu tạo, nên "sửa" và "xóa" mới đúng trong lúc điền (đổi và bỏ từng dòng trước khi lưu), chưa đúng với một nhà trọ đã lưu. Nếu giữ nguyên điều kiện hoàn thành của #11, nó không đóng được khi #12 chưa xong. Cách đúng là ghi phần "sửa nhà trọ đã lưu" vào #12 và để #11 đóng khi biểu mẫu tạo có phí và tiện ích.

Backend giữ phí và tiện ích ở nhà trọ, không ở tin: chủ trọ khai một lần, mọi tin của nhà trọ dùng lại. `POST /properties` nhận `fees` (tối đa 6 khoản, mỗi loại một lần, mỗi khoản có `kind`, `price` từ 0 đến 100.000.000, `unit`, `note` tối đa 100 ký tự) và `amenityKeys` (tối đa 30 khóa lấy từ `GET /amenities`, hiện có 13 mục mẫu). Backend không ràng buộc loại phí với đơn vị, nên điện tính "mỗi tháng" hay internet tính "mỗi kWh" đều qua. Khi sửa, `fees` và `amenityKeys` thay cả danh sách, nên biểu mẫu sửa sau này phải gửi lại danh sách đầy đủ.

Trang chi tiết tin đã vẽ phí và tiện ích (`PropertyZone`, commit `644d557`), nhưng biểu mẫu tạo chỉ có tên, địa chỉ và phường, nên không nhà trọ nào có phí hay tiện ích để hiện, trừ dữ liệu seed. Không quyết thì chủ trọ không khai được chi phí thật, và trang tin vẫn trống ở phần đó.

Biểu mẫu này còn là chỗ chung của ba việc. Spec 0011 (bản đồ, chưa xây) thêm vùng "Vị trí" sau "Địa chỉ" và đã dặn rằng #11 thêm vùng của mình sau đó. #12 sẽ dùng lại các ô nhập cho trang sửa. Ô chọn phường (spec 0015) đã có và biểu mẫu đọc danh mục phường ở trình duyệt bằng một truy vấn giữ cả lượt truy cập. Chủ trọ dùng điện thoại nhiều, nên một dòng phí bốn ô phải xếp dọc được và mọi nút phải đủ lớn để chạm.

## Options considered

Các quyết định có nhiều đường đi hợp lý được cân nhắc riêng. Với mỗi quyết định, phương án đầu là phương án được chọn.

### A. Phạm vi của phần biểu mẫu

**Option 1: Chỉ biểu mẫu tạo, ô nhập dùng lại được.** Thêm hai vùng vào biểu mẫu tạo. Các ô, lược đồ và hàm dựng body không tự giữ mặc định, để #12 nối PATCH. Spec 0011 đã làm đúng như vậy với bản đồ.
- Pros: phạm vi vừa, kiểm được từng lớp, #12 không phải viết lại ô nhập.
- Cons: chưa sửa được phí của nhà trọ đã tạo cho đến khi #12 xong.

**Option 2: Làm luôn trang sửa nhà trọ.** Thêm route sửa, đọc `GET /properties/:id`, gửi `PATCH` với danh sách đầy đủ.
- Pros: "sửa" trong điều kiện hoàn thành của #11 đúng ngay.
- Cons: kéo trước một phần lớn của #12 (chưa có danh sách nhà trọ để đi vào trang sửa), phạm vi phình, và #33 cũng cần trang đó.

### B. Cách khai phí

**Option 1: Nhấn "Thêm khoản phí" để thêm dòng, loại đã chọn bị ẩn khỏi ô chọn.** Đúng lời của điều kiện hoàn thành trong scope. Dòng thêm, đổi loại và xóa tự do.
- Pros: chỉ hiện những gì chủ trọ khai, loại không thể trùng, khớp luật "mỗi loại một lần", có sẵn mẫu `useFieldArray`.
- Cons: nhiều thao tác hơn một danh sách cố định nếu chủ trọ khai cả sáu loại; cần xử lý tiêu điểm khi thêm và xóa.

**Option 2: Sáu dòng cố định, mỗi dòng có công tắc bật tắt.** Loại không đổi được, nên không thể trùng.
- Pros: không có chuyện thêm xóa và đổi chỗ, mọi loại luôn hiện.
- Cons: sáu dòng chiếm chỗ dù chủ trọ chỉ khai hai loại, và trái lời "loại phí đã chọn bị ẩn khỏi danh sách chọn" trong scope.

**Option 3: Một bảng sáu hàng.** Cột loại, giá, đơn vị, ghi chú.
- Pros: gọn và dễ so sánh trên máy tính.
- Cons: bảng bốn cột không vừa màn hình 320 px, cần một bố cục thứ hai cho điện thoại.

### C. Đơn vị của khoản phí

**Option 1: Chọn tự do trong năm đơn vị, có mặc định theo loại.** Điện mặc định kWh, nước m³, giữ xe mỗi xe mỗi tháng, ba loại còn lại mỗi tháng.
- Pros: bao được mọi cách tính có thật (nước theo người, dịch vụ theo người, điện khoán theo tháng), không đặt luật mà backend không có.
- Cons: cho phép cặp vô lý như internet mỗi kWh.

**Option 2: Mỗi loại một danh sách đơn vị hợp lý.**
- Pros: ít chọn nhầm, ô chọn gọn hơn.
- Cons: chặn những cách tính có thật, và FE phải tự giữ một luật mà backend cố ý để mở.

**Option 3: Một đơn vị cố định cho mỗi loại, không có ô chọn.**
- Pros: đơn giản nhất.
- Cons: nước chỉ tính được theo m³, không khai được theo người, trong khi nhà trọ thực tế hay tính theo đầu người.

### D. Kiểu chọn tiện ích

**Option 1: Lưới ô tích (checkbox).** Hai cột trên điện thoại, nhiều cột hơn từ `sm`.
- Pros: thấy hết một lần, ô tích gốc nên bàn phím và trình đọc màn hình chạy đúng không cần thêm gì, vừa với 30 mục.
- Cons: dài hơn nếu danh mục lên đến hàng chục mục.

**Option 2: Thẻ bật tắt (nút dạng thẻ).**
- Pros: giống cách trang tin hiện tiện ích.
- Cons: trạng thái chọn phải đọc qua `aria-pressed`, dễ sai hơn ô tích, và thẻ không cho thấy rõ "đã chọn" ở chữ đen trắng.

**Option 3: Ô chọn nhiều có tìm kiếm (popover).**
- Pros: gọn khi danh sách rất dài.
- Cons: với 13 đến 30 mục nó chỉ giấu lựa chọn đi và cần thêm một thành phần chọn nhiều chưa có trong dự án.

### E. Khi danh mục tiện ích đọc lỗi

**Option 1: Báo lỗi trong vùng tiện ích kèm "Thử lại", vẫn cho tạo nhà trọ.**
- Pros: tiện ích không bắt buộc nên không chặn việc chính; lỗi nằm đúng chỗ.
- Cons: chủ trọ có thể tạo nhà trọ thiếu tiện ích mà không để ý, và phải chờ #12 để bổ sung.

**Option 2: Chặn nút tạo cho đến khi tải được.**
- Pros: không ai vô tình bỏ sót tiện ích.
- Cons: một lỗi đọc danh mục làm cả biểu mẫu kẹt, trong khi tiện ích là phần không bắt buộc.

### F. Trạng thái ban đầu của vùng phí

**Option 1: Trống, có nút "Thêm khoản phí".**
- Pros: phí không bắt buộc, nên không có dòng nào để xóa hay điền thừa.
- Cons: chủ trọ nào cũng có điện và nước phải bấm thêm hai lần.

**Option 2: Sẵn hai dòng điện và nước.**
- Pros: gần như nhà trọ nào cũng có hai khoản này, đỡ bấm.
- Cons: dòng để trống giá phải thành lỗi hoặc bị bỏ lặng lẽ (cả hai đều khó chịu), và biểu mẫu vừa mở đã có chỗ sai.

## Rationale

Chọn Option 1 ở mọi quyết định, vì chúng cùng một hướng: làm đúng điều backend cho phép, không đặt thêm luật mà backend không có, và giữ phạm vi vừa để #12 và #33 còn việc của mình.

Về phạm vi, biểu mẫu sửa nhà trọ chưa có và cần danh sách nhà trọ của #12 để đi vào, nên kéo nó về đây làm hai spec ôm nhau. Spec 0011 đã đi đúng đường đó với bản đồ, và giữ ô nhập không có mặc định riêng là cách rẻ nhất để #12 dùng lại. Về cách khai phí và đơn vị, backend cố ý không ràng buộc loại với đơn vị và scope đã nêu loại đã chọn phải ẩn, nên dòng thêm bằng nút với đơn vị tự do và mặc định thông minh vừa khớp hợp đồng vừa không chặn cách tính có thật. Lưới ô tích thắng vì với 13 đến 30 mục, ô tích gốc cho đúng hành vi bàn phím và trình đọc màn hình mà không cần thành phần mới.

Phí và tiện ích đều không bắt buộc, nên mọi lỗi liên quan phải thất bại nhẹ nhàng: danh mục lỗi không chặn việc tạo, dòng trống giá bị báo lỗi chứ không bị bỏ. Chủ trọ đã nói muốn vùng phí mở ra trống, vì thế dòng ban đầu không có.

## Decisions I made (RECOMMEND items)

Các quyết định nhỏ hơn không hỏi kỹ sư, mỗi cái ghi lựa chọn, lý do một dòng, và phương án thứ hai.

| Quyết định | Chọn | Vì sao | Phương án thứ hai |
|---|---|---|---|
| Đọc danh mục tiện ích ở đâu | Trình duyệt, bằng `useQuery` kiểu `useWards`, `auth: "none"`, `staleTime: Infinity` | Biểu mẫu là client và đứng sau đăng nhập, không có lần vẽ máy chủ nào cần tên tiện ích; cùng mẫu với phường nên dễ đọc | Đọc ở máy chủ bằng `use cache` rồi truyền xuống như prop (spec 0001 cho phép), nhưng trang này không có Server Component đọc danh mục |
| Chỗ đặt mã đọc danh mục | `src/features/amenities/` riêng | #12 và các nơi khác (admin) cũng cần, như `features/wards` | Đặt trong `features/property` |
| Hai mảng trong body | Luôn gửi cả hai, kể cả rỗng | Một hàm dựng body phục vụ cả tạo lẫn PATCH, và mảng rỗng là "xóa hết" | Bỏ mảng rỗng khi tạo, nhưng PATCH vẫn cần `[]`, nên có hai đường |
| Chỗ đặt phần hiển thị dùng chung | `FeeList` và `AmenityList` trong `features/property/components`, trang tin nhập vào | Nhà trọ là chủ của dữ liệu này; trang tin đã nhập từ feature khác nhiều lần | `src/components/property`, nhưng `src/components` dành cho thành phần chung của giao diện, không phải của một thực thể |
| Cấp tiêu đề của phần dùng chung | Nhận một prop cấp: `h2` ở trang tin, `h3` ở màn kết quả | Màn kết quả đã có `h2` "Đã tạo nhà trọ", không được nhảy cấp | Hai bản sao của từng phần |
| Tiêu điểm sau khi thêm hoặc xóa dòng | Thêm: vào ô "Loại phí" của dòng mới. Xóa: về nút "Thêm khoản phí" | Dòng vừa xóa không còn để đứng; nút thêm là chỗ ổn định, người dùng bàn phím không bị rơi ra đầu trang | Về ô của dòng trước |
| Báo trạng thái | Một vùng `role="status"` cho thêm và xóa dòng, và một cho số ô tích | Người dùng trình đọc màn hình cần biết thao tác có chạy | Không báo, nhưng thao tác im lặng |
| Trần 30 tiện ích | Tắt các ô chưa tích khi đủ 30, kèm dòng chữ | Chặn sớm thay vì chờ lỗi 400; admin có thể thêm tiện ích vượt 13 mẫu | Không chặn và để lược đồ báo lỗi |
| Thứ tự khóa tiện ích | Theo thứ tự danh mục | Body ổn định giữa các lần gửi, không phụ thuộc thứ tự bấm | Theo thứ tự bấm |
| `AMENITY_UNKNOWN` | Đọc lại danh mục, bỏ ô đã gỡ, giữ các ô còn lại, báo bằng một dòng | Giống cách `WARD_UNKNOWN` đang xử lý; chủ trọ không mất công điền lại | Chỉ báo lỗi, để chủ trọ tự tìm ô sai |
| Chiều dài ô giá | Tối đa 9 ký tự | 100.000.000 có chín chữ số, giống ô giá của spec 0016 | Không giới hạn và để lược đồ báo |
| Dòng đọc số dưới ô giá | Chỉ số tiền ("3.800 ₫", "Miễn phí"), không kèm đơn vị | Đơn vị đã có ô chọn riêng ngay cạnh | Đọc cả "3.800 ₫ mỗi kWh" bằng `formatFee` |
| Lược đồ cho #33 gộp | Xuất `feesSchema` và `amenityKeysSchema` riêng | Spec 0011 sẽ biến lược đồ thành `createPropertySchema(wards)`, gộp hai mảnh này bằng một dòng | Viết thẳng vào `propertySchema` và gộp tay |
| Hình dạng thư mục spec | Thư mục `index.md` cộng `rationale.md` | Spec có nhiều tiêu chí và cần chỗ cho `verify.md` của `/develop` | Một file như spec 0015 |
| Ngôn ngữ của spec | Tiếng Việt, tiêu đề mục tiếng Anh | Kỹ sư chọn, giống các spec 0012, 0015, 0016 | Tiếng Anh |
