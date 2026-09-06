import { useTenantSlice } from "./tenant";
import { getCurrentClinicId } from "./saas-store";
import { useSyncExternalStore } from "react";
import { db } from "./supabase";
import { registerHydrator } from "./db-hooks";

export type EspecieEstado = "Activo" | "Inactivo";

export const ESPECIE_ESTADOS: EspecieEstado[] = ["Activo", "Inactivo"];

export type Especie = {
  id: string;
  nombre: string;
  descripcion: string;
  estado: EspecieEstado;
  razas: string[];
  clinicId: string;
  createdAt: string;
};

export type EspecieDraft = Omit<Especie, "id" | "createdAt" | "clinicId">;

let state: Especie[] = [];
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
const emit = () => listeners.forEach((l) => l());
const set = (updater: (s: Especie[]) => Especie[]) => { state = updater(state); emit(); };

export const getEspecies = () => state;
export const useEspecies = () => useTenantSlice(subscribe, getEspecies);
export const useAllEspecies = () => useSyncExternalStore(subscribe, getEspecies, getEspecies);
export const getEspecie = (id: string) => state.find((s) => s.id === id);
export const getEspecieByNombre = (nombre: string) => state.find((s) => s.nombre === nombre);

export async function hydrateEspecies(_clinicId: string): Promise<void> {
  const { data, error } = await db.from("especies").select("*");
  if (error) { console.error(error); return; }
  const rows = (data ?? []).map((r) => ({
    id: String(r.id),
    nombre: String(r.nombre ?? ""),
    descripcion: String(r.descripcion ?? ""),
    estado: (r.estado as EspecieEstado) ?? "Activo",
    razas: Array.isArray(r.razas) ? (r.razas as string[]) : [],
    clinicId: String(r.clinic_id),
    createdAt: String(r.created_at ?? new Date().toISOString()),
  }));
  set(() => rows);
}
registerHydrator(hydrateEspecies);

/// Solo especies activas, ordenadas alfabéticamente (para dropdowns).
export function getEspeciesActivas(): Especie[] {
  return state.filter((s) => s.estado === "Activo").sort((a, b) => a.nombre.localeCompare(b.nombre));
}

// Razas de una especie (vacío si no existe).
export function getRazasDeEspecie(nombre: string): string[] {
  return getEspecieByNombre(nombre)?.razas ?? [];
}

export function addEspecie(s: EspecieDraft): Especie {
  const item: Especie = { ...s, id: crypto.randomUUID(), clinicId: getCurrentClinicId(), createdAt: new Date().toISOString() };
  set((list) => [item, ...list]);
  void Promise.resolve(db.from("especies").insert({
    id: item.id,
    clinic_id: item.clinicId,
    nombre: item.nombre,
    descripcion: item.descripcion,
    estado: item.estado,
    razas: item.razas,
    created_at: item.createdAt,
  })).then(() => {}).catch((e) => console.error(e));
  return item;
}
export function updateEspecie(id: string, patch: Partial<EspecieDraft>) {
  set((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const row: Record<string, unknown> = {};
  if (patch.nombre !== undefined) row.nombre = patch.nombre;
  if (patch.descripcion !== undefined) row.descripcion = patch.descripcion;
  if (patch.estado !== undefined) row.estado = patch.estado;
  if (patch.razas !== undefined) row.razas = patch.razas;
  void Promise.resolve(db.from("especies").update(row).eq("id", id)).then(() => {}).catch((e) => console.error(e));
}
export function deleteEspecie(id: string) {
  set((list) => list.filter((s) => s.id !== id));
  void Promise.resolve(db.from("especies").delete().eq("id", id)).then(() => {}).catch((e) => console.error(e));
}
export function toggleEspecieEstado(id: string) {
  const current = state.find((s) => s.id === id);
  const next: EspecieEstado = current?.estado === "Activo" ? "Inactivo" : "Activo";
  set((list) =>
    list.map((s) =>
      s.id === id ? { ...s, estado: s.estado === "Activo" ? "Inactivo" : "Activo" } : s
    )
  );
  void Promise.resolve(db.from("especies").update({ estado: next }).eq("id", id)).then(() => {}).catch((e) => console.error(e));
}

export function emptyEspecieDraft(): EspecieDraft {
  return { nombre: "", descripcion: "", estado: "Activo", razas: [] };
}

export function addRazaToEspecie(especieNombre: string, nuevaRaza: string): void {
  const cleanRaza = nuevaRaza.trim();
  const cleanEsp = especieNombre.trim();
  if (!cleanRaza || !cleanEsp) return;
  const esp = getEspecieByNombre(cleanEsp);
  if (esp) {
    if (!esp.razas.includes(cleanRaza)) {
      const updatedRazas = [...esp.razas, cleanRaza];
      updateEspecie(esp.id, { razas: updatedRazas });
    }
  } else {
    addEspecie({
      nombre: cleanEsp,
      descripcion: "",
      estado: "Activo",
      razas: [cleanRaza],
    });
  }
}

