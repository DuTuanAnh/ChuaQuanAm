import { createClient } from '@sanity/client';

/**
 * Read client — uses Sanity CDN, fast (cached at edge), Viewer-scope token.
 * Suitable for GET endpoints (posts, dharma, events, photos, registration counts).
 */
const readClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  useCdn: true,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN || undefined,
});

/**
 * Write client — bypasses CDN (writes must hit origin), requires Editor-scope
 * token. Used ONLY for creating registrations. Token must NEVER reach the
 * frontend — public submissions go through POST /api/registrations.
 */
const writeClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN || undefined,
});

// Existing code below uses `client` for reads — keep alias for compat.
const client = readClient;

export const isConfigured = () => Boolean(process.env.SANITY_PROJECT_ID);
export const isWriteConfigured = () => Boolean(process.env.SANITY_WRITE_TOKEN);

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

// ---------- Registrations (đăng ký khoá tu) ----------

/**
 * Fetch event + current registration count + capacity, used by
 * GET /api/events/:slug/capacity. Lets the frontend decide whether to show
 * the registration form, how many seats are left, or "đã đầy".
 *
 * Counts only registrations with status != 'cancelled' so cancelled people
 * free up a seat. `peopleSum` sums numberOfPeople (a registration of 3 takes
 * 3 seats), which is what chùa actually needs to plan cơm/chỗ ngồi.
 */
export async function getEventCapacity(slug) {
  return readClient.fetch(
    `*[_type == "event" && slug.current == $slug][0] {
      "eventId": _id,
      title,
      startDate,
      location,
      "maxAttendees": coalesce(maxAttendees, 0),
      "registrationsCount": count(*[_type == "registration" && event._ref == ^._id && status != "cancelled"]),
      "peopleSum": math::sum(*[_type == "registration" && event._ref == ^._id && status != "cancelled"].numberOfPeople)
    }`,
    { slug },
  );
}

/**
 * Create a new registration document. Throws if SANITY_WRITE_TOKEN is missing.
 *
 * Caller (the route) is responsible for validation (required fields, phone
 * format, numberOfPeople range, capacity check). This function trusts its
 * inputs — never expose it to user input without sanitization upstream.
 */
export async function createRegistration({
  eventId,
  fullName,
  phone,
  email,
  numberOfPeople,
  note,
}) {
  if (!isWriteConfigured()) {
    throw new Error(
      'Tính năng đăng ký chưa sẵn sàng — máy chủ chưa cấu hình SANITY_WRITE_TOKEN.',
    );
  }
  return writeClient.create({
    _type: 'registration',
    event: { _type: 'reference', _ref: eventId },
    fullName,
    phone,
    email: email || undefined,
    numberOfPeople,
    note: note || undefined,
    status: 'pending',
    submittedAt: new Date().toISOString(),
  });
}

/**
 * List all registrations for one event (admin / CSV export).
 * Sorted submittedAt asc so check-in order matches submission order.
 */
export async function getRegistrationsByEvent(eventId) {
  return readClient.fetch(
    `*[_type == "registration" && event._ref == $eventId] | order(submittedAt asc) {
      _id, fullName, phone, email, numberOfPeople, note, status, submittedAt, adminNote
    }`,
    { eventId },
  );
}
