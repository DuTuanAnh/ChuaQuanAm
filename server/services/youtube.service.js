import fetch from 'node-fetch';

/**
 * Thin wrapper around YouTube Data API v3.
 * Used to enrich dharma videos with duration / view count / channel info,
 * or to import a temple's playlist into Sanity. Routes don't call this yet —
 * available primitives for future use.
 *
 * Docs: https://developers.google.com/youtube/v3/docs
 */

const BASE = 'https://www.googleapis.com/youtube/v3';

export const isConfigured = () => Boolean(process.env.YOUTUBE_API_KEY);

async function call(path, params = {}) {
  if (!isConfigured()) {
    const err = new Error('YouTube API key is not configured.');
    err.status = 503;
    throw err;
  }

  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
  url.searchParams.set('key', process.env.YOUTUBE_API_KEY);

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`YouTube API ${res.status}: ${text}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/** Search public YouTube videos. Returns the raw `search.list` response. */
export function searchVideos(query, maxResults = 12) {
  return call('/search', {
    part: 'snippet',
    q: query,
    type: 'video',
    maxResults,
  });
}

/** Fetch contentDetails + statistics + snippet for a list of video IDs. */
export function getVideoDetails(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return Promise.resolve({ items: [] });
  return call('/videos', {
    part: 'contentDetails,statistics,snippet',
    id: ids.join(','),
  });
}

/** List videos in a public playlist (e.g. a temple's "Pháp thoại" playlist). */
export function getPlaylistVideos(playlistId, maxResults = 50) {
  return call('/playlistItems', {
    part: 'snippet,contentDetails',
    playlistId,
    maxResults,
  });
}

/**
 * Convert ISO 8601 duration string (e.g. "PT32M14S") to seconds.
 * Useful when ingesting YouTube data into Sanity's `durationSec` field.
 */
export function parseIsoDuration(iso) {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || '');
  if (!m) return 0;
  const [, h, mn, s] = m;
  return (parseInt(h || '0', 10) * 3600) + (parseInt(mn || '0', 10) * 60) + parseInt(s || '0', 10);
}
