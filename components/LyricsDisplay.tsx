"use client";

import { useState } from "react";
import { translations, type Locale } from "@/lib/i18n";
import { useOscarVoice } from "@/hooks/useOscarVoice";
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
  const { speak, stop, isLoading, isPlaying } = useOscarVoice();

  if (!result) return null;

  async function handleCopy() {
    if (!result?.lyrics) return;
    await navigator.clipboard.writeText(result.lyrics);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Entry point 1 — error: not found
  if (result.error === "not_found") {
    return (
      <div className="mt-6 flex items-start gap-3 bg-[#1a1d27] border border-red-900/40 rounded-xl p-5">
        <span className="text-red-400 text-xl mt-0.5">⚠</span>
        <p className="text-red-300 flex-1">{t.notFound}</p>
        <SpeakButton
          label={t.speakMessage}
          stopLabel={t.stopSpeaking}
          loadingLabel={t.ttsLoading}
          isLoading={isLoading}
          isPlaying={isPlaying}
          onClick={() => (isLoading || isPlaying ? stop() : speak(t.notFound))}
        />
      </div>
    );
  }

  // Entry point 2 — error: generic
  if (result.error === "generic") {
    return (
      <div className="mt-6 flex items-start gap-3 bg-[#1a1d27] border border-yellow-900/40 rounded-xl p-5">
        <span className="text-yellow-400 text-xl mt-0.5">⚠</span>
        <p className="text-yellow-300 flex-1">{t.errorGeneric}</p>
        <SpeakButton
          label={t.speakMessage}
          stopLabel={t.stopSpeaking}
          loadingLabel={t.ttsLoading}
          isLoading={isLoading}
          isPlaying={isPlaying}
          onClick={() =>
            isLoading || isPlaying ? stop() : speak(t.errorGeneric)
          }
        />
      </div>
    );
  }

  // Entry point 3 — lyrics found: speak button reads the full lyrics
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
        <div className="flex items-center gap-2">
          {/* Speak button — min 44×44px for accessibility */}
          <SpeakButton
            label={t.speakLyrics}
            stopLabel={t.stopSpeaking}
            loadingLabel={t.ttsLoading}
            isLoading={isLoading}
            isPlaying={isPlaying}
            onClick={() =>
              isLoading || isPlaying
                ? stop()
                : speak(result.lyrics ?? "")
            }
            showLabel
          />

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
      </div>

      {/* Lyrics */}
      <div className="px-5 py-5 max-h-[60vh] overflow-y-auto">
        <pre className="lyrics-text text-slate-300 font-sans">
          {result.lyrics}
        </pre>
      </div>
    </div>
  );
}

interface SpeakButtonProps {
  label: string;
  stopLabel: string;
  loadingLabel: string;
  isLoading: boolean;
  isPlaying: boolean;
  onClick: () => void;
  showLabel?: boolean;
}

function SpeakButton({
  label,
  stopLabel,
  loadingLabel,
  isLoading,
  isPlaying,
  onClick,
  showLabel = false,
}: SpeakButtonProps) {
  const active = isLoading || isPlaying;

  return (
    <button
      onClick={onClick}
      title={isLoading ? loadingLabel : isPlaying ? stopLabel : label}
      aria-label={isLoading ? loadingLabel : isPlaying ? stopLabel : label}
      className={`flex items-center gap-2 min-w-[44px] min-h-[44px] px-3 rounded-lg text-sm font-medium transition border ${
        active
          ? "bg-violet-700/30 text-violet-300 border-violet-700/40 hover:bg-violet-700/40"
          : "bg-[#252836] hover:bg-[#2e3347] text-slate-300 border-[#2e3347]"
      }`}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin inline-block" />
      ) : isPlaying ? (
        <StopIcon />
      ) : (
        <SpeakerIcon />
      )}
      {showLabel && (
        <span className="hidden sm:inline">
          {isLoading ? loadingLabel : isPlaying ? stopLabel : label}
        </span>
      )}
    </button>
  );
}

function SpeakerIcon() {
  return (
    <svg
      className="w-4 h-4 shrink-0"
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg
      className="w-4 h-4 shrink-0"
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M6 6h12v12H6z" />
    </svg>
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
