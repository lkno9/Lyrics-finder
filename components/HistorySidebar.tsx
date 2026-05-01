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

  function timeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return locale === "fr" ? "à l'instant" : "just now";
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}${locale === "fr" ? "j" : "d"}`;
  }

  return (
    <aside className="w-full shrink-0">
      <div className="bg-[#13151f] border border-[#2e3347] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2e3347]">
          <div className="flex items-center gap-2">
            <HistoryIcon />
            <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
              {t.historyTitle}
            </span>
            {history.length > 0 && (
              <span className="text-[10px] bg-violet-600/20 text-violet-400 font-bold px-1.5 py-0.5 rounded-full">
                {history.length}
              </span>
            )}
          </div>
          {history.length > 0 && (
            <button
              onClick={onClear}
              className="text-xs text-slate-500 hover:text-red-400 transition"
            >
              {t.clearHistory}
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
          {history.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#1a1d27] flex items-center justify-center">
                <EmptyIcon />
              </div>
              <p className="text-slate-500 text-sm">{t.historyEmpty}</p>
            </div>
          ) : (
            <ul className="py-1">
              {history.map((entry) => {
                const isActive =
                  activeEntry?.artist === entry.artist &&
                  activeEntry?.title === entry.title;
                return (
                  <li key={`${entry.artist}-${entry.title}-${entry.timestamp}`}>
                    <button
                      onClick={() => onSelect(entry.artist, entry.title)}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition group ${
                        isActive
                          ? "bg-violet-900/20 border-l-2 border-violet-500"
                          : "hover:bg-[#1a1d27] border-l-2 border-transparent"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? "bg-violet-600/30" : "bg-[#1e2130] group-hover:bg-[#252836]"
                      }`}>
                        <NoteSmallIcon isActive={isActive} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-medium truncate ${
                            isActive
                              ? "text-violet-300"
                              : "text-slate-300 group-hover:text-white"
                          }`}
                        >
                          {entry.title}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {entry.artist}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-600 shrink-0">
                        {timeAgo(entry.timestamp)}
                      </span>
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

function HistoryIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={2} />
      <polyline points="12 6 12 12 16 14" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

function EmptyIcon() {
  return (
    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M9 3v10.55A4 4 0 1 0 11 17V7h4V3H9z" fill="currentColor" opacity={0.3} />
      <path d="M9 3v10.55A4 4 0 1 0 11 17V7h4V3H9z" strokeWidth={1.5} />
    </svg>
  );
}

function NoteSmallIcon({ isActive }: { isActive: boolean }) {
  return (
    <svg className={`w-3.5 h-3.5 ${isActive ? "text-violet-400" : "text-slate-500"}`} fill="currentColor" viewBox="0 0 24 24">
      <path d="M9 3v10.55A4 4 0 1 0 11 17V7h4V3H9z" />
    </svg>
  );
}
