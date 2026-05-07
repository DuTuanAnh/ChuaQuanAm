# Hướng dẫn Deploy — Chùa Quan Âm

Deploy lần đầu theo thứ tự **bắt buộc**: Backend → Frontend.

> Lý do: Frontend cần URL backend thật để build. Build với placeholder = bundle hỏng.

---

## Phần 1 — Deploy Backend lên Railway (~10 phút)

### 1.1 Push code lên GitHub

```bash
cd e:/Website_ChuaQuanAm
git add .
git commit -m "chore: initial deploy setup"
# Tạo repo trên https://github.com/new (Private OK), copy URL
git remote add origin https://github.com/<username>/chuaquanam.git
git branch -M main
git push -u origin main
```

> Lưu ý: `.env` và `node_modules/` đã được `.gitignore` — KHÔNG bị push.

### 1.2 Tạo project Railway

1. Vào https://railway.com → **New Project** → **Deploy from GitHub repo**
2. Chọn repo `chuaquanam` vừa push
3. Railway sẽ phát hiện monorepo → click **Add service** → chọn folder `server/`
4. Vào tab **Settings** → **Root Directory** = `/server` (nếu Railway chưa tự set)

### 1.3 Set Environment Variables

Tab **Variables** → paste 7 biến (mỗi biến 1 dòng):

```
SANITY_PROJECT_ID=13i7s9vj
SANITY_DATASET=production
SANITY_TOKEN=<paste từ server/.env>
NODE_ENV=production
CACHE_ADMIN_USER=admin
CACHE_ADMIN_PASS=<đặt password mạnh, ≥12 ký tự>
CORS_ORIGINS=
```

> `PORT` Railway tự cấp — không set tay.
> `CORS_ORIGINS` để rỗng tạm; quay lại điền sau khi có URL Vercel.

### 1.4 Deploy + lấy URL

1. Tab **Settings** → **Networking** → **Generate Domain** (Railway cấp URL `xxx.up.railway.app` miễn phí)
2. Copy URL — vd: `https://chuaquanam-api.up.railway.app`
3. Test: mở `https://<URL>/api/health` → phải trả `{"status":"ok","services":{"sanity":"configured"}}`
4. Test: mở `https://<URL>/api-docs` → Swagger UI hiện ra

✅ Backend xong.

---

## Phần 2 — Deploy Frontend lên Vercel (~5 phút)

### 2.1 Cập nhật URL backend trong code

Sửa file `website-chua-quan-am/src/environments/environment.prod.ts`:

```ts
export const environment = {
  production: true,
  apiUrl: 'https://chuaquanam-api.up.railway.app/api', // ← URL Railway thật
};
```

Commit + push:
```bash
git add website-chua-quan-am/src/environments/environment.prod.ts
git commit -m "chore: set production apiUrl"
git push
```

### 2.2 Tạo project Vercel

1. Vào https://vercel.com → **Add New** → **Project** → import repo `chuaquanam`
2. **Root Directory**: click Edit → chọn `website-chua-quan-am`
3. Vercel tự đọc `vercel.json`:
   - Build command: `npx ng build`
   - Output: `dist/website-chua-quan-am/browser`
   - SPA rewrites đã config sẵn
4. Click **Deploy** → đợi ~2 phút

### 2.3 Lấy URL frontend

Sau khi deploy xong, Vercel cấp URL `xxx.vercel.app` — vd: `https://chuaquanam.vercel.app`

### 2.4 Whitelist domain Vercel ở backend (CORS)

Quay lại Railway → tab **Variables** → sửa:

```
CORS_ORIGINS=https://chuaquanam.vercel.app
```

Railway tự redeploy. Nếu sau này có domain riêng (vd `chuaquanam.com`), thêm vào, ngăn cách bằng dấu phẩy:

```
CORS_ORIGINS=https://chuaquanam.vercel.app,https://chuaquanam.com
```

### 2.5 Whitelist Vercel ở Sanity (cho ảnh CDN)

Vào https://www.sanity.io/manage → project `13i7s9vj` → **API** → **CORS origins** → **Add origin**:
- Origin: `https://chuaquanam.vercel.app`
- ✓ Allow credentials = OFF (đọc public)

---

## Phần 3 — Test cuối

1. Mở `https://chuaquanam.vercel.app`
2. Kiểm tra **mọi route** load đúng (không 404):
   - `/` — Trang chủ
   - `/hoat-dong`
   - `/phap-thoai`
   - `/thu-vien-anh`
   - `/gioi-thieu`
   - `/lien-he`
3. F12 → tab **Network** → mở 1 trang content → API call về `xxx.up.railway.app/api/...` phải trả 200, không bị CORS chặn
4. Refresh trang `/lien-he` → vẫn load được (test SPA fallback)

---

## Lưu ý

- **Railway free tier**: $5 credit/tháng, đủ cho traffic chùa. Sau hết credit phải nạp.
- **Vercel free tier**: 100GB bandwidth/tháng — quá đủ.
- Khi cần xoá cache backend (vừa publish content mới và muốn frontend nhận ngay):
  ```bash
  curl -X DELETE -u admin:<CACHE_ADMIN_PASS> https://<railway-url>/api/cache/clear
  ```

## File rác cần dọn (không gấp)

- `e:/Website_ChuaQuanAm/sanity-studio/` — folder Studio CŨ, không dùng nữa. Studio đang chạy là `studio/`. Có thể xoá khi rảnh.
