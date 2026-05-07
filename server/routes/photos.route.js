import { Router } from 'express';

import {
  getFeaturedPhotos,
  getPhotoById,
  getPhotos,
} from '../services/sanity.service.js';

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const VALID_ALBUMS = new Set([
  'kien-truc',
  'le-hoi',
  'khoa-tu',
  'thien-nhien',
  'su-kien',
]);

const router = Router();

/**
 * @swagger
 * /api/photos:
 *   get:
 *     summary: Lấy tất cả ảnh
 *     description: |
 *       Trả về toàn bộ ảnh thư viện, sắp xếp `dateTaken` desc. Có thể lọc
 *       theo `album` qua query param.
 *     tags: [Photos]
 *     parameters:
 *       - in: query
 *         name: album
 *         required: false
 *         schema:
 *           type: string
 *           enum: [kien-truc, le-hoi, khoa-tu, thien-nhien, su-kien]
 *         description: Lọc theo album (tuỳ chọn).
 *         example: le-hoi
 *     responses:
 *       200:
 *         description: Danh sách ảnh
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Photo' }
 *             example:
 *               - _id: "photo-001"
 *                 _type: "photo"
 *                 title: "Chánh điện lúc bình minh"
 *                 album: "kien-truc"
 *                 dateTaken: "2026-04-12"
 *                 description: "Ánh nắng đầu ngày phủ lên mái cong chánh điện."
 *                 isFeature: true
 *                 image:
 *                   _type: "image"
 *                   asset:
 *                     _ref: "image-abc-1024x768-jpg"
 *                     _type: "reference"
 *                     url: "https://cdn.sanity.io/images/.../chanh-dien.jpg"
 *               - _id: "photo-002"
 *                 _type: "photo"
 *                 title: "Lễ Phật Đản 2025"
 *                 album: "le-hoi"
 *                 dateTaken: "2025-05-22"
 *                 isFeature: false
 *                 image:
 *                   _type: "image"
 *                   asset:
 *                     _ref: "image-xyz-1600x900-jpg"
 *                     url: "https://cdn.sanity.io/images/.../phat-dan.jpg"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const album = req.query.album ? String(req.query.album) : undefined;
    if (album && !VALID_ALBUMS.has(album)) {
      return res.status(400).json({
        error: `Album '${album}' không hợp lệ. Giá trị hợp lệ: ${[...VALID_ALBUMS].join(', ')}.`,
        status: 400,
      });
    }
    const photos = await getPhotos(album);
    res.json(photos);
  }),
);

/**
 * @swagger
 * /api/photos/featured:
 *   get:
 *     summary: Ảnh nổi bật (cho trang chủ)
 *     description: Trả về các ảnh có `isFeature == true`, mới nhất trước.
 *     tags: [Photos]
 *     responses:
 *       200:
 *         description: Danh sách ảnh nổi bật
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Photo' }
 *             example:
 *               - _id: "photo-001"
 *                 _type: "photo"
 *                 title: "Chánh điện lúc bình minh"
 *                 album: "kien-truc"
 *                 dateTaken: "2026-04-12"
 *                 isFeature: true
 *                 image:
 *                   asset:
 *                     url: "https://cdn.sanity.io/images/.../chanh-dien.jpg"
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
// IMPORTANT: register `/featured` BEFORE `/:id` so Express doesn't match
// "featured" as an id parameter.
router.get(
  '/featured',
  asyncHandler(async (_req, res) => {
    const photos = await getFeaturedPhotos();
    res.json(photos);
  }),
);

/**
 * @swagger
 * /api/photos/{id}:
 *   get:
 *     summary: Chi tiết 1 ảnh theo Sanity _id
 *     tags: [Photos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Sanity document `_id`.
 *         example: photo-001
 *     responses:
 *       200:
 *         description: Ảnh tìm thấy
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Photo' }
 *             example:
 *               _id: "photo-001"
 *               _type: "photo"
 *               title: "Chánh điện lúc bình minh"
 *               album: "kien-truc"
 *               dateTaken: "2026-04-12"
 *               description: "Ánh nắng đầu ngày phủ lên mái cong chánh điện."
 *               isFeature: true
 *               image:
 *                 _type: "image"
 *                 asset:
 *                   _ref: "image-abc-1024x768-jpg"
 *                   _type: "reference"
 *                   url: "https://cdn.sanity.io/images/.../chanh-dien.jpg"
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const photo = await getPhotoById(req.params.id);
    if (!photo) {
      return res
        .status(404)
        .json({ error: `Không tìm thấy ảnh với _id "${req.params.id}".`, status: 404 });
    }
    res.json(photo);
  }),
);

export default router;
