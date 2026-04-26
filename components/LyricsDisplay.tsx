"use client";

import { useState } from "react";
import { translations, type Locale } from "@/lib/i18n";
import type { LyricsResult } from "@/lib/types";

interface LyricsDisplayProps {
  locale: Locale;
  result: LyricsResult | null;
  artist: string;
  title: string;
}

export default function LyricsDisplay({
  locale,
  result,
  artist,
  title,
}: LyricsDisplayProps) {
  const t = translations[locale];
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  async function handleCopy() {
    if (!result?.lyrics) return;
    await navigator.clipboard.writeText(result.lyrics);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (result.error === "not_found") {
    return (
      <div className="mt-6 flex items-start gap-3 bg-[#1a1d27] border border-red-900/40 rounded-xl p-5">
        <span className="text-red-400 text-xl mt-0.5">⚠</span>
        <p className="text-red-300">{t.notFound}</p>
      </div>
    );
  }

  if (result.error === "generic") {
    return (
      <div className="mt-6 flex items-start gap-3 bg-[#1a1d27] border border-yellow-900/40 rounded-xl p-5">
        <span className="text-yellow-400 text-xl mt-0.5">⚠</span>
        <p className="text-yellow-300">{t.errorGeneric}</p>
      </div>
    );
  }

  return (
    <div className="mt-6 bg-[#1a1d27] border border-[#2e3347] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#2e3347]">
        <div>
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-0.5">
            {artist}
          </p>
          <h2 className="text-white font-semibold text-lg leading-tight">
            {title}
          </h2>
        </div>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            copied
              ? "bg-green-700/30 text-green-400 border border-green-700/40"
              : "bg-[#252836] hover:bg-[#2e3347] text-slate-300 border border-[#2e3347]"
          }`}
        >
          {copied ? (
            <>
              <CheckIcon />
              {t.copied}
            </>
          ) : (
            <>
              <CopyIcon />
              {t.copyButton}
            </>
          )}
        </button>
      </div>

      {/* Lyrics */}
      <div className="px-5 py-5 max-h-[60vh] overflow-y-auto">
        <pre className="lyrics-text text-slate-300 font-sans">{result.lyrics}</pre>
      </div>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth={2} />
      <path
        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
        strokeWidth={2}
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <polyline points="20 6 9 17 4 12" strokeWidth={2} />
    </svg>
  );
}
