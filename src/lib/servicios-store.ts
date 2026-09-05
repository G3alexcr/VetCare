import { useTenantSlice } from "./tenant";
import { getCurrentClinicId } from "./saas-store";
import { useSyncExternalStore } from "react";
import { db } from "./supabase";
import { registerHydrator } from "./db-hooks";

export type ServicioEstado = "Activo" | "Inactivo";

export const SERVICIO_ESTADOS: ServicioEstado[] = ["Activo", "Inactivo"];

export type Servicio = {
  id: string;
  nombre: string;
  precio: number; // en la moneda configurada (₡ colones o $ dólares)
  duracionMin: number;
  estado: ServicioEstado;
  gravaImpuestos: boolean;
  descripcion: string;
  clinicId: string;
  createdAt: string;
};

export type ServicioDraft = Omit<Servicio, "id" | "createdAt" | "clinicId">;

let state: Servicio[] = [];
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
const emit = () => listeners.forEach((l) => l());
const set = (updater: (s: Servicio[]) => Servicio[]) => { state = updater(state); emit(); };

export const getServicios = () => state;
export const useServicios = () => useTenantSlice(subscribe, getServicios);
export const useAllServicios = () => useSyncExternalStore(subscribe, getServicios, getServicios);
export const getServicio = (id: string) => state.find((s) => s.id === id);

export async function hydrateServicios(_clinicId: string): Promise<void> {
  const { data, error } = await db.from("servicios").select("*");
  if (error) { console.error(error); return; }
  const rows = (data ?? []).map((r) => ({
    id: String(r.id),
    nombre: String(r.nombre ?? ""),
    precio: Number(r.precio ?? 0),
    duracionMin: Number(r.duracion_min ?? 0),
    estado: (r.estado as ServicioEstado) ?? "Activo",
    gravaImpuestos: Boolean(r.grava_impuestos),
    descripcion: String(r.descripcion ?? ""),
    clinicId: String(r.clinic_id),
    createdAt: String(r.created_at ?? new Date().toISOString()),
  }));
  set(() => rows);
}
registerHydrator(hydrateServicios);

export function addServicio(s: ServicioDraft): Servicio {
  const item: Servicio = { ...s, id: crypto.randomUUID(), clinicId: getCurrentClinicId(), createdAt: new Date().toISOString() };
  set((list) => [item, ...list]);
  void Promise.resolve(db.from("servicios").insert({
    id: item.id,
    clinic_id: item.clinicId,
    nombre: item.nombre,
    precio: item.precio,
    duracion_min: item.duracionMin,
    estado: item.estado,
    grava_impuestos: item.gravaImpuestos,
    descripcion: item.descripcion,
    created_at: item.createdAt,
  })).then(() => {}).catch((e) => console.error(e));
  return item;
}
export function updateServicio(id: string, patch: Partial<ServicioDraft>) {
  set((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const row: Record<string, unknown> = {};
  if (patch.nombre !== undefined) row.nombre = patch.nombre;
  if (patch.precio !== undefined) row.precio = patch.precio;
  if (patch.duracionMin !== undefined) row.duracion_min = patch.duracionMin;
  if (patch.estado !== undefined) row.estado = patch.estado;
  if (patch.gravaImpuestos !== undefined) row.grava_impuestos = patch.gravaImpuestos;
  if (patch.descripcion !== undefined) row.descripcion = patch.descripcion;
  void Promise.resolve(db.from("servicios").update(row).eq("id", id)).then(() => {}).catch((e) => console.error(e));
}
export function deleteServicio(id: string) {
  set((list) => list.filter((s) => s.id !== id));
  void Promise.resolve(db.from("servicios").delete().eq("id", id)).then(() => {}).catch((e) => console.error(e));
}

export function emptyServicioDraft(): ServicioDraft {
  return {
    nombre: "",
    precio: 0,
    duracionMin: 30,
    estado: "Activo",
    gravaImpuestos: true,
    descripcion: "",
  };
}

// Muestra una duración amigable: 15 -> "15 min", 60 -> "1 h", 720 -> "12 h", 1440 -> "1 día".
export function formatDuracion(min: number): string {
  if (min === 0) return "0 min";
  if (min % 1440 === 0) return `${min / 1440} día${min / 1440 > 1 ? "s" : ""}`;
  if (min % 60 === 0) return `${min / 60} h`;
  return `${min} min`;
}
