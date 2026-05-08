"use client";

import { useCallback, useEffect, useState } from "react";
import SearchForm from "@/components/SearchForm";
import LyricsDisplay from "@/components/LyricsDisplay";
import HistorySidebar from "@/components/HistorySidebar";
import { translations, type Locale } from "@/lib/i18n";
import { fetchLyrics } from "@/lib/lyrics";
import type { LyricsResult, SearchEntry } from "@/lib/types";

const HISTORY_KEY = "lyricsfind_history";
const MAX_HISTORY = 30;

// TODO: remplacer NEXT_PUBLIC_OSCAR_PHONE_NUMBER par le vrai numéro Twilio
// associé à l'agent ElevenLabs une fois disponible.
// La mécanique d'appel est prête.
const OSCAR_PHONE = process.env.NEXT_PUBLIC_OSCAR_PHONE_NUMBER ?? "";

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

  function handleCallOscar() {
    if (!OSCAR_PHONE || OSCAR_PHONE === "PENDING") {
      alert("Le numéro d'Oscar n'est pas encore configuré.");
      return;
    }
    window.location.href = `tel:${OSCAR_PHONE}`;
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
        <div className="flex items-center gap-3">
          {/* Phone button — calls Oscar via native dialer */}
          <div className="flex flex-col items-center gap-0.5">
            <button
              onClick={handleCallOscar}
              aria-label="Appeler Oscar"
              className="w-11 h-11 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white rounded-full flex items-center justify-center transition shadow-md"
            >
              <PhoneIcon />
            </button>
            <span className="text-green-400 font-medium" style={{ fontSize: "1rem" }}>
              Appeler Oscar
            </span>
          </div>

          <button
            onClick={toggleLocale}
            className="text-xs font-semibold text-slate-400 hover:text-white border border-[#2e3347] hover:border-slate-500 rounded-lg px-3 py-1.5 transition"
          >
            {t.languageToggle}
          </button>
        </div>
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

function PhoneIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24 11.47 11.47 0 0 0 3.58.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.58a1 1 0 0 1-.25 1.01L6.62 10.79z" />
    </svg>
  );
}
