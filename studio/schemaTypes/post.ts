import { defineField, defineType } from 'sanity';

const CATEGORY_OPTIONS = [
  { title: 'Thông báo', value: 'thong-bao' },
  { title: 'Pháp luận', value: 'phap-luan' },
  { title: 'Sinh hoạt', value: 'sinh-hoat' },
];

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORY_OPTIONS.map((o) => [o.value, o.title]),
);

export default defineType({
  name: 'post',
  title: 'Bài viết',
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
      name: 'category',
      title: 'Danh mục',
      type: 'string',
      options: { list: CATEGORY_OPTIONS, layout: 'radio' },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'thumbnail',
      title: 'Ảnh thumbnail',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'publishedAt',
      title: 'Ngày đăng',
      type: 'datetime',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Tóm tắt',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'body',
      title: 'Nội dung',
      type: 'array',
      of: [
        { type: 'block' },
        { type: 'image', options: { hotspot: true } },
      ],
    }),
    defineField({
      name: 'author',
      title: 'Tác giả',
      type: 'string',
    }),
  ],
  preview: {
    select: { title: 'title', category: 'category', media: 'thumbnail' },
    prepare({ title, category, media }) {
      return {
        title: title || '(Chưa đặt tiêu đề)',
        subtitle: CATEGORY_LABEL[category as string] || category,
        media,
      };
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
