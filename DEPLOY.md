# Deploy miễn phí

## Cloudflare Pages (khuyên dùng)

1. Đưa source lên một GitHub repository.
2. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git.
3. Chọn repository.
4. Build command: `npm run build`
5. Build output directory: `dist`
6. Node.js: 20 hoặc mới hơn.
7. Deploy.

Với site ở domain gốc `*.pages.dev`, không cần đặt `VITE_BASE_PATH`.

Sau khi deploy qua HTTPS, mở bằng Chrome/Edge. Khi trình duyệt xác nhận PWA hợp lệ, nút **Cài ứng dụng** sẽ xuất hiện.

## GitHub Pages

Project đã có `.github/workflows/deploy-pages.yml`.

1. Push project lên branch `main`.
2. GitHub repository → Settings → Pages.
3. Source: **GitHub Actions**.
4. Workflow sẽ tự build với base path `/repository-name/` và deploy thư mục `dist`.

## Build local

```bash
npm install
npm run build
npm run preview
```

`dist/` là bản production.

## Trước khi cập nhật app

Trong app mở **Sao lưu** → tải ít nhất **Backup tiến độ học**. Dữ liệu IndexedDB nằm trên thiết bị của người dùng, không nằm trên Cloudflare/GitHub.
