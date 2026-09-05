import { useSyncExternalStore } from "react";
import { db } from "./supabase";

export type AiProvider = "openai" | "gemini" | "claude";

export type AiToolId =
  | "chat"
  | "resumen"
  | "diagnostico"
  | "consulta"
  | "receta"
  | "indicaciones"
  | "documento"
  | "historial"
  | "config";

export type AiSettings = {
  provider: AiProvider;
  model: string;
  apiKey?: string;
  temperature: number;
  maxTokens: number;
  language: "es" | "en";
};

export type AiHistoryEntry = {
  id: string;
  tool: string;
  question: string;
  answer: string;
  userName: string;
  petId?: string;
  petName?: string;
  createdAt: string;
};

const defaultSettings: AiSettings = {
  provider: "openai",
  model: "gpt-4o-mini",
  apiKey: "",
  temperature: 0.3,
  maxTokens: 2048,
  language: "es",
};

// Sin localStorage: los ajustes e historial de la IA se mantienen en memoria
// (por sesión) y se perderán al recargar.
let settings: AiSettings = defaultSettings;
let history: AiHistoryEntry[] = [];

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const emit = () => listeners.forEach((l) => l());

export function useAiSettings() {
  return useSyncExternalStore(subscribe, () => settings, () => settings);
}

export function updateAiSettings(patch: Partial<AiSettings>) {
  settings = { ...settings, ...patch };
  emit();
}

export function useAiHistory() {
  return useSyncExternalStore(subscribe, () => history, () => history);
}

export function addAiHistoryEntry(entry: Omit<AiHistoryEntry, "id" | "createdAt">) {
  history = [
    { ...entry, id: `ai${Date.now()}${Math.random().toString(36).slice(2, 6)}`, createdAt: new Date().toISOString() },
    ...history,
  ].slice(0, 200);
  emit();
}

export function clearAiHistory() {
  history = [];
  emit();
}

// ---- Panel UI state (not persisted) ----

export type AiPanelState = { open: boolean; tool: AiToolId; petId?: string };

let panel: AiPanelState = { open: false, tool: "chat" };

export function useAiPanel() {
  return useSyncExternalStore(subscribe, () => panel, () => panel);
}

export function openVetCareAI(tool: AiToolId = "chat", petId?: string) {
  panel = { open: true, tool, petId: petId ?? panel.petId };
  emit();
}

export function setAiPanelTool(tool: AiToolId) {
  panel = { ...panel, tool };
  emit();
}

export function setAiPanelPet(petId?: string) {
  panel = { ...panel, petId };
  emit();
}

export function closeVetCareAI() {
  panel = { ...panel, open: false };
  emit();
}

export async function saveClinicAiSettings(
  clinicId: string,
  patch: Partial<AiSettings> & { emergencyPhone?: string }
) {
  updateAiSettings(patch);
  if (!clinicId) return;
  const updateData: Record<string, any> = {};
  if (patch.provider) updateData.ai_provider = patch.provider;
  if (patch.apiKey !== undefined) updateData.ai_api_key = patch.apiKey;
  if (patch.model) updateData.ai_model = patch.model;
  if (patch.emergencyPhone !== undefined) updateData.emergency_phone = patch.emergencyPhone;
  try {
    await db.from("clinics").update(updateData).eq("id", clinicId);
  } catch (err) {
    console.error("Error saving AI settings to Supabase:", err);
    throw err;
  }
}
