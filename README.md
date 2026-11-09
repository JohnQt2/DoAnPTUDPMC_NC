# ChinaEasy - Nền Tảng Học Tiếng Trung Sơ Cấp (Modular Monolith)

Dự án nền tảng học tiếng Trung sơ cấp HSK dành cho người Việt, được thiết kế theo đúng kiến trúc **Modular Monolith** chuẩn hóa theo **Chương 3 Báo cáo Kỹ thuật & Đặc tả nghiệp vụ (UC01 - UC16)**. Hệ thống có tính module hóa cao, ranh giới phân định rõ ràng giữa các domain, và sẵn sàng tách thành Microservices khi quy mô người dùng tăng trưởng mà không cần viết lại mã nguồn.

---

## 🏛️ 1. Kiến Trúc Hệ Thống (Modular Monolith)

Hệ thống được tổ chức thành các phân hệ lõi độc lập với trách nhiệm rõ ràng:

```
d:\ChinaEasy\
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma              # 22 bảng CSDL quan hệ khớp 100% với ERD và dataset.sql
│   │   └── seed.ts                    # Dữ liệu sư phạm mẫu HSK1, Pinyin, SVG nét vẽ, Đề thi
│   └── src/
│       ├── config/                    # Cấu hình biến môi trường Zod type-safe
│       ├── shared/                    # Cơ sở hạ tầng dùng chung (Prisma, Redis/Memory, Error, Security)
│       │   ├── database/              # Prisma Client singleton
│       │   ├── redis/                 # Redis Service + High-performance In-Memory Fallback
│       │   ├── middleware/            # Auth JWT, RBAC, Idempotency-Key, Rate Limiter, Error Handler
│       │   └── utils/                 # SM-2 Spaced Repetition, Crypto (SHA-256 OTP & Token hashing)
│       ├── modules/
│       │   ├── auth/                  # Email OTP (300s, lockout 5 lần), Google OAuth, JWT RTR, Device Revocation
│       │   ├── user/                  # Khảo sát mục tiêu Onboarding, Thông báo nhắc học, RBAC Admin
│       │   ├── curriculum/            # Quản lý Khóa học, Chương, Bài học, Khối nội dung LessonBlocks
│       │   ├── learning/              # Pinyin, Thanh điệu F0, Minimal Pairs, Chữ Hán SVG, Luyện tập
│       │   ├── assessment/            # Ngân hàng câu hỏi, Snapshot, Idempotency-Key, Chấm điểm 80%
│       │   └── srs/                   # Thuật toán SuperMemo-2 (SM-2), Hàng đợi ôn tập 25 từ/ngày
│       ├── app.ts                     # Express setup, mounting các phân hệ
│       ├── server.ts                  # Server entry point
│       └── test/                      # Bộ kiểm thử tích hợp tự động (Integration Test Suite)
├── frontend/
│   ├── src/
│   │   ├── context/                   # AuthContext: Quản lý Access Token trong bộ nhớ tạm (In-Memory)
│   │   ├── lib/                       # API client (tự động đính kèm Bearer token & Silent Token Refresh)
│   │   ├── components/                # HanziCanvas (田字格, SVG nét viết), PitchVisualizer (F0 ngũ độ), Navbar
│   │   └── pages/
│   │       ├── auth/                  # Đăng nhập đa kênh (Google OAuth + Email OTP 300s countdown)
│   │       ├── profile/               # Hồ sơ cá nhân, Khảo sát lộ trình, Cài đặt nhắc học, Quản lý thiết bị
│   │       ├── courses/               # Danh sách khóa học, Cây bài học (Hiển thị điều kiện khóa/mở 80%)
│   │       ├── lessons/               # Màn hình học vi mô: Nghe, Xem khẩu hình, Viết chữ Hán, Hội thoại
│   │       ├── learning/              # Bảng chữ cái Pinyin, Thử thách phân biệt âm tương phản (Minimal Pairs)
│   │       ├── test/                  # Làm bài kiểm tra trắc nghiệm, Nộp bài Idempotency, Xem kết quả & giải thích
│   │       ├── srs/                   # Ôn tập Flashcard lặp lại ngắt quãng (Nút: Lại, Khó, Tốt, Dễ với khoảng cách SM-2)
│   │       └── admin/                 # Admin/Content Editor CMS: Quản trị khóa học, bài học, ngân hàng câu hỏi
│   └── vite.config.ts / tailwind.config.js
├── ERD.md                             # Tài liệu đặc tả ERD chi tiết & Từ điển dữ liệu 22 bảng (v3.0)
└── ERD_VIEWER.html                    # Giao diện trực quan hóa ERD tương tác (Pan & Zoom)
```

### 📊 Sơ Đồ Thực Thể Quan Hệ (ERD v3.0)
Hệ thống CSDL bao gồm **22 bảng quan hệ** chuẩn hóa theo đúng mã nguồn `schema.prisma` và kiến trúc Modular Monolith:
- 📖 **Chi tiết toàn bộ bảng & từ điển dữ liệu:** Xem tại [`ERD.md`](./ERD.md)
- 🖥️ **Trình xem sơ đồ trực quan tương tác (Pan & Zoom):** Mở tệp [`ERD_VIEWER.html`](./ERD_VIEWER.html) trên trình duyệt web.

---

