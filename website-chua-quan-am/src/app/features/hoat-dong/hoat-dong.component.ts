import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { CalendarModule } from 'primeng/calendar';

import { EventKind, TempleEvent } from '../../shared/models/event.model';
import {
  EventActions,
  EventTypeFilter,
  selectFilteredEvents,
  selectLoading,
  selectSelectedType,
} from './store';

interface ChipOption {
  value: EventTypeFilter;
  label: string;
}

interface DayGroup {
  dateKey: string; // YYYY-MM-DD
  date: Date;
  events: TempleEvent[];
}

const TYPE_LABEL: Record<EventKind, string> = {
  'le-via': 'Lễ vía',
  'khoa-tu': 'Khoá tu',
  'sinh-hoat': 'Sinh hoạt',
  'phong-sinh': 'Phóng sinh',
};

const pad = (n: number): string => n.toString().padStart(2, '0');
const dateKey = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

@Component({
  selector: 'app-hoat-dong',
  standalone: true,
  imports: [RouterLink, FormsModule, CalendarModule],
  templateUrl: './hoat-dong.component.html',
  styleUrl: './hoat-dong.component.scss',
})
export class HoatDongComponent implements OnInit {
  private readonly store = inject(Store);

  // ---- store signals ----
  protected readonly events = toSignal(
    this.store.select(selectFilteredEvents),
    { initialValue: [] as TempleEvent[] },
  );
  protected readonly selectedType = toSignal(
    this.store.select(selectSelectedType),
    { initialValue: 'all' as EventTypeFilter },
  );
  protected readonly loading = toSignal(this.store.select(selectLoading), {
    initialValue: false,
  });

  // ---- chips ----
  protected readonly chips: ChipOption[] = [
    { value: 'all', label: 'Tất cả' },
    { value: 'le-via', label: 'Lễ vía' },
    { value: 'khoa-tu', label: 'Khoá tu' },
    { value: 'sinh-hoat', label: 'Sinh hoạt' },
    { value: 'phong-sinh', label: 'Phóng sinh' },
  ];

  // ---- calendar selection ----
  protected selectedCalendarDate: Date | null = null;

  // ---- derived: dates that have events (for highlight) ----
  protected readonly eventDateSet = computed(
    () => new Set(this.events().map((e) => dateKey(new Date(e.startsAt)))),
  );

  // ---- timeline groupings ----
  private readonly today = signal(this.startOfToday());

  protected readonly upcomingGroups = computed<DayGroup[]>(() => {
    const todayMs = this.today().getTime();
    const upcoming = this.events()
      .filter((e) => new Date(e.startsAt).getTime() >= todayMs)
      .slice()
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      );
    return this.groupByDay(upcoming);
  });

  protected readonly pastGroups = computed<DayGroup[]>(() => {
    const todayMs = this.today().getTime();
    const past = this.events()
      .filter((e) => new Date(e.startsAt).getTime() < todayMs)
      .slice()
      .sort(
        (a, b) =>
          new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
      );
    return this.groupByDay(past);
  });

  ngOnInit() {
    this.store.dispatch(EventActions.loadEvents());
  }

  // ---- handlers ----
  protected selectChip(value: EventTypeFilter) {
    this.store.dispatch(EventActions.setEventType({ kind: value }));
  }

  /**
   * Called by p-calendar's date template — receives a {day, month, year, ...} cell context.
   * Returns true when at least one filtered event falls on that calendar day.
   */
  protected hasEventOn(d: { day: number; month: number; year: number }): boolean {
    return this.eventDateSet().has(`${d.year}-${pad(d.month + 1)}-${pad(d.day)}`);
  }

  protected onDateSelect(date: Date) {
    const key = dateKey(date);
    // Wait a tick so the DOM update from selection finishes before scrolling.
    queueMicrotask(() => {
      const el = document.getElementById(`day-${key}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('day-flash');
        setTimeout(() => el.classList.remove('day-flash'), 1400);
      }
    });
  }

  // ---- template helpers ----
  protected typeLabel(kind: EventKind): string {
    return TYPE_LABEL[kind];
  }

  protected formatDayBig(d: Date): string {
    return d.getDate().toString().padStart(2, '0');
  }
  protected formatMonthLabel(d: Date): string {
    return `Tháng ${d.getMonth() + 1}`;
  }
  protected formatWeekday(d: Date): string {
    return ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][
      d.getDay()
    ];
  }
  protected formatTime(iso: string): string {
    const d = new Date(iso);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // ---- private ----
  private startOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private groupByDay(events: TempleEvent[]): DayGroup[] {
    const map = new Map<string, TempleEvent[]>();
    for (const e of events) {
      const d = new Date(e.startsAt);
      const key = dateKey(d);
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return Array.from(map.entries()).map(([key, evs]) => ({
      dateKey: key,
      date: new Date(evs[0].startsAt),
      events: evs,
    }));
  }
}
