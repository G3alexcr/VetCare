import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  renderConsultationEmailHtml,
  renderAppointmentEmailHtml,
  type ConsultationEmailData,
  type AppointmentEmailData,
} from "./email-templates";

const resendApiKey = (customKey?: string) => customKey?.trim() || process.env["RESEND_API_KEY"];

export const sendConsultationEmailFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        clientName: z.string(),
        clientEmail: z.string().email(),
        petName: z.string(),
        petSpecies: z.string().optional(),
        petBreed: z.string().optional(),
        vetName: z.string().optional(),
        date: z.string(),
        time: z.string().optional(),
        diagnosis: z.string(),
        treatment: z.string(),
        medications: z.string().optional(),
        weight: z.number().optional(),
        temperature: z.number().optional(),
        notes: z.string().optional(),
        clinicName: z.string().optional(),
        clinicPhone: z.string().optional(),
        portalUrl: z.string().optional(),
        // Per-clinic email integration
        apiKey: z.string().optional(),
        fromEmail: z.string().optional(),
        fromName: z.string().optional(),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const html = renderConsultationEmailHtml(data as ConsultationEmailData);
    const apiKey = resendApiKey(data.apiKey);

    if (!apiKey) {
      console.warn("[email] RESEND_API_KEY no configurada. Simulación de envío exitosa.");
      return {
        success: true,
        mocked: true,
        message: "Correo generado con éxito (configura la API Key en Configuración > Correos)",
        html,
      };
    }

    try {
      const senderName = data.fromName?.trim() || data.clinicName || "VetCare";
      const senderEmail = data.fromEmail?.trim() || "onboarding@resend.dev";
      const from = `${senderName} <${senderEmail}>`;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [data.clientEmail],
          subject: `📋 Resumen Clínico: Atención de ${data.petName} — ${senderName}`,
          html,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error("[email] Error en Resend:", res.status, errText);
        return {
          success: false,
          error: `Resend error (${res.status}): ${errText}`,
          html,
        };
      }

      const resData = (await res.json().catch(() => ({}))) as { id?: string };
      return {
        success: true,
        id: resData.id,
        html,
      };
    } catch (err: any) {
      console.error("[email] Error enviando correo:", err);
      return {
        success: false,
        error: err?.message || "Error al conectar con servidor de correos",
        html,
      };
    }
  });

export const sendAppointmentEmailFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        clientName: z.string(),
        clientEmail: z.string().email(),
        petName: z.string(),
        petSpecies: z.string().optional(),
        petBreed: z.string().optional(),
        vetName: z.string().optional(),
        date: z.string(),
        time: z.string(),
        reason: z.string(),
        clinicName: z.string().optional(),
        clinicAddress: z.string().optional(),
        clinicPhone: z.string().optional(),
        portalUrl: z.string().optional(),
        // Per-clinic email integration
        apiKey: z.string().optional(),
        fromEmail: z.string().optional(),
        fromName: z.string().optional(),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const html = renderAppointmentEmailHtml(data as AppointmentEmailData);
    const apiKey = resendApiKey(data.apiKey);

    if (!apiKey) {
      console.warn("[email] RESEND_API_KEY no configurada. Simulación de envío exitosa.");
      return {
        success: true,
        mocked: true,
        message: "Correo de cita generado con éxito",
        html,
      };
    }

    try {
      const senderName = data.fromName?.trim() || data.clinicName || "VetCare";
      const senderEmail = data.fromEmail?.trim() || "onboarding@resend.dev";
      const from = `${senderName} <${senderEmail}>`;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [data.clientEmail],
          subject: `📅 Cita Confirmada para ${data.petName} — ${senderName}`,
          html,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        return {
          success: false,
          error: `Resend error (${res.status}): ${errText}`,
          html,
        };
      }

      const resData = (await res.json().catch(() => ({}))) as { id?: string };
      return {
        success: true,
        id: resData.id,
        html,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Error al conectar con servidor de correos",
        html,
      };
    }
  });

export const sendTestEmailFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        toEmail: z.string().email(),
        apiKey: z.string().optional(),
        fromEmail: z.string().optional(),
        fromName: z.string().optional(),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const key = resendApiKey(data.apiKey);
    if (!key) {
      return {
        success: false,
        error: "Debes ingresar una clave API de Resend (empieza por re_...)",
      };
    }

    const senderName = data.fromName?.trim() || "VetCare";
    const senderEmail = data.fromEmail?.trim() || "onboarding@resend.dev";
    const from = `${senderName} <${senderEmail}>`;

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [data.toEmail],
          subject: `✓ Prueba de Conexión Exitosa — ${senderName}`,
          html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px 24px; background: #0b111e; color: #ffffff; border-radius: 16px; max-width: 500px; margin: 0 auto; border: 1px solid #1e293b;">
            <div style="font-size: 28px; margin-bottom: 12px;">🐾</div>
            <h2 style="color: #10b981; margin: 0 0 12px 0;">¡Conexión de Correo Exitosa!</h2>
            <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
              Este es un correo de prueba enviado desde el módulo de <strong>Configuración de la Clínica</strong> en <strong>${senderName}</strong>.
            </p>
            <div style="background: #151f32; border: 1px solid #23334d; border-radius: 10px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; font-size: 13px; color: #38bdf8;">✓ Resend API Key conectada y verificada</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">Remitente: ${from}</p>
            </div>
            <p style="color: #64748b; font-size: 11px; margin: 20px 0 0 0;">
              Enviado el ${new Date().toLocaleString()} a ${data.toEmail}
            </p>
          </div>`,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error("[email test] Resend error:", res.status, errText);
        return {
          success: false,
          error: `Error de Resend (${res.status}): ${errText}`,
        };
      }

      return {
        success: true,
        message: `✓ ¡Correo de prueba entregado con éxito a ${data.toEmail}!`,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Error al conectar con los servidores de Resend",
      };
    }
  });
