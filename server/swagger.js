import swaggerJsdoc from 'swagger-jsdoc';

/**
 * OpenAPI 3 specification.
 *
 * Per-endpoint documentation lives as `@swagger` JSDoc blocks above each
 * route handler — the `apis` array below tells swagger-jsdoc which files to
 * scan. Reusable component schemas live here so all routes can `$ref` them.
 */
const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'API Website Chùa Quan Âm',
      version: '1.0.0',
      description:
        'Backend API cho website Chùa Quan Âm — tự viện Phật giáo Bắc Tông tại ' +
        'Mỹ Đông, Đông Hải, Khánh Hoà. Dữ liệu pull từ Sanity CMS, YouTube Data API ' +
        'dùng để enrich pháp thoại video.',
      contact: { name: 'Văn phòng chùa', phone: '0984 148 802' },
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Dev server' },
      // TODO: thêm production URL sau khi deploy.
    ],
    tags: [
      { name: 'System',  description: 'Health check + service status' },
      { name: 'Posts',   description: 'Bài viết / tin tức' },
      { name: 'Dharma',  description: 'Pháp thoại & kinh sách Bắc Tông' },
      { name: 'Events',  description: 'Sự kiện & khoá lễ — Phật Đản, Vu Lan, Vía Quán Âm…' },
      { name: 'Photos',  description: 'Thư viện ảnh chùa — kiến trúc, lễ hội, khoá tu, thiên nhiên, sự kiện' },
    ],
    components: {
      securitySchemes: {
        basicAuth: { type: 'http', scheme: 'basic' },
      },
      schemas: {
        Slug: {
          type: 'object',
          properties: {
            current: { type: 'string', example: 'phat-dan-2569' },
          },
        },
        SanityImage: {
          type: 'object',
          properties: {
            _type: { type: 'string', example: 'image' },
            asset: {
              type: 'object',
              properties: {
                _ref: { type: 'string', example: 'image-abc123-1024x768-jpg' },
                _type: { type: 'string', example: 'reference' },
                url: { type: 'string', format: 'uri', nullable: true },
              },
            },
            alt: { type: 'string', nullable: true },
          },
        },
        Post: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: 'p-001' },
            _type: { type: 'string', enum: ['post'] },
            title: { type: 'string', example: 'Tâm thư đầu năm' },
            slug: { $ref: '#/components/schemas/Slug' },
            excerpt: { type: 'string', nullable: true },
            body: { description: 'Portable Text blocks (Sanity)', nullable: true },
            heroImage: { allOf: [{ $ref: '#/components/schemas/SanityImage' }], nullable: true },
            publishedAt: { type: 'string', format: 'date-time' },
            author: { type: 'string', nullable: true, example: 'Văn phòng chùa' },
            tags: { type: 'array', items: { type: 'string' }, nullable: true },
          },
          required: ['_id', '_type', 'title', 'slug', 'publishedAt'],
        },
        Dharma: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: 'd-001' },
            _type: { type: 'string', enum: ['dharma'] },
            kind: {
              type: 'string',
              enum: ['phap-thoai', 'kinh-sach', 'bai-viet'],
              example: 'phap-thoai',
            },
            title: { type: 'string', example: 'Tâm an, vạn sự an' },
            slug: { $ref: '#/components/schemas/Slug' },
            excerpt: { type: 'string', nullable: true },
            speaker: {
              type: 'string',
              nullable: true,
              example: 'Hoà thượng (đang cập nhật)',
              description: 'Tôn xưng + pháp danh — Hoà thượng / Thượng toạ / Đại đức / Sư cô...',
            },
            publishedAt: { type: 'string', format: 'date-time' },
            durationSec: { type: 'integer', nullable: true, example: 1934 },
            youtubeId: { type: 'string', nullable: true, example: 'M7lc1UVf-VE' },
            videoUrl: { type: 'string', format: 'uri', nullable: true },
            audioUrl: { type: 'string', format: 'uri', nullable: true },
            transcript: { description: 'Portable Text blocks', nullable: true },
            body: { description: 'Portable Text blocks — full content cho kinh sách', nullable: true },
            thumbnail: { allOf: [{ $ref: '#/components/schemas/SanityImage' }], nullable: true },
            tags: { type: 'array', items: { type: 'string' }, nullable: true },
            references: {
              type: 'array',
              items: { type: 'string' },
              nullable: true,
              example: ['Kinh Diệu Pháp Liên Hoa, phẩm Phổ Môn'],
            },
          },
          required: ['_id', '_type', 'kind', 'title', 'slug', 'publishedAt'],
        },
        TempleEvent: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: 'e-001' },
            _type: { type: 'string', enum: ['event'] },
            kind: {
              type: 'string',
              enum: ['le-via', 'khoa-tu', 'sinh-hoat', 'phong-sinh'],
              example: 'le-via',
            },
            title: { type: 'string', example: 'Đại lễ Phật Đản — PL.2569' },
            slug: { $ref: '#/components/schemas/Slug' },
            excerpt: { type: 'string', nullable: true },
            body: { description: 'Portable Text blocks', nullable: true },
            startsAt: { type: 'string', format: 'date-time', example: '2026-05-14T06:00:00+07:00' },
            endsAt: { type: 'string', format: 'date-time', nullable: true },
            lunarDate: { type: 'string', nullable: true, example: 'Rằm tháng Tư âm lịch' },
            location: { type: 'string', nullable: true, example: 'Đại hùng bảo điện' },
            hero: { allOf: [{ $ref: '#/components/schemas/SanityImage' }], nullable: true },
            tags: { type: 'array', items: { type: 'string' }, nullable: true },
            recurring: { type: 'boolean', nullable: true, example: true },
          },
          required: ['_id', '_type', 'kind', 'title', 'slug', 'startsAt'],
        },
        Photo: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: 'photo-001' },
            _type: { type: 'string', enum: ['photo'] },
            title: { type: 'string', example: 'Chánh điện lúc bình minh' },
            album: {
              type: 'string',
              enum: ['kien-truc', 'le-hoi', 'khoa-tu', 'thien-nhien', 'su-kien'],
              example: 'kien-truc',
            },
            dateTaken: { type: 'string', format: 'date', nullable: true, example: '2026-04-12' },
            description: { type: 'string', nullable: true },
            isFeature: { type: 'boolean', example: false },
            image: { allOf: [{ $ref: '#/components/schemas/SanityImage' }] },
          },
          required: ['_id', '_type', 'title', 'album', 'image'],
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Không tìm thấy bài viết với slug "abc".' },
            status: { type: 'integer', example: 404 },
            path: { type: 'string', nullable: true, example: '/api/posts/abc' },
          },
          required: ['error', 'status'],
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            services: {
              type: 'object',
              properties: {
                sanity: { type: 'string', example: 'configured' },
                youtube: { type: 'string', example: 'not configured' },
              },
            },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
      responses: {
        NotFound: {
          description: 'Không tìm thấy tài nguyên',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
          },
        },
        BadRequest: {
          description: 'Tham số không hợp lệ',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
          },
        },
        ServerError: {
          description: 'Lỗi máy chủ',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
          },
        },
      },
    },
  },
  apis: ['./server.js', './routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
