# CLAUDE.md — Website Chùa Quan Âm

## 1. Dự án

Website giới thiệu và lưu trữ nội dung cho **Chùa Quan Âm** — tự viện **Phật giáo Bắc Tông** (Đại thừa) tại Việt Nam, thờ Đức Bồ Tát Quán Thế Âm.

Hai mục đích chính:
1. **Giới thiệu**: lịch sử chùa, trụ trì & tăng đoàn, kiến trúc, đường đến chùa, lịch khoá lễ.
2. **Lưu trữ nội dung**: pháp thoại (bài giảng audio/video), kinh sách Bắc Tông, hoạt động & sự kiện, thư viện ảnh.

Tính năng nâng cao:
- **Sanity CMS** quản lý nội dung động (bài giảng, bài viết, sự kiện, kinh sách).
- **YouTube embed** cho pháp thoại video.
- **Chatbox** AI (Claude API) giải đáp câu hỏi cho khách truy cập.

- **Đối tượng**: Phật tử Bắc Tông và khách thập phương người Việt; ưu tiên trải nghiệm trên mobile.
- **Ngôn ngữ mặc định**: Tiếng Việt (`vi-VN`). Có thể bổ sung English về sau.

### 1.1 Thông tin chùa đã được user xác nhận

Đây là dữ liệu thật, **được dùng trực tiếp** trong UI (không cần `{{TODO}}`):

- **Tên**: Chùa Quan Âm
- **Địa chỉ**: Mỹ Đông, Đông Hải, Khánh Hoà
- **Điện thoại**: 0984 148 802
- **Giờ mở cửa**: Mở cả ngày

Mọi thông tin **khác** (năm thành lập, trụ trì, lịch sử, tăng đoàn, kiến trúc cụ thể, kinh phí, lịch lễ năm…) **vẫn phải dùng `{{TODO}}`** cho tới khi được xác nhận.

## 2. Stack chính thức

- **Angular 17** standalone components, file-based routing (`app.routes.ts`), SCSS.
- **TailwindCSS 3** — utility-first, theme tuỳ chỉnh.
- **PrimeNG 17 + PrimeIcons** — UI library (table, dialog, calendar, dropdown…).
- **NgRx 17** — state management:
  - `@ngrx/store` (state)
  - `@ngrx/effects` (side effects, gọi Sanity / Claude API)
  - `@ngrx/entity` (chuẩn hoá list pháp thoại / sự kiện)
  - `@ngrx/store-devtools` (chỉ bật ở dev)
- **@sanity/client** — kết nối Sanity CMS lấy nội dung.
- **@angular/youtube-player** — embed YouTube cho video pháp thoại.
- **Build**: `ng build` (production) / `ng serve` (dev). Deploy: chưa quyết định — Vercel/Netlify đều OK với output `dist/`.

> **Tên project on disk**: `website-chua-quan-am/` (kebab-case, đúng convention Angular CLI / npm — uppercase và underscore không hợp lệ cho npm package name). Display name "Website Chùa Quan Âm" giữ nguyên trong meta / `<title>`.

## 3. Định hướng thiết kế

**Tham chiếu trực quan**:
- `godly.website_website_gamma-272.png` — phong cách Gamma editorial (curved gradients, layered shapes, mixed-weight serif typography, asymmetric layouts).
- `mockup/index.html` + `mockup/step-*.png` — bản mockup tĩnh đã lặp 9 vòng tinh chỉnh, dùng làm spec hình ảnh chi tiết.

**Tinh thần cần đạt**: *trang nghiêm – chỉnh chu – chuyên nghiệp*.

### 3.1 Bảng màu chính thức

```
Nâu trầm (primary):    #3D2B1F   — heading, footer, dark sections
Vàng đồng (accent):    #B8860B   — link, eyebrow, button primary, highlight
```

Bảng mở rộng (đặt trong `tailwind.config.js` extend):

```
brown-darker:  #2C1A0E   (footer / darkest sections)
brown-deep:    #3D2B1F   (primary, navbar bg)
brown-mid:     #5A4030
brown-soft:    #7A5A45
brass:         #B8860B   (accent)
brass-bright:  #D4A843   (navbar text, header brand on dark)
brass-light:   #D4A82A
brass-soft:    #E8C870
parchment:     #C4A47C   (text trên dark sections / footer)
cream:         #FDF8EF   (background)
cream-warm:    #F2E6CC
ink:           #1F140C   (text trên cream)
muted:         #8B7B6A
line:          #D9CCB6
```

