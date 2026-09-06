import { useTenantSlice } from "./tenant";
import { getCurrentClinicId } from "./saas-store";

// ==================== Types ====================
export type RoomType = "Jaula" | "Habitación" | "UCI" | "Aislamiento";
export type RoomStatus =
  | "Disponible"
  | "Ocupada"
  | "Limpieza"
  | "Mantenimiento"
  | "Reservada";

export type HospitalRoom = {
  id: string;
  code: string;
  type: RoomType;
  status: RoomStatus;
  capacity: number;
  location: string;
  size: string;
  notes: string;
  currentPetId?: string;
  currentHospId?: string;
  createdAt: string;
};

export type CareLog = {
  id: string;
  hospId: string;
  date: string;
  time: string;
  veterinarian: string;
  temperature: string;
  weight: string;
  heartRate: string;
  respiratoryRate: string;
  generalState: string;
  observations: string;
  createdAt: string;
};

export type MedicationStatus = "Pendiente" | "Administrado" | "Omitido";

export type HospitalMedication = {
  id: string;
  hospId: string;
  medicine: string;
  dose: string;
  route: string;
  scheduledDate: string;
  scheduledTime: string;
  responsible: string;
  status: MedicationStatus;
  administeredAt: string;
  notes: string;
  createdAt: string;
};

export type TreatmentPlan = {
  id: string;
  hospId: string;
  medicine: string;
  frequency: string;
  duration: string;
  instructions: string;
  createdAt: string;
};

// ==================== State ====================
type State = {
  rooms: Array<HospitalRoom & { clinicId: string }>;
  care: Array<CareLog & { clinicId: string }>;
  meds: Array<HospitalMedication & { clinicId: string }>;
  plans: Array<TreatmentPlan & { clinicId: string }>;
};

const STORAGE_KEY = "go2vet_hospital_v1";

const SEED_ROOMS: Array<HospitalRoom & { clinicId: string }> = [
  { id: "r_seed_1", code: "J-01", type: "Jaula", status: "Disponible", capacity: 1, location: "Ala General", size: "Mediana", notes: "Jaula estándar para perros medianos y felinos", clinicId: "cl1", createdAt: new Date().toISOString() },
  { id: "r_seed_2", code: "J-02", type: "Jaula", status: "Disponible", capacity: 1, location: "Ala General", size: "Grande", notes: "Jaula amplia para caninos grandes", clinicId: "cl1", createdAt: new Date().toISOString() },
  { id: "r_seed_3", code: "J-03", type: "Jaula", status: "Disponible", capacity: 1, location: "Ala Felina", size: "Pequeña", notes: "Ambiente silencioso cat-friendly", clinicId: "cl1", createdAt: new Date().toISOString() },
  { id: "r_seed_4", code: "J-04", type: "Jaula", status: "Disponible", capacity: 1, location: "Ala Felina", size: "Pequeña", notes: "Ambiente silencioso cat-friendly", clinicId: "cl1", createdAt: new Date().toISOString() },
  { id: "r_seed_5", code: "UCI-01", type: "UCI", status: "Disponible", capacity: 1, location: "Área Crítica", size: "Mediana", notes: "Con toma de oxígeno y soporte vital", clinicId: "cl1", createdAt: new Date().toISOString() },
  { id: "r_seed_6", code: "AIS-01", type: "Aislamiento", status: "Disponible", capacity: 1, location: "Infecciosos", size: "Grande", notes: "Protocolo de bioseguridad / cuarentena", clinicId: "cl1", createdAt: new Date().toISOString() },
];

function loadInitialState(): State {
  if (typeof window === "undefined") {
    return { rooms: SEED_ROOMS, care: [], meds: [], plans: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.rooms) && parsed.rooms.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error cargando hospital-store:", err);
  }
  return { rooms: SEED_ROOMS, care: [], meds: [], plans: [] };
}

let state: State = loadInitialState();

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
const emit = () => listeners.forEach((l) => l());
const setState = (u: (s: State) => State) => {
  state = u(state);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Error guardando hospital-store:", e);
    }
  }
  emit();
};

const uid = (p: string) => `${p}${Date.now()}${Math.random().toString(36).slice(2, 6)}`;

