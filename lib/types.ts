export interface SearchEntry {
  artist: string;
  title: string;
  timestamp: number;
}

export interface LyricsResult {
  lyrics: string | null;
  error: "not_found" | "generic" | null;
}
