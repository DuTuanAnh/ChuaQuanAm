import { Router } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';

import { sendRegistrationStatusEmail } from '../services/email.service.js';

const router = Router();

/**
 * Sanity webhook signature header format:
 *   sanity-webhook-signature: t=<timestamp>,v1=<hex-hmac>
 * where v1 = HMAC-SHA256(secret, `${timestamp}.${rawBody}`)
 *
 * We must compute against the RAW body (not parsed JSON) so the byte-for-byte
 * representation matches what Sanity signed. The route below uses a raw body
 * parser to preserve it.
 */
function verifySanitySignature(rawBody, headerValue, secret) {
  if (!headerValue || typeof headerValue !== 'string') return false;
  const parts = Object.fromEntries(
    headerValue.split(',').map((kv) => kv.split('=').map((s) => s.trim())),
  );
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return false;

  const expected = createHmac('sha256', secret)
    .update(`${t}.${rawBody}`)
    .digest('hex');

  // timingSafeEqual requires equal-length buffers; bail early on mismatch.
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(v1, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * @swagger
 * /api/webhooks/sanity/registration-status:
 *   post:
 *     summary: Sanity webhook — Phật tử nhận email khi registration đổi status
 *     description: |
 *       Sanity gọi endpoint này mỗi khi document `registration` thay đổi
 *       (đặc biệt là field `status`). Backend gửi email tương ứng cho
 *       Phật tử (confirmed → "Đã xác nhận", cancelled → "Đã huỷ").
 *
 *       Phải cấu hình **webhook secret** trong Sanity Manage; secret cùng
 *       giá trị với env `SANITY_WEBHOOK_SECRET`. Nếu signature không khớp
 *       → 401.
 *     tags: [System]
 *     security: []
 *     responses:
 *       200: { description: Đã xử lý }
 *       401: { description: Sai signature }
 *       400: { description: Payload không hợp lệ }
 */
router.post(
  '/sanity/registration-status',
  // Raw body parser (overrides the global express.json) so we can verify the
  // signature against the exact bytes Sanity signed.
  (req, res, next) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      req.rawBody = data;
      try {
        req.body = data ? JSON.parse(data) : {};
      } catch {
        return res.status(400).json({ error: 'Body không phải JSON hợp lệ.' });
      }
      next();
    });
    req.on('error', next);
  },
  async (req, res) => {
    const secret = process.env.SANITY_WEBHOOK_SECRET;
    if (!secret) {
      console.error(
        `[${new Date().toISOString()}] [WEBHOOK] SANITY_WEBHOOK_SECRET not configured — rejecting.`,
      );
      return res
        .status(503)
        .json({ error: 'Webhook chưa được cấu hình trên server.' });
    }

    const signature = req.headers['sanity-webhook-signature'];
    if (!verifySanitySignature(req.rawBody, signature, secret)) {
      console.warn(
        `[${new Date().toISOString()}] [WEBHOOK] Invalid signature — rejecting.`,
      );
      return res.status(401).json({ error: 'Sai signature.' });
    }

    const payload = req.body;
    const status = payload?.status;
    const email = payload?.email;

    // Only act on confirmed / cancelled. pending is set on initial signup
    // (already gets its email from POST /api/registrations). Other statuses
    // (attended) don't need an email.
    if (!email) {
      console.log(
        `[${new Date().toISOString()}] [WEBHOOK] registration ${payload?._id} has no email — skipping email send.`,
      );
      return res.json({ ok: true, sent: false, reason: 'no email on record' });
    }
    if (status !== 'confirmed' && status !== 'cancelled') {
      console.log(
        `[${new Date().toISOString()}] [WEBHOOK] registration ${payload?._id} status='${status}' — no email needed.`,
      );
      return res.json({ ok: true, sent: false, reason: `status=${status}` });
    }

    // Format the event date in vi-VN for the email body. The webhook
    // projection (configured in Sanity) flattens event details so we don't
    // need a follow-up fetch.
    const dateStr = payload?.eventStartDate
      ? new Date(payload.eventStartDate).toLocaleString('vi-VN', {
          weekday: 'long',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Ho_Chi_Minh',
        })
      : undefined;

    try {
      await sendRegistrationStatusEmail({
        status,
        to: email,
        fullName: payload.fullName,
        eventTitle: payload.eventTitle,
        numberOfPeople: payload.numberOfPeople,
        dateStr,
        location: payload.eventLocation,
      });
      res.json({ ok: true, sent: true, status });
    } catch (err) {
      console.error(
        `[${new Date().toISOString()}] [WEBHOOK EMAIL FAIL]`,
        err.message,
      );
      // 200 anyway so Sanity doesn't retry forever; we've logged the failure
      // and will follow up with the Phật tử by phone if needed.
      res.json({ ok: true, sent: false, error: err.message });
    }
  },
);

export default router;
