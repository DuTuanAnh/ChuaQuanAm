import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { DropdownModule } from 'primeng/dropdown';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { debounceTime, distinctUntilChanged, take } from 'rxjs';

import { Dharma } from '../../shared/models/dharma.model';
import { SanityImgPipe } from '../../shared/pipes/sanity-img.pipe';
import {
  DharmaActions,
  selectAvailableSpeakers,
  selectAvailableYears,
  selectFilteredVideos,
  selectFilters,
  selectLoading,
  selectSearchQuery,
} from './store';

interface Option<T> {
  label: string;
  value: T | null;
}

const ROWS_PER_PAGE = 12;

const TOPICS = [
  'Tứ Diệu Đế',
  'Bát Chánh Đạo',
  'Thiền định',
  'Tịnh Độ',
  'Pháp Hoa',
  'Quán Âm Bồ Tát',
  'Vô thường',
  'Từ bi - trí tuệ',
];

@Component({
  selector: 'app-phap-thoai',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    DropdownModule,
    PaginatorModule,
    SanityImgPipe,
  ],
  templateUrl: './phap-thoai.component.html',
  styleUrl: './phap-thoai.component.scss',
})
export class PhapThoaiComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly ROWS_PER_PAGE = ROWS_PER_PAGE;
  protected readonly searchControl = new FormControl('', { nonNullable: true });

  // ---- store signals ----
  protected readonly filteredVideos = toSignal(
    this.store.select(selectFilteredVideos),
    { initialValue: [] as Dharma[] },
  );
  protected readonly filters = toSignal(this.store.select(selectFilters), {
    initialValue: { speaker: undefined, topic: undefined, year: undefined },
  });
  protected readonly loading = toSignal(this.store.select(selectLoading), {
    initialValue: false,
  });
  private readonly availableSpeakers = toSignal(
    this.store.select(selectAvailableSpeakers),
    { initialValue: [] as string[] },
  );
  private readonly availableYears = toSignal(
    this.store.select(selectAvailableYears),
    { initialValue: [] as number[] },
  );

  // ---- pagination ----
  protected readonly currentPage = signal(0);

  protected readonly pagedVideos = computed<Dharma[]>(() => {
    const all = this.filteredVideos();
    const start = this.currentPage() * ROWS_PER_PAGE;
    return all.slice(start, start + ROWS_PER_PAGE);
  });

  protected readonly totalRecords = computed(() => this.filteredVideos().length);
  protected readonly firstIndex = computed(() => this.currentPage() * ROWS_PER_PAGE);

  // ---- dropdown options ----
  protected readonly speakerOptions = computed<Option<string>[]>(() => [
    { label: 'Tất cả pháp sư', value: null },
    ...this.availableSpeakers().map((s) => ({ label: s, value: s })),
  ]);

  protected readonly topicOptions: Option<string>[] = [
    { label: 'Tất cả chủ đề', value: null },
    ...TOPICS.map((t) => ({ label: t, value: t })),
  ];

  protected readonly yearOptions = computed<Option<number>[]>(() => [
    { label: 'Tất cả năm', value: null },
    ...this.availableYears().map((y) => ({ label: y.toString(), value: y })),
  ]);

  protected readonly hasAnyFilter = computed(() => {
    const f = this.filters();
    return !!(f.speaker || f.topic || f.year || this.searchControl.value);
  });

  ngOnInit() {
    this.store.dispatch(DharmaActions.loadVideos());

    // Sync existing query into the control once on init
    this.store
      .select(selectSearchQuery)
      .pipe(take(1))
      .subscribe((q) => this.searchControl.setValue(q, { emitEvent: false }));

    // Debounced search
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((q) => {
        this.store.dispatch(DharmaActions.setSearchQuery({ query: q }));
        this.currentPage.set(0);
      });
  }

  // ---- handlers ----
  protected onSpeakerChange(speaker: string | null) {
    this.store.dispatch(
      DharmaActions.setFilter({ filters: { speaker: speaker ?? undefined } }),
    );
    this.currentPage.set(0);
  }

  protected onTopicChange(topic: string | null) {
    this.store.dispatch(
      DharmaActions.setFilter({ filters: { topic: topic ?? undefined } }),
    );
    this.currentPage.set(0);
  }

  protected onYearChange(year: number | null) {
    this.store.dispatch(
      DharmaActions.setFilter({ filters: { year: year ?? undefined } }),
    );
    this.currentPage.set(0);
  }

  protected clearFilters() {
    this.searchControl.setValue('', { emitEvent: false });
    this.store.dispatch(DharmaActions.setSearchQuery({ query: '' }));
    this.store.dispatch(
      DharmaActions.setFilter({
        filters: { speaker: undefined, topic: undefined, year: undefined },
      }),
    );
    this.currentPage.set(0);
  }

  protected onPage(event: PaginatorState) {
    this.currentPage.set(event.page ?? 0);
    window.scrollTo({ top: 320, behavior: 'smooth' });
  }

  // ---- template helpers ----
  protected videoThumb(v: Dharma): string | null {
    const sanityUrl = (v.thumbnail as { asset?: { url?: string } } | undefined)
      ?.asset?.url;
    if (sanityUrl) return sanityUrl;
    if (v.youtubeId) return `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`;
    return null;
  }

  protected formatDuration(sec?: number): string {
    if (!sec) return '';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  protected formatDate(iso: string): string {
    const d = new Date(iso);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${d.getFullYear()}`;
  }
}
