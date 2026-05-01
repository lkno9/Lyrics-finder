import type { LyricsResult, SuggestionResult } from "./types";

export async function fetchLyrics(
  artist: string,
  title: string
): Promise<LyricsResult> {
  try {
    const params = new URLSearchParams({ artist, title });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const res = await fetch(`/api/lyrics?${params}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { lyrics: null, error: "generic" };
    }

    const data = await res.json();

    if (!data.lyrics) {
      return { lyrics: null, error: data.error || "not_found" };
    }

    return { lyrics: data.lyrics, error: null };
  } catch {
    return { lyrics: null, error: "generic" };
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
