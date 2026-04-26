"use client";

import { translations, type Locale } from "@/lib/i18n";
import type { SearchEntry } from "@/lib/types";

interface HistorySidebarProps {
  locale: Locale;
  history: SearchEntry[];
  activeEntry: { artist: string; title: string } | null;
  onSelect: (artist: string, title: string) => void;
  onClear: () => void;
}

export default function HistorySidebar({
  locale,
  history,
  activeEntry,
  onSelect,
  onClear,
}: HistorySidebarProps) {
  const t = translations[locale];

  return (
    <aside className="w-full lg:w-64 xl:w-72 shrink-0">
      <div className="bg-[#13151f] border border-[#2e3347] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2e3347]">
          <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
            {t.historyTitle}
          </span>
          {history.length > 0 && (
            <button
              onClick={onClear}
              className="text-xs text-slate-500 hover:text-slate-300 transition"
            >
              {t.clearHistory}
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
          {history.length === 0 ? (
            <p className="px-4 py-5 text-slate-500 text-sm text-center">
              {t.historyEmpty}
            </p>
          ) : (
            <ul>
              {history.map((entry) => {
                const isActive =
                  activeEntry?.artist === entry.artist &&
                  activeEntry?.title === entry.title;
                return (
                  <li key={`${entry.artist}-${entry.title}-${entry.timestamp}`}>
                    <button
                      onClick={() => onSelect(entry.artist, entry.title)}
                      className={`w-full text-left px-4 py-3 border-b border-[#1e2130] last:border-0 transition group ${
                        isActive
                          ? "bg-violet-900/30"
                          : "hover:bg-[#1a1d27]"
                      }`}
                    >
                      <p
                        className={`text-sm font-medium truncate ${
                          isActive ? "text-violet-300" : "text-slate-300 group-hover:text-white"
                        }`}
                      >
                        {entry.title}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {entry.artist}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}
