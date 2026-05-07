import { Router } from 'express';

import { getDharmaBySlug, getDharmaVideos } from '../services/sanity.service.js';

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const router = Router();

/**
 * @swagger
 * /api/dharma:
 *   get:
 *     summary: Danh sách pháp thoại — có thể lọc theo speaker / topic / year
 *     description: |
 *       Trả về các bản ghi `dharma`, sắp xếp `publishedAt` desc. Bộ lọc tuỳ chọn
 *       qua query params — bỏ trống nghĩa là không lọc theo trường đó.
 *     tags: [Dharma]
 *     parameters:
 *       - in: query
 *         name: speaker
 *         schema: { type: string }
 *         description: Lọc theo tên pháp sư (chính xác).
 *       - in: query
 *         name: topic
 *         schema:
 *           type: string
 *           enum: [tu-dieu-de, bat-chanh-dao, thien-dinh, kinh-dien, khac]
 *         description: Lọc theo chủ đề.
 *       - in: query
 *         name: year
 *         schema: { type: string, example: "2026" }
 *         description: Lọc theo năm publishedAt — string-prefix match.
 *     responses:
 *       200:
 *         description: Danh sách pháp thoại
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Dharma' }
 *             example:
 *               - _id: "d-001"
 *                 title: "Tâm an, vạn sự an"
 *                 slug: { current: "tam-an-van-su-an" }
 *                 speaker: "Hoà thượng Thích Tâm Đức"
 *                 topic: "tu-dieu-de"
 *                 videoType: "youtube"
 *                 youtubeUrl: "https://www.youtube.com/watch?v=M7lc1UVf-VE"
 *                 thumbnail: { asset: { url: "https://cdn.sanity.io/.../thumb.jpg" } }
 *                 duration: "32:14"
 *                 publishedAt: "2026-04-12T00:00:00Z"
 *                 description: "Đối diện phiền não bằng tỉnh thức và lòng từ."
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const videos = await getDharmaVideos(
      req.query.speaker,
      req.query.topic,
      req.query.year,
    );
    res.json(videos);
  }),
);

/**
 * @swagger
 * /api/dharma/{slug}:
 *   get:
 *     summary: Chi tiết 1 pháp thoại / kinh sách
 *     description: Lookup theo slug — có thể trả về kind `phap-thoai`, `kinh-sach`, hoặc `bai-viet`.
 *     tags: [Dharma]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *         description: Slug không dấu, ví dụ "tam-an-van-su-an".
 *     responses:
 *       200:
 *         description: Pháp thoại / kinh sách tìm thấy
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Dharma' }
 *             example:
 *               _id: "d-001"
 *               _type: "dharma"
 *               kind: "phap-thoai"
 *               title: "Tâm an, vạn sự an"
 *               slug: { current: "tam-an-van-su-an" }
 *               excerpt: "Đối diện phiền não bằng tỉnh thức và lòng từ."
 *               speaker: "Hoà thượng (đang cập nhật)"
 *               publishedAt: "2026-04-12T00:00:00Z"
 *               durationSec: 1934
 *               youtubeId: "M7lc1UVf-VE"
 *               body: "[Portable Text blocks]"
 *               tags: ["Tứ Diệu Đế"]
 *               references: ["Kinh Diệu Pháp Liên Hoa, phẩm Phổ Môn"]
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const item = await getDharmaBySlug(req.params.slug);
    if (!item) {
      return res
        .status(404)
        .json({ error: `Không tìm thấy pháp thoại với slug "${req.params.slug}".`, status: 404 });
    }
    res.json(item);
  }),
);

export default router;
