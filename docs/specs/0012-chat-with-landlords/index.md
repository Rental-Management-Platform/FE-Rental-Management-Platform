# 0012. Chat với chủ trọ: nhắn tin giữa người tìm trọ và chủ trọ

**Date**: 2026-11-07
**Status**: In Progress

## Summary

Tính năng này cho người tìm trọ nhắn cho chủ trọ từ trang chi tiết tin, và cho chủ trọ trả lời từ hộp thư. Backend chưa có kênh đẩy, nên giao diện tự hỏi lại vài giây một lần (polling) và nối tin mới vào danh sách theo số thứ tự `seq`. Mỗi bên có đường dẫn riêng: người tìm trọ vào `/tin-nhan` trong khung công khai, chủ trọ vào `/landlord/tin-nhan` trong khu chủ trọ, nhưng cả hai dùng chung một bộ màn hình. Không thêm thư viện, bảng dữ liệu hay biến môi trường nào.

## Requirements

Lấy từ mục #34 của scope và chốt cùng người làm dự án. Hợp đồng với backend: `api-for-frontend.md` mục 3 (giới hạn tần suất), 6.39 (bảy API chat), 7 ("Chat với chủ trọ và hộp thư"), A.9 và Phụ lục B. Mẫu cần theo: spec 0002 (client, phiên, xóa bộ nhớ khi phiên đổi), 0003 và 0004 (thành phần, vùng thẻ, chữ), 0005 (lớp chặn đăng nhập `RequireSession`, `authHref`), 0007 (`mediaUrl`), 0008 (khung làm việc, công cụ và thẻ dashboard), 0009 (`ListPagination`, `robots.ts`), 0010 (thẻ liên hệ ở trang chi tiết tin).

**User stories**:
- Là người tìm trọ trên điện thoại, tôi muốn nhắn hỏi chủ trọ ngay từ trang tin ("Phòng còn trống không ạ?") và thấy câu trả lời hiện ra sau vài giây.
- Là người tìm trọ, tôi muốn mở lại đúng cuộc trò chuyện cũ khi quay lại một tin tôi đã nhắn, thay vì bắt đầu lại.
- Là chủ trọ, tôi muốn thấy ai đang hỏi tin nào, biết cuộc nào chưa đọc, và trả lời ngay từ khu làm việc.
- Là người dùng chat, tôi muốn cái chỉ báo chưa đọc ở đầu trang cho biết có tin mới mà không phải mở hộp thư.
- Là người dùng bàn phím hoặc trình đọc màn hình, tôi muốn tin mới của bên kia được đọc lên và ô soạn dùng được trọn vẹn bằng phím.
- Là người gõ tiếng Việt bằng Telex hay VNI, tôi muốn phím Enter không gửi tin khi tôi mới chốt chữ.

**Acceptance criteria** (hợp đồng; mỗi tiêu chí kiểm được riêng):

- **AC-1**: Tuyến đường và lớp chặn. Hai bộ trang dùng chung các màn hình trong `src/features/chat/components/` (`InboxScreen`, `ThreadScreen`), mỗi bộ truyền vào địa chỉ gốc của mình:
  - Người tìm trọ: nhóm route mới `src/app/(tenant)/` có `layout.tsx` bọc `<RequireSession accountType="tenant"><PublicShell>{children}</PublicShell></RequireSession>` (lớp chặn nằm ngoài khung, giống nhóm `(landlord)`), cùng `error.tsx` và `not-found.tsx` như các nhóm khác. Trang: `/tin-nhan` và `/tin-nhan/[id]`.
  - Chủ trọ: `src/app/(landlord)/landlord/tin-nhan/page.tsx` và `.../[id]/page.tsx`, nằm trong layout `(landlord)` đã có (đã có lớp chặn `landlord` và `LandlordShell`).
  - Mỗi trang xuất `metadata` với tiêu đề "Tin nhắn" và `robots: { index: false, follow: false }`, và `export const instant = false` (như trang sửa tin, vì lớp chặn vẽ trạng thái chờ cho tới khi biết phiên). Trang con đọc `id` bằng `useParams` bên trong `<Suspense>`, đúng mẫu `edit-listing`. Trước khi viết trang, đọc hướng dẫn `useParams` và `instant` trong `node_modules/next/dist/docs/`.
  - HTML từ máy chủ chỉ có trạng thái chờ của lớp chặn, không có chữ nào của cuộc trò chuyện. Khách bị đưa tới `/login?next=` (lớp chặn có sẵn). Admin, hay người tìm trọ mở `/landlord/tin-nhan` và ngược lại, thấy `ForbiddenState` (lớp chặn có sẵn, không chuyển hướng).
  - `src/app/robots.ts` thêm `/tin-nhan` vào `disallow` (`/landlord` đã có). Không có trang chat nào trong sitemap.
- **AC-2**: Địa chỉ gốc và ai dùng chat. Hai hàm thuần trong `src/features/chat/`:
  - `chatBasePath(accountType)` trả `/tin-nhan` cho `tenant`, `/landlord/tin-nhan` cho `landlord`, `null` cho `admin`. Mọi liên kết chat (chỉ báo, menu tài khoản, công cụ chủ trọ, thẻ dashboard, dòng hộp thư, chuyển trang sau khi gửi tin đầu) dựng từ hàm này, không viết cứng ở chỗ khác.
  - `canUseChat(session)` đúng khi phiên là `user`, `accountType` là `tenant` hoặc `landlord`, và `can(session, "conversation:read")`. Khi sai, không có yêu cầu chat nào được gửi và không có chỉ báo nào được vẽ. Admin không bao giờ gọi một trong bảy API (họ nhận 403 cả bảy).
- **AC-3**: Nút "Nhắn cho chủ trọ" ở trang chi tiết tin. Một hàm thuần `toChatEntry(session, listing, lookup)` trong `chat-entry.ts` ra một giá trị `ChatEntry`, theo thứ tự này:
  1. Phiên đang `loading`: `checking`. Chỉ có một giao diện cho `checking`, dù vì phiên đang tải (bước này) hay vì đang dò cuộc trò chuyện (bước 4): một khung chờ (skeleton) cùng cỡ nút, để nút không nháy và khung không nhảy.
  2. Khách: `guest`. Hiện nút phụ "Nhắn cho chủ trọ" là liên kết tới `authHref("/login", path)` (đường dẫn chuẩn của tin), nằm dưới nút đăng nhập xem số điện thoại có sẵn.
  3. Người đang xem là chủ trọ của tin (`user.id` bằng `landlord.id`), admin, hay người thiếu `conversation:create` hoặc thiếu `conversation:read`: `none`, không vẽ gì (thẻ liên hệ giữ nguyên "Đây là tin của bạn" hay số điện thoại như spec 0010). Cần cả hai quyền, vì gửi xong người dùng được chuyển tới trang cuộc trò chuyện mà trang đó cần `conversation:read`; thiếu một quyền thì không để họ gửi rồi nhận 403.
  4. Còn lại: đọc `GET /me/conversations?listingId=<listing.id>&pageSize=1` (đang chờ: `checking`). Có phần tử: `existing` (nút "Xem tin nhắn của bạn", là liên kết tới trang cuộc trò chuyện). Không có phần tử, hoặc lần đọc lỗi: `new` (nút "Nhắn cho chủ trọ" mở hộp thoại AC-4).
  - Lần đọc dò này chỉ chạy khi trang mở và người xem đủ điều kiện, `staleTime` 30 giây. Khóa `["chat","by-listing",listingId]` giữ `ConversationItem` hoặc `null`: `queryFn` tự trả `items[0] ?? null` (không dùng `select`, để `setQueryData` ở AC-4 ghi đúng hình dạng). Nút không phụ thuộc lần đọc số điện thoại: số điện thoại lỗi không làm mất nút.
  - Cần thêm `id` và `title` của tin vào props của `ListingContact` (spec 0010); phần đọc số điện thoại giữ nguyên.
