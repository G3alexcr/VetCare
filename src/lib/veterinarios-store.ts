import { useTenantSlice } from "./tenant";
import { getCurrentClinicId } from "./saas-store";
import { useSyncExternalStore } from "react";
import { db } from "./supabase";
import { registerHydrator } from "./db-hooks";

export type VetEstado = "Activo" | "Inactivo" | "Suspendido";

export const VET_ESTADOS: VetEstado[] = ["Activo", "Inactivo", "Suspendido"];

export const ESPECIALIDADES_VET = [
  "Medicina General",
  "Cirugía",
  "Dermatología",
  "Cardiología",
  "Traumatología",
  "Oftalmología",
  "Odontología",
  "Felinos",
  "Caninos",
  "Exóticos",
  "Imagenología",
  "Nutrición",
];

export type DiaSemana =
  | "Lunes"
  | "Martes"
  | "Miércoles"
  | "Jueves"
  | "Viernes"
  | "Sábado"
  | "Domingo";

export const DIAS: DiaSemana[] = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

export type HorarioDia = {
  dia: DiaSemana;
  entrada: string; // "09:00"
  salida: string; // "18:00"
  disponible: boolean;
};

export type Pausa = {
  id: string;
  nombre: string; // ej. "Almuerzo"
  desde: string; // "13:00"
  hasta: string; // "14:00"
};

export type Veterinario = {
  id: string;
  nombre: string;
  email: string;
  password: string;
  telefono: string;
  whatsapp: string;
  especialidad: string;
  comision: number; // %
  estado: VetEstado;
  foto: string | null; // data URL
  horario: HorarioDia[];
  pausas: Pausa[];
  notas: string;
  clinicId: string;
  createdAt: string;
};

export function createEmptyHorario(disponible = true): HorarioDia[] {
  return DIAS.map((dia) => ({ dia, entrada: "09:00", salida: "18:00", disponible }));
}

let state: Veterinario[] = [];
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
const emit = () => listeners.forEach((l) => l());
const set = (updater: (s: Veterinario[]) => Veterinario[]) => { state = updater(state); emit(); };

export const getVeterinarios = () => state;
export const useVeterinarios = () => useTenantSlice(subscribe, getVeterinarios);
export const useAllVeterinarios = () => useSyncExternalStore(subscribe, getVeterinarios, getVeterinarios);
export const getVeterinario = (id: string) => state.find((v) => v.id === id);

export async function hydrateVeterinarios(_clinicId: string): Promise<void> {
  const { data, error } = await db.from("veterinarios").select("*");
  if (error) { console.error(error); return; }
  const rows = (data ?? []).map((r) => ({
    id: String(r.id),
    nombre: String(r.nombre ?? ""),
    email: String(r.email ?? ""),
    password: String(r.password ?? ""),
    telefono: String(r.telefono ?? ""),
    whatsapp: String(r.whatsapp ?? ""),
    especialidad: String(r.especialidad ?? ""),
    comision: Number(r.comision ?? 0),
    estado: (r.estado as VetEstado) ?? "Activo",
    foto: r.foto ? String(r.foto) : null,
    horario: Array.isArray(r.horario) ? (r.horario as HorarioDia[]) : [],
    pausas: Array.isArray(r.pausas) ? (r.pausas as Pausa[]) : [],
    notas: String(r.notas ?? ""),
    clinicId: String(r.clinic_id),
    createdAt: String(r.created_at ?? new Date().toISOString()),
  }));
  set(() => rows);
}
registerHydrator(hydrateVeterinarios);

export function addVeterinario(v: Omit<Veterinario, "id" | "createdAt" | "clinicId">): Veterinario {
  const item: Veterinario = { ...v, id: crypto.randomUUID(), clinicId: getCurrentClinicId(), createdAt: new Date().toISOString() };
  set((s) => [item, ...s]);
  void Promise.resolve(db.from("veterinarios").insert({
    id: item.id,
    clinic_id: item.clinicId,
    nombre: item.nombre,
    email: item.email,
    password: item.password,
    telefono: item.telefono,
    whatsapp: item.whatsapp,
    especialidad: item.especialidad,
    comision: item.comision,
    estado: item.estado,
    foto: item.foto,
    horario: item.horario,
    pausas: item.pausas,
    notas: item.notas,
    created_at: item.createdAt,
  })).then(() => {}).catch((e) => console.error(e));
  return item;
}
export function updateVeterinario(id: string, patch: Partial<Omit<Veterinario, "id" | "createdAt">>) {
  set((s) => s.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  const row: Record<string, unknown> = {};
  if (patch.nombre !== undefined) row.nombre = patch.nombre;
  if (patch.email !== undefined) row.email = patch.email;
  if (patch.password !== undefined) row.password = patch.password;
  if (patch.telefono !== undefined) row.telefono = patch.telefono;
  if (patch.whatsapp !== undefined) row.whatsapp = patch.whatsapp;
  if (patch.especialidad !== undefined) row.especialidad = patch.especialidad;
  if (patch.comision !== undefined) row.comision = patch.comision;
  if (patch.estado !== undefined) row.estado = patch.estado;
  if (patch.foto !== undefined) row.foto = patch.foto;
  if (patch.horario !== undefined) row.horario = patch.horario;
  if (patch.pausas !== undefined) row.pausas = patch.pausas;
  if (patch.notas !== undefined) row.notas = patch.notas;
  if (patch.clinicId !== undefined) row.clinic_id = patch.clinicId;
  void Promise.resolve(db.from("veterinarios").update(row).eq("id", id)).then(() => {}).catch((e) => console.error(e));
}
export function deleteVeterinario(id: string) {
  set((s) => s.filter((v) => v.id !== id));
  void Promise.resolve(db.from("veterinarios").delete().eq("id", id)).then(() => {}).catch((e) => console.error(e));
}

export type VeterinarioDraft = Omit<Veterinario, "id" | "createdAt" | "clinicId">;

export function emptyDraft(): VeterinarioDraft {
  return {
    nombre: "",
    email: "",
    password: "",
    telefono: "",
    whatsapp: "",
    especialidad: ESPECIALIDADES_VET[0],
    comision: 20,
    estado: "Activo",
    foto: null,
    horario: createEmptyHorario(true),
    pausas: [],
    notas: "",
  };
}

// Índice del día de la semana (Lunes=0 ... Domingo=6) para "Activos hoy".
export const getTodayIndex = () => (new Date().getDay() + 6) % 7; // getDay: Dom=0 => Lun=0
