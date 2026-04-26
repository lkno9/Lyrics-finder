"use client";

import { FormEvent, useState } from "react";
import { translations, type Locale } from "@/lib/i18n";

interface SearchFormProps {
  locale: Locale;
  onSearch: (artist: string, title: string) => void;
  isLoading: boolean;
  initialArtist?: string;
  initialTitle?: string;
}

export default function SearchForm({
  locale,
  onSearch,
  isLoading,
  initialArtist = "",
  initialTitle = "",
}: SearchFormProps) {
  const t = translations[locale];
  const [artist, setArtist] = useState(initialArtist);
  const [title, setTitle] = useState(initialTitle);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const a = artist.trim();
    const ti = title.trim();
    if (a && ti) onSearch(a, ti);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-3 w-full"
    >
      <input
        type="text"
        value={artist}
        onChange={(e) => setArtist(e.target.value)}
        placeholder={t.artistPlaceholder}
        required
        className="flex-1 bg-[#1a1d27] border border-[#2e3347] rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
      />
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t.titlePlaceholder}
        required
        className="flex-1 bg-[#1a1d27] border border-[#2e3347] rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
      />
      <button
        type="submit"
        disabled={isLoading}
        className="px-6 py-3 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition whitespace-nowrap"
      >
        {isLoading ? t.searching : t.searchButton}
      </button>
    </form>
  );
}
