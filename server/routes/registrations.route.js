import { Router } from 'express';

import {
  createRegistration,
  getEventCapacity,
  getRegistrationsByEvent,
} from '../services/sanity.service.js';
import { sendRegistrationConfirmation } from '../services/email.service.js';

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const router = Router();

// ---------- Rate limit ----------
// In-memory IP → timestamps[]. Allow 3 submissions per minute per IP.
// Not durable across restarts; that's fine for spam control. A Phật tử
// genuinely registering once won't hit this; a script flooding does.
const SUBMISSION_WINDOW_MS = 60_000;
const MAX_SUBMISSIONS_PER_WINDOW = 3;
const recentSubmissions = new Map();

function rateLimitSubmission(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  const timestamps = (recentSubmissions.get(ip) || []).filter(
    (t) => now - t < SUBMISSION_WINDOW_MS,
  );
  if (timestamps.length >= MAX_SUBMISSIONS_PER_WINDOW) {
    return res.status(429).json({
      error: 'Bạn đã gửi quá nhiều đăng ký trong một phút. Vui lòng chờ một lát.',
      status: 429,
    });
  }
  timestamps.push(now);
  recentSubmissions.set(ip, timestamps);
  // Periodic cleanup to keep map small.
  if (recentSubmissions.size > 5000) {
    for (const [k, v] of recentSubmissions) {
      if (v.every((t) => now - t >= SUBMISSION_WINDOW_MS)) {
        recentSubmissions.delete(k);
      }
    }
  }
  next();
}

// ---------- Validation ----------
const PHONE_RE = /^(0|\+84)\d{9}$/;
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

function validatePayload(body) {
  const errors = {};
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const numberOfPeople = parseInt(body.numberOfPeople, 10);
  const note = typeof body.note === 'string' ? body.note.trim() : '';
  const eventSlug = typeof body.eventSlug === 'string' ? body.eventSlug.trim() : '';

  if (!eventSlug) errors.eventSlug = 'Thiếu mã sự kiện.';
  if (fullName.length < 2 || fullName.length > 60)
    errors.fullName = 'Họ và tên phải từ 2–60 ký tự.';
  if (!PHONE_RE.test(phone))
    errors.phone = 'Số điện thoại không hợp lệ (vd 0912345678 hoặc +84912345678).';
  if (email && !EMAIL_RE.test(email))
    errors.email = 'Định dạng email không hợp lệ.';
  if (!Number.isInteger(numberOfPeople) || numberOfPeople < 1 || numberOfPeople > 20)
    errors.numberOfPeople = 'Số người tham dự phải là số nguyên từ 1–20.';
  if (note.length > 500)
    errors.note = 'Ghi chú không được dài quá 500 ký tự.';

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: { eventSlug, fullName, phone, email, numberOfPeople, note },
  };
}

// ---------- GET /api/events/:slug/capacity ----------
// Public endpoint — frontend uses it to decide if form shows + seats left.
/**
 * @swagger
 * /api/events/{slug}/capacity:
 *   get:
 *     summary: Tình trạng đăng ký sự kiện (đếm số chỗ còn lại)
 *     tags: [Registrations]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Capacity info
 *         content:
 *           application/json:
 *             example:
 *               eventId: "abc123"
 *               maxAttendees: 300
 *               registrationsCount: 45
 *               peopleSum: 67
 *       404:
 *         description: Không tìm thấy sự kiện
 */
router.get(
  '/capacity/:slug',
  asyncHandler(async (req, res) => {
    const info = await getEventCapacity(req.params.slug);
    if (!info?.eventId) {
      return res
        .status(404)
        .json({ error: 'Không tìm thấy sự kiện.', status: 404 });
    }
    res.json(info);
  }),
);

// ---------- POST /api/registrations ----------
/**
 * @swagger
 * /api/registrations:
 *   post:
 *     summary: Đăng ký tham dự khoá tu / sự kiện
 *     description: |
 *       Public endpoint. Tạo registration document mới trong Sanity.
 *       Rate limit: 3 lần / 60s / IP.
 *     tags: [Registrations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eventSlug, fullName, phone, numberOfPeople]
 *             properties:
 *               eventSlug:      { type: string, example: "khoa-tu-bien-on-ky-16" }
 *               fullName:       { type: string, example: "Nguyễn Văn A" }
 *               phone:          { type: string, example: "0912345678" }
 *               email:          { type: string, example: "abc@gmail.com" }
 *               numberOfPeople: { type: integer, example: 2 }
 *               note:           { type: string, example: "Đi cùng vợ và con nhỏ 5 tuổi" }
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       409:
 *         description: Khoá tu đã đầy
 *       429:
 *         description: Vượt rate limit
 *       503:
 *         description: Tính năng chưa sẵn sàng (server chưa cấu hình write token)
 */
