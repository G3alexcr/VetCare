import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * runVoiceTTS — Multi-provider Text-to-Speech server function:
 * 1. Fish Audio (if configured and has credits)
 * 2. OpenAI TTS-1 (ultra-realistic human voice, using the clinic's OpenAI API key)
 * Returns base64-encoded audio (mp3).
 */
export const runVoiceTTS = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        text: z.string().max(4000),
        fishApiKey: z.string().optional(),
        fishVoiceId: z.string().optional(),
        openAiApiKey: z.string().optional(),
        openAiVoice: z.enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]).default("nova"),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    // 1. Intentar Fish Audio si hay clave configurada
    if (data.fishApiKey?.trim()) {
      try {
        const voiceId = data.fishVoiceId?.trim() || undefined;
        const body: Record<string, unknown> = {
          text: data.text,
          chunk_length: 200,
          format: "mp3",
          mp3_bitrate: 128,
          normalize: true,
          latency: "balanced",
        };
        if (voiceId) {
          body.reference_id = voiceId;
        }

        const res = await fetch("https://api.fish.audio/v1/tts", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${data.fishApiKey.trim()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString("base64");
          return { audioDataUrl: `data:audio/mpeg;base64,${base64}`, provider: "fish_audio" };
        } else {
          const errText = await res.text().catch(() => "");
          console.warn("Fish Audio returned error, falling back to OpenAI TTS:", res.status, errText);
        }
      } catch (err) {
        console.warn("Fish Audio fetch error, falling back:", err);
      }
    }

    // 2. Fallback a OpenAI TTS (tts-1) si hay clave de OpenAI
    if (data.openAiApiKey?.trim()) {
      const res = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${data.openAiApiKey.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "tts-1",
          input: data.text.slice(0, 4000),
          voice: data.openAiVoice,
          response_format: "mp3",
        }),
      });

      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        return { audioDataUrl: `data:audio/mpeg;base64,${base64}`, provider: "openai" };
      } else {
        const errText = await res.text().catch(() => "");
        throw new Error(`Error de voz OpenAI (${res.status}): ${errText}`);
      }
    }

    throw new Error("No hay proveedor de voz configurado con saldo activo.");
  });

// Mantener compatibilidad hacia atrás
export const runFishAudioTTS = runVoiceTTS;
