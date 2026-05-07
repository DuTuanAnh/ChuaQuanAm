import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';

import { SanityService } from '../../../core/services/sanity.service';
import { DharmaActions } from './dharma.actions';
import { DEMO_DHARMA_VIDEOS } from './dharma.demo';

@Injectable()
export class DharmaEffects {
  private readonly actions$ = inject(Actions);
  private readonly sanity = inject(SanityService);

  loadVideos$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DharmaActions.loadVideos),
      switchMap(() => {
        // No Sanity yet → seed with demo data so the rest of the app
        // (search, filters, pagination) has something to work against.
        if (!this.sanity.isConfigured) {
          return of(DharmaActions.loadVideosSuccess({ videos: DEMO_DHARMA_VIDEOS }));
        }

        return this.sanity.getDharmaVideos().pipe(
          map((videos) => DharmaActions.loadVideosSuccess({ videos })),
          catchError((err: unknown) =>
            of(
              DharmaActions.loadVideosFail({
                error: err instanceof Error ? err.message : 'Không tải được pháp thoại.',
              }),
            ),
          ),
        );
      }),
    ),
  );
}
