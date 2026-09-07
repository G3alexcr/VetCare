export type ClinicEmailConfig = {
  resendApiKey: string;
  senderName: string;
  senderEmail: string;
};

const STORAGE_KEY_PREFIX = "vetcare_clinic_email_config_";

export function getClinicEmailConfig(clinicId: string): ClinicEmailConfig {
  if (typeof window === "undefined") {
    return { resendApiKey: "", senderName: "", senderEmail: "citas@go2vet.online" };
  }
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${clinicId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        resendApiKey: parsed.resendApiKey || "",
        senderName: parsed.senderName || "",
        senderEmail: parsed.senderEmail || "citas@go2vet.online",
      };
    }
  } catch (err) {
    console.warn("Error leyendo configuración de correos:", err);
  }
  return { resendApiKey: "", senderName: "", senderEmail: "citas@go2vet.online" };
}

export function saveClinicEmailConfig(clinicId: string, config: ClinicEmailConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${clinicId}`, JSON.stringify(config));
  } catch (err) {
    console.error("Error guardando configuración de correos:", err);
  }
}