Không dùng đen tuyệt đối — `--ink: #1F140C` (gần đen, ấm hơn).

PrimeNG theme: dùng base `lara-light-amber` hoặc `aura-light-amber` rồi override CSS variables về palette nâu+vàng đồng để tránh xung đột.

### 3.2 Typography

- **Heading**: **Playfair Display** — serif display, weights 400/500/600/700 + italic.
- **Body**: **DM Sans** — sans-serif hiện đại, đã include subset Vietnamese trên Google Fonts. Weights 300/400/500/600/700.
- Load qua Google Fonts trong `src/index.html`.
- Tailwind extend: `fontFamily: { display: ['"Playfair Display"', 'serif'], sans: ['"DM Sans"', ...] }`.
- **Bắt buộc** kiểm tra mọi nguyên âm có dấu (ặ, ễ, ử, ợ…) hiển thị đúng trên cả Playfair lẫn DM Sans.

### 3.3 Hoạ tiết & hình ảnh

- Motif: hoa sen, mây vân, núi xa, cổng tam quan, chuỗi tràng hạt — vẽ vector / minh hoạ trừu tượng. Tránh clipart "Phật giáo".
- Hero / divider: dùng SVG curved gradient (kế thừa cảm giác Gamma) thay vì ảnh thật.
- Ảnh thật chỉ dùng cho thư viện ảnh, ảnh chùa, ảnh tăng đoàn, ảnh sự kiện.
- **Quy tắc tôn nghiêm**:
  - Không đè text/nút lên tượng Phật / Bồ Tát.
  - Không crop ảnh tôn tượng.
  - Không đặt CTA thương mại sát ảnh tôn tượng.
  - Không trộn iconography của tôn giáo / tín ngưỡng khác.

### 3.4 Chuyển động

- Tinh tế: fade-in khi scroll, parallax rất nhẹ, hover translate vài px.
- **Không**: bounce/elastic/flashy, autoplay video có tiếng.
- Tôn trọng `prefers-reduced-motion`.

## 4. Routes & Navbar

Navbar 6 mục:

| Slug | Tiêu đề | Nội dung |
|---|---|---|
| `/` | **Trang chủ** | Hero, intro, highlight pháp thoại / hoạt động mới |
| `/hoat-dong` | **Hoạt động** | Sự kiện sắp tới + đã diễn ra (Phật Đản, Vu Lan, Vía Quán Âm, khoá tu) |
| `/phap-thoai` | **Pháp thoại** | Bài giảng (YouTube embed + transcript) + kinh sách Bắc Tông |
| `/thu-vien-anh` | **Thư viện ảnh** | Gallery ảnh chùa theo 5 album (kiến trúc / lễ hội / khoá tu / thiên nhiên / sự kiện) — Galleria fullscreen lightbox |
| `/gioi-thieu` | **Giới thiệu** | Lịch sử chùa, trụ trì & tăng đoàn, kiến trúc, hệ phái Bắc Tông |
| `/lien-he` | **Liên hệ** | Địa chỉ, đường đến, điện thoại, email, form liên hệ |

Slug không dấu, lowercase, gạch ngang.

Chatbox hiển thị nổi cố định góc dưới trên mọi route (component dùng chung).

## 5. Cấu trúc thư mục

Workspace có **3 sub-projects** chạy độc lập khi dev:

```
e:/Website_ChuaQuanAm/
├── CLAUDE.md
├── godly.website_website_gamma-272.png   # design inspiration
├── mockup/                                # static HTML iteration cũ
├── website-chua-quan-am/                  # Angular frontend (port 4200)
├── server/                                # Node + Express backend (port 3000)
└── studio/                                # Sanity Studio (port 3333 dev)
    │                                       # Deployed: https://chuaquanam.sanity.studio
    ├── schemaTypes/
    │   ├── index.ts                       # barrel
    │   ├── post.ts
    │   ├── dharma.ts
    │   ├── event.ts
    │   └── photo.ts
    ├── sanity.config.ts                   # projectId 13i7s9vj, dataset production
    ├── sanity.cli.ts                      # studioHost: 'chuaquanam' — auto-deploy host
    ├── tsconfig.json
    ├── package.json
    ├── README.md
    └── .gitignore
    ├── routes/
    │   ├── posts.route.js
    │   ├── dharma.route.js
    │   └── events.route.js
    ├── services/
    │   ├── sanity.service.js              # GROQ proxy
    │   └── youtube.service.js             # YouTube Data API v3 wrapper
    ├── server.js
    ├── package.json
    ├── .env.example
    └── .env                               # gitignored
```