- **AC-4**: Hộp thoại tin đầu tiên (thành công). Dùng `Dialog` có sẵn, mở bằng `DialogTrigger` là chính nút `new` (nên Radix trả focus về nút khi đóng). Tiêu đề "Nhắn cho chủ trọ", mô tả nêu tên chủ trọ (`landlord.name`, không có thì "Chủ trọ") và tiêu đề tin. Một ô soạn theo luật AC-14, chữ gợi ý "Phòng còn trống không ạ?", nút "Gửi". Gửi gọi `POST /listings/:id/conversations` với `{ body }` (`id` là `listing.id`). Khi thành công, theo thứ tự: ghi `conversation` vào `["chat","conversation",id]` và vào `["chat","by-listing",listingId]` bằng `setQueryData` (`listingId` lấy từ `conversation.listing.id`), làm mới (invalidate) `["chat","inbox"]` và `["chat","unread"]`, đóng hộp thoại, rồi chuyển trang bằng `router.push` tới `chatBasePath(accountType)` nối với `/` và `conversation.id`. Trong lúc gửi, nút "Gửi" khóa và ô soạn `readOnly`, để bấm đúp không tạo hai tin (POST này không an toàn khi lặp). Đóng hộp thoại giữ bản nháp cho tới khi rời trang: vì Radix gỡ `DialogContent` khi đóng, `useForm` của ô soạn đặt ở thành phần cha bọc `Dialog` (ngoài `DialogContent`), không đặt bên trong.
- **AC-5**: Hộp thoại: lỗi. Giữ nguyên bản nháp ở mọi lỗi:
  - 400 `VALIDATION_FAILED` có `errors[].field` là `body`: hiện dưới ô soạn.
  - 404 `LISTING_NOT_FOUND`: dòng "Tin này vừa được ẩn hoặc xóa." trong hộp thoại, nút "Gửi" tắt, có nút đóng.
  - 409 `CANNOT_CHAT_WITH_SELF`: hiện `message` của lỗi trong hộp thoại.
  - 403 `PERMISSION_DENIED`: "Bạn không có quyền nhắn tin." (`ACCOUNT_LOCKED` đã do lớp phiên xử lý, spec 0002).
  - 429: đếm ngược bằng `formatWait` (chờ có thể tới 1 giờ), "Gửi" khóa tới khi hết.
  - Lỗi mạng, hết giờ, 5xx: hiện `describeError(...).message` trong hộp thoại, "Gửi" bấm lại được, không tự gửi lại.
- **AC-6**: Hộp thư: nội dung và hỏi lại. `InboxScreen` đọc `GET /me/conversations?page=<n>&pageSize=20` bằng khóa `["chat","inbox",page]`, vẽ `ul` các dòng là liên kết tới `${chatBasePath}/${id}`. Mỗi dòng: ảnh bìa (`mediaUrl(listing.coverImageUrl)`, `null` thì `ImagePlaceholder`), `listing.title`, tên bên kia (`otherUser.name`, `null` thì "Người dùng"), nội dung tin cuối cắt ngắn (tiền tố "Bạn: " khi `lastMessage.isMine`), nhãn giờ theo AC-13. Dòng có `unreadCount` lớn hơn 0 in đậm, có chấm, và tên truy cập của liên kết có thêm chữ "chưa đọc" cho trình đọc màn hình (không chỉ dựa vào màu). Hỏi lại theo luật AC-10, mỗi 10 giây, chỉ trang đang mở. Nội dung tin cuối là chữ thô, hiện bằng `{...}`.
- **AC-7**: Hộp thư: trang và trạng thái. Trang nằm trên địa chỉ `?page=` (Zod, mặc định 1, ngoài khoảng hoặc không phải số thì thành 1), chuyển trang bằng `ListPagination` (`itemLabel` "cuộc trò chuyện"). Khi `total` bằng 0: `EmptyState` có lời riêng cho từng loại tài khoản (người tìm trọ: bạn chưa nhắn cho chủ trọ nào, kèm nút "Tìm trọ" về `/`; chủ trọ: chưa có ai nhắn cho bạn). Trang vượt quá số trang (có `total` mà `items` rỗng): lời "Trang này không có cuộc trò chuyện" kèm liên kết về trang 1. Lỗi đọc: `ErrorState` có "Thử lại", và 429 hiện `RateLimitNotice` với đếm ngược.
- **AC-8**: Mở cuộc trò chuyện. `ThreadScreen` kiểm `id` là UUID trước khi gọi (sai: như AC-20, không gọi API), rồi đọc `GET /conversations/:id` (đầu trang, khóa `["chat","conversation",id]`) và `GET /conversations/:id/messages` không con trỏ, `limit=30` (khóa `["chat","messages",id]`, dữ liệu chỉ là mảng `ChatMessage[]` tăng dần theo `seq`; `lastSeq` của phản hồi không được lưu vì không tiêu chí nào dùng nó). Tin của mình (`isMine`) căn phải với màu `primary`, tin của bên kia căn trái với màu `muted`; nội dung hiện bằng `{body}` với `white-space: pre-wrap` và `break-words`, không bao giờ là HTML. Danh sách là một vùng `role="log"` có nhãn "Tin nhắn" (đây là vùng duy nhất được phép đọc nội dung tin lên, xem AC-22); vùng này chỉ được gắn vào sau khi đã có dữ liệu đầu tiên (khung chờ nằm ngoài vùng), để 30 tin đầu không bị đọc dồn. Mỗi tin có chữ ẩn cho trình đọc màn hình ("Bạn:" hay "<tên>:") và giờ. Khi vừa mở và đang có sẵn con trỏ chuột (`pointer: fine`) thì focus vào ô soạn; trên màn hình cảm ứng thì không tự focus (để bàn phím không bật lên). Có khung chờ (skeleton) trong lúc tải lần đầu.
- **AC-9**: Đầu trang cuộc trò chuyện. Thẻ nhỏ của tin: ảnh bìa (`mediaUrl`, `null` thì placeholder), tiêu đề, giá bằng `formatMoney`, tên bên kia. Khi `listing.isPublic` là `true`, thẻ là liên kết tới `listingPath(listing.slug, listing.code)`. Khi `false`: không có liên kết, hiện nhãn "Tin không còn hiển thị", nhưng vẫn nhắn được (ô soạn không khóa vì lý do này). Có liên kết "Hộp thư" quay về `chatBasePath` ở mọi cỡ màn hình.
- **AC-10**: Luật hỏi lại (dùng chung cho cuộc trò chuyện 4 giây, hộp thư 10 giây, chỉ báo 20 giây). Một hàm thuần `nextPollDelay({ base, error, failures })` quyết khoảng chờ kế tiếp, và TanStack Query chạy nó qua `refetchInterval` dạng hàm:
  - Không lỗi: `base`. Lỗi 429: chờ `error.retryAfterSeconds` giây (không có thì 60), rồi quay về `base`. Lỗi khác (mạng, 5xx): nhân đôi từ `base` theo số lần lỗi liên tiếp, tối đa 30 giây; một lần thành công đặt lại. Lỗi không xóa danh sách đang hiện; sau hai lần hỏi lại lỗi liên tiếp mới hiện một dòng nhỏ "Không cập nhật được tin mới. Đang thử lại." (không cho 429 đơn lẻ), và dòng biến mất khi thành công.
  - Đếm lỗi liên tiếp: ba query hỏi lại (`messages`, `inbox`, `unread`) đặt `retry: false` (nhịp kế tiếp đã là lần thử lại, và bộ đếm `fetchFailureCount` của TanStack về 0 ở mỗi lần fetch nên không dùng được). Số lần lỗi liên tiếp nằm trong một `useRef`: tăng trong `catch` của `queryFn`, về 0 khi thành công, và hàm `refetchInterval` đọc ref này để gọi `nextPollDelay`.
  - Tab ẩn (`document.hidden`) thì không hỏi (`refetchIntervalInBackground: false`). Khi tab hiện lại thì hỏi ngay, trừ khi lỗi cuối là 429 và chưa hết `retryAfterSeconds`: `refetchOnWindowFocus` là một hàm trả `false` trong khoảng chờ đó (để không "thử lại ngay" trái với hợp đồng). Rời trang thì hủy yêu cầu đang bay (luôn truyền `signal`).
  - Cuộc trò chuyện hỏi `GET /conversations/:id/messages?afterSeq=<seq lớn nhất đang có>&limit=100`; `hasMore` là `true` thì gọi tiếp ngay, tối đa 5 vòng mỗi lần: hết 5 vòng mà `hasMore` vẫn `true` thì dừng và chờ nhịp `base` kế tiếp; giữa các vòng kiểm `signal.aborted`. Tin nhận về đi qua `mergeMessages` (AC-23): hợp theo `seq`, bỏ trùng, xếp tăng dần.
  - Một đường ghi duy nhất vào `["chat","messages",id]`: các nguồn ghi ngoài hỏi lại (gửi tin AC-15, xem tin cũ AC-11) dùng `setQueryData` dạng hàm gọi `mergeMessages(hiệnCó, mới)`. Riêng `queryFn` của lần hỏi lại, vì kết quả nó trả về luôn ghi đè bộ nhớ, thì sau `await` cuối cùng phải đọc lại bộ nhớ mới nhất bằng `getQueryData` rồi trả `mergeMessages(mớiNhất, nhậnVề)`; không dùng bản chụp lúc bắt đầu, và không gọi `setQueryData` bên trong `queryFn`. Khi chưa có dữ liệu thì gọi không con trỏ (30 tin mới nhất).
  - Khóa `["chat","messages",id]` đặt `gcTime: 0`, nên mỗi lần mở lại cuộc trò chuyện luôn bắt đầu bằng 30 tin mới nhất (đúng "khi vừa mở màn hình thì gọi không tham số" của hợp đồng), không dựa vào dữ liệu cũ có thể thiếu tin.
