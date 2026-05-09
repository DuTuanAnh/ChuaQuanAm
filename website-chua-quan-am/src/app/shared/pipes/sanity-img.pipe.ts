import { Pipe, PipeTransform } from '@angular/core';

/**
 * Append Sanity Image URL transform params for on-the-fly resize + WebP/AVIF.
 * Cuts asset size 5–10× vs. raw `asset.url` for typical display widths.
 *
 * Usage in templates:
 *   <img [src]="photo.image | sanityImg:600" />              // 600w thumb
 *   <img [src]="photo.image | sanityImg:1600:'hero'" />      // larger preset
 *   <img [src]="photo.image | sanityImg:{ w: 800, q: 80 }" /> // explicit opts
 *
 * Presets pick a sensible default quality for each use case.
 */

type Preset = 'thumb' | 'card' | 'hero' | 'lightbox';

interface SanityImgOpts {
  /** Target rendered width in CSS px. Sanity will pick 1× and 2× variants. */
  w?: number;
  /** JPEG/WebP quality 1–100 (default 75). */
  q?: number;
  /** Crop fit. `max` (default) preserves aspect, `crop` fills. */
  fit?: 'max' | 'crop' | 'min' | 'fill';
}

const PRESETS: Record<Preset, SanityImgOpts> = {
  thumb: { w: 400, q: 70 },
  card: { w: 800, q: 75 },
  hero: { w: 1600, q: 80 },
  lightbox: { w: 2000, q: 85 },
};

@Pipe({ name: 'sanityImg', standalone: true })
export class SanityImgPipe implements PipeTransform {
  transform(
    src: string | null | undefined,
    sizeOrOpts: number | Preset | SanityImgOpts = 'card',
    preset?: Preset,
  ): string {
    if (!src) return '';
    // Skip non-Sanity URLs.
    if (!src.includes('cdn.sanity.io')) return src;
    // Don't double-transform if caller already passed query params.
    if (src.includes('?')) return src;

    const opts = this.resolve(sizeOrOpts, preset);
    const params = new URLSearchParams();
    if (opts.w) params.set('w', String(opts.w));
    params.set('q', String(opts.q ?? 75));
    params.set('fit', opts.fit ?? 'max');
    params.set('auto', 'format'); // Serves AVIF/WebP when supported.

    return `${src}?${params.toString()}`;
  }

  private resolve(
    sizeOrOpts: number | Preset | SanityImgOpts,
    preset?: Preset,
  ): SanityImgOpts {
    if (typeof sizeOrOpts === 'number') {
      return preset ? { ...PRESETS[preset], w: sizeOrOpts } : { w: sizeOrOpts };
    }
    if (typeof sizeOrOpts === 'string') {
      return PRESETS[sizeOrOpts];
    }
    return sizeOrOpts;
  }
}
