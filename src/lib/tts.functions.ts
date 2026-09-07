import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * runFishAudioTTS — Fish Audio Text-to-Speech server function.
 * Uses Fish Audio exclusively (model: s2.1-pro-free) with the clinic's Fish Audio key.
 * Returns base64-encoded audio (mp3).
 */
export const runFishAudioTTS = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        text: z.string().max(4000),
        apiKey: z.string(),
        voiceId: z.string().optional(),
        format: z.enum(["mp3", "wav", "opus"]).default("mp3"),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const voiceId = data.voiceId?.trim() || undefined;

    const body: Record<string, unknown> = {
      text: data.text,
      chunk_length: 200,
      format: data.format,
      mp3_bitrate: 128,
      normalize: true,
      latency: "balanced",
      model_id: "s2.1-pro-free",
    };
    if (voiceId) {
      body.reference_id = voiceId;
    }

    const res = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${data.apiKey.trim()}`,
        "Content-Type": "application/json",
        model: "s2.1-pro-free",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      let detail = errText.slice(0, 200);
      try {
        const j = JSON.parse(errText) as { message?: string };
        detail = j.message ?? detail;
      } catch {}
      throw new Error(`Fish Audio (${res.status}): ${detail}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return { audioDataUrl: `data:audio/mpeg;base64,${base64}`, provider: "fish_audio" };
  });

export const runVoiceTTS = runFishAudioTTS;
