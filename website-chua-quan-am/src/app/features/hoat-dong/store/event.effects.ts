import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';

import { SanityService } from '../../../core/services/sanity.service';
import { EventActions } from './event.actions';
import { DEMO_EVENTS } from './event.demo';

@Injectable()
export class EventEffects {
  private readonly actions$ = inject(Actions);
  private readonly sanity = inject(SanityService);

  loadEvents$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EventActions.loadEvents),
      switchMap(() => {
        // No Sanity yet → seed demo so calendar / chips / timeline have data.
        if (!this.sanity.isConfigured) {
          return of(EventActions.loadEventsSuccess({ events: DEMO_EVENTS }));
        }

        return this.sanity.getEvents().pipe(
          map((events) => EventActions.loadEventsSuccess({ events })),
          catchError((err: unknown) =>
            of(
              EventActions.loadEventsFail({
                error: err instanceof Error ? err.message : 'Không tải được sự kiện.',
              }),
            ),
          ),
        );
      }),
    ),
  );
}
