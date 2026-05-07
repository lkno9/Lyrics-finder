import { NextRequest, NextResponse } from "next/server";

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? "59dhv4BKONM60oDSKECM";
const API_KEY = process.env.ELEVENLABS_API_KEY ?? "";
const MAX_TEXT_LENGTH = 5000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text: unknown = body?.text;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "Invalid text" }, { status: 400 });
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Text too long (max ${MAX_TEXT_LENGTH} characters)` },
        { status: 400 }
      );
    }

    if (!API_KEY) {
      return NextResponse.json(
        { error: "ElevenLabs API key not configured" },
        { status: 503 }
      );
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": API_KEY,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: text.trim(),
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
        signal: AbortSignal.timeout(20000),
      }
    );

    if (!response.ok) {
      const status = response.status;
      if (status === 401) {
        return NextResponse.json({ error: "Invalid API key" }, { status: 502 });
      }
      if (status === 429) {
        return NextResponse.json(
          { error: "ElevenLabs quota exceeded" },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: `ElevenLabs error (${status})` },
        { status: 502 }
      );
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      return NextResponse.json({ error: "Request timed out" }, { status: 504 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
