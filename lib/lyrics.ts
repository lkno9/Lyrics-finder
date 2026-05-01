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
  // Try with original names first, then cleaned versions
  const attempts = [
    { artist, title },
    { artist: cleanForSearch(artist), title: cleanForSearch(title) },
  ];

  for (const attempt of attempts) {
    if (!attempt.artist || !attempt.title) continue;

    // Try lyrics.ovh
    const ovhResult = await tryLyricsOvh(attempt.artist, attempt.title);
    if (ovhResult.lyrics) return ovhResult;

    // Try lrclib.net
    const lrclibResult = await tryLrclib(attempt.artist, attempt.title);
    if (lrclibResult.lyrics) return lrclibResult;
  }

  // Last resort: search lrclib by query
  const searchResult = await tryLrclibSearch(`${artist} ${title}`);
  if (searchResult.lyrics) return searchResult;

  return { lyrics: null, error: "not_found" };
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
