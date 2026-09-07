import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * runFishAudioTTS — Fish Audio Text-to-Speech server function.
 * Returns base64-encoded audio (mp3) or an error.
 * The client falls back to browser SpeechSynthesis when no key is set or on error.
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
    };
    if (voiceId) {
      body.reference_id = voiceId;
    }

    const res = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${data.apiKey}`,
        "Content-Type": "application/json",
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
      if (res.status === 401 || res.status === 403)
        throw new Error("Fish Audio: API Key inválida. Verifica tu clave en Configuración.");
      if (res.status === 402)
        throw new Error("Fish Audio: Créditos insuficientes. Recarga en fish.audio.");
      if (res.status === 429)
        throw new Error("Fish Audio: Demasiadas solicitudes. Intenta en unos segundos.");
      throw new Error(`Fish Audio (${res.status}): ${detail}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType =
      data.format === "mp3" ? "audio/mpeg" : data.format === "wav" ? "audio/wav" : "audio/ogg";
    return { audioDataUrl: `data:${mimeType};base64,${base64}` };
  });
