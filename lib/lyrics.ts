import type { LyricsResult, SuggestionResult } from "./types";

/**
 * Clean artist/title for better API matching:
 * - Remove "feat.", "ft.", featured artists in parentheses
 * - Remove content in parentheses/brackets (remix info, live, etc.)
 */
function cleanForSearch(text: string): string {
  return text
    .replace(/\s*[\(\[][^\)\]]*[\)\]]\s*/g, "") // remove (xxx) and [xxx]
    .replace(/\s*feat\.?\s*.*/i, "") // remove feat. and everything after
    .replace(/\s*ft\.?\s*.*/i, "") // remove ft. and everything after
    .trim();
}

export async function fetchLyrics(
  artist: string,
  title: string
): Promise<LyricsResult> {
  const cleanedArtist = cleanForSearch(artist);
  const cleanedTitle = cleanForSearch(title);

  // Build a list of attempts with different artist/title combos
  const attempts = [
    { artist, title },
    { artist: cleanedArtist, title: cleanedTitle },
  ];

  // Try each attempt with both APIs
  for (const attempt of attempts) {
    if (!attempt.artist || !attempt.title) continue;

    // Try lrclib first (more reliable)
    const lrclibResult = await tryLrclib(attempt.artist, attempt.title);
    if (lrclibResult.lyrics) return lrclibResult;

    // Try lyrics.ovh
    const ovhResult = await tryLyricsOvh(attempt.artist, attempt.title);
    if (ovhResult.lyrics) return ovhResult;
  }

  // Fallback: search lrclib with full query
  const searchResult = await tryLrclibSearch(`${artist} ${title}`);
  if (searchResult.lyrics) return searchResult;

  // Fallback: search lrclib with just the title (handles cover artists)
  const titleOnlyResult = await tryLrclibSearch(cleanedTitle);
  if (titleOnlyResult.lyrics) return titleOnlyResult;

  // Fallback: search lyrics.ovh suggestions to find original artist
  const originalArtistResult = await tryFindOriginalArtist(title);
  if (originalArtistResult.lyrics) return originalArtistResult;

  return { lyrics: null, error: "not_found" };
}

/**
 * Try to find lyrics by searching for the song title in suggestions
 * and attempting lyrics fetch with alternative artists found.
 */
async function tryFindOriginalArtist(title: string): Promise<LyricsResult> {
  try {
    const cleaned = cleanForSearch(title);
    const url = `https://api.lyrics.ovh/suggest/${encodeURIComponent(cleaned)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return { lyrics: null, error: null };

    const data = await res.json();
    if (!data.data || !Array.isArray(data.data)) return { lyrics: null, error: null };

    // Try the first 3 alternative artists
    const candidates = data.data.slice(0, 3);
    for (const candidate of candidates) {
      const altArtist = candidate.artist?.name;
      const altTitle = candidate.title;
      if (!altArtist || !altTitle) continue;

      const lrclibResult = await tryLrclib(altArtist, altTitle);
      if (lrclibResult.lyrics) return lrclibResult;

      const ovhResult = await tryLyricsOvh(altArtist, altTitle);
      if (ovhResult.lyrics) return ovhResult;
    }

    return { lyrics: null, error: null };
  } catch {
    return { lyrics: null, error: null };
  }
}

async function tryLyricsOvh(artist: string, title: string): Promise<LyricsResult> {
  try {
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return { lyrics: null, error: null };

    const data = await res.json();
    if (!data.lyrics || data.lyrics.trim() === "") {
      return { lyrics: null, error: null };
    }

    return { lyrics: data.lyrics, error: null };
  } catch {
    return { lyrics: null, error: null };
  }
}

async function tryLrclib(artist: string, title: string): Promise<LyricsResult> {
  try {
    const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return { lyrics: null, error: null };

    const data = await res.json();
    // Prefer plain lyrics, fallback to synced lyrics
    const lyrics = data.plainLyrics || data.syncedLyrics || null;
    if (!lyrics || lyrics.trim() === "") {
      return { lyrics: null, error: null };
    }

    // Clean synced lyrics (remove timestamps like [00:12.34])
    const cleaned = lyrics.replace(/\[\d{2}:\d{2}\.\d{2,3}\]\s*/g, "");
    return { lyrics: cleaned, error: null };
  } catch {
    return { lyrics: null, error: null };
  }
}

async function tryLrclibSearch(query: string): Promise<LyricsResult> {
  try {
    const url = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return { lyrics: null, error: null };

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return { lyrics: null, error: null };
    }

    // Take the first result with lyrics
    for (const item of data) {
      const lyrics = item.plainLyrics || item.syncedLyrics || null;
      if (lyrics && lyrics.trim() !== "") {
        const cleaned = lyrics.replace(/\[\d{2}:\d{2}\.\d{2,3}\]\s*/g, "");
        return { lyrics: cleaned, error: null };
      }
    }

    return { lyrics: null, error: null };
  } catch {
    return { lyrics: null, error: null };
  }
}

export async function searchSuggestions(
  query: string
): Promise<SuggestionResult[]> {
  try {
    const url = `https://api.lyrics.ovh/suggest/${encodeURIComponent(query)}`;
    const res = await fetch(url);

    if (!res.ok) return [];

    const data = await res.json();

    if (!data.data || !Array.isArray(data.data)) return [];

    return data.data.slice(0, 8).map((item: any) => ({
      artist: item.artist?.name || "Unknown",
      title: item.title || "Unknown",
      albumCover: item.album?.cover_small || null,
      duration: item.duration || 0,
    }));
  } catch {
    return [];
  }
}
