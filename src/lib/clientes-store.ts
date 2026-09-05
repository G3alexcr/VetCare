import { useTenantSlice } from "./tenant";
import { getCurrentClinicId } from "./saas-store";
import { useSyncExternalStore } from "react";
import { db } from "./supabase";
import { registerHydrator } from "./db-hooks";

export type ClinicClient = {
  id: string;
  name: string;
  fullName: string;
  identification: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  registeredAt: string;
  notes: string;
  clinicId: string;
  createdAt: string;
};

export type ClinicClientDraft = Omit<ClinicClient, "id" | "createdAt" | "clinicId" | "fullName">;

export const SEED_CLIENTES: ClinicClient[] = [
  {
    id: "00000000-0000-0000-0000-00000000f101",
    name: "María Rodríguez",
    fullName: "María Rodríguez",
    identification: "1712345678",
    phone: "+506 8811 3344",
    whatsapp: "+506 8811 3344",
    email: "maria@gmail.com",
    address: "Av. Principal 123",
    registeredAt: "2024-01-15",
    notes: "Propietaria de Rocky",
    clinicId: "00000000-0000-0000-0000-0000000000a1",
    createdAt: "2024-01-15T10:00:00.000Z",
  },
  {
    id: "00000000-0000-0000-0000-00000000f102",
    name: "Juan Pérez",
    fullName: "Juan Pérez",
    identification: "1723456789",
    phone: "+506 8822 4455",
    whatsapp: "+506 8822 4455",
    email: "juan@hotmail.com",
    address: "Calle Los Pinos 45",
    registeredAt: "2024-02-10",
    notes: "Propietario de Luna",
    clinicId: "00000000-0000-0000-0000-0000000000a1",
    createdAt: "2024-02-10T11:00:00.000Z",
  },
];

let state: ClinicClient[] = SEED_CLIENTES;
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
const emit = () => listeners.forEach((l) => l());
const set = (updater: (s: ClinicClient[]) => ClinicClient[]) => { state = updater(state); emit(); };

export const getAllClientes = () => state;
export const useAllClientes = () => useSyncExternalStore(subscribe, getAllClientes, getAllClientes);
export const useClientes = () => useTenantSlice(subscribe, getAllClientes);

function mapCliente(r: Record<string, unknown>): ClinicClient {
  const name = String((r.full_name || r.name) ?? "");
  const createdAt = String(r.created_at ?? new Date().toISOString());
  return {
    id: String(r.id),
    name,
    fullName: name,
    identification: String(r.identification ?? ""),
    phone: String(r.phone ?? ""),
    whatsapp: String(r.whatsapp ?? ""),
    email: String(r.email ?? ""),
    address: String(r.address ?? ""),
    registeredAt: String(r.registered_at ?? createdAt.split("T")[0]),
    notes: String(r.notes ?? ""),
    clinicId: String(r.clinic_id),
    createdAt,
  };
}

export async function hydrateClientes(_clinicId: string): Promise<void> {
  const { data, error } = await db.from("clients").select("*");
  if (error) { console.error(error); return; }
  const rows = (data ?? []).map(mapCliente);
  const ids = new Set(rows.map((c) => c.id));
  const missing = SEED_CLIENTES.filter((c) => !ids.has(c.id));
  set(() => [...rows, ...missing]);
}
registerHydrator(hydrateClientes);

export function addCliente(c: ClinicClientDraft): ClinicClient {
  const item: ClinicClient = {
    ...c,
    fullName: c.name,
    id: crypto.randomUUID(),
    clinicId: getCurrentClinicId(),
    createdAt: new Date().toISOString(),
  };
  set((s) => [item, ...s]);
  void Promise.resolve(db.from("clients").insert({
    id: item.id,
    clinic_id: item.clinicId,
    name: item.name,
    full_name: item.fullName,
    identification: item.identification,
    phone: item.phone,
    whatsapp: item.whatsapp,
    email: item.email,
    address: item.address,
    registered_at: item.registeredAt || null,
    notes: item.notes,
    created_at: item.createdAt,
  })).then(() => {}).catch((e) => console.error(e));
  return item;
}

export function updateCliente(id: string, patch: Partial<ClinicClient>) {
  set((s) => s.map((c) => (c.id === id ? { ...c, ...patch, fullName: patch.name ?? c.fullName, name: patch.name ?? c.name } : c)));
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) { row.name = patch.name; row.full_name = patch.name; }
  if (patch.identification !== undefined) row.identification = patch.identification;
  if (patch.phone !== undefined) row.phone = patch.phone;
  if (patch.whatsapp !== undefined) row.whatsapp = patch.whatsapp;
  if (patch.email !== undefined) row.email = patch.email;
  if (patch.address !== undefined) row.address = patch.address;
  if (patch.registeredAt !== undefined) row.registered_at = patch.registeredAt || null;
  if (patch.notes !== undefined) row.notes = patch.notes;
  if (patch.fullName !== undefined) { row.name = patch.fullName; row.full_name = patch.fullName; }
  void Promise.resolve(db.from("clients").update(row).eq("id", id)).then(() => {}).catch((e) => console.error(e));
}

export function deleteCliente(id: string) {
  set((s) => s.filter((c) => c.id !== id));
  void Promise.resolve(db.from("clients").delete().eq("id", id)).then(() => {}).catch((e) => console.error(e));
}
