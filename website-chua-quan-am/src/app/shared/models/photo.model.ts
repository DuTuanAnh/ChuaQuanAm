export type PhotoAlbum =
  | 'kien-truc'
  | 'le-hoi'
  | 'khoa-tu'
  | 'thien-nhien'
  | 'su-kien';

export interface Photo {
  _id: string;
  title: string;
  /** Resolved CDN URL, or empty string when image hasn't been uploaded yet (demo). */
  image: string;
  album: PhotoAlbum;
  dateTaken: string; // ISO 8601
  description: string;
  isFeature: boolean;
}
