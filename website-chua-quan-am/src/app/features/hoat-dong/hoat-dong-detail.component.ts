import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import { SanityService } from '../../core/services/sanity.service';
import { EventKind, TempleEvent } from '../../shared/models/event.model';
import { EventActions, selectEvents, selectLoading } from './store';

const TYPE_LABEL: Record<EventKind, string> = {
  'le-via': 'Lễ vía',
  'khoa-tu': 'Khoá tu',
  'sinh-hoat': 'Sinh hoạt',
  'phong-sinh': 'Phóng sinh',
};

const WEEKDAYS = [
  'Chủ nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
];

const pad = (n: number): string => n.toString().padStart(2, '0');

@Component({
  selector: 'app-hoat-dong-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './hoat-dong-detail.component.html',
  styleUrl: './hoat-dong-detail.component.scss',
})
export class HoatDongDetailComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly sanity = inject(SanityService);

  /** Bound from route param via withComponentInputBinding(). */
  readonly slug = input.required<string>();

  /** Single-event fetch result; only used as fallback when not in store. */
  private readonly fetched = signal<TempleEvent | undefined>(undefined);
  private readonly fetchLoading = signal(false);

  private readonly allEvents = toSignal(this.store.select(selectEvents), {
    initialValue: [] as TempleEvent[],
  });

  protected readonly listLoading = toSignal(this.store.select(selectLoading), {
    initialValue: false,
  });

  protected readonly loading = computed(
    () => this.listLoading() || this.fetchLoading(),
  );

  protected readonly event = computed<TempleEvent | undefined>(() => {
    const slug = this.slug();
    return (
      this.allEvents().find((e) => e.slug.current === slug) ?? this.fetched()
    );
  });

  protected readonly related = computed<TempleEvent[]>(() => {
    const e = this.event();
    if (!e) return [];
    const todayMs = Date.now();
    const others = this.allEvents().filter((x) => x._id !== e._id);
    // Same kind first, prefer upcoming, then by date proximity.
    const sameKind = others.filter((x) => x.kind === e.kind);
    const upcoming = sameKind
      .filter((x) => new Date(x.startsAt).getTime() >= todayMs)
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      );
    const past = sameKind
      .filter((x) => new Date(x.startsAt).getTime() < todayMs)
      .sort(
        (a, b) =>
          new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
      );
    return [...upcoming, ...past].slice(0, 3);
  });

  ngOnInit() {
    if (this.allEvents().length === 0) {
      this.store.dispatch(EventActions.loadEvents());
      // Also fetch single event in parallel — covers the case where the store
      // is empty AND the user landed on the detail URL directly (deep link).
      this.fetchLoading.set(true);
      this.sanity.getEventBySlug(this.slug()).subscribe({
        next: (ev) => {
          this.fetched.set(ev);
          this.fetchLoading.set(false);
        },
        error: () => this.fetchLoading.set(false),
      });
    }
  }

  // ---- helpers ----
  protected typeLabel(kind: EventKind): string {
    return TYPE_LABEL[kind];
  }

  protected formatFullDate(iso: string): string {
    const d = new Date(iso);
    return `${WEEKDAYS[d.getDay()]}, ngày ${d.getDate()} tháng ${
      d.getMonth() + 1
    }, ${d.getFullYear()}`;
  }

  protected formatDayBig(iso: string): string {
    return new Date(iso).getDate().toString().padStart(2, '0');
  }

  protected formatMonthLabel(iso: string): string {
    return `Tháng ${new Date(iso).getMonth() + 1}`;
  }

  protected formatTime(iso: string): string {
    const d = new Date(iso);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  protected formatDateRange(start: string, end?: string): string {
    if (!end) return this.formatTime(start);
    const s = new Date(start);
    const e = new Date(end);
    const sameDay =
      s.getFullYear() === e.getFullYear() &&
      s.getMonth() === e.getMonth() &&
      s.getDate() === e.getDate();
    if (sameDay) {
      return `${this.formatTime(start)} – ${this.formatTime(end)}`;
    }
    return `${this.formatTime(start)} ${this.formatFullDate(start)} – ${this.formatTime(end)} ${this.formatFullDate(end)}`;
  }

  protected isUpcoming(iso: string): boolean {
    return new Date(iso).getTime() >= Date.now();
  }
}
