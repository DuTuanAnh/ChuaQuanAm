import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { EventKind, TempleEvent } from '../../../shared/models/event.model';

/** Filter dropdown value: an EventKind, or 'all' to disable filtering. */
export type EventTypeFilter = EventKind | 'all';

export const EventActions = createActionGroup({
  source: 'Events',
  events: {
    'Load Events': emptyProps(),
    'Load Events Success': props<{ events: TempleEvent[] }>(),
    'Load Events Fail': props<{ error: string }>(),
    'Set Event Type': props<{ kind: EventTypeFilter }>(),
  },
});
