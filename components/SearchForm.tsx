"use client";

import { FormEvent, useState, useEffect, useRef } from "react";
import { translations, type Locale } from "@/lib/i18n";
import { searchSuggestions } from "@/lib/lyrics";
import type { SuggestionResult } from "@/lib/types";

interface SearchFormProps {
  locale: Locale;
  onSearch: (artist: string, title: string) => void;
  isLoading: boolean;
  initialQuery?: string;
}

export default function SearchForm({
  locale,
  onSearch,
  isLoading,
  initialQuery = "",
}: SearchFormProps) {
  const t = translations[locale];
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<SuggestionResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced suggestion search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchSuggestions(trimmed);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setIsSearching(false);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    // If there are suggestions, pick the first one
    if (suggestions.length > 0) {
      handleSelectSuggestion(suggestions[0]);
    }
  }

  function handleSelectSuggestion(s: SuggestionResult) {
    setShowSuggestions(false);
    setQuery(`${s.artist} - ${s.title}`);
    onSearch(s.artist, s.title);
  }

  function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="flex gap-3 w-full">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-[#1a1d27] border border-[#2e3347] rounded-xl px-4 py-3 pl-11 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
          />
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="px-6 py-3 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition whitespace-nowrap"
        >
          {isLoading ? t.searching : t.searchButton}
        </button>
      </form>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-2 w-full bg-[#1a1d27] border border-[#2e3347] rounded-xl shadow-2xl overflow-hidden">
          <p className="px-4 py-2 text-xs uppercase tracking-widest text-slate-500 font-semibold border-b border-[#2e3347]">
            {t.suggestionsTitle}
          </p>
          <ul className="max-h-80 overflow-y-auto">
            {suggestions.map((s, i) => (
              <li key={`${s.artist}-${s.title}-${i}`}>
                <button
                  type="button"
                  onClick={() => handleSelectSuggestion(s)}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[#252836] transition border-b border-[#1e2130] last:border-0"
                >
                  {s.albumCover ? (
                    <img
                      src={s.albumCover}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[#2e3347] flex items-center justify-center shrink-0">
                      <NoteIcon />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-200 truncate">
                      {s.title}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{s.artist}</p>
                  </div>
                  {s.duration > 0 && (
                    <span className="text-xs text-slate-600 shrink-0">
                      {formatDuration(s.duration)}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" strokeWidth={2} />
      <path d="m21 21-4.35-4.35" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M9 3v10.55A4 4 0 1 0 11 17V7h4V3H9z" />
    </svg>
  );
}
