import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Dharma, DharmaKind } from '../../shared/models/dharma.model';
import { EventKind, TempleEvent } from '../../shared/models/event.model';
import { Photo, PhotoAlbum } from '../../shared/models/photo.model';
import { Post } from '../../shared/models/post.model';

/**
 * Frontend service — proxies to the Express backend at `environment.apiUrl`.
 * The backend talks to Sanity; the frontend never sees a Sanity token.
 *
 * Method names + return types are kept identical to the previous direct-Sanity
 * version so existing consumers (NgRx Effects, ThuVienAnhComponent) don't need
 * to change. Backend response shapes diverge from Angular models (see the
 * Sanity schemas in `studio/`), so each method maps via a small helper.
 */

// ---------- Backend response shapes ----------
// Match the GROQ projections in `server/services/sanity.service.js`.

interface ApiSlug {
  current: string;
}

interface ApiImage {
  asset?: { url?: string; _ref?: string };
  alt?: string;
}

interface ApiPost {
  _id: string;
  title: string;
  slug?: ApiSlug;
  category?: string;
  thumbnail?: ApiImage;
  publishedAt: string;
  excerpt?: string;
  author?: string;
}

interface ApiDharma {
  _id: string;
  title: string;
  slug?: ApiSlug;
  speaker?: string;
  topic?: string;
  videoType?: 'youtube' | 'upload';
  youtubeUrl?: string;
  videoFile?: { asset?: { url?: string } };
  thumbnail?: ApiImage;
  duration?: string; // "mm:ss" or "hh:mm:ss"
  publishedAt: string;
  description?: string;
}

interface ApiEvent {
  _id: string;
  title: string;
  slug?: ApiSlug;
  type?: EventKind;
  startDate: string;
  endDate?: string;
  location?: string;
  image?: ApiImage;
  description?: string;
  isRecurring?: boolean;
  recurringNote?: string;
  contact?: string;
}

interface ApiPhoto {
  _id: string;
  title: string;
  album: PhotoAlbum;
  dateTaken?: string;
  description?: string;
  isFeature?: boolean;
  image?: ApiImage;
}

// ---------- Mappers: backend shape → Angular model ----------

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const ensureSlug = (slug: ApiSlug | undefined, fallbackTitle: string): { current: string } =>
  slug ?? { current: slugify(fallbackTitle) };

const parseDurationSec = (raw?: string): number | undefined => {
  if (!raw) return undefined;
  const parts = raw.split(':').map((p) => parseInt(p, 10));
  if (parts.some(Number.isNaN)) return undefined;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return undefined;
};

const extractYoutubeId = (url?: string): string | undefined => {
  if (!url) return undefined;
  const m =
    /(?:v=|\/embed\/|\/v\/|youtu\.be\/|\/shorts\/)([A-Za-z0-9_-]{11})/.exec(url);
  return m?.[1];
};

const mapPost = (p: ApiPost): Post => ({
  _id: p._id,
  _type: 'post',
  title: p.title,
  slug: ensureSlug(p.slug, p.title),
  excerpt: p.excerpt,
  publishedAt: p.publishedAt,
  author: p.author,
  // Backend `thumbnail` maps to `heroImage` in the Angular model.
  heroImage: p.thumbnail
    ? { _type: 'image', asset: { _ref: p.thumbnail.asset?._ref ?? '', _type: 'reference' }, alt: p.thumbnail.alt }
    : undefined,
  // body, tags: not exposed by backend post projection — left undefined.
});

const mapDharma = (d: ApiDharma): Dharma => ({
  _id: d._id,
  _type: 'dharma',
  // Backend dharma schema doesn't distinguish kind — assume 'phap-thoai'.
  kind: 'phap-thoai' as DharmaKind,
  title: d.title,
  slug: ensureSlug(d.slug, d.title),
  speaker: d.speaker,
  excerpt: d.description,
  publishedAt: d.publishedAt,
  durationSec: parseDurationSec(d.duration),
  youtubeId: extractYoutubeId(d.youtubeUrl),
  videoUrl: d.videoType === 'upload' ? d.videoFile?.asset?.url : undefined,
  // topic (string) → tags (string[]) for Angular consumers.
  tags: d.topic ? [d.topic] : undefined,
  thumbnail: d.thumbnail
    ? { _type: 'image', asset: { _ref: d.thumbnail.asset?._ref ?? '', _type: 'reference' }, alt: d.thumbnail.alt }
    : undefined,
});