// ==================== Hooks ====================
export function useHospitalRooms() { return useTenantSlice(subscribe, () => state.rooms); }
export function useCareLogs() { return useTenantSlice(subscribe, () => state.care); }
export function useHospitalMeds() { return useTenantSlice(subscribe, () => state.meds); }
export function useTreatmentPlans() { return useTenantSlice(subscribe, () => state.plans); }

// ==================== Rooms ====================
export function addRoom(r: Omit<HospitalRoom, "id" | "createdAt">) {
  const item: HospitalRoom & { clinicId: string } = { ...r, id: uid("r"), clinicId: getCurrentClinicId(), createdAt: new Date().toISOString() };
  setState((s) => ({ ...s, rooms: [item, ...s.rooms] }));
  return item;
}
export function updateRoom(id: string, patch: Partial<HospitalRoom>) {
  setState((s) => ({ ...s, rooms: s.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
}
export function deleteRoom(id: string) {
  setState((s) => ({ ...s, rooms: s.rooms.filter((r) => r.id !== id) }));
}
export function assignRoom(roomId: string, hospId: string, petId: string) {
  updateRoom(roomId, { status: "Ocupada", currentHospId: hospId, currentPetId: petId });
}
export function releaseRoom(roomId: string) {
  updateRoom(roomId, { status: "Limpieza", currentHospId: undefined, currentPetId: undefined });
}

// ==================== Care logs ====================
export function addCareLog(c: Omit<CareLog, "id" | "createdAt">) {
  const item: CareLog & { clinicId: string } = { ...c, id: uid("cl"), clinicId: getCurrentClinicId(), createdAt: new Date().toISOString() };
  setState((s) => ({ ...s, care: [item, ...s.care] }));
  return item;
}
export function deleteCareLog(id: string) {
  setState((s) => ({ ...s, care: s.care.filter((c) => c.id !== id) }));
}

// ==================== Medications ====================
export function addHospitalMed(m: Omit<HospitalMedication, "id" | "createdAt">) {
  const item: HospitalMedication & { clinicId: string } = { ...m, id: uid("hm"), clinicId: getCurrentClinicId(), createdAt: new Date().toISOString() };
  setState((s) => ({ ...s, meds: [item, ...s.meds] }));
  return item;
}
export function updateHospitalMed(id: string, patch: Partial<HospitalMedication>) {
  setState((s) => ({ ...s, meds: s.meds.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
}
export function deleteHospitalMed(id: string) {
  setState((s) => ({ ...s, meds: s.meds.filter((m) => m.id !== id) }));
}
export function markMedStatus(id: string, status: MedicationStatus) {
  updateHospitalMed(id, { status, administeredAt: status === "Administrado" ? new Date().toISOString() : "" });
}

// ==================== Treatment plans ====================
export function addTreatmentPlan(t: Omit<TreatmentPlan, "id" | "createdAt">) {
  const item: TreatmentPlan & { clinicId: string } = { ...t, id: uid("tp"), clinicId: getCurrentClinicId(), createdAt: new Date().toISOString() };
  setState((s) => ({ ...s, plans: [item, ...s.plans] }));
  return item;
}
export function deleteTreatmentPlan(id: string) {
  setState((s) => ({ ...s, plans: s.plans.filter((p) => p.id !== id) }));
}

// ==================== Helpers ====================
export function daysBetween(a: string, b: string) {
  const d1 = new Date(a).getTime();
  const d2 = new Date(b).getTime();
  return Math.max(0, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
}

export function isMedOverdue(m: HospitalMedication, now = new Date()): boolean {
  if (m.status !== "Pendiente") return false;
  const dt = new Date(`${m.scheduledDate}T${m.scheduledTime || "00:00"}:00`);
  return dt.getTime() < now.getTime();
}

export const ROOM_STATUSES: RoomStatus[] = ["Disponible", "Ocupada", "Limpieza", "Mantenimiento", "Reservada"];
export const ROOM_TYPES: RoomType[] = ["Jaula", "Habitación", "UCI", "Aislamiento"];

export function roomStatusColor(s: RoomStatus): string {
  switch (s) {
    case "Disponible": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Ocupada": return "bg-rose-100 text-rose-700 border-rose-200";
    case "Limpieza": return "bg-sky-100 text-sky-700 border-sky-200";
    case "Mantenimiento": return "bg-amber-100 text-amber-700 border-amber-200";
    case "Reservada": return "bg-violet-100 text-violet-700 border-violet-200";
  }
}
