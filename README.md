# HSK Việt Nam PWA — Phase 13

Ứng dụng học từ vựng HSK dành cho người Việt, chạy trên Web / Android / Windows 11 dưới dạng PWA.

## Chức năng hiện có

- Import `FULL TỪ VỰNG HSK1- HSK6.xlsm` và chuẩn hóa HSK1–HSK6.
- Danh sách từ vựng, tìm kiếm không dấu, lọc HSK, yêu thích, đánh dấu đã học.
- Trang chi tiết: Hanzi, Pinyin, Hán-Việt (khi metadata có), nghĩa, ví dụ, TTS.
- Phân biệt chữ theo bộ thủ / thành phần gợi âm.
- Mind Map từ ghép cùng chữ.
- Quiz 5 dạng + đáp án nhiễu thông minh.
- Progress, từ hay sai, từ đến hạn, spaced repetition.
- PWA offline, install prompt, light/dark/system theme.
- **Phase 13:** backup/restore dữ liệu, cấu hình production, Cloudflare Pages và GitHub Pages.

## Chạy local

Yêu cầu Node.js 20+.

```bash
npm install
npm run dev
```

Mở địa chỉ Vite hiển thị (thường là `http://localhost:5173`).

## Build production

```bash
npm run build
npm run preview
```

Thư mục production là `dist/`.

> Trong môi trường tạo source này, npm registry bị timeout nên bản zip chưa thể chạy `npm install`/production build tại chỗ. Source đã được kiểm tra tĩnh về cú pháp và relative imports.

## Sao lưu dữ liệu

Tab **Sao lưu** có 2 loại:

1. **Backup đầy đủ:** vocabulary + metadata chữ + progress + favorites + quiz history.
2. **Backup tiến độ học:** progress + favorites + quiz history, phù hợp chuyển sang thiết bị khác.

Khôi phục có 2 chế độ:

- **Gộp:** giữ dữ liệu hiện tại và nhập thêm/cập nhật dữ liệu từ backup.
- **Thay thế:** xóa dữ liệu app hiện tại rồi khôi phục từ backup.

Để chuyển máy an toàn: import file Excel HSK trên máy mới trước, sau đó restore **Backup tiến độ học** ở chế độ **Gộp**.

## Deploy

Xem `DEPLOY.md`.

### Cloudflare Pages

- Build command: `npm run build`
- Output directory: `dist`
- Production branch: `main`

### GitHub Pages

Project có sẵn `.github/workflows/deploy-pages.yml`. Trong repository chọn:

`Settings → Pages → Source → GitHub Actions`

Sau đó push branch `main`.

## Dữ liệu local

IndexedDB database: `HskVietnamDB`

Tables:

- `vocabulary`
- `characters`
- `progress`
- `favorites`
- `quizHistory`

Dữ liệu này nằm trên thiết bị, không tự đồng bộ lên Cloudflare/GitHub. Vì vậy nên backup định kỳ.
