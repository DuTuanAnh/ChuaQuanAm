import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GalleriaModule } from 'primeng/galleria';
import { SkeletonModule } from 'primeng/skeleton';

import { SanityService } from '../../core/services/sanity.service';
import { Photo, PhotoAlbum } from '../../shared/models/photo.model';
import { SanityImgPipe } from '../../shared/pipes/sanity-img.pipe';

type AlbumFilter = PhotoAlbum | 'all';

interface ChipOption {
  value: AlbumFilter;
  label: string;
}

@Component({
  selector: 'app-thu-vien-anh',
  standalone: true,
  imports: [GalleriaModule, SkeletonModule, SanityImgPipe],
  templateUrl: './thu-vien-anh.component.html',
  styleUrl: './thu-vien-anh.component.scss',
})
export class ThuVienAnhComponent implements OnInit {
  private readonly sanity = inject(SanityService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly allPhotos = signal<Photo[]>([]);

  protected readonly selectedAlbum = signal<AlbumFilter>('all');

  // Lightbox state — bound to PrimeNG Galleria.
  protected lightboxVisible = false;
  protected lightboxIndex = 0;

  protected readonly chips: ChipOption[] = [
    { value: 'all',          label: 'Tất cả' },
    { value: 'kien-truc',    label: 'Kiến trúc' },
    { value: 'le-hoi',       label: 'Lễ hội' },
    { value: 'khoa-tu',      label: 'Khoá tu' },
    { value: 'thien-nhien',  label: 'Thiên nhiên' },
    { value: 'su-kien',      label: 'Sự kiện' },
  ];

  protected readonly filteredPhotos = computed<Photo[]>(() => {
    const album = this.selectedAlbum();
    return album === 'all'
      ? this.allPhotos()
      : this.allPhotos().filter((p) => p.album === album);
  });

  /** Skeleton placeholder count — same as 2 grid rows worth on desktop (4×2). */
  protected readonly skeletonSlots = Array.from({ length: 8 });

  protected readonly galleriaResponsive = [
    { breakpoint: '1024px', numVisible: 5 },
    { breakpoint: '768px',  numVisible: 4 },
    { breakpoint: '560px',  numVisible: 3 },
  ];

  ngOnInit() {
    this.sanity
      .getPhotos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (photos) => {
          this.allPhotos.set(photos);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.error.set(err instanceof Error ? err.message : 'Không tải được thư viện ảnh.');
          this.loading.set(false);
        },
      });
  }

  protected selectChip(value: AlbumFilter) {
    this.selectedAlbum.set(value);
  }

  protected openLightbox(index: number) {
    this.lightboxIndex = index;
    this.lightboxVisible = true;
  }
}
