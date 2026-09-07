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
        model: z.string().optional(),
        apiKey: z.string().optional(),
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
        return "Credenciales de IA inválidas. Revisa la API Key configurada.";
      if (res.status === 402)
        return "Saldo o cuota de IA insuficiente. Revisa el plan de tu proveedor de IA.";
      return `Error del servicio de IA (${res.status}): ${detail || res.statusText}`;
    };

    const effectiveApiKey = data.apiKey || gatewayApiKey();
    const effectiveBaseUrl = gatewayBaseUrl();

    // Si no hay ninguna clave ni gateway configurado, devolvemos una respuesta asistida estructurada
    if (!effectiveApiKey && !effectiveBaseUrl) {
      return {
        text: `### 🩺 Go2Vet AI (Asistencia Clínica Provisoria)
No se ha detectado una **API Key** configurada para esta clínica.

> [!TIP]
> Puedes configurar tu **API Key de OpenAI** (ej. \`sk-...\`) o **Google Gemini** directamente en la pestaña **⚙️ Configuración** del asistente lateral para respuestas 100% en vivo.

**Análisis preliminar de la solicitud:**
- **Consulta recibida:** *${data.prompt.slice(0, 150)}${data.prompt.length > 150 ? "..." : ""}*
- **Recomendación clínica estándar:** Verificar constantes fisiológicas (temperatura, frecuencia cardíaca/respiratoria, TLLC), revisar historial vacunal y considerar exámenes complementarios de hemograma y bioquímica sanguínea según el cuadro.

*⚠️ Esta información es orientativa y no reemplaza el criterio del médico veterinario tratante.*`
      };
    }

    const provider = data.provider === "claude" ? "openai" : data.provider;

    // 1. Google Gemini
    if (provider === "gemini") {
      if (!effectiveBaseUrl && effectiveApiKey) {
        let geminiModel = (data.model || "gemini-1.5-flash").trim().replace(/^google\//i, "");
        if (!geminiModel.startsWith("gemini-")) {
          geminiModel = "gemini-1.5-flash";
        }
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${effectiveApiKey}`;
        const parts: any[] = [{ text: `${data.system}\n\nUsuario:\n${data.prompt}` }];

        for (const att of data.attachments ?? []) {
          if (att.kind === "image" && att.dataUrl.includes(",")) {
            const [header, base64Data] = att.dataUrl.split(",");
            const mimeType = header.match(/:(.*?);/)?.[1] || "image/jpeg";
            parts.push({
              inline_data: {
                mime_type: mimeType,
                data: base64Data,
              },
            });
          }
        }

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              temperature: data.temperature,
              maxOutputTokens: data.maxTokens,
            },
          }),
        });

        if (!res.ok) throw new Error(await readGatewayError(res));
        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("Google Gemini no devolvió respuesta.");
        return { text };
      }

      const authHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${effectiveApiKey}`,
      };
      const content: unknown[] = [{ type: "text", text: data.prompt }];
      for (const att of data.attachments ?? []) {
        if (att.kind === "image") {
          content.push({ type: "image_url", image_url: { url: att.dataUrl } });
        } else {
          content.push({ type: "file", file: { filename: att.name, file_data: att.dataUrl } });
        }
      }
      const res = await fetch(`${effectiveBaseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          model: data.model || "google/gemini-2.0-flash",
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
      return { text: typeof text === "string" ? text : "" };
    }

    // 2. OpenAI
    const openAiUrl = effectiveBaseUrl ? `${effectiveBaseUrl}/v1/chat/completions` : "https://api.openai.com/v1/chat/completions";
    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${effectiveApiKey}`,
    };

    let targetModel = (data.model || "gpt-4o-mini").trim();
    if (!effectiveBaseUrl) {
      // Limpieza para OpenAI directo: eliminar prefijos como "openai/" y modelos no existentes
      targetModel = targetModel.replace(/^openai\//i, "");
      if (
        targetModel.includes("gpt-5") ||
        targetModel.includes("sol") ||
        (!targetModel.startsWith("gpt-") &&
          !targetModel.startsWith("o1") &&
          !targetModel.startsWith("o3") &&
          !targetModel.startsWith("chatgpt"))
      ) {
        targetModel = "gpt-4o-mini";
      }
    }

    const userContent: any[] = [{ type: "text", text: data.prompt }];
    for (const att of data.attachments ?? []) {
      if (att.kind === "image") {
        userContent.push({ type: "image_url", image_url: { url: att.dataUrl } });
      }
    }

    const res = await fetch(openAiUrl, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        model: targetModel,
        messages: [
          { role: "system", content: data.system },
          { role: "user", content: userContent },
        ],
        temperature: data.temperature,
        max_tokens: data.maxTokens,
      }),
    });

    if (!res.ok) throw new Error(await readGatewayError(res));
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: unknown } }> };
    const text = json.choices?.[0]?.message?.content;
    const out = typeof text === "string" ? text : "";
    if (!out) throw new Error("OpenAI no devolvió contenido.");
    return { text: out };
  });

