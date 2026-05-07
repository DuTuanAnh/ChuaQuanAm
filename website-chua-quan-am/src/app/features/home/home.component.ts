import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  NgZone,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { catchError, of } from 'rxjs';
import { GalleriaModule } from 'primeng/galleria';

import { environment } from '../../../environments/environment';
import { Dharma } from '../../shared/models/dharma.model';
import { EventKind, TempleEvent } from '../../shared/models/event.model';
import { Photo, PhotoAlbum } from '../../shared/models/photo.model';
import { DEMO_PHOTOS } from '../../shared/models/photo.demo';
import { DharmaActions, selectVideos } from '../phap-thoai/store';
import { EventActions, selectUpcomingEvents } from '../hoat-dong/store';

const EVENT_TYPE_LABEL: Record<EventKind, string> = {
  'le-via': 'Lễ vía',
  'khoa-tu': 'Khoá tu',
  'sinh-hoat': 'Sinh hoạt',
  'phong-sinh': 'Phóng sinh',
};

/** Raw shape from `/api/photos/featured` (mirrors backend GROQ projection). */
interface ApiPhoto {
  _id: string;
  title: string;
  album: PhotoAlbum;
  dateTaken?: string;
  description?: string;
  isFeature?: boolean;
  image?: { asset?: { url?: string } };
}

const FEATURED_TARGET = 6;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, GalleriaModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly zone = inject(NgZone);

  @ViewChild('heroBg') private heroBg?: ElementRef<HTMLElement>;
  private parallaxHandler?: () => void;

  // ---- Events / videos via NgRx (existing) ----
  private readonly upcomingEvents = toSignal(
    this.store.select(selectUpcomingEvents),
    { initialValue: [] as TempleEvent[] },
  );
  private readonly videos = toSignal(this.store.select(selectVideos), {
    initialValue: [] as Dharma[],
  });

  protected readonly displayEvents = computed(() => this.upcomingEvents().slice(0, 3));
  protected readonly displayVideos = computed(() => this.videos().slice(0, 3));

  // ---- Featured photos via HttpClient → backend /api/photos/featured ----
  protected readonly featuredPhotos = signal<Photo[]>([]);

  // Lightbox state — bound to PrimeNG Galleria.
  protected lightboxVisible = false;
  protected lightboxIndex = 0;

  ngOnInit() {
    this.store.dispatch(EventActions.loadEvents());
    this.store.dispatch(DharmaActions.loadVideos());

    // Featured photos. Falls back to demo data if backend is down or returns empty.
    const url = `${environment.apiUrl}/photos/featured`;
    this.http
      .get<ApiPhoto[]>(url)
      .pipe(
        catchError(() => of([] as ApiPhoto[])),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((rows) => {
        const mapped = rows.map(this.mapApiPhoto);
        const list =
          mapped.length > 0 ? mapped : DEMO_PHOTOS.filter((p) => p.isFeature);
        this.featuredPhotos.set(list.slice(0, FEATURED_TARGET));
      });
  }

  protected openLightbox(idx: number) {
    this.lightboxIndex = idx;
    this.lightboxVisible = true;
  }

  ngAfterViewInit() {
    // Hero parallax — bg translates at 50% of scroll speed.
    // Skipped for users who prefer reduced motion.
    if (
      typeof window === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    this.zone.runOutsideAngular(() => {
      this.parallaxHandler = () => {
        const el = this.heroBg?.nativeElement;
        if (!el) return;
        const y = window.scrollY;
        // Only animate while hero is roughly in viewport.
        if (y < window.innerHeight * 1.2) {
          el.style.transform = `translate3d(0, ${y * 0.5}px, 0)`;
        }
      };
      window.addEventListener('scroll', this.parallaxHandler, { passive: true });
    });
  }

  ngOnDestroy() {
    if (this.parallaxHandler) {
      window.removeEventListener('scroll', this.parallaxHandler);
    }
  }

  // ---- template helpers ----
  protected eventDay(iso: string): string {
    return new Date(iso).getDate().toString().padStart(2, '0');
  }
  protected eventMonth(iso: string): string {
    return `tháng ${new Date(iso).getMonth() + 1}`;
  }
  protected formatDuration(sec?: number): string {
    if (!sec) return '';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
  protected videoThumb(v: Dharma): string | null {
    const sanityUrl = (v.thumbnail as { asset?: { url?: string } } | undefined)
      ?.asset?.url;
    if (sanityUrl) return sanityUrl;
    if (v.youtubeId) return `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`;
    return null;
  }
  protected eventTypeLabel(kind: EventKind): string {
    return EVENT_TYPE_LABEL[kind];
  }

  private mapApiPhoto(raw: ApiPhoto): Photo {
    return {
      _id: raw._id,
      title: raw.title,
      image: raw.image?.asset?.url ?? '',
      album: raw.album,
      dateTaken: raw.dateTaken ?? '',
      description: raw.description ?? '',
      isFeature: raw.isFeature ?? false,
    };
  }
}
