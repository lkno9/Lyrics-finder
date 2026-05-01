import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const artist = searchParams.get("artist") || "";
  const title = searchParams.get("title") || "";

  if (!artist && !title) {
    return NextResponse.json({ lyrics: null, error: "missing_params" }, { status: 400 });
  }

  // Run all sources in parallel, return the first one that succeeds
  const result = await findLyrics(artist, title);
  return NextResponse.json(result);
}

async function findLyrics(artist: string, title: string): Promise<{ lyrics: string | null; error: string | null; source?: string }> {
  const cleaned = {
    artist: cleanForSearch(artist),
    title: cleanForSearch(title),
  };

  // Phase 1: all fast sources + Genius in parallel
  const sources = [
    tryLrclib(artist, title).then(tag("lrclib")),
    tryLrclib(cleaned.artist, cleaned.title).then(tag("lrclib-clean")),
    tryLyricsOvh(artist, title).then(tag("lyrics.ovh")),
    tryGenius(artist, title).then(tag("genius")),
    tryGenius(cleaned.artist, cleaned.title).then(tag("genius-clean")),
  ];

  const phase1 = await Promise.any(
    sources.map(p => p.then(r => r.lyrics ? r : Promise.reject()))
  ).catch(() => null);

  if (phase1?.lyrics) return phase1;

  // Phase 2: broader search
  const phase2Sources = [
    tryLrclibSearch(`${artist} ${title}`).then(tag("lrclib-search")),
    tryLrclibSearch(cleaned.title).then(tag("lrclib-title")),
    tryGeniusSearch(title).then(tag("genius-search")),
  ];

  const phase2 = await Promise.any(
    phase2Sources.map(p => p.then(r => r.lyrics ? r : Promise.reject()))
  ).catch(() => null);

  if (phase2?.lyrics) return phase2;

  return { lyrics: null, error: "not_found" };
}

function tag(source: string) {
  return (r: { lyrics: string | null; error: string | null }) => ({ ...r, source });
}

function cleanForSearch(text: string): string {
  return text
    .replace(/\s*[\(\[][^\)\]]*[\)\]]\s*/g, "")
    .replace(/\s*feat\.?\s*.*/i, "")
    .replace(/\s*ft\.?\s*.*/i, "")
    .trim();
}

// --- Genius ---

async function tryGenius(artist: string, title: string): Promise<{ lyrics: string | null; error: string | null }> {
  return tryGeniusSearch(`${artist} ${title}`);
}

async function tryGeniusSearch(query: string): Promise<{ lyrics: string | null; error: string | null }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    // Search using Genius internal API
    const searchUrl = `https://genius.com/api/search/multi?q=${encodeURIComponent(query)}`;
    const searchRes = await fetch(searchUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LyricsFind/1.0)" },
    });
    clearTimeout(timeout);

    if (!searchRes.ok) return empty();

    const searchData = await searchRes.json();
    const sections = searchData?.response?.sections || [];

    // Find song results
    let songUrl: string | null = null;
    for (const section of sections) {
      if (section.type === "song" && section.hits?.length > 0) {
        songUrl = section.hits[0]?.result?.url || null;
        break;
      }
    }
    // Fallback: check top_hits
    if (!songUrl) {
      for (const section of sections) {
        if (section.type === "top_hit" && section.hits?.length > 0) {
          for (const hit of section.hits) {
            if (hit.type === "song" && hit.result?.url) {
              songUrl = hit.result.url;
              break;
            }
          }
          if (songUrl) break;
        }
      }
    }

    if (!songUrl) return empty();

    // Fetch the Genius page and extract lyrics
    const controller2 = new AbortController();
    const timeout2 = setTimeout(() => controller2.abort(), 8000);

    const pageRes = await fetch(songUrl, {
      signal: controller2.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LyricsFind/1.0)" },
    });
    clearTimeout(timeout2);

    if (!pageRes.ok) return empty();

    const html = await pageRes.text();
    const lyrics = extractLyricsFromGenius(html);

    if (!lyrics) return empty();
    return { lyrics, error: null };
  } catch {
    return empty();
  }
}

function extractLyricsFromGenius(html: string): string | null {
  // Genius wraps lyrics in data-lyrics-container="true" divs
  const containerRegex = /data-lyrics-container="true"[^>]*>([\s\S]*?)(?=<\/div>)/gi;
  const parts: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = containerRegex.exec(html)) !== null) {
    parts.push(match[1]);
  }

  if (parts.length === 0) return null;

  let raw = parts.join("\n");

  // Convert <br> to newlines
  raw = raw.replace(/<br\s*\/?>/gi, "\n");
  // Remove all HTML tags
  raw = raw.replace(/<[^>]+>/g, "");
  // Decode common HTML entities
  raw = raw
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));

  const lyrics = raw.trim();
  return lyrics.length > 10 ? lyrics : null;
}

// --- lrclib ---

async function tryLrclib(artist: string, title: string): Promise<{ lyrics: string | null; error: string | null }> {
  try {
    const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return empty();

    const data = await res.json();
    const lyrics = data.plainLyrics || data.syncedLyrics || null;
    if (!lyrics || lyrics.trim() === "") return empty();

    const cleaned = lyrics.replace(/\[\d{2}:\d{2}\.\d{2,3}\]\s*/g, "");
    return { lyrics: cleaned, error: null };
  } catch {
    return empty();
  }
}

async function tryLrclibSearch(query: string): Promise<{ lyrics: string | null; error: string | null }> {
  try {
    const url = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return empty();

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return empty();

    for (const item of data) {
      const lyrics = item.plainLyrics || item.syncedLyrics || null;
      if (lyrics && lyrics.trim() !== "") {
        const cleaned = lyrics.replace(/\[\d{2}:\d{2}\.\d{2,3}\]\s*/g, "");
        return { lyrics: cleaned, error: null };
      }
    }
    return empty();
  } catch {
    return empty();
  }
}

// --- lyrics.ovh ---

async function tryLyricsOvh(artist: string, title: string): Promise<{ lyrics: string | null; error: string | null }> {
  try {
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return empty();

    const data = await res.json();
    if (!data.lyrics || data.lyrics.trim() === "") return empty();

    return { lyrics: data.lyrics, error: null };
  } catch {
    return empty();
  }
}

function empty() {
  return { lyrics: null, error: null };
}
