import { Dharma } from '../../../shared/models/dharma.model';

/**
 * Demo videos used while Sanity isn't configured (sanityProjectId === 'placeholder').
 * Speakers are deliberately generic monastic titles so we don't fabricate any real
 * teacher's name — rule from CLAUDE.md §9. Tags align with the curated topic list
 * shown in the filter dropdown so demo filtering produces meaningful results.
 *
 * Replace by configuring a real Sanity project — the effect will switch over
 * automatically.
 */

const TOPICS = {
  TDD: 'Tứ Diệu Đế',
  BCD: 'Bát Chánh Đạo',
  TD: 'Thiền định',
  TD2: 'Tịnh Độ',
  PH: 'Pháp Hoa',
  QA: 'Quán Âm Bồ Tát',
  VT: 'Vô thường',
  TB: 'Từ bi - trí tuệ',
};

const SPEAKERS = {
  HT: 'Hoà thượng (đang cập nhật)',
  TT: 'Thượng toạ (đang cập nhật)',
  DD: 'Đại đức (đang cập nhật)',
  SC: 'Sư cô (đang cập nhật)',
};

const mins = (m: number, s = 0): number => m * 60 + s;

export const DEMO_DHARMA_VIDEOS: Dharma[] = [
  {
    _id: 'demo-d-01', _type: 'dharma', kind: 'phap-thoai',
    title: 'Tâm an, vạn sự an',
    slug: { current: 'tam-an-van-su-an' },
    excerpt: 'Đối diện phiền não bằng tỉnh thức và lòng từ — bài giảng mở đầu khoá An cư.',
    speaker: SPEAKERS.HT,
    publishedAt: '2026-04-12T00:00:00Z',
    durationSec: mins(32, 14),
    tags: [TOPICS.TDD, TOPICS.TB],
    // Demo: Google's public IFrame API test video. Replace with real Sanity youtubeId.
    youtubeId: 'M7lc1UVf-VE',
  },
  {
    _id: 'demo-d-02', _type: 'dharma', kind: 'phap-thoai',
    title: 'Phổ Môn — hạnh nguyện Quán Thế Âm',
    slug: { current: 'pho-mon-hanh-nguyen-quan-the-am' },
    excerpt: 'Phẩm Phổ Môn trong Kinh Pháp Hoa và hạnh cứu khổ ban vui.',
    speaker: SPEAKERS.TT,
    publishedAt: '2026-03-28T00:00:00Z',
    durationSec: mins(45, 8),
    tags: [TOPICS.QA, TOPICS.PH],
  },
  {
    _id: 'demo-d-03', _type: 'dharma', kind: 'phap-thoai',
    title: 'Bát Chánh Đạo trong đời sống thường nhật',
    slug: { current: 'bat-chanh-dao-doi-song' },
    excerpt: 'Tám nhánh đạo đi vào công việc, gia đình và quan hệ.',
    speaker: SPEAKERS.DD,
    publishedAt: '2026-03-10T00:00:00Z',
    durationSec: mins(28, 50),
    tags: [TOPICS.BCD],
  },
  {
    _id: 'demo-d-04', _type: 'dharma', kind: 'phap-thoai',
    title: 'Thiền chỉ và thiền quán',
    slug: { current: 'thien-chi-thien-quan' },
    excerpt: 'Hai phương pháp căn bản dẫn đến tịnh và tuệ — pháp thoại tại khoá tu mùa thu.',
    speaker: SPEAKERS.SC,
    publishedAt: '2026-02-18T00:00:00Z',
    durationSec: mins(38, 12),
    tags: [TOPICS.TD],
    // Demo: public sample MP4 from W3C. Replace with real Sanity videoUrl asset.
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
  },
  {
    _id: 'demo-d-05', _type: 'dharma', kind: 'phap-thoai',
    title: 'Bốn chân lý cao quý',
    slug: { current: 'bon-chan-ly-cao-quy' },
    excerpt: 'Khổ — Tập — Diệt — Đạo: nền tảng của mọi giáo pháp.',
    speaker: SPEAKERS.HT,
    publishedAt: '2025-11-05T00:00:00Z',
    durationSec: mins(41, 30),
    tags: [TOPICS.TDD],
  },
  {
    _id: 'demo-d-06', _type: 'dharma', kind: 'phap-thoai',
    title: 'Niệm danh hiệu Đức Phật A Di Đà',
    slug: { current: 'niem-phat-a-di-da' },
    excerpt: 'Tịnh Độ tông và pháp môn niệm Phật.',
    speaker: SPEAKERS.TT,
    publishedAt: '2025-09-22T00:00:00Z',
    durationSec: mins(26, 15),
    tags: [TOPICS.TD2],
  },
  {
    _id: 'demo-d-07', _type: 'dharma', kind: 'phap-thoai',
    title: 'Kinh Diệu Pháp Liên Hoa — diệu nghĩa',
    slug: { current: 'phap-hoa-dieu-nghia' },
    excerpt: 'Tinh hoa của một trong ba bộ kinh trọng yếu của Đại thừa.',
    speaker: SPEAKERS.HT,
    publishedAt: '2025-08-14T00:00:00Z',
    durationSec: mins(52, 0),
    tags: [TOPICS.PH, TOPICS.QA],
  },
  {
    _id: 'demo-d-08', _type: 'dharma', kind: 'phap-thoai',
    title: 'Quán chiếu vô thường',
    slug: { current: 'quan-chieu-vo-thuong' },
    excerpt: 'Vô thường không bi ai — là cánh cửa của tỉnh thức.',
    speaker: SPEAKERS.DD,
    publishedAt: '2025-07-02T00:00:00Z',
    durationSec: mins(24, 33),
    tags: [TOPICS.VT, TOPICS.TDD],
  },
  {
    _id: 'demo-d-09', _type: 'dharma', kind: 'phap-thoai',
    title: 'Trồng cây từ bi trong tâm',
    slug: { current: 'trong-cay-tu-bi' },
    excerpt: 'Từ bi không phải xúc cảm yếu mềm — là sức mạnh trí tuệ.',
    speaker: SPEAKERS.SC,
    publishedAt: '2025-05-28T00:00:00Z',
    durationSec: mins(19, 45),
    tags: [TOPICS.TB],
  },
  {
    _id: 'demo-d-10', _type: 'dharma', kind: 'phap-thoai',
    title: 'Tu tập trong gia đình',
    slug: { current: 'tu-tap-trong-gia-dinh' },
    excerpt: 'Đem chánh pháp vào tương tác hằng ngày với người thân.',
    speaker: SPEAKERS.TT,
    publishedAt: '2025-04-11T00:00:00Z',
    durationSec: mins(35, 20),
    tags: [TOPICS.BCD, TOPICS.TB],
  },
  {
    _id: 'demo-d-11', _type: 'dharma', kind: 'phap-thoai',
    title: 'Lời Phật dạy về khổ',
    slug: { current: 'loi-phat-day-ve-kho' },
    excerpt: 'Đối diện và chuyển hoá khổ — không né tránh.',
    speaker: SPEAKERS.DD,
    publishedAt: '2024-11-19T00:00:00Z',
    durationSec: mins(30, 0),
    tags: [TOPICS.TDD, TOPICS.VT],
  },
  {
    _id: 'demo-d-12', _type: 'dharma', kind: 'phap-thoai',
    title: 'Thiền minh sát Vipassana',
    slug: { current: 'thien-minh-sat' },
    excerpt: 'Quán sát thân, thọ, tâm, pháp như chúng đang là.',
    speaker: SPEAKERS.HT,
    publishedAt: '2024-09-30T00:00:00Z',
    durationSec: mins(47, 55),
    tags: [TOPICS.TD],
  },
  {
    _id: 'demo-d-13', _type: 'dharma', kind: 'phap-thoai',
    title: 'Hồi hướng công đức',
    slug: { current: 'hoi-huong-cong-duc' },
    excerpt: 'Hạnh hồi hướng và ý nghĩa của lễ tụng cuối khoá.',
    speaker: SPEAKERS.SC,
    publishedAt: '2024-08-08T00:00:00Z',
    durationSec: mins(22, 10),
    tags: [TOPICS.TD2],
  },
  {
    _id: 'demo-d-14', _type: 'dharma', kind: 'phap-thoai',
    title: 'Bồ Tát đạo',
    slug: { current: 'bo-tat-dao' },
    excerpt: 'Hạnh nguyện đại thừa — vì lợi lạc tất cả chúng sinh.',
    speaker: SPEAKERS.TT,
    publishedAt: '2024-06-15T00:00:00Z',
    durationSec: mins(39, 18),
    tags: [TOPICS.QA, TOPICS.TB],
  },
  {
    _id: 'demo-d-15', _type: 'dharma', kind: 'phap-thoai',
    title: 'Pháp Hoa thất dụ',
    slug: { current: 'phap-hoa-that-du' },
    excerpt: 'Bảy ví dụ trong Kinh Pháp Hoa và bài học đời sống.',
    speaker: SPEAKERS.HT,
    publishedAt: '2024-04-23T00:00:00Z',
    durationSec: mins(50, 42),
    tags: [TOPICS.PH],
  },
  {
    _id: 'demo-d-16', _type: 'dharma', kind: 'phap-thoai',
    title: 'Sáu pháp Ba La Mật',
    slug: { current: 'sau-phap-ba-la-mat' },
    excerpt: 'Bố thí, trì giới, nhẫn nhục, tinh tấn, thiền định, trí tuệ.',
    speaker: SPEAKERS.DD,
    publishedAt: '2024-02-09T00:00:00Z',
    durationSec: mins(36, 25),
    tags: [TOPICS.TB, TOPICS.BCD],
  },
];
