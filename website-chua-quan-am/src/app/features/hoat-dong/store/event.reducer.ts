import { createFeature, createReducer, on } from '@ngrx/store';
import { TempleEvent } from '../../../shared/models/event.model';
import { EventActions, EventTypeFilter } from './event.actions';

export interface EventState {
  events: TempleEvent[];
  selectedType: EventTypeFilter;
  loading: boolean;
  error: string | null;
}

export const initialEventState: EventState = {
  events: [],
  selectedType: 'all',
  loading: false,
  error: null,
};

export const eventFeature = createFeature({
  name: 'events',
  reducer: createReducer(
    initialEventState,

    on(EventActions.loadEvents, (state) => ({
      ...state,
      loading: true,
      error: null,
    })),

    on(EventActions.loadEventsSuccess, (state, { events }) => ({
      ...state,
      events,
      loading: false,
    })),

    on(EventActions.loadEventsFail, (state, { error }) => ({
      ...state,
      loading: false,
      error,
    })),

    on(EventActions.setEventType, (state, { kind }) => ({
      ...state,
      selectedType: kind,
    })),
  ),
});
