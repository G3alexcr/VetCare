import { useSyncExternalStore } from "react";
import { useTenantSlice } from "./tenant";
import { getCurrentClinicId } from "./saas-store";
import { db } from "./supabase";
import { registerHydrator } from "./db-hooks";
import type { Pet } from "./mock-data";

export type TenantPet = Pet & { clinicId: string; createdAt: string };
export type PetDraft = Omit<TenantPet, "id" | "createdAt" | "clinicId">;

export const SEED_PETS: TenantPet[] = [
  {
    id: "00000000-0000-0000-0000-0000000000b1",
    name: "Rocky",
    species: "Canino",
    breed: "Labrador Retriever",
    sex: "Macho",
    color: "Dorado",
    birthDate: "2022-05-10",
    weight: 28,
    microchip: "981098102938475",
    sterilized: true,
    allergies: "Ninguna",
    notes: "Sociable y juguetón",
    photo: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400",
    clientId: "00000000-0000-0000-0000-00000000f101",
    clinicId: "00000000-0000-0000-0000-0000000000a1",
    createdAt: "2024-01-15T10:00:00.000Z",
  },
  {
    id: "00000000-0000-0000-0000-0000000000b2",
    name: "Luna",
    species: "Felino",
    breed: "Siamés",
    sex: "Hembra",
    color: "Crema y café",
    birthDate: "2023-01-01",
    weight: 4,
    microchip: "981098102938476",
    sterilized: true,
    allergies: "Ninguna",
    notes: "Tranquila y cariñosa",
    photo: "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=400",
    clientId: "00000000-0000-0000-0000-00000000f102",
    clinicId: "00000000-0000-0000-0000-0000000000a1",
    createdAt: "2024-02-10T11:00:00.000Z",
  },
  {
    id: "09f5d472-9f7e-4e83-9f7d-702fb78348b6",
    name: "Nani",
    species: "Canino",
    breed: "Raza Pequeña",
    sex: "Hembra",
    color: "Negro y cafe",
    birthDate: "2024-09-29",
    weight: 8,
    microchip: "",
    sterilized: false,
    allergies: "Ninguna",
    notes: "Paciente Nani en excelente estado de salud.",
    photo: "/nani.png",
    clientId: "5e700fd9-3323-433c-9570-294e46c10785",
    clinicId: "00000000-0000-0000-0000-0000000000a1",
    createdAt: "2026-09-06T05:48:49.927+00:00",
  },
];

// Purge any legacy localStorage cache so stale pet data and old photos never pollute memory
if (typeof window !== "undefined") {
  try {
    localStorage.removeItem("vetcare_cached_pets");
  } catch {}
}

let state: TenantPet[] = [...SEED_PETS];

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
const emit = () => listeners.forEach((l) => l());
const set = (updater: (s: TenantPet[]) => TenantPet[]) => {
  state = updater(state);
  emit();
};

export const getAllPets = () => state;
export const useAllPets = () => useSyncExternalStore(subscribe, getAllPets, getAllPets);
export const usePets = () => useTenantSlice(subscribe, getAllPets);

function mapPet(r: Record<string, unknown>): TenantPet {
  return {
    id: String(r.id),
    photo: String(r.photo ?? ""),
    name: String(r.name ?? ""),
    species: String(r.species ?? ""),
    breed: String(r.breed ?? ""),
    sex: (r.sex as Pet["sex"]) ?? "Macho",
    color: String(r.color ?? ""),
    birthDate: String(r.birth_date ?? ""),
    weight: Number(r.weight ?? 0),
    microchip: String(r.microchip ?? ""),
    sterilized: Boolean(r.sterilized),
    allergies: String(r.allergies ?? ""),
    notes: String(r.notes ?? ""),
    clientId: String(r.client_id ?? ""),
    clinicId: String(r.clinic_id),
    createdAt: String(r.created_at ?? new Date().toISOString()),
  };
}

export async function hydratePets(_clinicId: string): Promise<void> {
  const { data, error } = await db.from("pets").select("*");
  if (error) { console.error(error); return; }
  const rows = (data ?? []).map(mapPet);
  const dbIds = new Set(rows.map((p) => p.id));
  const dbNames = new Set(rows.map((p) => p.name.trim().toLowerCase()));
  const missingSeeds = SEED_PETS.filter(
    (c) => !dbIds.has(c.id) && !dbNames.has(c.name.trim().toLowerCase())
  );
  set(() => [...rows, ...missingSeeds]);
}
registerHydrator(hydratePets);

export function addPet(p: PetDraft): TenantPet {
  const item: TenantPet = {
    ...p,
    id: crypto.randomUUID(),
    clinicId: getCurrentClinicId(),
    createdAt: new Date().toISOString(),
  };
  set((s) => [item, ...s]);
  void Promise.resolve(db.from("pets").insert({
    id: item.id,
    clinic_id: item.clinicId,
    client_id: item.clientId || null,
    name: item.name,
    species: item.species,
    breed: item.breed,
    sex: item.sex,
    color: item.color,
    birth_date: item.birthDate || null,
    weight: item.weight,
    microchip: item.microchip,
    sterilized: item.sterilized,
    allergies: item.allergies,
    notes: item.notes,
    photo: item.photo,
    created_at: item.createdAt,
  })).then(() => {}).catch((e) => console.error(e));
  return item;
}

export function updatePet(id: string, patch: Partial<Omit<TenantPet, "id" | "createdAt">>) {
  set((s) => s.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.species !== undefined) row.species = patch.species;
  if (patch.breed !== undefined) row.breed = patch.breed;
  if (patch.sex !== undefined) row.sex = patch.sex;
  if (patch.color !== undefined) row.color = patch.color;
  if (patch.birthDate !== undefined) row.birth_date = patch.birthDate || null;
  if (patch.weight !== undefined) row.weight = patch.weight;
  if (patch.microchip !== undefined) row.microchip = patch.microchip;
  if (patch.sterilized !== undefined) row.sterilized = patch.sterilized;
  if (patch.allergies !== undefined) row.allergies = patch.allergies;
  if (patch.notes !== undefined) row.notes = patch.notes;
  if (patch.photo !== undefined) row.photo = patch.photo;
  if (patch.clientId !== undefined) row.client_id = patch.clientId || null;
  void Promise.resolve(db.from("pets").update(row).eq("id", id)).then(() => {}).catch((e) => console.error(e));
}

export function deletePet(id: string) {
  set((s) => s.filter((p) => p.id !== id));
  void Promise.resolve(db.from("pets").delete().eq("id", id)).then(() => {}).catch((e) => console.error(e));
}
