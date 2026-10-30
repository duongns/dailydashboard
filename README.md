# Daily Dashboard — Jekyll + JavaScript

Giữ giao diện dashboard, nhóm lịch theo tháng/ngày, lấy Google Calendar Events + Google Tasks, thời tiết làm mới 30 phút và lịch làm mới 3 giờ khi trang đang mở.

## Bảo mật OAuth quan trọng

**Không đưa Google Client Secret vào JavaScript hoặc vào file tĩnh được xuất bản trên GitHub Pages.** GitHub Actions Secrets chỉ che giá trị trong log; nếu workflow chèn secret vào HTML/JS xuất bản thì bất kỳ ai cũng có thể xem trong mã nguồn tải về. Google Identity Services token client chạy trong trình duyệt dùng **OAuth Client ID** (đây là thông tin công khai), không dùng Client Secret. Nếu cần dùng Client Secret, phải có backend/serverless function giữ secret ở phía máy chủ; GitHub Pages không chạy backend.

## Cài đặt

1. Tạo repository GitHub và đẩy toàn bộ thư mục này lên nhánh `main`.
2. Trong Google Cloud Console, bật **Google Calendar API** và **Google Tasks API**.
3. Tạo OAuth Client ID loại **Web application**. Thêm URL GitHub Pages của bạn vào **Authorized JavaScript origins** (ví dụ `https://TEN-USER.github.io` và/hoặc `https://TEN-USER.github.io/TEN-REPO` nếu dùng project site). Không tạo/đưa Client Secret vào trang tĩnh.
4. Sửa `_config.yml`, thay `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com` bằng OAuth Client ID của bạn. Đây không phải secret.
5. GitHub repository → **Settings → Pages** → chọn **GitHub Actions** làm source. Workflow trong `.github/workflows/pages.yml` sẽ build và deploy khi push lên `main`.
6. Mở URL Pages, nhấn **Kết nối Google Calendar**, đăng nhập và chấp thuận scope Calendar readonly + Tasks readonly.

## Ghi chú

- Tự cập nhật mỗi 3 giờ / 30 phút chỉ khi trang còn mở và trình duyệt cho phép timer chạy.
- Tasks API riêng biệt với Calendar API; cần bật cả hai.
- OAuth Client ID xuất hiện công khai trong trang là bình thường. Không commit Client Secret, access token hoặc refresh token.
- Nếu cần xác thực server-side hoặc lưu refresh token lâu dài, hãy thêm backend (ví dụ Cloud Run/Functions hoặc dịch vụ serverless) và lưu secret trong secret manager phía máy chủ.
