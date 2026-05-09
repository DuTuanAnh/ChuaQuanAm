import { createClient } from '@sanity/client';

/**
 * Sanity client — created once at module load using env values.
 * Project must have a real id + dataset (see server/.env).
 *
 * Security: never expose `token` to clients. This file runs server-side only.
 */
const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  useCdn: true,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN || undefined,
});

export const isConfigured = () => Boolean(process.env.SANITY_PROJECT_ID);

// ---------- Posts ----------

export async function getPosts() {
  return client.fetch(`
    *[_type == "post"] | order(publishedAt desc) {
      _id, title, slug, category,
      thumbnail { ..., asset->{ url } },
      publishedAt, excerpt, author
    }
  `);
}

export async function getPostBySlug(slug) {
  return client.fetch(
    `*[_type == "post" && slug.current == $slug][0]`,
    { slug },
  );
}

// ---------- Dharma (pháp thoại) ----------

/**
 * Filter pháp thoại by optional speaker / topic / year — undefined = skip filter.
 * Uses parameterised GROQ (`$speaker`, `$topic`, `$year`) instead of string
 * concatenation to avoid GROQ injection.
 */
export async function getDharmaVideos(speaker, topic, year) {
  const params = {
    speaker: speaker || null,
    topic: topic || null,
    year: year ? String(year) : null,
  };
  return client.fetch(
    `
    *[_type == "dharma"
      && (!defined($speaker) || speaker == $speaker)
      && (!defined($topic)   || topic == $topic)
      && (!defined($year)    || string::startsWith(publishedAt, $year))
    ] | order(publishedAt desc) {
      _id, title, slug, speaker, topic,
      videoType, youtubeUrl,
      thumbnail { ..., asset->{ url } },
      duration, publishedAt, description
    }
  `,
    params,
  );
}

export async function getDharmaBySlug(slug) {
  return client.fetch(
    `*[_type == "dharma" && slug.current == $slug][0]`,
    { slug },
  );
}

// ---------- Events (sự kiện) ----------

export async function getEvents() {
  return client.fetch(`
    *[_type == "event"] | order(startDate asc) {
      _id, title, slug, type, startDate, endDate,
      location,
      image { ..., asset->{ url } },
      description, isRecurring, recurringNote, contact
    }
  `);
}

export async function getUpcomingEvents(limit) {
  const today = new Date().toISOString();
  return client.fetch(
    `
    *[_type == "event" && startDate >= $today]
      | order(startDate asc) [0...$limit] {
        _id, title, slug, type, startDate,
        location,
        image { ..., asset->{ url } }
      }
  `,
    { today, limit: parseInt(limit, 10) },
  );
}

/**
 * Fetch a single event by slug. Returns null if not found.
 *
 * Some legacy events may have been created before the slug field existed —
 * Sanity will return them with `slug` undefined. The Studio now requires slug
 * on new events, so editors need to add slugs to old ones via the Studio UI.
 */
export async function getEventBySlug(slug) {
  return client.fetch(
    `*[_type == "event" && slug.current == $slug][0] {
      _id, title, slug, type, startDate, endDate,
      location,
      image { ..., asset->{ url } },
      description, isRecurring, recurringNote, contact
    }`,
    { slug },
  );
}

// ---------- Photos (ảnh) ----------

/** Optional `album` filter via parameterised GROQ. */
export async function getPhotos(album) {
  return client.fetch(
    `
    *[_type == "photo" && (!defined($album) || album == $album)]
      | order(_createdAt desc) {
        _id, title,
        image { ..., asset->{ url } },
        album, dateTaken, description, isFeature
      }
  `,
    { album: album || null },
  );
}

export async function getFeaturedPhotos() {
  return client.fetch(`
    *[_type == "photo" && isFeature == true] {
      _id, title,
      image { ..., asset->{ url } },
      album
    }
  `);
}

/** Single photo by Sanity document _id — used by GET /api/photos/:id route. */
export async function getPhotoById(id) {
  const item = await client.fetch(
    `*[_type == "photo" && _id == $id][0] {
      _id, title,
      image { ..., asset->{ url } },
      album, dateTaken, description, isFeature
    }`,
    { id },
  );
  return item ?? null;
}