export type StructuredConsultation = {
  reason: string;
  weight?: number;
  temperature?: number;
  diagnosis: string;
  treatment: string;
  medications: string;
  notes: string;
};

export const structureConsultationVoice = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        transcript: z.string(),
        petContext: z.string().optional(),
        provider: z.enum(["openai", "gemini", "claude"]).default("openai"),
        apiKey: z.string().optional(),
        model: z.string().optional(),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const system = `Eres un asistente clínico veterinario de élite. Tu trabajo es recibir la transcripción oral o dictado que un médico veterinario hace mientras examina a un paciente (o después de la consulta), y extraer y estructurar la información médica directamente para la historia clínica.
Debes responder EXCLUSIVAMENTE con un JSON válido (sin markdown, sin explicaciones, sin comillas invertidas) con las siguientes claves:
{
  "reason": "Motivo de la consulta (ej. 'Vómitos y decaimiento de 48h')",
  "weight": número o null si no se mencionó,
  "temperature": número o null si no se mencionó,
  "diagnosis": "Diagnóstico presuntivo o definitivo estructurado con terminología clínica",
  "treatment": "Procedimientos realizados o plan de tratamiento",
  "medications": "Medicamentos recetados con dosis y frecuencia",
  "notes": "Observaciones clínicas adicionales, constantes o recomendaciones de control"
}`;

    const prompt = `${data.petContext ? `Datos del paciente: ${data.petContext}\n\n` : ""}Dictado del veterinario:\n"${data.transcript}"\n\nGenera el JSON estructurado:`;

    const res = await runVetCareAI({
      data: {
        system,
        prompt,
        provider: data.provider,
        apiKey: data.apiKey,
        model: data.model,
        temperature: 0.1,
        maxTokens: 1024,
      },
    });

    let raw = res.text.trim();
    if (raw.startsWith("```json")) raw = raw.slice(7);
    if (raw.startsWith("```")) raw = raw.slice(3);
    if (raw.endsWith("```")) raw = raw.slice(0, -3);
    raw = raw.trim();

    try {
      const parsed = JSON.parse(raw) as Partial<StructuredConsultation>;
      return {
        success: true,
        data: {
          reason: String(parsed.reason ?? ""),
          weight: typeof parsed.weight === "number" ? parsed.weight : undefined,
          temperature: typeof parsed.temperature === "number" ? parsed.temperature : undefined,
          diagnosis: String(parsed.diagnosis ?? ""),
          treatment: String(parsed.treatment ?? ""),
          medications: String(parsed.medications ?? ""),
          notes: String(parsed.notes ?? ""),
        },
      };
    } catch (err) {
      console.error("Failed to parse structured JSON:", raw, err);
      return {
        success: false,
        raw,
        data: {
          reason: data.transcript.slice(0, 100),
          notes: data.transcript,
          diagnosis: "",
          treatment: "",
          medications: "",
        },
      };
    }
  });

