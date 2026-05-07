import { createFeature, createReducer, on } from '@ngrx/store';
import { Dharma } from '../../../shared/models/dharma.model';
import { DharmaActions, DharmaFilters } from './dharma.actions';

export interface DharmaState {
  videos: Dharma[];
  selectedVideo: Dharma | null;
  filters: DharmaFilters;
  searchQuery: string;
  loading: boolean;
  error: string | null;
}

export const initialDharmaState: DharmaState = {
  videos: [],
  selectedVideo: null,
  filters: {},
  searchQuery: '',
  loading: false,
  error: null,
};

export const dharmaFeature = createFeature({
  name: 'dharma',
  reducer: createReducer(
    initialDharmaState,

    on(DharmaActions.loadVideos, (state) => ({
      ...state,
      loading: true,
      error: null,
    })),

    on(DharmaActions.loadVideosSuccess, (state, { videos }) => ({
      ...state,
      videos,
      loading: false,
    })),

    on(DharmaActions.loadVideosFail, (state, { error }) => ({
      ...state,
      loading: false,
      error,
    })),

    on(DharmaActions.setFilter, (state, { filters }) => ({
      ...state,
      filters: { ...state.filters, ...filters },
    })),

    on(DharmaActions.setSearchQuery, (state, { query }) => ({
      ...state,
      searchQuery: query,
    })),

    on(DharmaActions.selectVideo, (state, { video }) => ({
      ...state,
      selectedVideo: video,
    })),
  ),
});