- **AC-11**: Xem tin cũ hơn. Khi `items[0].seq` lớn hơn 1, đầu danh sách có nút "Xem tin cũ hơn". Chạy bằng một `useMutation` (không thử lại): bấm gọi `GET .../messages?beforeSeq=<seq nhỏ nhất đang có>&limit=30`, và trong `onSuccess` gọi `setQueryData` dạng hàm với `mergeMessages(hiệnCó, items)`. Nút hiện spinner lúc đang tải, lỗi hiện ngay tại chỗ kèm "Thử lại". Tin cũ chèn lên đầu không làm màn hình nhảy, và không dựa vào `overflow-anchor` (Safari không chắc chạy): trước khi gộp ghi lại `scrollHeight - scrollTop` của vùng cuộn, sau khi gộp đặt lại `scrollTop` trong `useLayoutEffect` để tin đang nằm ở mép trên của tầm nhìn vẫn đứng yên. Trong lúc chèn, vùng `role="log"` đặt `aria-live="off"` rồi trả lại ở khung hình kế tiếp, để trình đọc màn hình không đọc dồn cả loạt tin cũ. `seq` liên tiếp và không hở, nên "còn tin cũ hơn" chỉ là `items[0].seq > 1`, không lưu cờ riêng. Không làm gián đoạn lần hỏi lại.
- **AC-12**: Cuộn. Mở xong thì cuộn xuống tin cuối. Khi có tin mới: nếu danh sách đang cách đáy tối đa 80 px (dính đáy) thì tự cuộn xuống; nếu người dùng đang đọc tin cũ thì không cuộn, hiện nút "Tin mới" cho trình đọc màn hình và con trỏ, bấm thì cuộn xuống đáy và tắt nút. Số trên nút là số tin của bên kia có `seq` lớn hơn `seq` của tin cuối được ghi lại ở lần cuối danh sách còn dính đáy. Người dùng tự cuộn xuống tới đáy cũng tắt nút và đặt lại mốc đó. Tin mình vừa gửi luôn cuộn xuống đáy. Ô soạn luôn thấy được mà không phải cuộn cả trang trên màn hình 390 px, kể cả khi bàn phím ảo mở: vùng danh sách tự cuộn bên trong một cột flex mà ô soạn là phần tử cuối; `dvh` một mình không đủ vì nó không co lại khi bàn phím ảo mở, nên các trang chat xuất `viewport` với `interactiveWidget: "resizes-content"` (có trong tài liệu `generate-viewport.md` của Next.js; đọc lại trước khi dùng). Phải kiểm trên iOS Safari và Chrome Android ở 390 px; nếu iOS vẫn che ô soạn thì đo `window.visualViewport.height` để đặt chiều cao cột.
- **AC-13**: Giờ và vạch ngày. Ba hàm thuần trong `src/lib/format.ts`, đều nhận `now` làm tham số và dùng `TIME_ZONE` (giờ Việt Nam). `now` đến từ một hook `useNow()` giữ ngày giờ hiện tại trong state, làm mới mỗi 60 giây và khi tab hiện lại (không đọc `Date.now()` ngay trong lúc vẽ, vì như vậy không thuần), nên nhãn "Hôm nay" đổi đúng lúc qua nửa đêm:
  - `formatClock(iso)` ra `14:05` (24 giờ).
  - `chatDayLabel(iso, now)`: cùng ngày thì "Hôm nay", ngày hôm trước thì "Hôm qua", còn lại là `formatDateTime(iso)` (ngày `05/11/2026`). Trong cuộc trò chuyện, giữa hai tin khác ngày có một vạch ngày với nhãn này, và giờ nằm nhỏ dưới mỗi tin, ngoài bong bóng, màu `muted-foreground`.
  - `inboxTimeLabel(iso, now)`: hôm nay thì `14:05`, hôm qua thì "Hôm qua", cùng năm thì `05/11`, khác năm thì `05/11/2025`.
  - Ranh giới ngày tính theo giờ Việt Nam, không theo múi giờ của máy.
- **AC-14**: Ô soạn. Dùng chung cho hộp thoại AC-4 và cuộc trò chuyện. Một `textarea` có nhãn "Nội dung tin nhắn" (React Hook Form với một lược đồ Zod `messageSchema`):
  - Độ dài là số ký tự Unicode của chuỗi đã bỏ khoảng trắng hai đầu (`Array.from(draft.trim()).length`), từ 1 đến 1000. Rỗng hoặc toàn khoảng trắng: nút "Gửi" tắt. Hơn 1000: lỗi dưới ô và nút tắt. Bộ đếm `n/1000` luôn hiện (màu `muted-foreground`, chuyển `destructive` khi vượt). Nội dung gửi đi là bản người dùng gõ (backend tự bỏ khoảng trắng hai đầu).
  - Enter: với `matchMedia("(pointer: fine)")` đúng thì Enter gửi và Shift+Enter xuống dòng; với màn hình cảm ứng (`(pointer: coarse)`) thì Enter xuống dòng. Không bao giờ gửi khi đang gõ dở bằng bộ gõ (`event.nativeEvent.isComposing` đúng, hoặc `keyCode` 229). Nút "Gửi" có ở mọi thiết bị.
  - Ô tự cao lên tới khoảng 5 dòng rồi cuộn bên trong, không cần thư viện. Bản nháp chỉ nằm trong trạng thái của thành phần (xem AC-22) và chỉ bị xóa khi gửi thành công.
