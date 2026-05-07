# Sanity Studio — Chùa Quan Âm

CMS for authoring photos (and later: posts, dharma talks, events).

## Setup (one time)

1. Tạo Sanity project tại https://www.sanity.io/manage (chọn dataset `production`).
2. Copy `Project ID` từ trang manage.
3. Copy `.env.example` → `.env.local` và điền:
   ```
   SANITY_STUDIO_PROJECT_ID=<your-project-id>
   SANITY_STUDIO_DATASET=production
   ```
4. Install + chạy Studio:
   ```
   cd sanity-studio
   npm install
   npm run dev
   ```
   Mở http://localhost:3333

## Đồng bộ project ID

Project ID phải giống nhau ở 3 nơi:
- `sanity-studio/.env.local` → `SANITY_STUDIO_PROJECT_ID`
- `website-chua-quan-am/src/environments/environment.development.ts` → `sanityProjectId`
- `server/.env` → `SANITY_PROJECT_ID`

## Schemas hiện có

- **photo** — ảnh thư viện (title, image hotspot, album, dateTaken, description, isFeature)

Các schema khác (post, dharma, event) sẽ được thêm khi cần.
