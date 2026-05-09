import { SanityImage } from './post.model';

/**
 * Event — sự kiện / khoá lễ / pháp hội tại chùa Bắc Tông.
 * 'le-via'    — đại lễ + vía (Phật Đản, Vu Lan, Vía Quán Âm, Vía A Di Đà…)
 * 'khoa-tu'   — khoá tu một ngày / cuối tuần / chuyên đề
 * 'sinh-hoat' — lớp giáo lý, tụng kinh định kỳ, đêm thiền trà…
 * 'phong-sinh'— phóng sinh
 */
export type EventKind = 'le-via' | 'khoa-tu' | 'sinh-hoat' | 'phong-sinh';

export interface TempleEvent {
  _id: string;
  _type: 'event';
  kind: EventKind;
  title: string;
  slug: { current: string };
  excerpt?: string;
  body?: unknown; // Portable Text

  // Ngày dương lịch (ISO 8601). Mọi sự kiện đều có ngày dương để sort/filter.
  startsAt: string;
  endsAt?: string;

  // Ngày âm lịch — hiển thị thêm cho lễ Phật giáo (Rằm tháng 7, 19/6 ÂL...).
  lunarDate?: string;

  location?: string;
  hero?: SanityImage;
  /** Direct CDN URL of the hero image — populated by SanityService mapper. */
  heroUrl?: string;
  tags?: string[];

  /** True nếu là sự kiện thường niên (Vu Lan, Phật Đản...). */
  recurring?: boolean;
  /** Free-text recurring schedule note ("Mỗi tháng vào Chủ nhật đầu tiên"). */
  recurringNote?: string;
  /** Người / số điện thoại / email phụ trách sự kiện. */
  contact?: string;
}