const mapEvent = (e: ApiEvent): TempleEvent => ({
  _id: e._id,
  _type: 'event',
  kind: (e.type ?? 'sinh-hoat') as EventKind,
  title: e.title,
  // Prefer real slug from Sanity; fall back to synthesized for legacy events.
  slug: e.slug ?? { current: slugify(e.title) || e._id },
  excerpt: e.description,
  body: e.description,
  startsAt: e.startDate,
  endsAt: e.endDate,
  location: e.location,
  recurring: e.isRecurring,
  recurringNote: e.recurringNote,
  contact: e.contact,
  heroUrl: e.image?.asset?.url,
  hero: e.image
    ? { _type: 'image', asset: { _ref: e.image.asset?._ref ?? '', _type: 'reference' }, alt: e.image.alt }
    : undefined,
});

const mapPhoto = (p: ApiPhoto): Photo => ({
  _id: p._id,
  title: p.title,
  image: p.image?.asset?.url ?? '',
  album: p.album,
  dateTaken: p.dateTaken ?? '',
  description: p.description ?? '',
  isFeature: p.isFeature ?? false,
});

// ---------- Service ----------

@Injectable({ providedIn: 'root' })
export class SanityService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  /** Backend is the canonical data source now — always true. */
  get isConfigured(): boolean {
    return true;
  }

  // ---------- Posts ----------

  getPosts(): Observable<Post[]> {
    return this.http
      .get<ApiPost[]>(`${this.base}/posts`)
      .pipe(map((rows) => rows.map(mapPost)));
  }

  getPostBySlug(slug: string): Observable<Post | undefined> {
    return this.http
      .get<ApiPost | null>(`${this.base}/posts/${encodeURIComponent(slug)}`)
      .pipe(map((row) => (row ? mapPost(row) : undefined)));
  }

  // ---------- Dharma ----------

  getDharmaVideos(speaker?: string, topic?: string, year?: number): Observable<Dharma[]> {
    let params = new HttpParams();
    if (speaker) params = params.set('speaker', speaker);
    if (topic) params = params.set('topic', topic);
    if (year !== undefined) params = params.set('year', String(year));
    return this.http
      .get<ApiDharma[]>(`${this.base}/dharma`, { params })
      .pipe(map((rows) => rows.map(mapDharma)));
  }

  getDharmaBySlug(slug: string): Observable<Dharma | undefined> {
    return this.http
      .get<ApiDharma | null>(`${this.base}/dharma/${encodeURIComponent(slug)}`)
      .pipe(map((row) => (row ? mapDharma(row) : undefined)));
  }

  /** Kept for callers that pass filter args — same as getDharmaVideos. */
  getDharmaByFilter(
    speaker?: string,
    topic?: string,
    year?: number,
  ): Observable<Dharma[]> {
    return this.getDharmaVideos(speaker, topic, year);
  }

  // ---------- Events ----------

  getEvents(): Observable<TempleEvent[]> {
    return this.http
      .get<ApiEvent[]>(`${this.base}/events`)
      .pipe(map((rows) => rows.map(mapEvent)));
  }

  getUpcomingEvents(limit: number): Observable<TempleEvent[]> {
    return this.http
      .get<ApiEvent[]>(`${this.base}/events/upcoming/${limit}`)
      .pipe(map((rows) => rows.map(mapEvent)));
  }

  /** Backend doesn't expose a by-id route for events yet; return undefined. */
  getEventById(_id: string): Observable<TempleEvent | undefined> {
    return new Observable((sub) => {
      sub.next(undefined);
      sub.complete();
    });
  }

  getEventBySlug(slug: string): Observable<TempleEvent | undefined> {
    return this.http
      .get<ApiEvent | null>(`${this.base}/events/${encodeURIComponent(slug)}`)
      .pipe(map((row) => (row ? mapEvent(row) : undefined)));
  }

  // ---------- Photos ----------

  getPhotos(album?: PhotoAlbum): Observable<Photo[]> {
    let params = new HttpParams();
    if (album) params = params.set('album', album);
    return this.http
      .get<ApiPhoto[]>(`${this.base}/photos`, { params })
      .pipe(map((rows) => rows.map(mapPhoto)));
  }

  /** Alias for backwards compatibility — uses `getPhotos(album)`. */
  getPhotosByAlbum(album: PhotoAlbum): Observable<Photo[]> {
    return this.getPhotos(album);
  }

  getFeaturedPhotos(): Observable<Photo[]> {
    return this.http
      .get<ApiPhoto[]>(`${this.base}/photos/featured`)
      .pipe(map((rows) => rows.map(mapPhoto)));
  }
}
