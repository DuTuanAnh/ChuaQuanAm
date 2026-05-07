import { SanityImage } from './post.model';

/**
 * Dharma — pháp thoại (bài giảng) hoặc bản kinh sách Bắc Tông.
 * Có thể là audio, video (YouTube), hoặc text-only transcript / kinh điển.
 */
export type DharmaKind = 'phap-thoai' | 'kinh-sach' | 'bai-viet';

export interface Dharma {
  _id: string;
  _type: 'dharma';
  kind: DharmaKind;
  title: string;
  slug: { current: string };
  excerpt?: string;
  speaker?: string; // tôn xưng: Hoà thượng, Thượng toạ, ...
  publishedAt: string; // ISO 8601
  durationSec?: number; // cho audio/video
  youtubeId?: string; // 11-char video id để dùng với <youtube-player>
  videoUrl?: string;  // URL video tự host (Sanity asset / CDN). Dùng <video> HTML5.
  audioUrl?: string;
  transcript?: unknown; // Portable Text
  body?: unknown; // Portable Text — full content cho kinh sách
  thumbnail?: SanityImage;
  tags?: string[];
  references?: string[]; // ví dụ: "Kinh Diệu Pháp Liên Hoa, phẩm Phổ Môn"
}
