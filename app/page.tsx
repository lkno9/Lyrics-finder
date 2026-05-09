"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SearchForm from "@/components/SearchForm";
import LyricsDisplay from "@/components/LyricsDisplay";
import HistorySidebar from "@/components/HistorySidebar";
import { translations, type Locale } from "@/lib/i18n";
import { fetchLyrics } from "@/lib/lyrics";
import type { LyricsResult, SearchEntry } from "@/lib/types";

const HISTORY_KEY = "lyricsfind_history";
const MAX_HISTORY = 30;

export default function Home() {
  const [locale, setLocale] = useState<Locale>("fr");
  const t = translations[locale];

  const [artist, setArtist] = useState("");
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LyricsResult | null>(null);
  const [history, setHistory] = useState<SearchEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<{
    artist: string;
    title: string;
  } | null>(null);

  const [initialQuery, setInitialQuery] = useState("");
  const [formKey, setFormKey] = useState(0);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  function persistHistory(entries: SearchEntry[]) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
    } catch {}
  }

  function addToHistory(a: string, ti: string) {
    setHistory((prev) => {
      const filtered = prev.filter(
        (e) =>
          !(
            e.artist.toLowerCase() === a.toLowerCase() &&
            e.title.toLowerCase() === ti.toLowerCase()
          )
      );
      const next = [
        { artist: a, title: ti, timestamp: Date.now() },
        ...filtered,
      ].slice(0, MAX_HISTORY);
      persistHistory(next);
      return next;
    });
  }

  const handleSearch = useCallback(async (a: string, ti: string) => {
    setArtist(a);
    setTitle(ti);
    setActiveEntry({ artist: a, title: ti });
    setIsLoading(true);
    setResult(null);

    const data = await fetchLyrics(a, ti);
    setResult(data);
    setIsLoading(false);

    if (!data.error) {
      addToHistory(a, ti);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleHistorySelect(a: string, ti: string) {
    setInitialQuery(`${a} - ${ti}`);
    setFormKey((k) => k + 1);
    handleSearch(a, ti);
  }

  function handleClearHistory() {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {}
  }

  function toggleLocale() {
    setLocale((l) => (l === "fr" ? "en" : "fr"));
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="border-b border-[#1e2130] px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
            <MusicIcon />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">
              {t.appTitle}
            </h1>
            <p className="text-slate-500 text-xs mt-0.5 hidden sm:block">
              {t.appSubtitle}
            </p>
          </div>
        </div>
        <button
          onClick={toggleLocale}
          className="text-xs font-semibold text-slate-400 hover:text-white border border-[#2e3347] hover:border-slate-500 rounded-lg px-3 py-1.5 transition"
        >
          {t.languageToggle}
        </button>
      </header>

      {/* Main layout */}
      <div className="flex flex-col lg:flex-row flex-1 gap-0">
        {/* Sidebar */}
        <div className="order-2 lg:order-1 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto p-4 sm:p-6 lg:pr-0 lg:w-72 xl:w-80 shrink-0">
          <HistorySidebar
            locale={locale}
            history={history}
            activeEntry={activeEntry}
            onSelect={handleHistorySelect}
            onClear={handleClearHistory}
          />
        </div>

        {/* Content */}
        <main className="order-1 lg:order-2 flex-1 p-4 sm:p-6 lg:pl-6 min-w-0">
          <div className="max-w-3xl">
            <SearchForm
              key={formKey}
              locale={locale}
              onSearch={handleSearch}
              isLoading={isLoading}
              initialQuery={initialQuery}
            />

            {/* Loading state */}
            {isLoading && (
              <div className="mt-6 bg-[#1a1d27] border border-[#2e3347] rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-violet-300 text-sm font-medium">
                    {locale === "fr"
                      ? "Recherche des paroles en cours…"
                      : "Searching for lyrics…"}
                  </p>
                </div>
                <div className="space-y-2.5 animate-pulse">
                  <div className="h-3 bg-[#2e3347] rounded w-2/3" />
                  <div className="h-3 bg-[#2e3347] rounded w-full" />
                  <div className="h-3 bg-[#2e3347] rounded w-5/6" />
                  <div className="h-3 bg-[#2e3347] rounded w-full" />
                  <div className="h-3 bg-[#2e3347] rounded w-3/4" />
                </div>
              </div>
            )}

            {/* Result */}
            {!isLoading && (
              <LyricsDisplay
                locale={locale}
                result={result}
                artist={artist}
                title={title}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function MusicIcon() {
  return (
    <svg
      className="w-4 h-4 text-white"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M9 3v10.55A4 4 0 1 0 11 17V7h4V3H9z" />
    </svg>
  );
}
