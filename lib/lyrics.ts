import type { LyricsResult, SuggestionResult } from "./types";

/**
 * Clean artist/title for better API matching
 */
function cleanForSearch(text: string): string {
  return text
    .replace(/\s*[\(\[][^\)\]]*[\)\]]\s*/g, "")
    .replace(/\s*feat\.?\s*.*/i, "")
    .replace(/\s*ft\.?\s*.*/i, "")
    .trim();
}

export async function fetchLyrics(
  artist: string,
  title: string
): Promise<LyricsResult> {
  const cleanedArtist = cleanForSearch(artist);
  const cleanedTitle = cleanForSearch(title);

  // Phase 1: Try all primary sources in parallel (fast)
  const phase1 = await Promise.any([
    tryLrclib(artist, title).then(r => r.lyrics ? r : Promise.reject()),
    tryLrclib(cleanedArtist, cleanedTitle).then(r => r.lyrics ? r : Promise.reject()),
    tryLyricsOvh(artist, title).then(r => r.lyrics ? r : Promise.reject()),
    tryLyricsOvh(cleanedArtist, cleanedTitle).then(r => r.lyrics ? r : Promise.reject()),
  ]).catch(() => null);

  if (phase1?.lyrics) return phase1;

  // Phase 2: Search-based fallback in parallel (still fast)
  const phase2 = await Promise.any([
    tryLrclibSearch(`${artist} ${title}`).then(r => r.lyrics ? r : Promise.reject()),
    tryLrclibSearch(cleanedTitle).then(r => r.lyrics ? r : Promise.reject()),
  ]).catch(() => null);

  if (phase2?.lyrics) return phase2;

  // Phase 3: Last resort - find original artist via suggestions
  const phase3 = await tryFindOriginalArtist(title);
  if (phase3.lyrics) return phase3;

  return { lyrics: null, error: "not_found" };
}

async function tryFindOriginalArtist(title: string): Promise<LyricsResult> {
  try {
    const cleaned = cleanForSearch(title);
    const url = `https://api.lyrics.ovh/suggest/${encodeURIComponent(cleaned)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return { lyrics: null, error: null };

    const data = await res.json();
    if (!data.data || !Array.isArray(data.data)) return { lyrics: null, error: null };

    // Try top 3 candidates in parallel
    const candidates = data.data.slice(0, 3);
    const attempts = candidates.flatMap((c: any) => {
      const a = c.artist?.name;
      const t = c.title;
      if (!a || !t) return [];
      return [
        tryLrclib(a, t).then(r => r.lyrics ? r : Promise.reject()),
        tryLyricsOvh(a, t).then(r => r.lyrics ? r : Promise.reject()),
      ];
    });

    if (attempts.length === 0) return { lyrics: null, error: null };

    const result = await Promise.any(attempts).catch(() => null);
    return result || { lyrics: null, error: null };
  } catch {
    return { lyrics: null, error: null };
  }
}

async function tryLyricsOvh(artist: string, title: string): Promise<LyricsResult> {
  try {
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

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
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return { lyrics: null, error: null };

    const data = await res.json();
    const lyrics = data.plainLyrics || data.syncedLyrics || null;
    if (!lyrics || lyrics.trim() === "") {
      return { lyrics: null, error: null };
    }

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
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return { lyrics: null, error: null };

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return { lyrics: null, error: null };
    }

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
