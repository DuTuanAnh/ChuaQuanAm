import { createSelector } from '@ngrx/store';
import { eventFeature } from './event.reducer';

/** Re-export auto-generated base selectors. */
export const {
  selectEvents,
  selectSelectedType,
  selectLoading,
  selectError,
} = eventFeature;

/** Apply type filter — if `selectedType === 'all'`, return all events. */
export const selectFilteredEvents = createSelector(
  eventFeature.selectEvents,
  eventFeature.selectSelectedType,
  (events, type) => (type === 'all' ? events : events.filter((e) => e.kind === type)),
);

/** Upcoming events from the filtered set, soonest first. */
export const selectUpcomingEvents = createSelector(
  selectFilteredEvents,
  (events) => {
    const now = Date.now();
    return events
      .filter((e) => new Date(e.startsAt).getTime() >= now)
      .sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      );
  },
);

/** Past events from the filtered set, most recent first. */
export const selectPastEvents = createSelector(
  selectFilteredEvents,
  (events) => {
    const now = Date.now();
    return events
      .filter((e) => new Date(e.startsAt).getTime() < now)
      .sort(
        (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
      );
  },
);
