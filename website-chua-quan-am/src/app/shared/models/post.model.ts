/**
 * Post — bài viết / tin tức từ Sanity CMS.
 * Khớp schema Sanity (_id, _type, slug.current).
 */
export interface Post {
  _id: string;
  _type: 'post';
  title: string;
  slug: { current: string };
  excerpt?: string;
  body?: unknown; // Portable Text blocks
  heroImage?: SanityImage;
  publishedAt: string; // ISO 8601
  author?: string;
  tags?: string[];
}

export interface SanityImage {
  _type: 'image';
  asset: {
    _ref: string;
    _type: 'reference';
  };
  alt?: string;
}
