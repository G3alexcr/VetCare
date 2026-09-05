import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// VetCare AI gateway configuration (server-only env vars):
//   AI_GATEWAY_URL — base URL of an OpenAI-compatible API
//                     (e.g. https://api.openai.com or any compatible gateway)
//   AI_API_KEY     — bearer token for that gateway
const gatewayBaseUrl = () => process.env["AI_GATEWAY_URL"]?.replace(/\/+$/, "");
const gatewayApiKey = () => process.env["AI_API_KEY"];

export const runVetCareAI = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        system: z.string(),
        prompt: z.string(),
        provider: z.enum(["openai", "gemini", "claude"]),
        temperature: z.number(),
        maxTokens: z.number(),
        attachments: z
          .array(
            z.object({
              name: z.string(),
              kind: z.enum(["image", "file"]),
              dataUrl: z.string(),
            })
          )
          .optional(),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const readGatewayError = async (res: Response): Promise<string> => {
      const body = await res.text().catch(() => "");
      let detail = body.slice(0, 400);
      try {
        const parsed = JSON.parse(body) as { error?: { message?: string }; message?: string };
        detail = parsed.error?.message ?? parsed.message ?? detail;
      } catch {
        /* keep raw body */
      }
      if (res.status === 429) return "Límite de solicitudes de IA alcanzado. Intenta de nuevo en unos minutos.";
      if (res.status === 401 || res.status === 403)
        return "Credenciales de IA inválidas. Revisa AI_GATEWAY_URL y AI_API_KEY en el entorno del servidor.";
      if (res.status === 402)
        return "Saldo o cuota de IA insuficiente. Revisa el plan de tu proveedor de IA.";
      return `Error del servicio de IA (${res.status}): ${detail || res.statusText}`;
    };

    const baseUrl = gatewayBaseUrl();
    const apiKey = gatewayApiKey();
    if (!baseUrl || !apiKey) {
      throw new Error(
        "El servicio de IA no está configurado (faltan AI_GATEWAY_URL / AI_API_KEY en el entorno del servidor)."
      );
    }

    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    // Claude se resuelve al mismo endpoint compatible con OpenAI.
    const provider = data.provider === "claude" ? "openai" : data.provider;

    if (provider === "gemini") {
      const content: unknown[] = [{ type: "text", text: data.prompt }];
      for (const att of data.attachments ?? []) {
        if (att.kind === "image") {
          content.push({ type: "image_url", image_url: { url: att.dataUrl } });
        } else {
          content.push({ type: "file", file: { filename: att.name, file_data: att.dataUrl } });
        }
      }
      const res = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          model: "google/gemini-3.6-flash",
          messages: [
            { role: "system", content: data.system },
            { role: "user", content },
          ],
          temperature: data.temperature,
          max_tokens: data.maxTokens,
        }),
      });
      if (!res.ok) throw new Error(await readGatewayError(res));
      const json = (await res.json()) as { choices?: Array<{ message?: { content?: unknown } }> };
      const text = json.choices?.[0]?.message?.content;
      const out = typeof text === "string" ? text : "";
      if (!out) throw new Error("La IA no devolvió contenido.");
      return { text: out };
    }

    // OpenAI → Responses API (siempre en streaming; se acumula en el servidor).
    const inputContent: unknown[] = [{ type: "input_text", text: data.prompt }];
    for (const att of data.attachments ?? []) {
      if (att.kind === "image") {
        inputContent.push({ type: "input_image", image_url: att.dataUrl });
      } else {
        inputContent.push({ type: "input_file", filename: att.name, file_data: att.dataUrl });
      }
    }
    const res = await fetch(`${baseUrl}/v1/responses`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        instructions: data.system,
        input: [{ role: "user", content: inputContent }],
        stream: true,
        reasoning: { effort: "low", summary: "auto" },
        max_output_tokens: data.maxTokens,
      }),
    });
    if (!res.ok) throw new Error(await readGatewayError(res));
    const reader = res.body?.getReader();
    if (!reader) throw new Error("Respuesta vacía del servicio de IA.");

    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload) as {
            type?: string;
            delta?: unknown;
            response?: { output_text?: unknown };
          };
          if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
            text += evt.delta;
          } else if (evt.type === "response.completed" && !text) {
            const out = evt.response?.output_text;
            if (typeof out === "string") text = out;
          }
        } catch {
          /* ignora eventos SSE mal formados */
        }
      }
    }
    if (!text) throw new Error("La IA no devolvió contenido.");
    return { text };
  });
