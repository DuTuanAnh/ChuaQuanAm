# Studio — Chùa Quan Âm

Sanity Studio TypeScript cho 4 schemas: `post`, `dharma`, `event`, `photo`.
Project ID `13i7s9vj` · Dataset `production`.

**🌐 Production URL: https://chuaquanam.sanity.studio**

## Setup (chỉ làm 1 lần)

```bash
cd studio
npm install
npx sanity login   # browser SSO, tài khoản đã tạo project
```

## Chạy local

```bash
npm run dev
# Mở http://localhost:3333
```

## Re-deploy sau khi thay đổi schema

```bash
npm run deploy
# Auto deploy lên chuaquanam.sanity.studio (studioHost đã pin trong sanity.cli.ts)
```

## Đồng bộ project ID (khi đổi)

Phải khớp ở 3 nơi:
- `studio/sanity.config.ts` + `studio/sanity.cli.ts` → `'13i7s9vj'`
- `server/.env` → `SANITY_PROJECT_ID=13i7s9vj`
- `website-chua-quan-am/src/environments/environment.ts` → `apiUrl` (gọi backend)

## Schemas

- **post** — Bài viết: `title*, slug*, category* (3 options), thumbnail, publishedAt*, excerpt, body (Portable Text), author`
- **dharma** — Pháp thoại: `title*, slug*, speaker*, topic (5 options), videoType* (youtube|upload), youtubeUrl/videoFile (conditional), thumbnail, duration, publishedAt*, description`
- **event** — Sự kiện: `title*, type* (4 options), startDate*, endDate, location, image, description, isRecurring (bool), recurringNote (conditional), contact`
- **photo** — Ảnh: `title*, image*, album* (5 options), dateTaken, description, isFeature (bool)`

## Workflow content authoring

1. Editor login `https://chuaquanam.sanity.studio` (Sanity account)
2. Click 1 trong 4 schema sidebar → **Create new** → fill + Publish
3. Backend cache TTL 5-10min — nếu cần frontend update ngay:
   ```bash
   curl -X DELETE -u admin:<pass> http://localhost:3000/api/cache/clear
   ```
