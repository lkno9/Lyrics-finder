import type { LyricsResult, SuggestionResult } from "./types";

export async function fetchLyrics(
  artist: string,
  title: string
): Promise<LyricsResult> {
  try {
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
    const res = await fetch(url);

    if (res.status === 404) {
      return { lyrics: null, error: "not_found" };
    }

    if (!res.ok) {
      return { lyrics: null, error: "generic" };
    }

    const data = await res.json();

    if (!data.lyrics || data.lyrics.trim() === "") {
      return { lyrics: null, error: "not_found" };
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
