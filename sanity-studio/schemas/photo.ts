import { defineField, defineType } from 'sanity';
import { ImageIcon } from '@sanity/icons';

const ALBUM_OPTIONS = [
  { title: 'Kiến trúc chùa', value: 'kien-truc' },
  { title: 'Lễ hội',         value: 'le-hoi' },
  { title: 'Khoá tu',        value: 'khoa-tu' },
  { title: 'Thiên nhiên',    value: 'thien-nhien' },
  { title: 'Sự kiện',        value: 'su-kien' },
] as const;

const ALBUM_LABEL: Record<string, string> = Object.fromEntries(
  ALBUM_OPTIONS.map((o) => [o.value, o.title]),
);

export default defineType({
  name: 'photo',
  title: 'Ảnh',
  type: 'document',
  icon: ImageIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Tên / mô tả ảnh',
      type: 'string',
      validation: (Rule) => Rule.required().min(2).max(120),
    }),
    defineField({
      name: 'image',
      title: 'File ảnh',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'album',
      title: 'Album',
      type: 'string',
      options: {
        list: ALBUM_OPTIONS.map((o) => ({ title: o.title, value: o.value })),
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'dateTaken',
      title: 'Ngày chụp',
      type: 'date',
      options: { dateFormat: 'DD/MM/YYYY' },
    }),
    defineField({
      name: 'description',
      title: 'Mô tả ngắn',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'isFeature',
      title: 'Ảnh nổi bật trang chủ',
      type: 'boolean',
      description: 'Bật để hiển thị ảnh ở khu vực highlight trên trang chủ.',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      album: 'album',
      isFeature: 'isFeature',
      media: 'image',
    },
    prepare({ title, album, isFeature, media }) {
      const subtitle = [
        ALBUM_LABEL[album as string] ?? album,
        isFeature ? '★ nổi bật' : null,
      ]
        .filter(Boolean)
        .join(' • ');
      return { title: title || '(Chưa đặt tên)', subtitle, media };
    },
  },
  orderings: [
    {
      title: 'Ngày chụp — mới nhất',
      name: 'dateTakenDesc',
      by: [{ field: 'dateTaken', direction: 'desc' }],
    },
    {
      title: 'Album',
      name: 'albumAsc',
      by: [
        { field: 'album', direction: 'asc' },
        { field: 'dateTaken', direction: 'desc' },
      ],
    },
  ],
});