- **AC-15**: Gửi trong cuộc trò chuyện (thành công). `POST /conversations/:id/messages` với `{ body }`. Trong lúc gửi nút "Gửi" khóa (`aria-disabled`) và ô soạn để `readOnly`, không `disabled`, để không mất focus. Khi thành công: nối tin trả về vào bộ nhớ tin nhắn bằng `setQueryData` dạng hàm với `mergeMessages`; ghi `lastMessage`, `lastMessageAt` và `unreadCount: 0` (gửi tin đưa mốc đã đọc của người gửi tới tin cuối) vào `["chat","conversation",id]`; làm mới `["chat","inbox"]` (cuộc trò chuyện này phải nhảy lên đầu trang 1, nên không sửa tại chỗ từng dòng) và `["chat","unread"]`; xóa bản nháp, cuộn xuống đáy, giữ focus ở ô soạn khi là con trỏ chuột. Không có bong bóng "đang gửi" tạm (không gửi lạc quan): tin chỉ hiện khi máy chủ đã nhận.
- **AC-16**: Gửi: lỗi. Giữ nguyên bản nháp ở mọi lỗi:
  - 409 `CHAT_PEER_UNAVAILABLE`: ô soạn khóa, hiện `message` của lỗi ("Người kia hiện không nhận được tin nhắn.") kèm nút "Thử gửi lại" mở khóa ô soạn (người kia có thể đã được mở khóa). Lịch sử vẫn đọc được.
  - 429: đếm ngược, "Gửi" khóa tới khi hết (giới hạn 30 tin mỗi phút).
  - 400 `VALIDATION_FAILED` ở `body`: hiện dưới ô soạn.
  - Lỗi mạng hay hết giờ (20 giây): dòng lỗi ngay trên ô soạn, và chạy ngay một lần hỏi lại (delta) vì tin có thể đã tới nơi dù ta không nhận được phản hồi. Nút "Gửi" giữ khóa cho tới khi lần hỏi bù này xong (thành công hay lỗi), để người dùng không bấm gửi lại khi chưa biết tin đã tới chưa. Nếu tin đã có thì nó hiện ra và bản nháp trùng nằm đó để người dùng tự xóa.
  - 404 `CONVERSATION_NOT_FOUND`: cả màn thành trạng thái AC-20. 403 `ACCOUNT_LOCKED` và 401: do lớp phiên xử lý (spec 0002), bản nháp mất theo phiên.
