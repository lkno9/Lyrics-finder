import type { LyricsResult } from "./types";

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
