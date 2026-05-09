import { defineField, defineType } from 'sanity';

const TYPE_OPTIONS = [
  { title: 'Lễ vía',     value: 'le-via' },
  { title: 'Khoá tu',    value: 'khoa-tu' },
  { title: 'Sinh hoạt',  value: 'sinh-hoat' },
  { title: 'Phóng sinh', value: 'phong-sinh' },
];

const TYPE_LABEL: Record<string, string> = Object.fromEntries(
  TYPE_OPTIONS.map((o) => [o.value, o.title]),
);

export default defineType({
  name: 'event',
  title: 'Sự kiện',
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
      title: 'Đường dẫn (slug)',
      type: 'slug',
      description: 'Tự sinh từ tiêu đề. Bấm Generate để tạo. Dùng cho URL /hoat-dong/...',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'type',
      title: 'Loại sự kiện',
      type: 'string',
      options: { list: TYPE_OPTIONS, layout: 'radio' },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'startDate',
      title: 'Ngày bắt đầu',
      type: 'datetime',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'endDate',
      title: 'Ngày kết thúc',
      type: 'datetime',
    }),
    defineField({
      name: 'location',
      title: 'Địa điểm',
      type: 'string',
    }),
    defineField({
      name: 'image',
      title: 'Ảnh sự kiện',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'description',
      title: 'Mô tả',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'isRecurring',
      title: 'Sự kiện lặp lại',
      type: 'boolean',
      description: 'Bật nếu là khoá lễ / hoạt động định kỳ.',
      initialValue: false,
    }),
    defineField({
      name: 'recurringNote',
      title: 'Ghi chú lịch lặp',
      type: 'string',
      description: 'Ví dụ "Mỗi tháng vào Chủ nhật đầu tiên".',
      hidden: ({ parent }) => !parent?.isRecurring,
    }),
    defineField({
      name: 'contact',
      title: 'Liên hệ',
      type: 'string',
      description: 'Người / số điện thoại / email phụ trách.',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      type: 'type',
      startDate: 'startDate',
      media: 'image',
    },
    prepare({ title, type, startDate, media }) {
      const date = startDate
        ? new Date(startDate as string).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
        : '';
      const subtitle = [TYPE_LABEL[type as string], date].filter(Boolean).join(' • ');
      return { title: title || '(Chưa đặt tiêu đề)', subtitle, media };
    },
  },
  orderings: [
    {
      title: 'Ngày bắt đầu — sớm nhất',
      name: 'startDateAsc',
      by: [{ field: 'startDate', direction: 'asc' }],
    },
    {
      title: 'Ngày bắt đầu — mới nhất',
      name: 'startDateDesc',
      by: [{ field: 'startDate', direction: 'desc' }],
    },
  ],
});