router.post(
  '/',
  rateLimitSubmission,
  asyncHandler(async (req, res) => {
    const { valid, errors, data } = validatePayload(req.body || {});
    if (!valid) {
      return res
        .status(400)
        .json({ error: 'Dữ liệu không hợp lệ.', errors, status: 400 });
    }

    // Capacity check.
    const capacity = await getEventCapacity(data.eventSlug);
    if (!capacity?.eventId) {
      return res
        .status(404)
        .json({ error: 'Không tìm thấy sự kiện.', status: 404 });
    }
    if (!capacity.maxAttendees || capacity.maxAttendees === 0) {
      return res.status(400).json({
        error: 'Sự kiện này không mở đăng ký trực tuyến.',
        status: 400,
      });
    }
    const peopleSoFar = capacity.peopleSum || 0;
    if (peopleSoFar + data.numberOfPeople > capacity.maxAttendees) {
      return res.status(409).json({
        error: `Khoá tu đã gần đủ chỗ — chỉ còn ${Math.max(0, capacity.maxAttendees - peopleSoFar)} chỗ trống, không thể nhận đăng ký ${data.numberOfPeople} người.`,
        status: 409,
        seatsLeft: Math.max(0, capacity.maxAttendees - peopleSoFar),
      });
    }

    const created = await createRegistration({
      eventId: capacity.eventId,
      fullName: data.fullName,
      phone: data.phone,
      email: data.email,
      numberOfPeople: data.numberOfPeople,
      note: data.note,
    });

    // Send confirmation email asynchronously — don't block response.
    // Failure to send email shouldn't fail the registration itself.
    if (data.email) {
      const dateStr = capacity.startDate
        ? new Date(capacity.startDate).toLocaleString('vi-VN', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Ho_Chi_Minh',
          })
        : undefined;
      sendRegistrationConfirmation({
        to: data.email,
        fullName: data.fullName,
        eventTitle: capacity.title,
        numberOfPeople: data.numberOfPeople,
        dateStr,
        location: capacity.location,
      }).catch((err) =>
        console.error(`[${new Date().toISOString()}] [EMAIL FAIL]`, err.message),
      );
    }

    res.status(201).json({
      ok: true,
      registrationId: created._id,
      message:
        'Đã ghi nhận đăng ký. Chùa sẽ liên hệ xác nhận trong 1–2 ngày. Nam mô A Di Đà Phật.',
    });
  }),
);

// ---------- GET /api/registrations/export/:slug.csv ----------
// Protected by Basic Auth (same as cache/clear). Returns CSV for admin.
/**
 * @swagger
 * /api/registrations/export/{slug}.csv:
 *   get:
 *     summary: Xuất danh sách đăng ký dạng CSV (admin only)
 *     description: |
 *       Cần Basic Auth (CACHE_ADMIN_USER + CACHE_ADMIN_PASS). Mở file CSV
 *       trong Excel/Google Sheets để check-in tại chùa.
 *     tags: [Registrations]
 *     security: [{ basicAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: CSV file
 *         content:
 *           text/csv: {}
 *       401:
 *         description: Sai/thiếu auth
 */
router.get(
  '/export/:slug.csv',
  // basicAuth is mounted in server.js as middleware; we'll attach there.
  asyncHandler(async (req, res) => {
    const capacity = await getEventCapacity(req.params.slug);
    if (!capacity?.eventId) {
      return res.status(404).send('Sự kiện không tồn tại.');
    }
    const rows = await getRegistrationsByEvent(capacity.eventId);
    const header = [
      'STT',
      'Họ và tên',
      'Số điện thoại',
      'Email',
      'Số người',
      'Trạng thái',
      'Thời điểm đăng ký',
      'Ghi chú Phật tử',
      'Ghi chú admin',
    ];
    const csvEscape = (v) =>
      v == null ? '' : `"${String(v).replace(/"/g, '""')}"`;
    const lines = [header.map(csvEscape).join(',')];
    rows.forEach((r, i) => {
      lines.push(
        [
          i + 1,
          r.fullName,
          r.phone,
          r.email,
          r.numberOfPeople,
          r.status,
          r.submittedAt,
          r.note,
          r.adminNote,
        ]
          .map(csvEscape)
          .join(','),
      );
    });
    const csv = '﻿' + lines.join('\n'); // BOM for Excel UTF-8 detection
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set(
      'Content-Disposition',
      `attachment; filename="dang-ky-${req.params.slug}.csv"`,
    );
    res.send(csv);
  }),
);

export default router;