- **AC-17**: Đánh dấu đã đọc. Hook `useMarkRead` gọi `POST /conversations/:id/read`. Khi danh sách đang dính đáy (AC-12) thì `upToSeq` là `seq` của tin cuối trong `items` (không đo từng tin có hiện trong tầm nhìn hay không). Gọi khi và chỉ khi: tab đang hiện, danh sách đang dính đáy, và có một tin của bên kia với `seq` lớn hơn mốc đã gọi trong lần xem này (hoặc `unreadCount` của `["chat","conversation",id]` lớn hơn 0 lúc mở). Xét lại điều kiện ở ba lúc: dữ liệu tin nhắn đổi, trạng thái dính đáy đổi (kể cả khi người dùng tự cuộn xuống mà không bấm nút), và `visibilitychange`. Chỉ cho một yêu cầu `read` bay tại một thời điểm, giữ lại mốc `upToSeq` mới nhất để gọi sau khi yêu cầu đang bay xong, nên phản hồi về sai thứ tự không làm `unreadCount` cũ đè lên cái mới. Không gọi lặp cùng một `upToSeq`. Phản hồi (một `ConversationItem` với `unreadCount` mới) được ghi vào `["chat","conversation",id]` và vào dòng tương ứng của hộp thư bằng `setQueryData` (đọc không đổi thứ tự hộp thư nên sửa tại chỗ là đúng); sau đó làm mới `["chat","unread"]` ngay, không chờ lần hỏi lại. Tin của bên kia đến lúc người dùng đang đọc tin cũ (nút "Tin mới" đang hiện) chưa được tính là đã đọc.
- **AC-18**: Chỉ báo tin chưa đọc. `ChatIndicator` hiện khi `canUseChat(session)`: một nút biểu tượng bong bóng tin nhắn (`MessageCircle`) là liên kết tới `chatBasePath`, kèm số nhỏ `unreadConversations` (ẩn khi 0, tối đa "99+", cặp màu `destructive` với `destructive-foreground` đã có trong `check-contrast`). Đọc `GET /me/conversations/unread-count` bằng khóa `["chat","unread"]`, hỏi lại mỗi 20 giây theo AC-10, `staleTime` 10 giây. Đặt ở `PublicShell`: trên điện thoại nằm ngoài ngăn menu, cạnh nút menu; từ `md` nằm trước menu tài khoản (cỡ `lg`, 44 px). Đặt ở thanh trên của `WorkspaceShell`: trước menu tài khoản (cỡ `default`). Tên truy cập "Tin nhắn" và, khi có số, "Tin nhắn, N cuộc trò chuyện chưa đọc". Số đổi không được đọc lên tự động (không có vùng `aria-live`), vì nó đổi mỗi vài giây. Khách và admin không thấy gì. `ChatIndicator` là một đảo client riêng nằm trong khung tĩnh (khung không đọc phiên, spec 0003), trả `null` khi phiên còn `loading` hoặc `canUseChat` sai, nên HTML của máy chủ và lần vẽ đầu ở trình duyệt giống nhau, không lệch hydration. Nó nằm bên trái của phần tử căn phải, nên việc nó hiện ra sau khi biết phiên không đẩy menu tài khoản đi chỗ khác.
- **AC-19**: Lối vào. Menu tài khoản: `ACCOUNT_LINKS.tenant` có mục "Tin nhắn" tới `/tin-nhan` và `ACCOUNT_LINKS.landlord` có mục "Tin nhắn" tới `/landlord/tin-nhan`, cả hai mang `permission: "conversation:read"`; `AccountMenuView` lọc các mục có `permission` bằng `can()` (cả dạng menu thả xuống lẫn dạng danh sách trong ngăn). `LANDLORD_TOOLS` thêm công cụ `chat.inbox`: nhóm "Tin nhắn" (đặt sau nhóm "Tin đăng"), nhãn "Tin nhắn", mô tả "Trả lời những người tìm trọ đã nhắn cho bạn.", biểu tượng `MessagesSquare`, `permission: "conversation:read"`, `status: "ready"`, `href: "/landlord/tin-nhan"`, `stat: "unreadChat"`. Mục menu bên trái sáng ở cả `/landlord/tin-nhan` và `/landlord/tin-nhan/[id]`. Thẻ dashboard chủ trọ hiện số từ `StatKey` mới `unreadChat`: nguồn `unreadChat` dùng đúng khóa `["chat","unread"]` và cùng hàm đọc của chỉ báo (một yêu cầu, một mục bộ nhớ): `src/features/chat/api` xuất `unreadQueryOptions(api)`, nguồn dashboard trải nó ra rồi thêm `select` để đổi `UnreadSummary` thành dạng nguồn của dashboard (`{ source: "unreadChat", unreadConversations }`). Nếu kiểu của `sourceQuery` chưa nhận `select` thì mở rộng kiểu đó; không thêm khóa thứ hai. Lời "Chưa có tin chưa đọc" khi 0, "N cuộc trò chuyện chưa đọc" khi lớn hơn 0; quyền của nguồn là `conversation:read`.
- **AC-20**: Trạng thái của trang. `id` không phải UUID, hoặc 404 `CONVERSATION_NOT_FOUND` ở lần đọc đầu hay ở lần hỏi lại: `NotFoundState` với "Không tìm thấy cuộc trò chuyện" và liên kết "Về hộp thư". 403 `PERMISSION_DENIED` ở lần đọc đầu: `ForbiddenState`. Lần tải đầu lỗi khác (mạng, 5xx, hết giờ): `ErrorState` có "Thử lại"; 429: `RateLimitNotice` với đếm ngược. Hai lần đọc đầu (đầu trang và tin nhắn) cùng quyết một trạng thái cho cả màn: một trong hai lỗi là cả màn lỗi, và 404 của một trong hai là "không tìm thấy". Cách phân biệt lỗi lần đọc đầu với lỗi khi hỏi lại: truy vấn có lỗi và `data === undefined` thì là lỗi của cả màn; đã có dữ liệu thì lỗi chỉ hiện dòng báo của AC-10 và không thay cả màn hình, riêng 404 (cuộc trò chuyện biến mất giữa chừng) vẫn thành "không tìm thấy".
- **AC-21**: Giới hạn tần suất. `src/lib/api/rate-limits.ts` thêm luật cho `POST /listings/:id/conversations` (1 giờ) và `POST /conversations/:id/messages` (1 phút), để thời gian chờ khi trình duyệt không đọc được `Retry-After` đúng với cột "Bị chặn trong" của hợp đồng mục 3 (các `GET` chat đã rơi vào mặc định 60 giây, đúng). Nút gửi và hộp thoại dùng `useCountdown` và `formatWait` có sẵn.
- **AC-22**: Riêng tư và an toàn. Nội dung tin nhắn không bao giờ nằm trong URL, `localStorage`, `sessionStorage`, nhật ký trình duyệt (`console`), tiêu đề tab, thông báo toast hay vùng `aria-live`. Ngoại lệ duy nhất, có chủ ý: vùng `role="log"` của danh sách tin (AC-8), vì `role="log"` đã ngầm là `aria-live="polite"` và đó là cách tin mới của bên kia được đọc lên cho người dùng trình đọc màn hình. Không có `dangerouslySetInnerHTML` trong `src/features/chat`. Không tự biến liên kết trong tin thành bấm được (chữ thô, người dùng tự chép). Bản nháp chỉ nằm trong trạng thái thành phần. Bộ nhớ truy vấn tự xóa khi phiên đổi (đã có, `auth-provider.tsx`), nên khóa không cần id người dùng.
- **AC-23**: Nền dùng chung (cho chat và cho #35, #36, theo scope). `src/lib/api/types.ts` thêm các kiểu `ChatMessage`, `ConversationItem`, `ChatMessagesPage`, `UnreadSummary`, `OpenConversationResult` và, chép luôn một lần từ Phụ lục B, `ReviewStatus`, `PublicReview`, `MyReview`, `MyReviewState`, `AdminReview`; thêm 9 mã lỗi vào `ERROR_CODES`: `CONVERSATION_NOT_FOUND`, `CANNOT_CHAT_WITH_SELF`, `CHAT_PEER_UNAVAILABLE`, `REVIEW_NOT_FOUND`, `REVIEW_NOT_ELIGIBLE`, `REVIEW_ALREADY_EXISTS`, `CANNOT_REVIEW_SELF`, `REVIEW_HIDDEN`, `REVIEW_STATE_INVALID`; cập nhật dòng chú thích đầu file (ngày backend). `src/lib/format.ts` thêm `formatRating(average)` ra một chữ số thập phân kiểu Việt (`4,3`, `4,0`). `src/features/chat/merge-messages.ts` xuất `mergeMessages(current, incoming)`: hợp theo `seq`, bỏ trùng, xếp tăng dần, không sửa đầu vào.
- **AC-24**: Xem thử trong `/dev/ui`. Một phần mới trong `/dev/ui` (và màn trong `/dev/ui/screens` nếu hợp) vẽ trên dữ liệu giả, không cần backend: cuộc trò chuyện (tin hai phía, vạch ngày, tin dài, tin nhiều dòng, nút "Tin mới", "Xem tin cũ hơn"), hộp thư (có chưa đọc, trống cho từng loại tài khoản), hộp thoại tin đầu và lỗi của nó, chỉ báo (0, 7, "99+"), thẻ đầu trang với `isPublic` là `false`, ô soạn bị khóa vì `CHAT_PEER_UNAVAILABLE`, và đếm ngược 429. Cả hai đường `/dev` trả 404 ở môi trường chạy thật (đã có). Mốc này đặt cuối và bỏ qua được.

## Decision

**Chosen option**: Hỏi lại bằng TanStack Query với con trỏ `seq`, hai bộ đường dẫn dùng chung một bộ màn hình, hộp thoại cho tin đầu.

Giao diện chat là một lớp mỏng trên hợp đồng 6.39: bốn quyết định nhỏ của nó nằm trong `rationale.md` (D1 đến D4), mỗi cái kèm lựa chọn còn lại.

| # | Quyết định | Chọn | Còn lại |
|---|---|---|---|
| D1 | Cách lấy tin mới | một query theo cuộc trò chuyện, hỏi phần tăng thêm bằng `afterSeq`, gộp bằng hàm thuần | `useInfiniteQuery` theo trang; một kho tự viết ngoài TanStack |
| D2 | Đường dẫn và khung | `/tin-nhan` (khung công khai) và `/landlord/tin-nhan` (khu chủ trọ), màn hình dùng chung | một `/tin-nhan` cho cả hai |
| D3 | Gửi tin đầu | hộp thoại | ngăn trượt; ô soạn nằm trong thẻ liên hệ |
| D4 | Nhận biết cuộc trò chuyện cũ | đọc dò khi trang tin mở | đọc khi bấm nút |

D2, D3 và D4 do người làm dự án chọn; D1 do `/architect` đề xuất. Cùng với D1, các quyết định `/architect` tự đưa ra (RECOMMEND), mỗi cái có lý do và phương án còn lại trong `rationale.md`: nhịp hỏi lại 4, 10 và 20 giây; cách giãn khi lỗi; `gcTime: 0` cho tin nhắn; luật đánh dấu đã đọc; không gửi lạc quan; bỏ qua Enter khi đang gõ bằng bộ gõ và ô soạn tự cao không thư viện; không tự biến liên kết; nút "Thử gửi lại" khi người kia bị khóa; vị trí chỉ báo trên điện thoại; không tự focus ô soạn trên cảm ứng.

**Implementation skills**: `tanstack-query-best-practices` (`deckardger/tanstack-agent-skills`, `.agents/skills/tanstack-query-best-practices/`) · `react-hook-form` (`pproenca/dot-skills`, `.agents/skills/react-hook-form/`) · `zod` (`pproenca/dot-skills`, `.agents/skills/zod/`) · `shadcn` (`shadcn-ui/ui`, `.agents/skills/shadcn/`) · `tailwind-design-system` (`wshobson/agents`, `.agents/skills/tailwind-design-system/`) · `next-dev-loop` (`vercel/next.js`, `.agents/skills/next-dev-loop/`)

## Rationale

Lý do và các lựa chọn đã cân nhắc: xem `rationale.md`.

## Feature design

**Data model sketch**: dữ liệu chat nằm hết ở backend và hợp đồng đã chốt hình dạng, nên giao diện không tạo bảng nào. Phía giao diện có ba lớp:

1. Kiểu chép tay từ Phụ lục B (AC-23): `ChatMessage` (`id`, `seq`, `senderId`, `isMine`, `body`, `createdAt`), `ConversationItem` (`id`, `myRole`, `listing` có `isPublic` và `coverImageUrl`, `otherUser` có `name` có thể `null`, `lastMessage` không có `id`, `lastMessageAt`, `createdAt`, `unreadCount`), `ChatMessagesPage` (`items`, `hasMore`, `lastSeq`), `UnreadSummary` (`unreadConversations`, `unreadMessages`), `OpenConversationResult` (`conversation`, `message`). Một cuộc trò chuyện ứng với đúng một cặp (tin, người nhắn); `seq` duy nhất, liên tiếp từ 1 và không hở.
2. Bộ nhớ truy vấn (khóa gốc `["chat", ...]`, tự xóa khi phiên đổi):

| Khóa | Giữ gì | Hỏi lại |
|---|---|---|
| `["chat","unread"]` | `UnreadSummary` | 20 giây; chỉ báo và thẻ dashboard dùng chung |
| `["chat","inbox",page]` | `Page<ConversationItem>` (20 mỗi trang) | 10 giây, chỉ trang đang mở |
| `["chat","conversation",id]` | `ConversationItem` (đầu trang) | không định kỳ; cập nhật từ phản hồi của `read` và của gửi tin |
| `["chat","messages",id]` | `ChatMessage[]` tăng dần theo `seq`, `gcTime: 0` | 4 giây bằng `afterSeq` |
| `["chat","by-listing",listingId]` | `ConversationItem` hoặc `null` (`queryFn` trả `items[0] ?? null`) | không định kỳ, `staleTime` 30 giây |

3. Trạng thái chỉ ở màn hình (mất khi rời trang): bản nháp ô soạn, "đang dính đáy" và số tin mới bên dưới, cờ người kia không nhận được tin, đếm ngược 429, bộ đếm lỗi liên tiếp của lần hỏi lại, mốc `upToSeq` đã gọi trong lần xem.

**State transitions**:
- Ô soạn: `idle` sang `sending` khi bấm gửi; `sending` về `idle` kèm xóa nháp khi thành công; về `idle` kèm lỗi và giữ nháp khi lỗi thường; sang `cooling` khi 429 (về `idle` khi hết giờ đếm); sang `peer-blocked` khi 409 `CHAT_PEER_UNAVAILABLE` (về `idle` khi bấm "Thử gửi lại").
- Lần hỏi lại: `ok` (khoảng `base`), `rate-limited` (chờ `retryAfterSeconds` rồi `ok`), `failing` (khoảng nhân đôi tới 30 giây, hiện dòng báo từ lần lỗi thứ hai liên tiếp), về `ok` ngay khi một lần thành công.

**API surface** (mọi gọi dùng client chung với chế độ `required`, token trong bộ nhớ, `signal` của TanStack):

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/listings/:id/conversations` | POST | `id` (UUID tin), body `{ body }` | 201 `{ conversation, message }` | `conversation:create` (người tìm trọ) | 400 `VALIDATION_FAILED` (`body`), 404 `LISTING_NOT_FOUND`, 409 `CANNOT_CHAT_WITH_SELF`, 403, 429 (20 mỗi giờ) |
| `/conversations/:id/messages` | POST | `id`, body `{ body }` | 201 `ChatMessage` | `message:create` | 400, 404 `CONVERSATION_NOT_FOUND`, 409 `CHAT_PEER_UNAVAILABLE`, 403 `ACCOUNT_LOCKED`, 429 (30 mỗi phút) |
| `/conversations/:id/messages` | GET | `limit` 1..100, `afterSeq` hoặc `beforeSeq` (không cùng lúc) | `{ items tăng dần, hasMore, lastSeq }` | `conversation:read` | 400, 404, 429 (120 mỗi phút) |
| `/conversations/:id` | GET | `id` | `ConversationItem` | `conversation:read` | 404 |
| `/me/conversations` | GET | `page`, `pageSize`, `listingId?` | `Page<ConversationItem>`, tin mới nhất trên | `conversation:read` | 400, 429 |
| `/me/conversations/unread-count` | GET | không | `UnreadSummary` | `conversation:read` | 429 |
| `/conversations/:id/read` | POST | `id`, body `{ upToSeq }` | 200 `ConversationItem` | `conversation:update` | 400, 404 |

Admin nhận 403 `PERMISSION_DENIED` ở cả bảy API, nên giao diện không gọi (AC-2). Các `POST` tạo mới không an toàn khi bấm đúp (hợp đồng mục 8.1), nên nút luôn khóa lúc gửi và giao diện không tự gửi lại.

**Value sourcing**:

| Hành động | Giá trị tạo ra hoặc hiển thị | Nguồn |
|---|---|---|
| Nút nhắn | id tin để gọi POST | `ListingDetail.id` từ lần đọc của máy chủ (spec 0010), truyền qua prop vào `ListingContact` |
| Nút nhắn | tiêu đề tin, tên chủ trọ trong hộp thoại | `listing.title` và `landlord.name` (hoặc "Chủ trọ"), cùng prop |
| Nút nhắn | có hiện nút không | `useSession()`: `status`, `user.accountType`, `user.id` so với `landlord.id`, `can(conversation:create)` |
| Nút nhắn | đã có cuộc trò chuyện chưa | `GET /me/conversations?listingId=<listing.id>&pageSize=1`, `items[0]` |
| Sau khi gửi tin đầu | địa chỉ trang cuộc trò chuyện | `chatBasePath(user.accountType)` và `conversation.id` của phản hồi |
| Hộp thư | tên bên kia | `otherUser.name`, `null` thì "Người dùng" |
| Hộp thư, đầu trang | ảnh bìa | `mediaUrl(listing.coverImageUrl)`, `null` thì `ImagePlaceholder` |
| Hộp thư | tiền tố "Bạn:" | `lastMessage.isMine` |
| Hộp thư | chấm chưa đọc | `unreadCount` lớn hơn 0 |
| Hộp thư, vạch ngày, giờ | nhãn giờ | `lastMessageAt` hay `createdAt`, `now` từ hook `useNow()` (state, làm mới mỗi 60 giây và khi tab hiện lại), `TIME_ZONE` |
| Hộp thư | câu trống | `session.user.accountType` |
| Hộp thư | trang đang xem | tham số `?page=` (Zod, mặc định 1) |
| Cuộc trò chuyện | id cuộc trò chuyện | `useParams().id`, kiểm UUID trước khi gọi |
| Cuộc trò chuyện | tin nào là của mình | `ChatMessage.isMine` |
| Cuộc trò chuyện | `afterSeq`, `beforeSeq` | `seq` lớn nhất, nhỏ nhất đang có trong bộ nhớ tin nhắn |
| Cuộc trò chuyện | còn tin cũ hơn không | `items[0].seq` lớn hơn 1 |
| Đánh dấu đã đọc | `upToSeq` | `seq` của tin cuối trong `items` khi đang dính đáy |
| Cuộn | số trên nút "Tin mới" | số tin của bên kia có `seq` lớn hơn `seq` cuối ghi lại lúc còn dính đáy |
| Đầu trang cuộc trò chuyện | liên kết sang tin | `listingPath(listing.slug, listing.code)`, chỉ khi `listing.isPublic` |
| Cuộn | đang dính đáy | `scrollHeight - scrollTop - clientHeight` nhỏ hơn hoặc bằng 80 |
| Ô soạn | độ dài | `Array.from(draft.trim()).length` |
| Ô soạn | Enter gửi hay xuống dòng | `matchMedia("(pointer: fine)")` |
| 429 | số giây chờ | `ApiError.retryAfterSeconds` (hoặc `blockSecondsFor`, AC-21) |
| Chỉ báo, thẻ dashboard | số hiện | `UnreadSummary.unreadConversations` |
| Chỉ báo | có hiện không | `canUseChat(session)` |
| Mọi liên kết chat | địa chỉ gốc | `chatBasePath(accountType)` |

**Key invariants**:
- Mọi lần ghi vào `["chat","messages",id]` đi qua `mergeMessages`: gửi tin và xem tin cũ dùng `setQueryData` dạng hàm; `queryFn` của lần hỏi lại đọc lại bộ nhớ mới nhất sau `await` cuối rồi trả `mergeMessages(mớiNhất, nhậnVề)` (AC-10). Nhờ vậy ba nguồn chạy cùng lúc (hỏi lại, gửi tin, xem tin cũ) không ghi đè lẫn nhau. Mảng luôn tăng dần và không trùng `seq`.
- Không bao giờ gửi cả `afterSeq` lẫn `beforeSeq` trong một lần gọi (backend trả 400).
- Một `POST` tạo mới chỉ có một lần bay tại một thời điểm cho mỗi ô soạn.
- Tin của mình không bao giờ tính vào chưa đọc; mốc đã đọc không lùi (backend bảo đảm), nên gọi `read` lặp là an toàn nhưng giao diện vẫn không gọi lặp.
- Không có yêu cầu chat nào được gửi khi `canUseChat` sai.
- Chỉ người của đúng loại tài khoản thấy trang của loại đó (lớp chặn), và không điều gì trong giao diện thay cho kiểm tra của backend.

**Security model**:
- Chỉ `tenant` và `landlord` có `conversation:read` dùng chat. Người tìm trọ là bên duy nhất mở được cuộc trò chuyện (`conversation:create`); chủ trọ chỉ trả lời. Admin luôn 403 nên không gọi và không thấy chỉ báo.
- Backend trả 404 `CONVERSATION_NOT_FOUND` cho cả "không có" lẫn "không phải một trong hai bên", nên giao diện không phân biệt và không lộ gì.
- Token chỉ ở trong bộ nhớ (spec 0002). Phản hồi chat có `Cache-Control: private, no-store`. Tin nhắn là chữ thô: hiện bằng `{body}`, không HTML, không tự gắn liên kết. Không số điện thoại hay email nào trong bất kỳ phản hồi chat nào.
- Nội dung tin không vào URL, kho lưu trữ của trình duyệt, nhật ký, tiêu đề tab hay thông báo (AC-22). Không có nhật ký audit phía giao diện; backend không ghi nội dung tin vào nhật ký của nó.
- Phạm vi tuân thủ: tin nhắn riêng tư giữa hai người là dữ liệu cá nhân, nhưng đây là bản demo hoặc đồ án, không có tiêu chuẩn tuân thủ riêng nào được nêu.

**Configuration required**: không có biến môi trường hay khóa mới.

**Critical test scenarios** (mỗi cái ứng với một tiêu chí):
- Happy path: người tìm trọ mở một tin, bấm "Nhắn cho chủ trọ", gửi "Phòng còn trống không ạ?", được chuyển sang cuộc trò chuyện thấy tin vừa gửi; chủ trọ mở `/landlord/tin-nhan` thấy cuộc trò chuyện in đậm có chấm, mở ra, trả lời; sau tối đa khoảng 4 giây người tìm trọ thấy câu trả lời, không trùng, và chỉ báo của chủ trọ về 0. Kiểm AC-3, AC-4, AC-6, AC-8, AC-10, AC-15, AC-17, AC-18.
- Quay lại tin đã nhắn: nút ghi "Xem tin nhắn của bạn" và dẫn tới đúng cuộc trò chuyện, không tạo cuộc thứ hai. Kiểm AC-3.
- Bấm đúp "Gửi" trong hộp thoại hay ô soạn: đúng một tin được tạo. Kiểm AC-4, AC-15.
- Hai bên gửi gần như cùng lúc: danh sách tăng dần, không trùng `seq`, không hở. Kiểm AC-10.
- Đang đọc tin cũ thì tin mới tới: màn hình không nhảy, hiện nút "Tin mới", chưa tính là đã đọc; bấm nút thì cuộn xuống và đánh dấu đã đọc. Kiểm AC-12, AC-17.
- Tab ẩn: không có yêu cầu hỏi lại nào; hiện lại thì hỏi ngay. Kiểm AC-10.
- Người kia bị khóa: gửi nhận 409, ô soạn khóa, lịch sử vẫn đọc được, "Thử gửi lại" mở khóa. Kiểm AC-16.
- Tin bị ẩn: thẻ đầu trang không có liên kết, có nhãn "Tin không còn hiển thị", vẫn nhắn được. Kiểm AC-9.
- Bàn phím ảo: trên iOS Safari và Chrome Android ở 390 px, mở bàn phím thì ô soạn vẫn thấy được và danh sách tự cuộn bên trong. Kiểm AC-12.
- Người có `conversation:create` nhưng thiếu `conversation:read`: không có nút "Nhắn cho chủ trọ" (thay vì gửi xong rồi nhận 403). Kiểm AC-3.
- Gõ tiếng Việt bằng Telex trên máy tính, Enter chốt chữ không gửi tin; Enter sau khi chốt thì gửi. Trên điện thoại Enter xuống dòng. Kiểm AC-14.
- Quá 1000 ký tự: không gửi được, bộ đếm đỏ; một emoji tính một ký tự. Kiểm AC-14.
- 429 khi gửi: nháp còn nguyên, đếm ngược, hết giờ gửi lại được. Kiểm AC-5, AC-16, AC-21.
- Hỏi lại gặp 429: chờ `retryAfterSeconds` rồi chạy tiếp, danh sách không mất. Kiểm AC-10.
- Quyền: admin không có chỉ báo và không gọi API chat; chủ trọ không có nút nhắn; khách bấm nút thì tới đăng nhập rồi về lại tin; chủ trọ mở `/tin-nhan` và người tìm trọ mở `/landlord/tin-nhan` thấy trang "không có quyền". Kiểm AC-1, AC-2, AC-3.
- `CONVERSATION_NOT_FOUND` và id sai dạng: trang "Không tìm thấy cuộc trò chuyện" kèm đường về hộp thư, id sai dạng không gọi API. Kiểm AC-20.
- Tin chứa `<script>`, `&amp;` và xuống dòng: hiện đúng nguyên văn, giữ xuống dòng, không chạy gì. Kiểm AC-8, AC-22.

## Build plan

Theo Tracer Bullet: M1 chạy một sợi chỉ mỏng thật xuyên mọi tầng (người tìm trọ gửi từ trang tin, chủ trọ thấy và trả lời), rồi M2 đến M4 làm dày dần, mỗi mốc vẫn chạy trọn vẹn. Hàm thuần (`mergeMessages`, `nextPollDelay`, `toChatEntry`, các hàm giờ, `chatBasePath`) viết tách khỏi React để `/test` dễ phủ khi cần. Trước khi viết trang, đọc phần liên quan trong `node_modules/next/dist/docs/` (như `AGENTS.md` yêu cầu).

**M1. Sợi chỉ mỏng: một tin đi từ trang tin tới hộp thư của chủ trọ**
1. Nền dùng chung: kiểu chat và đánh giá, 9 mã lỗi, `formatRating`, luật tần suất mới trong `rate-limits.ts`, satisfies **AC-23**, **AC-21**
2. `chatBasePath`, `canUseChat`, `mergeMessages`, `chat-keys.ts` và các hàm gọi API (mở, gửi, đọc tin, hộp thư, chi tiết, `unreadQueryOptions`) trong `src/features/chat/api/`, satisfies **AC-2**, **AC-10**
3. Nhóm route `(tenant)` với lớp chặn và khung công khai, trang chat của chủ trọ trong `(landlord)`, `metadata`, `instant = false`, `robots.ts`, satisfies **AC-1**, **AC-20**
4. `ThreadScreen` mỏng: tải 30 tin mới nhất, vẽ hai phía, ô soạn gửi được, hỏi lại 4 giây bằng `afterSeq` có vòng `hasMore`, satisfies **AC-8**, **AC-10**, **AC-14**, **AC-15**
5. `InboxScreen` mỏng: các dòng (chưa có dấu chưa đọc, phần đó ở mục 9), phân trang `?page=`, trạng thái trống, satisfies **AC-6**, **AC-7**
6. Nút và hộp thoại ở trang chi tiết tin: truyền `id` và `title` vào `ListingContact`, `toChatEntry`, dò cuộc trò chuyện cũ, hộp thoại, chuyển trang sau khi gửi, satisfies **AC-3**, **AC-4**
7. Lối vào tối thiểu để chủ trọ tới hộp thư: công cụ `chat.inbox` ở trạng thái `ready` và mục "Tin nhắn" trong menu tài khoản (lọc theo quyền), satisfies **AC-19**

**M2. Chưa đọc và chỉ báo**
8. Truy vấn `unread-count` và `ChatIndicator` ở `PublicShell` (điện thoại và máy tính) và `WorkspaceShell`, satisfies **AC-18**
9. `useMarkRead`, dấu đậm và chấm ở hộp thư, cập nhật bộ nhớ từ phản hồi `read`, satisfies **AC-17**, **AC-6**
10. Thẻ "Tin nhắn" trên dashboard chủ trọ: `StatKey` và nguồn `unreadChat` dùng chung khóa với chỉ báo, satisfies **AC-19**

**M3. Chiều sâu của cuộc trò chuyện**
11. "Xem tin cũ hơn" bằng `useMutation`, giữ vị trí cuộn bằng `useLayoutEffect` và tạm tắt `aria-live`; dính đáy, nút "Tin mới" kèm số; cuộn khi gửi; trang chat xuất `viewport` với `interactiveWidget: "resizes-content"` và cột flex có ô soạn ở cuối, satisfies **AC-11**, **AC-12**
12. `formatClock`, `chatDayLabel`, `inboxTimeLabel`, hook `useNow()`, vạch ngày, giờ dưới tin và ở hộp thư, satisfies **AC-13**
13. Ô soạn đủ luật: React Hook Form và Zod, đếm theo ký tự Unicode, bộ đếm, luật Enter theo con trỏ, bỏ qua khi đang gõ bộ gõ, tự cao, satisfies **AC-14**
14. Thẻ đầu trang cuộc trò chuyện với `isPublic`, liên kết về hộp thư, satisfies **AC-9**
15. Luật hỏi lại đầy đủ: `nextPollDelay`, `retry: false` và `useRef` đếm lỗi liên tiếp, tab ẩn, `refetchOnWindowFocus` dạng hàm theo 429, giãn khi lỗi, dòng báo sau hai lần lỗi, `queryFn` đọc lại bộ nhớ mới nhất trước khi gộp, dừng sau 5 vòng, `gcTime: 0`, satisfies **AC-10**

**M4. Lỗi, giới hạn và an toàn**
16. Lỗi khi gửi (hộp thoại và ô soạn): 400, 404, 409 hai loại, 429 đếm ngược, mạng kèm lần hỏi lại bù (nút "Gửi" khóa tới khi lần bù xong), nút "Thử gửi lại", satisfies **AC-5**, **AC-16**, **AC-21**
17. Trạng thái trang: không tìm thấy, không quyền, lỗi lần đọc đầu, id sai dạng, trang hộp thư vượt biên, satisfies **AC-20**, **AC-7**
18. Rà riêng tư: không `dangerouslySetInnerHTML`, không kho lưu trữ, không nội dung tin trong nhật ký, tiêu đề hay toast, satisfies **AC-22**

**M5. Xem thử (bỏ qua được nếu hết giờ)**
19. Phần `/dev/ui` cho chat trên dữ liệu giả, satisfies **AC-24**

## Consequences

**Positive**:
- Một bộ màn hình cho hai loại người dùng, nhưng mỗi bên ở đúng khung của mình, và không phải sửa lớp chặn đăng nhập (spec 0005).
- Hàm gộp thuần và một đường ghi duy nhất vào bộ nhớ tin nhắn giữ danh sách đúng dù hỏi lại, gửi tin và xem tin cũ chạy chồng nhau.
- Tải backend nhẹ và đoán trước được: một tab mở cuộc trò chuyện dùng khoảng 15 lần hỏi mỗi phút cho `messages`, thấp xa mức 120.
- Phần nền (kiểu, mã lỗi, `formatRating`) làm sẵn cho #35 và #36.

**Negative / tradeoffs**:
- Hỏi lại chứ không đẩy: tin của bên kia có thể chậm tới khoảng 4 giây, tab ẩn thì không nhận gì (chủ trọ phải mở trang mới thấy). Chỉ báo chỉ chạy khi tab hiện.
- Hai đường dẫn thay vì một: mọi liên kết phải qua `chatBasePath`, và bài viết "dùng chung `/tin-nhan`" trong scope phải sửa (xem Follow-up).
- Không gửi lạc quan: tin chỉ hiện sau khi máy chủ đáp (thường dưới một giây), đổi lại không bao giờ có tin ma. Gửi lỗi mạng có thể để lại tin đã tới nơi mà người dùng chưa biết, nên có một lần hỏi bù.
- `gcTime: 0` cho tin nhắn nghĩa là mở lại một cuộc trò chuyện luôn thấy khung chờ ngắn rồi mới có tin (một yêu cầu), không có dữ liệu cũ hiện ngay.
- Thẻ liên hệ của spec 0010 (đã `Accepted`) được mở rộng: đây là thay đổi có chủ ý của một tính năng đã xong, nên phải giữ nguyên phần đọc số điện thoại.
- Bộ đếm theo ký tự Unicode đơn có thể lệch backend ở các emoji ghép (nhiều ký tự ghép thành một hình); backend là nơi kiểm cuối và lỗi của nó hiện dưới ô.

**Neutral**:
- Không có API, bảng, thư viện hay biến môi trường mới. Thêm nhóm route `(tenant)`, thư mục `src/features/chat/`, một `StatKey` và một nguồn dashboard mới.
- `(tenant)` và `(public)` mỗi nhóm có layout riêng cùng vẽ `PublicShell`, nên đi từ trang chat sang trang công khai (và ngược lại) làm khung công khai dựng lại một lần. Chấp nhận được, vì khung tĩnh và nhẹ.
- Admin không có chat; không có sửa, xóa, chặn người, ảnh, "đã xem", thông báo email hay đẩy (nằm trong danh sách chờ backend của scope).

## Follow-up

- [ ] Sửa lại các chỗ trong scope còn nói "dùng chung `/tin-nhan`": dòng "Điều đã chốt" thứ hai trong `docs/scope/index.md` (đoạn "hộp thư và cuộc trò chuyện nằm ở `/tin-nhan` và `/tin-nhan/[id]`, dùng chung") và mục "Hộp thư hai cột trên máy tính" trong Deferred (`/tin-nhan` và `/tin-nhan/[id]` thành hai bộ đường dẫn). Dòng #34 trong `public.md` được sửa ngay khi spec này được chấp nhận. Phần còn lại nên để `/sync` đối chiếu.
- [ ] `AGENTS.md` gốc (mục Layout) liệt kê các nhóm route `(public)`, `(auth)`, `(landlord)`, `(admin)`: cần thêm `(tenant)`, và thêm một dòng nhắc tới `src/features/chat/` hay một `AGENTS.md` lồng nhau cho khu chat. Việc này thuộc `/sync`, không sửa ở đây.
- [ ] Spec 0010 (thẻ liên hệ) và spec 0008 (`StatKey`, nguồn dashboard) được mở rộng bởi spec này: `/sync` nên ghi chú ở hai spec đó khi tính năng xong.
- [ ] Tự biến liên kết trong tin nhắn thành bấm được (phải làm an toàn: chỉ `http` và `https`, `rel="noopener noreferrer"`, không HTML). Chưa làm vì cần một quyết định riêng về an toàn; được thêm vào Deferred của scope khi spec này được chấp nhận.
- [ ] Nếu sau này backend có kênh đẩy, thay phần hỏi lại (AC-10) bằng kênh đó; `mergeMessages` và các khóa truy vấn giữ nguyên.
