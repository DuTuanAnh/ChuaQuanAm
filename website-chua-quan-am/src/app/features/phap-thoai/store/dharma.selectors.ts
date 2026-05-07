import { createSelector } from '@ngrx/store';
import { dharmaFeature } from './dharma.reducer';

/**
 * Re-export auto-generated base selectors from createFeature.
 * Components should import from this file to keep imports stable
 * even if reducer internals change.
 */
export const {
  selectVideos,
  selectSelectedVideo,
  selectFilters,
  selectSearchQuery,
  selectLoading,
  selectError,
} = dharmaFeature;

/**
 * Derived list — apply current filters + searchQuery to videos.
 * Recomputes only when one of (videos, filters, searchQuery) changes.
 */
export const selectFilteredVideos = createSelector(
  dharmaFeature.selectVideos,
  dharmaFeature.selectFilters,
  dharmaFeature.selectSearchQuery,
  (videos, filters, query) => {
    let result = videos;

    if (filters.speaker) {
      result = result.filter((v) => v.speaker === filters.speaker);
    }
    if (filters.topic) {
      result = result.filter((v) => v.tags?.includes(filters.topic!));
    }
    if (filters.year) {
      result = result.filter(
        (v) => new Date(v.publishedAt).getFullYear() === filters.year,
      );
    }

    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter((v) =>
        [v.title, v.excerpt, v.speaker]
          .filter(Boolean)
          .some((s) => (s as string).toLowerCase().includes(q)),
      );
    }

    return result;
  },
);

/** Distinct speakers across all loaded videos — useful for filter dropdowns. */
export const selectAvailableSpeakers = createSelector(
  dharmaFeature.selectVideos,
  (videos) =>
    Array.from(new Set(videos.map((v) => v.speaker).filter(Boolean) as string[])).sort(),
);

/** Distinct years across all loaded videos — desc, useful for filter dropdowns. */
export const selectAvailableYears = createSelector(
  dharmaFeature.selectVideos,
  (videos) =>
    Array.from(new Set(videos.map((v) => new Date(v.publishedAt).getFullYear()))).sort(
      (a, b) => b - a,
    ),
);

/** Factory: lookup a single video by slug from the loaded list. */
export const selectVideoBySlug = (slug: string) =>
  createSelector(dharmaFeature.selectVideos, (videos) =>
    videos.find((v) => v.slug.current === slug),
  );

/** Factory: 3 related videos — same speaker first, fallback to shared tags. */
export const selectRelatedVideos = (currentId: string, speaker?: string, tags?: string[]) =>
  createSelector(dharmaFeature.selectVideos, (videos) => {
    const others = videos.filter((v) => v._id !== currentId);
    const sameSpeaker = speaker ? others.filter((v) => v.speaker === speaker) : [];
    const sameTopic = tags?.length
      ? others.filter((v) => v.tags?.some((t) => tags.includes(t)))
      : [];
    const ordered = [
      ...sameSpeaker,
      ...sameTopic.filter((v) => !sameSpeaker.includes(v)),
      ...others.filter((v) => !sameSpeaker.includes(v) && !sameTopic.includes(v)),
    ];
    return ordered.slice(0, 3);
  });
