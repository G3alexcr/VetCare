export type ConsultationEmailData = {
  clientName: string;
  clientEmail: string;
  petName: string;
  petSpecies?: string;
  petBreed?: string;
  vetName?: string;
  date: string;
  time?: string;
  diagnosis: string;
  treatment: string;
  medications?: string;
  weight?: number;
  temperature?: number;
  notes?: string;
  clinicName?: string;
  clinicPhone?: string;
  portalUrl?: string;
};

export type AppointmentEmailData = {
  clientName: string;
  clientEmail: string;
  petName: string;
  petSpecies?: string;
  petBreed?: string;
  vetName?: string;
  date: string;
  time: string;
  reason: string;
  clinicName?: string;
  clinicAddress?: string;
  clinicPhone?: string;
  portalUrl?: string;
};

export function renderConsultationEmailHtml(data: ConsultationEmailData): string {
  const clinic = data.clinicName || "VetCare — Clínica Veterinaria";
  const portal = data.portalUrl || "https://app.go2vet.online/portal";
  const agendaUrl = `${portal}/agenda`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Resumen de Consulta Médica — ${data.petName}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #0b111e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <!-- Main Card Container (Dark modern card inspired by NexusSport) -->
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #151f32; border: 1px solid #23334d; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);" cellspacing="0" cellpadding="0">
          
          <!-- Header Logo -->
          <tr>
            <td style="padding: 32px 36px 12px 36px;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <div style="background: linear-gradient(135deg, #00c6ff, #0072ff); width: 36px; height: 36px; border-radius: 10px; display: inline-block; text-align: center; line-height: 36px; font-size: 20px;">
                      🐾
                    </div>
                  </td>
                  <td style="vertical-align: middle; padding-left: 12px;">
                    <span style="font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">${clinic}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Tag & Title -->
          <tr>
            <td style="padding: 12px 36px 0 36px;">
              <div style="display: inline-block; padding: 4px 12px; border-radius: 20px; background-color: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; font-size: 11px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase;">
                CONSULTA MÉDICA COMPLETADA
              </div>
              <h1 style="margin: 16px 0 8px 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                ¡Hola ${data.clientName}!
              </h1>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                La atención médica de <strong style="color: #ffffff;">${data.petName}</strong> ha concluido con éxito en <strong style="color: #ffffff;">${clinic}</strong>. Aquí tienes todos los detalles clínicos y el tratamiento indicado para su pronta recuperación.
              </p>
            </td>
          </tr>

          <!-- Inner Clinical Details Box -->
          <tr>
            <td style="padding: 24px 36px 12px 36px;">
              <table role="presentation" width="100%" style="background-color: #0f172a; border: 1px solid #1e2d4a; border-radius: 14px; padding: 20px;" cellspacing="0" cellpadding="0">
                
                <!-- Date -->
                <tr>
                  <td style="padding: 8px 12px; font-size: 13px; color: #94a3b8; width: 130px;">
                    📅 Fecha
                  </td>
                  <td style="padding: 8px 12px; font-size: 14px; color: #ffffff; font-weight: 700;">
                    ${data.date}${data.time ? ` · ${data.time}` : ""}
                  </td>
                </tr>

                <!-- Patient -->
                <tr>
                  <td style="padding: 8px 12px; font-size: 13px; color: #94a3b8; border-top: 1px solid #1e293b;">
                    🐾 Paciente
                  </td>
                  <td style="padding: 8px 12px; font-size: 14px; color: #ffffff; font-weight: 700; border-top: 1px solid #1e293b;">
                    ${data.petName} ${data.petSpecies ? `<span style="color: #38bdf8; font-weight: normal; font-size: 12px;">(${data.petSpecies}${data.petBreed ? ` · ${data.petBreed}` : ""})</span>` : ""}
                  </td>
                </tr>

                <!-- Veterinarian -->
                <tr>
                  <td style="padding: 8px 12px; font-size: 13px; color: #94a3b8; border-top: 1px solid #1e293b;">
                    🩺 Veterinario
                  </td>
                  <td style="padding: 8px 12px; font-size: 14px; color: #ffffff; font-weight: 700; border-top: 1px solid #1e293b;">
                    Dr(a). ${data.vetName || "Equipo Médico Veterinario"}
                  </td>
                </tr>

                <!-- Vitals -->
                ${(data.weight || data.temperature) ? `
                <tr>
                  <td style="padding: 8px 12px; font-size: 13px; color: #94a3b8; border-top: 1px solid #1e293b;">
                    ⚖️ Signos
                  </td>
                  <td style="padding: 8px 12px; font-size: 13px; color: #ffffff; font-weight: 600; border-top: 1px solid #1e293b;">
                    ${data.weight ? `Peso: <strong style="color: #38bdf8;">${data.weight} kg</strong>` : ""} ${data.temperature ? ` · T°: <strong style="color: #38bdf8;">${data.temperature} °C</strong>` : ""}
                  </td>
                </tr>
                ` : ""}

                <!-- Diagnosis -->
                <tr>
                  <td style="padding: 8px 12px; font-size: 13px; color: #94a3b8; border-top: 1px solid #1e293b; vertical-align: top;">
                    📋 Diagnóstico
                  </td>
                  <td style="padding: 8px 12px; font-size: 14px; color: #facc15; font-weight: 700; border-top: 1px solid #1e293b;">
                    ${data.diagnosis || "Control clínico general"}
                  </td>
                </tr>

                <!-- Treatment -->
                <tr>
                  <td style="padding: 8px 12px; font-size: 13px; color: #94a3b8; border-top: 1px solid #1e293b; vertical-align: top;">
                    💊 Tratamiento
                  </td>
                  <td style="padding: 8px 12px; font-size: 13px; color: #e2e8f0; line-height: 1.5; border-top: 1px solid #1e293b;">
                    ${data.treatment || "Seguir indicaciones médicas"}
                  </td>
                </tr>

                <!-- Medications -->
                ${data.medications ? `
                <tr>
                  <td style="padding: 8px 12px; font-size: 13px; color: #94a3b8; border-top: 1px solid #1e293b; vertical-align: top;">
                    💉 Medicamentos
                  </td>
                  <td style="padding: 8px 12px; font-size: 13px; color: #38bdf8; font-weight: 600; line-height: 1.5; border-top: 1px solid #1e293b;">
                    ${data.medications}
                  </td>
                </tr>
                ` : ""}

                <!-- Contact -->
                <tr>
                  <td style="padding: 8px 12px; font-size: 13px; color: #94a3b8; border-top: 1px solid #1e293b;">
                    👤 Tutor
                  </td>
                  <td style="padding: 8px 12px; font-size: 13px; color: #ffffff; border-top: 1px solid #1e293b;">
                    ${data.clientName} · <span style="color: #38bdf8;">${data.clientEmail}</span>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Call To Action Buttons -->
          <tr>
            <td style="padding: 24px 36px 16px 36px; text-align: center;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="padding: 0 6px;">
                    <a href="${portal}" target="_blank" style="background-color: #10b981; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 22px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                      Ver Carnet y Receta Digital
                    </a>
                  </td>
                  <td style="padding: 0 6px;">
                    <a href="${agendaUrl}" target="_blank" style="background-color: #1e293b; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; padding: 12px 22px; border-radius: 10px; display: inline-block; border: 1px solid #334155;">
                      Agendar Próximo Control
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Information note -->
          <tr>
            <td style="padding: 8px 36px 28px 36px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                Recuerda que puedes consultar todo el historial de vacunas, peso y exámenes de <strong style="color: #94a3b8;">${data.petName}</strong> desde tu Portal de Clientes en cualquier momento.
              </p>
            </td>
          </tr>

          <!-- Footer Bar -->
          <tr>
            <td style="background-color: #0c1220; padding: 20px 36px; border-top: 1px solid #1a263c; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                ${clinic} · Impulsado por <strong style="color: #38bdf8;">Go2Vet</strong>
              </p>
              ${data.clinicPhone ? `
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #475569;">
                Teléfono de atención / Urgencias: ${data.clinicPhone}
              </p>
              ` : ""}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderAppointmentEmailHtml(data: AppointmentEmailData): string {
  const clinic = data.clinicName || "VetCare — Clínica Veterinaria";
  const portal = data.portalUrl || "https://app.go2vet.online/portal";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cita Confirmada — ${data.petName}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #0b111e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #151f32; border: 1px solid #23334d; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);" cellspacing="0" cellpadding="0">
          
          <!-- Header Logo -->
          <tr>
            <td style="padding: 32px 36px 12px 36px;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <div style="background: linear-gradient(135deg, #10b981, #059669); width: 36px; height: 36px; border-radius: 10px; display: inline-block; text-align: center; line-height: 36px; font-size: 20px;">
                      📅
                    </div>
                  </td>
                  <td style="vertical-align: middle; padding-left: 12px;">
                    <span style="font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">${clinic}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Tag & Title -->
          <tr>
            <td style="padding: 12px 36px 0 36px;">
              <div style="display: inline-block; padding: 4px 12px; border-radius: 20px; background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399; font-size: 11px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase;">
                CITA VETERINARIA CONFIRMADA
              </div>
              <h1 style="margin: 16px 0 8px 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                ¡Hola ${data.clientName}!
              </h1>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                Tu cita para <strong style="color: #ffffff;">${data.petName}</strong> con <strong style="color: #ffffff;">${clinic}</strong> ha quedado agendada. Aquí tienes todos los detalles para que no pierdas nada.
              </p>
            </td>
          </tr>

          <!-- Inner Details Box -->
          <tr>
            <td style="padding: 24px 36px 12px 36px;">
              <table role="presentation" width="100%" style="background-color: #0f172a; border: 1px solid #1e2d4a; border-radius: 14px; padding: 20px;" cellspacing="0" cellpadding="0">
                
                <!-- Date -->
                <tr>
                  <td style="padding: 8px 12px; font-size: 13px; color: #94a3b8; width: 130px;">
                    📅 Fecha
                  </td>
                  <td style="padding: 8px 12px; font-size: 14px; color: #ffffff; font-weight: 700;">
                    ${data.date}
                  </td>
                </tr>

                <!-- Time -->
                <tr>
                  <td style="padding: 8px 12px; font-size: 13px; color: #94a3b8; border-top: 1px solid #1e293b;">
                    🕐 Hora
                  </td>
                  <td style="padding: 8px 12px; font-size: 14px; color: #38bdf8; font-weight: 700; border-top: 1px solid #1e293b;">
                    ${data.time}
                  </td>
                </tr>

                <!-- Patient -->
                <tr>
                  <td style="padding: 8px 12px; font-size: 13px; color: #94a3b8; border-top: 1px solid #1e293b;">
                    🐾 Paciente
                  </td>
                  <td style="padding: 8px 12px; font-size: 14px; color: #ffffff; font-weight: 700; border-top: 1px solid #1e293b;">
                    ${data.petName} ${data.petSpecies ? `<span style="color: #94a3b8; font-weight: normal; font-size: 12px;">(${data.petSpecies}${data.petBreed ? ` · ${data.petBreed}` : ""})</span>` : ""}
                  </td>
                </tr>

                <!-- Reason -->
                <tr>
                  <td style="padding: 8px 12px; font-size: 13px; color: #94a3b8; border-top: 1px solid #1e293b;">
                    📋 Motivo
                  </td>
                  <td style="padding: 8px 12px; font-size: 14px; color: #ffffff; font-weight: 600; border-top: 1px solid #1e293b;">
                    ${data.reason || "Consulta general"}
                  </td>
                </tr>

                <!-- Veterinarian -->
                <tr>
                  <td style="padding: 8px 12px; font-size: 13px; color: #94a3b8; border-top: 1px solid #1e293b;">
                    🩺 Veterinario
                  </td>
                  <td style="padding: 8px 12px; font-size: 14px; color: #ffffff; font-weight: 700; border-top: 1px solid #1e293b;">
                    Dr(a). ${data.vetName || "Por asignar"}
                  </td>
                </tr>

                <!-- Contact -->
                <tr>
                  <td style="padding: 8px 12px; font-size: 13px; color: #94a3b8; border-top: 1px solid #1e293b;">
                    👤 Contacto
                  </td>
                  <td style="padding: 8px 12px; font-size: 13px; color: #ffffff; border-top: 1px solid #1e293b;">
                    ${data.clientName} · <span style="color: #38bdf8;">${data.clientEmail}</span>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Call To Action Buttons -->
          <tr>
            <td style="padding: 24px 36px 16px 36px; text-align: center;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="padding: 0 6px;">
                    <a href="${portal}/agenda" target="_blank" style="background-color: #10b981; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 24px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                      Ver Cita en Portal
                    </a>
                  </td>
                  <td style="padding: 0 6px;">
                    <a href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Cita Veterinaria: ${data.petName} - ${clinic}`)}&dates=${encodeURIComponent(data.date.replace(/-/g, "") + "T" + (data.time || "10:00").replace(":", "") + "00Z")}&details=${encodeURIComponent(`Cita en ${clinic} para ${data.petName}. Motivo: ${data.reason}`)}" target="_blank" style="background-color: #1e293b; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; padding: 12px 24px; border-radius: 10px; display: inline-block; border: 1px solid #334155;">
                      Ver en Google Calendar
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Information note -->
          <tr>
            <td style="padding: 8px 36px 28px 36px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                Por favor llega con 10 minutos de anticipación. Si necesitas reagendar, puedes hacerlo directamente desde el portal.
              </p>
            </td>
          </tr>

          <!-- Footer Bar -->
          <tr>
            <td style="background-color: #0c1220; padding: 20px 36px; border-top: 1px solid #1a263c; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                ${clinic} · Impulsado por <strong style="color: #38bdf8;">Go2Vet</strong>
              </p>
              ${data.clinicPhone ? `
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #475569;">
                Teléfono de atención: ${data.clinicPhone}
              </p>
              ` : ""}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
