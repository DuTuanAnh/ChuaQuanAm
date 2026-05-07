import { Router } from 'express';

import { getEvents, getUpcomingEvents } from '../services/sanity.service.js';

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const router = Router();

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Danh sách tất cả sự kiện
 *     description: Trả về toàn bộ event, sắp xếp `startsAt` desc (mới nhất trước).
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: Danh sách sự kiện
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/TempleEvent' }
 *             example:
 *               - _id: "e-001"
 *                 _type: "event"
 *                 kind: "le-via"
 *                 title: "Đại lễ Phật Đản — PL.2569"
 *                 slug: { current: "phat-dan-2569" }
 *                 excerpt: "Nghi lễ tắm Phật, thuyết pháp, dâng hoa cúng dường."
 *                 startsAt: "2026-05-14T06:00:00+07:00"
 *                 lunarDate: "Rằm tháng Tư âm lịch"
 *                 location: "Đại hùng bảo điện"
 *                 recurring: true
 *               - _id: "e-002"
 *                 _type: "event"
 *                 kind: "khoa-tu"
 *                 title: "Khoá tu một ngày an lạc"
 *                 slug: { current: "khoa-tu-mot-ngay" }
 *                 startsAt: "2026-06-02T07:30:00+07:00"
 *                 location: "Sân thiền"
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const events = await getEvents();
    res.json(events);
  }),
);

/**
 * @swagger
 * /api/events/upcoming/{limit}:
 *   get:
 *     summary: N sự kiện sắp tới
 *     description: |
 *       Trả về tối đa `limit` sự kiện có `startsAt >= now()`, sắp xếp ASC
 *       (gần nhất trước). `limit` phải là số nguyên 1–100.
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: limit
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Số sự kiện tối đa cần trả về.
 *         example: 3
 *     responses:
 *       200:
 *         description: Danh sách sự kiện sắp tới
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/TempleEvent' }
 *             example:
 *               - _id: "e-001"
 *                 _type: "event"
 *                 kind: "le-via"
 *                 title: "Đại lễ Phật Đản — PL.2569"
 *                 slug: { current: "phat-dan-2569" }
 *                 startsAt: "2026-05-14T06:00:00+07:00"
 *                 lunarDate: "Rằm tháng Tư âm lịch"
 *                 location: "Đại hùng bảo điện"
 *                 recurring: true
 *               - _id: "e-009"
 *                 _type: "event"
 *                 kind: "le-via"
 *                 title: "Vía Bồ Tát Quán Thế Âm"
 *                 slug: { current: "via-quan-am-19-6" }
 *                 startsAt: "2026-07-19T07:00:00+07:00"
 *                 lunarDate: "19 tháng 6 âm lịch"
 *                 location: "Chánh điện"
 *               - _id: "e-011"
 *                 _type: "event"
 *                 kind: "le-via"
 *                 title: "Đại lễ Vu Lan báo hiếu"
 *                 slug: { current: "vu-lan-2026" }
 *                 startsAt: "2026-08-17T06:00:00+07:00"
 *                 lunarDate: "Rằm tháng Bảy âm lịch"
 *                 location: "Đại hùng bảo điện"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/upcoming/:limit',
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.params.limit, 10);
    if (Number.isNaN(limit) || limit < 1 || limit > 100) {
      return res
        .status(400)
        .json({ error: 'Tham số `limit` phải là số nguyên trong khoảng 1–100.', status: 400 });
    }
    const events = await getUpcomingEvents(limit);
    res.json(events);
  }),
);

export default router;
