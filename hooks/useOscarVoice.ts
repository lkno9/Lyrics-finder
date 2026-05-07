"use client";

import { useCallback, useRef, useState } from "react";

// In-memory cache: text → blob object URL (lives for the session)
const audioCache = new Map<string, string>();

export interface OscarVoiceState {
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
  speak: (text: string) => Promise<void>;
  stop: () => void;
}

export function useOscarVoice(): OscarVoiceState {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onplay = null;
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }

    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!text?.trim()) return;

      // Toggle off if already active
      if (isLoading || isPlaying) {
        stop();
        return;
      }

      setError(null);
      setIsLoading(true);

      try {
        let objectUrl = audioCache.get(text);

        if (!objectUrl) {
          const controller = new AbortController();
          abortRef.current = controller;

          const res = await fetch("/api/speak", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
            signal: controller.signal,
          });

          if (!res.ok) {
            throw new Error(`TTS request failed (${res.status})`);
          }

          const blob = await res.blob();
          objectUrl = URL.createObjectURL(blob);
          audioCache.set(text, objectUrl);
          abortRef.current = null;
        }

        const audio = new Audio(objectUrl);
        audioRef.current = audio;

        audio.onplay = () => {
          setIsLoading(false);
          setIsPlaying(true);
        };
        audio.onended = () => {
          setIsPlaying(false);
          audioRef.current = null;
        };
        audio.onerror = () => {
          setIsPlaying(false);
          setIsLoading(false);
          setError("Audio playback failed");
          audioRef.current = null;
        };

        await audio.play();
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Intentionally stopped — not an error
        } else {
          setError("TTS unavailable");
        }
        setIsLoading(false);
        setIsPlaying(false);
      }
    },
    [isLoading, isPlaying, stop]
  );

  return { speak, stop, isLoading, isPlaying, error };
}
