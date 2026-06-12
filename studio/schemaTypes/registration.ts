import { defineField, defineType } from 'sanity';

const STATUS_OPTIONS = [
  { title: 'Chờ xác nhận', value: 'pending' },
  { title: 'Đã xác nhận',   value: 'confirmed' },
  { title: 'Đã có mặt',     value: 'attended' },
  { title: 'Đã huỷ',        value: 'cancelled' },
];

const STATUS_LABEL: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map((o) => [o.value, o.title]),
);

/**
 * Đăng ký khoá tu — một document mỗi lượt đăng ký.
 * Editor không tạo trực tiếp; document được tạo qua POST /api/registrations
 * khi Phật tử submit form trên /hoat-dong/:slug.
 *
 * Phật tử chỉ thấy form + thông báo gửi thành công, không có quyền sửa/xem
 * registration của mình lại.
 */
export default defineType({
  name: 'registration',
  title: 'Đăng ký khoá tu',
  type: 'document',
  fields: [
    defineField({
      name: 'event',
      title: 'Khoá tu / Sự kiện',
      type: 'reference',
      to: [{ type: 'event' }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'fullName',
      title: 'Họ và tên',
      type: 'string',
      validation: (r) => r.required().min(2).max(60),
    }),
    defineField({
      name: 'phone',
      title: 'Số điện thoại',
      type: 'string',
      description: 'Số VN (10 số). Backend validate trước khi tạo document.',
      validation: (r) =>
        r
          .required()
          .regex(/^(0|\+84)\d{9}$/, { name: 'số điện thoại Việt Nam' }),
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      description: 'Tuỳ chọn — nếu có sẽ nhận email xác nhận.',
      validation: (r) =>
        r.regex(
          /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
          { name: 'định dạng email' },
        ),
    }),
    defineField({
      name: 'numberOfPeople',
      title: 'Số người tham dự',
      type: 'number',
      initialValue: 1,
      validation: (r) => r.required().integer().min(1).max(20),
    }),
    defineField({
      name: 'note',
      title: 'Ghi chú',
      type: 'text',
      rows: 3,
      description: 'Đi cùng ai / yêu cầu đặc biệt (ăn chay trường, dị ứng, hỗ trợ di chuyển…).',
      validation: (r) => r.max(500),
    }),
    defineField({
      name: 'status',
      title: 'Trạng thái',
      type: 'string',
      options: { list: STATUS_OPTIONS, layout: 'radio' },
      initialValue: 'pending',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'submittedAt',
      title: 'Thời điểm gửi',
      type: 'datetime',
      description: 'Tự set khi backend tạo document. Không nên sửa tay.',
      readOnly: true,
    }),
    defineField({
      name: 'adminNote',
      title: 'Ghi chú nội bộ (admin)',
      type: 'text',
      rows: 2,
      description: 'Chỉ thầy/ban quản trị thấy — Phật tử không biết. Ví dụ: "Đã gọi 17/5, sẽ tới"',
    }),
  ],
  preview: {
    select: {
      fullName: 'fullName',
      phone: 'phone',
      numberOfPeople: 'numberOfPeople',
      status: 'status',
      eventTitle: 'event.title',
    },
    prepare({ fullName, phone, numberOfPeople, status, eventTitle }) {
      const statusEmoji: Record<string, string> = {
        pending: '⏳',
        confirmed: '✅',
        attended: '🙏',
        cancelled: '✖',
      };
      const emoji = statusEmoji[status as string] ?? '⏳';
      const peopleLabel = numberOfPeople && numberOfPeople > 1 ? ` (+${numberOfPeople - 1})` : '';
      return {
        title: `${emoji} ${fullName ?? '(chưa rõ tên)'}${peopleLabel}`,
        subtitle: [
          phone,
          eventTitle ? `→ ${eventTitle}` : null,
          STATUS_LABEL[status as string],
        ]
          .filter(Boolean)
          .join(' • '),
      };
    },
  },
  orderings: [
    {
      title: 'Mới đăng ký trước',
      name: 'submittedAtDesc',
      by: [{ field: 'submittedAt', direction: 'desc' }],
    },
    {
      title: 'Theo trạng thái',
      name: 'statusAsc',
      by: [
        { field: 'status', direction: 'asc' },
        { field: 'submittedAt', direction: 'desc' },
      ],
    },
  ],
});