API endpoints (`/api/*`, JSON):
- `GET /api/health` — service status check
- `GET /api/posts`, `GET /api/posts/:slug`
- `GET /api/dharma`, `GET /api/dharma/:slug`
- `GET /api/events`, `GET /api/events/upcoming/:limit`

Backend giữ `SANITY_TOKEN` (read token cho draft / private dataset) và `YOUTUBE_API_KEY` server-side. Khi sẵn sàng, frontend Angular có thể switch từ direct Sanity client sang gọi `/api/*` qua HTTP — model shape đã giống nhau.

**Sanity project ID phải đồng bộ ở 3 nơi**:
- `sanity-studio/.env.local` → `SANITY_STUDIO_PROJECT_ID`
- `website-chua-quan-am/src/environments/environment.development.ts` → `sanityProjectId`
- `server/.env` → `SANITY_PROJECT_ID`

### 5.1 Cấu trúc Angular project

```
website-chua-quan-am/
├── src/
│   ├── app/
│   │   ├── app.config.ts            # providers (Router, Store, Effects, Animations)
│   │   ├── app.routes.ts            # 5 lazy-load routes
│   │   ├── app.component.{ts,html,scss}
│   │   │
│   │   ├── core/
│   │   │   └── services/            # SanityService, YoutubeService, ClaudeService
│   │   │
│   │   ├── features/                # 1 thư mục / 1 route
│   │   │   ├── home/
│   │   │   ├── hoat-dong/
│   │   │   ├── phap-thoai/
│   │   │   ├── gioi-thieu/
│   │   │   └── lien-he/
│   │   │
│   │   └── shared/
│   │       ├── components/
│   │       │   ├── navbar/
│   │       │   ├── footer/
│   │       │   └── chatbox/
│   │       └── models/
│   │           ├── post.model.ts
│   │           ├── dharma.model.ts
│   │           └── event.model.ts
│   │
│   ├── environments/
│   │   ├── environment.ts           # production
│   │   └── environment.development.ts
│   │
│   ├── styles.scss                  # Tailwind directives + PrimeNG imports + base
│   └── index.html                   # Google Fonts links
│
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## 6. NgRx state slices (đề xuất)

- `dharma` — list pháp thoại (Sanity), entity adapter.
- `events` — list sự kiện, entity adapter.
- `posts` — bài viết tin tức, entity adapter.
- `chat` — lịch sử hội thoại của chatbox (transient, không persist nhạy cảm).
- `ui` — trạng thái global (mobile menu, dialog mở, toasts).

Effects:
- `dharma.effects.ts` — load list / load detail từ Sanity.
- `events.effects.ts` — load events từ Sanity.
- `chat.effects.ts` — gửi message lên Claude API qua proxy.

> Thêm slice mới khi cần — không over-engineer trước.

## 7. Environment & secrets

`src/environments/environment.development.ts` (dev):
```ts
export const environment = {
  production: false,
  sanityProjectId: '{{TODO: từ sanity.io/manage}}',
  sanityDataset:   'production',
  youtubeApiKey:   '{{TODO}}',
  claudeApiKey:    '{{TODO}}',  // ⚠ KHÔNG để key thật ở frontend
};
```

`environment.ts` (production): cùng schema, giá trị thật được inject lúc build / qua proxy.

⚠ **Cảnh báo bảo mật**:
- **claudeApiKey** ở frontend bundle = lộ key cho ai inspect script.
  - Production phải dùng **backend proxy**: client gọi `POST /api/chat` → server giữ key, gọi Claude API.
  - Trong giai đoạn dev/local có thể để placeholder; trước khi deploy phải tách ra backend.
- **youtubeApiKey** chỉ cần cho **YouTube Data API v3** (search/playlist queries).
  - Nếu chỉ dùng `<youtube-player>` để embed video theo videoId thì **không cần API key**.
  - Restrict key theo HTTP referrer trong Google Cloud Console.
- **sanityProjectId + dataset** không phải secret — public read OK.
  - Nếu cần ghi (mutations) phải dùng read/write token, để ở backend, không bỏ vào env frontend.

## 8. Quy ước

- **Slug**: không dấu, lowercase, gạch ngang.
- **Copy người dùng**: tiếng Việt có dấu đầy đủ. Code, tên biến, comment, commit message: tiếng Anh.
- **Component naming**: `kebab-case` cho file, `PascalCase` cho class. Standalone components mặc định.
- **Models** (`shared/models/*.model.ts`): interfaces / types khớp schema Sanity (`_id`, `_type`, `slug.current`…).
- **Ngày tháng**: lưu ISO 8601; render bằng tiếng Việt (`Ngày 15 tháng 4, 2026`); thêm âm lịch khi mô tả lễ Bắc Tông.
- **Placeholder**: dùng `{{TODO: ...}}` (escape khi viết trong template Angular: `{{ '{{TODO}}' }}`) cho mọi thông tin chưa được user xác nhận. **Không bịa thông tin về chùa.**
- **Accessibility**: hướng tới WCAG AA. Kiểm tra contrast vàng đồng `#B8860B` trên cream — text nhỏ có thể cần `brass-light`.
- **SEO**: meta tiếng Việt, OG image cho mỗi trang, structured data `ReligiousOrganization` ở trang chủ và `Article` cho pháp thoại.

## 9. Tính nhạy cảm tôn giáo (Bắc Tông)

Đây là website tự viện **Phật giáo Bắc Tông (Đại thừa)** — cần đúng thuật ngữ và tôn xưng:

- Thuật ngữ: *Bồ Tát Quán Thế Âm* / *Quán Âm Bồ Tát*, *Đức Phật A Di Đà*, *Đức Bổn Sư Thích Ca Mâu Ni*, *Tam Bảo*, *Phật tử*, *chùa*, *tự viện*, *khoá lễ*, *quy y Tam Bảo*, *thọ giới*, *tịnh độ*, *Đại hùng bảo điện*, *hồng chung*, *trống bát-nhã*…
- Kinh điển Bắc Tông: *Kinh Diệu Pháp Liên Hoa* (Pháp Hoa), *Kinh A Di Đà*, *Kinh Quán Vô Lượng Thọ*, *Kinh Đại Bát Niết Bàn*, *Kinh Bát Nhã Ba La Mật*, *Kinh Lăng Nghiêm*, *Kinh Kim Cang*, *Phổ Môn*…
- Tôn xưng chư tăng: *Hoà thượng*, *Thượng toạ*, *Đại đức*, *Sư cô*, *Ni sư*, *Ni trưởng*. Khi không chắc, để `{{TODO: nhờ thầy duyệt}}`.
- Lễ chính: *Đại lễ Phật Đản* (Rằm tháng 4 ÂL), *Vía Quán Âm* (19/2, 19/6, 19/9 ÂL), *Vu Lan Báo Hiếu* (Rằm tháng 7 ÂL), *Vía Phật A Di Đà* (17/11 ÂL).
- Không xen iconography Nam Tông (Theravada) hay tôn giáo khác.
- Mục cúng dường (nếu có) tách bạch, trang trọng. Không quảng cáo / popup tiếp thị trong nội dung tôn giáo.
- **Chatbox**: prompt Claude phải có guardrail — không đoán giáo lý, không tự xưng tăng sĩ, redirect câu hỏi nhạy cảm về văn phòng chùa.

## 10. Cách làm việc với user

- **Ngôn ngữ trả lời**: tiếng Việt. Code/docs nội bộ giữ tiếng Anh.
- User có gu thẩm mỹ rõ ràng (đã tham chiếu Gamma + lặp 9 vòng visual). Trước khi quyết định visual lớn, đưa preview chạy được hoặc mock cụ thể.
- Khi sửa UI: chạy `ng serve` và mở browser kiểm tra thật trước khi báo xong. `ng build` pass ≠ feature đúng.
- Không tự thêm dependency / refactor lớn nằm ngoài yêu cầu.
- File `godly.website_website_gamma-272.png` và folder `mockup/` là tài liệu — **không xoá**.
