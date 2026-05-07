import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Dharma } from '../../../shared/models/dharma.model';

export interface DharmaFilters {
  speaker?: string;
  topic?: string;
  year?: number;
}

export const DharmaActions = createActionGroup({
  source: 'Dharma',
  events: {
    'Load Videos': emptyProps(),
    'Load Videos Success': props<{ videos: Dharma[] }>(),
    'Load Videos Fail': props<{ error: string }>(),
    'Set Filter': props<{ filters: Partial<DharmaFilters> }>(),
    'Set Search Query': props<{ query: string }>(),
    'Select Video': props<{ video: Dharma | null }>(),
  },
});
