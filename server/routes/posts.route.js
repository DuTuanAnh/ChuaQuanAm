import { Router } from 'express';

import { getPostBySlug, getPosts } from '../services/sanity.service.js';

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const router = Router();

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Lấy danh sách bài viết
 *     description: Trả về toàn bộ bài viết, sắp xếp `publishedAt` desc.
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: Danh sách bài viết
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Post' }
 *             example:
 *               - _id: "p-001"
 *                 _type: "post"
 *                 title: "Tâm thư đầu năm"
 *                 slug: { current: "tam-thu-dau-nam" }
 *                 excerpt: "Lời chia sẻ của trụ trì gửi quý Phật tử nhân dịp Xuân Bính Tý."
 *                 publishedAt: "2026-01-01T08:00:00+07:00"
 *                 author: "Văn phòng chùa"
 *                 tags: ["tâm thư", "đầu năm"]
 *               - _id: "p-002"
 *                 _type: "post"
 *                 title: "Thông báo khoá tu mùa xuân"
 *                 slug: { current: "thong-bao-khoa-tu-mua-xuan" }
 *                 publishedAt: "2026-02-10T08:00:00+07:00"
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const posts = await getPosts();
    res.json(posts);
  }),
);

/**
 * @swagger
 * /api/posts/{slug}:
 *   get:
 *     summary: Lấy chi tiết 1 bài viết theo slug
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *         description: Slug không dấu, ví dụ "tam-thu-dau-nam".
 *     responses:
 *       200:
 *         description: Bài viết tìm thấy
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Post' }
 *             example:
 *               _id: "p-001"
 *               _type: "post"
 *               title: "Tâm thư đầu năm"
 *               slug: { current: "tam-thu-dau-nam" }
 *               excerpt: "Lời chia sẻ của trụ trì..."
 *               body: "[Portable Text blocks]"
 *               publishedAt: "2026-01-01T08:00:00+07:00"
 *               author: "Văn phòng chùa"
 *               tags: ["tâm thư"]
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const post = await getPostBySlug(req.params.slug);
    if (!post) {
      return res
        .status(404)
        .json({ error: `Không tìm thấy bài viết với slug "${req.params.slug}".`, status: 404 });
    }
    res.json(post);
  }),
);

export default router;
