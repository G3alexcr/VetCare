import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  renderConsultationEmailHtml,
  renderAppointmentEmailHtml,
  type ConsultationEmailData,
  type AppointmentEmailData,
} from "./email-templates";

const resendApiKey = () => process.env["RESEND_API_KEY"];

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
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const html = renderConsultationEmailHtml(data as ConsultationEmailData);
    const apiKey = resendApiKey();

    if (!apiKey) {
      console.warn("[email] RESEND_API_KEY no configurada. Simulación de envío exitosa.");
      return {
        success: true,
        mocked: true,
        message: "Correo generado con éxito (configura RESEND_API_KEY en Vercel para despacho directo)",
        html,
      };
    }

    try {
      const clinic = data.clinicName || "VetCare";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${clinic} <onboarding@resend.dev>`,
          to: [data.clientEmail],
          subject: `📋 Resumen Clínico: Atención de ${data.petName} — ${clinic}`,
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
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const html = renderAppointmentEmailHtml(data as AppointmentEmailData);
    const apiKey = resendApiKey();

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
      const clinic = data.clinicName || "VetCare";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${clinic} <onboarding@resend.dev>`,
          to: [data.clientEmail],
          subject: `📅 Cita Confirmada para ${data.petName} — ${clinic}`,
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