## 🚀 2. Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### Yêu cầu tiên quyết:
- **Node.js**: v18+ hoặc v20+
- Hệ thống tự động sử dụng **SQLite** (`dev.db`) và bộ nhớ đệm **Embedded Memory Redis** mà không bắt buộc phải cài đặt SQL Server hay Redis Server ngoài.

### Bước 1: Khởi động Backend
```powershell
cd d:\ChinaEasy\backend

# Chạy seed dữ liệu sư phạm mẫu (Khóa HSK1, Pinyin, Chữ Hán SVG, Câu hỏi)
npm run db:seed

# Khởi chạy server Backend ở chế độ phát triển
npm run dev
# Hoặc chạy bản build đã biên dịch:
# node dist/server.js
```
*API Backend chạy tại: `http://localhost:5000`*

### 📧 Kiểm tra gửi email OTP (khi chạy trên máy khác)
```powershell
cd d:\ChinaEasy\backend
npm run check:smtp                    # kiểm tra kết nối + đăng nhập Gmail SMTP
npm run check:smtp -- ban@gmail.com   # gửi thử 1 email OTP
```
- Nếu copy `.env.example` → `.env`, hãy **để trống** `SMTP_USER`/`SMTP_PASS` để dùng tài khoản gửi mặc định, hoặc điền Gmail + App Password 16 ký tự của riêng bạn.
- Hệ thống tự thử cổng **465 → 587** nếu mạng chặn một cổng.
- Khi gửi thất bại, giao diện hiển thị nguyên nhân cụ thể (sai App Password, Google chặn đăng nhập, mạng chặn SMTP, phần mềm diệt virus...). Ở chế độ `development`, mã OTP được in ra **terminal backend** để vẫn đăng nhập thử được.
- Không thấy thư? Kiểm tra thư mục **Spam**.

### Bước 2: Khởi động Frontend
Mở cửa sổ PowerShell mới:
```powershell
cd d:\ChinaEasy\frontend

# Chạy frontend Vite Dev Server
npm run dev
```
*Giao diện người dùng chạy tại: `http://localhost:5173`*

### Bước 3: Chạy Kiểm Thử Tự Động (Integration Tests)
```powershell
cd d:\ChinaEasy\backend
node dist/test/integration.test.js
```

---

## 🔑 3. Tài Khoản Thử Nghiệm Mẫu Trong Hệ Thống

| Vai trò | Email | Quyền Hạn |
|---|---|---|
| **Admin** | `admin@chinaeasy.vn` | Toàn quyền quản trị, phân quyền người dùng, quản lý hệ thống |
| **Content Editor** | `editor@chinaeasy.vn` | Soạn thảo khóa học, bài học, ngân hàng câu hỏi, Draft/Publish |
| **Student** | `student@chinaeasy.vn` | Học bài, luyện viết chữ Hán, làm bài kiểm tra, ôn tập SRS |

*Lưu ý khi Đăng ký / Đăng nhập bằng Email OTP: Khi Guest nhập địa chỉ `@gmail.com` và mật khẩu trên giao diện web, hệ thống sử dụng tài khoản chính `ChinaEasy <hieuhoanghuu436@gmail.com>` gửi email HTML chứa mã xác thực 6 chữ số trực tiếp vào hộp thư Gmail thật của người nhận qua `smtp.gmail.com:465` (tuyệt đối không hiển thị mã OTP trên giao diện web).*

---

## 🎯 4. Các Nghiệp Vụ Kỹ Thuật Đã Triển Khai Hoàn Chỉnh

1. **Email OTP & Bảo Mật Phiên**:
   - OTP ngẫu nhiên 6 chữ số, lưu mã băm SHA-256 trong Redis với TTL 300 giây.
   - Giới hạn thử sai tối đa 5 lần. Sai quá 5 lần sẽ khóa tài khoản 15 phút.
   - Access Token (15 phút), Refresh Token Rotation (RTR).
   - Phát hiện token cũ bị dùng lại (Token Reuse) $\rightarrow$ thu hồi toàn bộ session family.
   - Quản lý phiên và đăng xuất theo thiết bị.
2. **Ngữ Âm Pinyin & Chữ Hán SVG**:
   - Trực quan hóa cao độ âm học $F_0$ trên thang ngũ độ Chao (55, 35, 214, 51).
   - Bộ tương phản tối thiểu (Minimal Pairs: b vs p, d vs t, tone 1 vs tone 4).
   - Bảng vẽ chữ Hán trên ô điền tự cách (田字格) với hoạt ảnh thứ tự nét vẽ SVG và cọ vẽ canvas.
3. **Kiểm Tra & Đánh Giá Năng Lực**:
   - Cơ chế **Snapshot câu hỏi**: Chụp lại trạng thái câu hỏi tại thời điểm bắt đầu làm bài.
   - Áp dụng **Idempotency-Key** để triệt tiêu request nộp bài trùng lặp khi mạng chập chờn.
   - Chấm điểm trong **Prisma Transaction** nguyên tử.
   - Điều kiện mở khóa bài học tiếp theo khi đạt $\ge 80\%$.
4. **Ôn Tập Ngắt Quãng SM-2**:
   - Thuật toán SuperMemo-2 cập nhật `repetitions`, `ease_factor`, `interval_days`, `next_review_at`.
   - Xem trước ngày ôn tập trên từng nút đánh giá: Lại (Again), Khó (Hard), Tốt (Good), Dễ (Easy).
