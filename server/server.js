import 'dotenv/config';
import { timingSafeEqual } from 'node:crypto';
import cors from 'cors';
import express from 'express';
import NodeCache from 'node-cache';
import swaggerUi from 'swagger-ui-express';

import dharmaRoute from './routes/dharma.route.js';
import eventsRoute from './routes/events.route.js';
import photosRoute from './routes/photos.route.js';
import postsRoute from './routes/posts.route.js';
import * as sanity from './services/sanity.service.js';
import * as youtube from './services/youtube.service.js';
import { swaggerSpec } from './swagger.js';

const app = express();

// ---------- CORS ----------
// Local dev origins are always allowed. Production origins come from env
// `CORS_ORIGINS` (comma-separated) so we can add the Vercel/Netlify domain
// without rebuilding/redeploying the server.
const DEFAULT_ORIGINS = ['http://localhost:4200', 'http://127.0.0.1:4200'];
const ENV_ORIGINS = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const ALLOWED_ORIGINS = [...DEFAULT_ORIGINS, ...ENV_ORIGINS];

app.use(
  cors({
    origin(origin, cb) {
      // Allow same-origin / curl / server-to-server (no Origin header).
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: false,
  }),
);

app.use(express.json({ limit: '1mb' }));

// ---------- In-memory response cache ----------
// Reduces Sanity API hits during traffic spikes (Phật Đản, Vu Lan…).
const cache = new NodeCache();

/**
 * Cache GET responses (only 2xx) under `req.originalUrl` as key.
 * Different query strings → different cache entries.
 * Non-GET methods are passed through untouched.
 */
function cacheMiddleware(ttlSeconds) {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();

    const key = req.originalUrl;
    const hit = cache.get(key);
    if (hit !== undefined) {
      res.set('X-Cache', 'HIT');
      return res.json(hit);
    }

    res.set('X-Cache', 'MISS');
    // Wrap res.json so successful responses get stored on the way out.
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, body, ttlSeconds);
      }
      return originalJson(body);
    };
    next();
  };
}

// Constant-time comparison so password check doesn't leak via timing.
function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Basic Auth gate using CACHE_ADMIN_USER + CACHE_ADMIN_PASS env vars.
 * Fail-closed: if either env is empty, reject with 503 instead of allowing
 * unauthenticated access by accident.
 */
function basicAuth(req, res, next) {
  const expectedUser = process.env.CACHE_ADMIN_USER;
  const expectedPass = process.env.CACHE_ADMIN_PASS;

  if (!expectedUser || !expectedPass) {
    return res.status(503).json({
      error: 'Cache admin chưa cấu hình. Set CACHE_ADMIN_USER + CACHE_ADMIN_PASS trong .env.',
      status: 503,
    });
  }

  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="Cache control"');
    return res.status(401).json({ error: 'Yêu cầu xác thực Basic Auth.', status: 401 });
  }

  const [user, pass] = Buffer.from(auth.slice(6), 'base64').toString().split(':');
  if (!safeEqual(user, expectedUser) || !safeEqual(pass, expectedPass)) {
    return res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu.', status: 401 });
  }
  next();
}

// ---------- Swagger UI ----------
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'API Chùa Quan Âm — Docs',
    customCss: '.swagger-ui .topbar { display: none }',
  }),
);
// Raw spec — useful for codegen / Postman import.
app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check + service status
 *     description: Kiểm tra server còn sống và xem Sanity / YouTube đã được cấu hình chưa.
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server đang chạy
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/HealthResponse' }
 *             example:
 *               status: "ok"
 *               services:
 *                 sanity: "configured"
 *                 youtube: "not configured"
 *               timestamp: "2026-05-04T14:44:27.252Z"
 */
// ---------- Health check ----------
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    services: {
      sanity: sanity.isConfigured() ? 'configured' : 'not configured (placeholder)',
      youtube: youtube.isConfigured() ? 'configured' : 'not configured',
    },
    cache: cache.getStats(),
    timestamp: new Date().toISOString(),
  });
});

// ---------- Resource routes (with caching) ----------
const TEN_MIN = 10 * 60;
const FIVE_MIN = 5 * 60;

app.use('/api/posts',  cacheMiddleware(TEN_MIN),  postsRoute);
app.use('/api/dharma', cacheMiddleware(TEN_MIN),  dharmaRoute);
app.use('/api/events', cacheMiddleware(FIVE_MIN), eventsRoute);
app.use('/api/photos', cacheMiddleware(TEN_MIN),  photosRoute);

/**
 * @swagger
 * /api/cache/clear:
 *   delete:
 *     summary: Xoá toàn bộ cache (cần Basic Auth)
 *     description: |
 *       Dùng khi vừa publish content mới và cần frontend nhận ngay.
 *       Auth qua header `Authorization: Basic <base64(user:pass)>`.
 *       Credentials lấy từ env `CACHE_ADMIN_USER` + `CACHE_ADMIN_PASS`.
 *     tags: [System]
 *     security:
 *       - basicAuth: []
 *     responses:
 *       200:
 *         description: Cache đã xoá
 *         content:
 *           application/json:
 *             example:
 *               cleared: true
 *               previousStats: { keys: 12, hits: 348, misses: 14 }
 *       401:
 *         description: Sai hoặc thiếu Basic Auth
 *       503:
 *         description: Cache admin credentials chưa được cấu hình trong .env
 */
app.delete('/api/cache/clear', basicAuth, (_req, res) => {
  const previousStats = cache.getStats();
  cache.flushAll();
  console.log(
    `[${new Date().toISOString()}] [CACHE] flushed (was ${previousStats.keys} keys, ` +
    `${previousStats.hits} hits / ${previousStats.misses} misses)`,
  );
  res.json({ cleared: true, previousStats });
});

// ---------- 404 fallback ----------
app.use((req, res) => {
  res.status(404).json({
    error: 'Không tìm thấy endpoint.',
    path: req.originalUrl,
    status: 404,
  });
});

// ---------- Global error handler ----------
// 4-arg signature is required for Express to recognise this as an error middleware.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  console.error(`[${new Date().toISOString()}] [ERROR ${status}]`, err.message);
  if (status >= 500 && err.stack) console.error(err.stack);

  res.status(status).json({
    error: err.message || 'Lỗi máy chủ.',
    status,
  });
});

// ---------- Start ----------
const PORT = parseInt(process.env.PORT, 10) || 3000;

app.listen(PORT, () => {
  const sanityStatus = sanity.isConfigured()
    ? 'configured'
    : 'placeholder — set SANITY_PROJECT_ID in .env';
  const youtubeStatus = youtube.isConfigured()
    ? 'configured'
    : 'no key — set YOUTUBE_API_KEY in .env';

  const banner = [
    '======================================================',
    '  Chùa Quan Âm — API server',
    '======================================================',
    `  Listening    http://localhost:${PORT}`,
    `  Health       http://localhost:${PORT}/api/health`,
    `  Swagger UI   http://localhost:${PORT}/api-docs`,
    `  Spec (JSON)  http://localhost:${PORT}/api-docs.json`,
    `  CORS allowed ${ALLOWED_ORIGINS.join(', ')}`,
    `  Sanity       ${sanityStatus}`,
    `  YouTube      ${youtubeStatus}`,
    `  Cache        TTL posts/dharma/photos=10m, events=5m`,
    '======================================================',
  ].join('\n');

  console.log(banner);
});
