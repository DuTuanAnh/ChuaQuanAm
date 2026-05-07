import { defineField, defineType } from 'sanity';

const TOPIC_OPTIONS = [
  { title: 'Tứ Diệu Đế',   value: 'tu-dieu-de' },
  { title: 'Bát Chánh Đạo', value: 'bat-chanh-dao' },
  { title: 'Thiền định',    value: 'thien-dinh' },
  { title: 'Kinh điển',     value: 'kinh-dien' },
  { title: 'Khác',          value: 'khac' },
];

const TOPIC_LABEL: Record<string, string> = Object.fromEntries(
  TOPIC_OPTIONS.map((o) => [o.value, o.title]),
);

export default defineType({
  name: 'dharma',
  title: 'Pháp thoại',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Tiêu đề',
      type: 'string',
      validation: (r) => r.required().min(2).max(160),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'speaker',
      title: 'Pháp sư',
      type: 'string',
      description: 'Tôn xưng + pháp danh — ví dụ "Hoà thượng Thích…"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'topic',
      title: 'Chủ đề',
      type: 'string',
      options: { list: TOPIC_OPTIONS },
    }),
    defineField({
      name: 'videoType',
      title: 'Loại video',
      type: 'string',
      options: {
        list: [
          { title: 'YouTube',          value: 'youtube' },
          { title: 'Tự host (upload)', value: 'upload' },
        ],
        layout: 'radio',
      },
      validation: (r) => r.required(),
      initialValue: 'youtube',
    }),
    defineField({
      name: 'youtubeUrl',
      title: 'YouTube URL',
      type: 'url',
      description: 'Dán link YouTube đầy đủ — ví dụ https://www.youtube.com/watch?v=…',
      hidden: ({ parent }) => parent?.videoType !== 'youtube',
      validation: (r) =>
        r.custom((value, ctx) => {
          const parent = ctx.parent as { videoType?: string } | undefined;
          if (parent?.videoType === 'youtube' && !value) {
            return 'Bắt buộc khi loại video là YouTube.';
          }
          return true;
        }),
    }),
    defineField({
      name: 'videoFile',
      title: 'File video',
      type: 'file',
      options: { accept: 'video/*' },
      hidden: ({ parent }) => parent?.videoType !== 'upload',
      validation: (r) =>
        r.custom((value, ctx) => {
          const parent = ctx.parent as { videoType?: string } | undefined;
          if (parent?.videoType === 'upload' && !value) {
            return 'Bắt buộc khi loại video là Upload.';
          }
          return true;
        }),
    }),
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail',
      type: 'image',
      options: { hotspot: true },
      description: 'Tuỳ chọn — nếu trống và là YouTube, frontend sẽ dùng ảnh mặc định từ YouTube.',
    }),
    defineField({
      name: 'duration',
      title: 'Thời lượng',
      type: 'string',
      description: 'Định dạng "mm:ss" hoặc "hh:mm:ss" — ví dụ "32:14".',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Ngày đăng',
      type: 'datetime',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'description',
      title: 'Mô tả',
      type: 'text',
      rows: 4,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      speaker: 'speaker',
      topic: 'topic',
      media: 'thumbnail',
    },
    prepare({ title, speaker, topic, media }) {
      const subtitle = [speaker, TOPIC_LABEL[topic as string]].filter(Boolean).join(' • ');
      return { title: title || '(Chưa đặt tiêu đề)', subtitle, media };
    },
  },
  orderings: [
    {
      title: 'Ngày đăng — mới nhất',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
});
