import { useSyncExternalStore } from "react";
import { useTenantSlice } from "./tenant";
import { getCurrentClinicId } from "./saas-store";
import {
  type Appointment,
  type AppointmentStatus,
  type Consultation,
} from "./mock-data";
import { db } from "./supabase";
import { registerHydrator } from "./db-hooks";
import { toLocalDateStr } from "./utils";

export function asUUID(id?: string): string {
  if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "00000000-0000-4000-8000-" + Math.random().toString(16).slice(2, 14).padEnd(12, "0");
}

export const STANDARD_HOURS = [
  "08:30", "09:00", "09:30", "10:00", "10:30", "11:00",
  "11:30", "14:00", "14:30", "15:00", "15:30", "16:00",
  "16:30", "17:00", "17:30"
];

export function getLocalAppts(): TenantAppointment[] {
  if (typeof window === "undefined") return [];
  try {
    localStorage.removeItem("go2vet_appointments_v1");
    localStorage.removeItem("go2vet_appointments_v2");
  } catch {}
  return [];
}

export function saveLocalAppt(_item: TenantAppointment) {
  // Sin almacenamiento local para garantizar datos limpios desde la base de datos
}

export function getLocalConsults(): LinkedConsultation[] {
  if (typeof window === "undefined") return [];
  try {
    localStorage.removeItem("go2vet_consultations_v1");
  } catch {}
  return [];
}

export function saveLocalConsult(_item: LinkedConsultation) {
  // Sin almacenamiento local para garantizar datos limpios desde la base de datos
}

export type TenantAppointment = Appointment & { clinicId: string };
export type LinkedConsultation = Consultation & { appointmentId?: string; clinicId: string };

export type Vaccine = {
  id: string;
  petId: string;
  vaccineName: string;
  laboratory: string;
  batchNumber: string;
  applicationDate: string; // YYYY-MM-DD
  nextDueDate: string; // YYYY-MM-DD
  veterinarian: string;
  notes: string;
  clinicId: string;
  createdAt: string;
};

export type SurgeryStatus = "Programada" | "En proceso" | "Finalizada" | "Cancelada";
export type Surgery = {
  id: string;
  petId: string;
  surgeryDate: string;
  procedureType: string;
  veterinarian: string;
  assistant: string;
  preoperativeDiagnosis: string;
  procedurePerformed: string;
  anesthesiaType: string;
  medications: string;
  durationMinutes: number;
  status: SurgeryStatus;
  observations: string;
  postoperativeRecommendations: string;
  clinicId: string;
  createdAt: string;
};

export type SurgeryFollowup = {
  id: string;
  surgeryId: string;
  followupDate: string;
  veterinarian: string;
  progressNotes: string;
  observations: string;
  clinicId: string;
  createdAt: string;
};

export type DewormingType = "Interna" | "Externa" | "Mixta";
export type Deworming = {
  id: string;
  petId: string;
  productName: string;
  activeIngredient: string;
  dewormingType: DewormingType;
  applicationDate: string;
  nextApplicationDate: string;
  weight: number;
  dose: string;
  veterinarian: string;
  notes: string;
  clinicId: string;
  createdAt: string;
};

export type HospitalizationStatus =
  | "Hospitalizado"
  | "Observación"
  | "Recuperación"
  | "Alta médica"
  | "Fallecido";

export type Hospitalization = {
  id: string;
  petId: string;
  admissionDate: string;
  admissionTime: string;
  veterinarian: string;
  reason: string;
  initialDiagnosis: string;
  treatmentPlan: string;
  patientStatus: string;
  roomNumber: string;
  observations: string;
  dischargeDate: string;
  dischargeSummary: string;
  ownerInstructions: string;
  dischargeMedications: string;
  followupDate: string;
  followupTime?: string;
  status: HospitalizationStatus;
  clinicId: string;
  createdAt: string;
};

export type HospitalizationProgress = {
  id: string;
  hospitalizationId: string;
  progressDate: string;
  progressTime: string;
  veterinarian: string;
  temperature: string;
  weight: string;
  medicationsAdministered: string;
  observations: string;
  clinicId: string;
  createdAt: string;
};

export type PetFileCategory =
  | "Laboratorio"
  | "Radiografía"
  | "Ecografía"
  | "Receta médica"
  | "Consentimiento informado"
  | "Resultado clínico"
  | "Informe quirúrgico"
  | "Hospitalización"
  | "Otros";

export type PetFile = {
  id: string;
  petId: string;
  fileName: string;
  fileCategory: PetFileCategory;
  fileUrl: string; // data URL (local) or remote URL
  fileSize: number;
  fileType: string;
  documentDate: string;
  veterinarian: string;
  description: string;
  uploadedBy: string;
  clinicId: string;
  createdAt: string;
};

export type PetPhotoCategory =
  | "General"
  | "Dermatología"
  | "Heridas"
  | "Cirugía"
  | "Postoperatorio"
  | "Radiografía"
  | "Ecografía"
  | "Odontología"
  | "Hospitalización"
  | "Seguimiento clínico"
  | "Otros";

export const PET_PHOTO_CATEGORIES: PetPhotoCategory[] = [
  "General",
  "Dermatología",
  "Heridas",
  "Cirugía",
  "Postoperatorio",
  "Radiografía",
  "Ecografía",
  "Odontología",
  "Hospitalización",
  "Seguimiento clínico",
  "Otros",
];

export type PetPhoto = {
  id: string;
  petId: string;
  title: string;
  category: PetPhotoCategory;
  photoUrl: string;
  photoDate: string;
  veterinarian: string;
  clinicalNotes: string;
  uploadedBy: string;
  clinicId: string;
  createdAt: string;
};

type State = {
  appointments: TenantAppointment[];
  consultations: LinkedConsultation[];
  vaccines: Vaccine[];
  dewormings: Deworming[];
  surgeries: Surgery[];
  surgeryFollowups: SurgeryFollowup[];
  hospitalizations: Hospitalization[];
  hospitalizationProgress: HospitalizationProgress[];
  petFiles: PetFile[];
  petPhotos: PetPhoto[];
};

const CLINIC_A1 = "00000000-0000-0000-0000-0000000000a1";
const ROCKY_ID = "00000000-0000-0000-0000-0000000000b1";
const LUNA_ID = "00000000-0000-0000-0000-0000000000b2";
const NANI_ID = "00000000-0000-0000-0000-0000000000b3";
const MARIA_ID = "00000000-0000-0000-0000-00000000f101";
const JUAN_ID = "00000000-0000-0000-0000-00000000f102";
const GHIULINA_ID = "00000000-0000-0000-0000-00000000f103";

export const SEED_APPOINTMENTS: TenantAppointment[] = [];

export const SEED_CONSULTATIONS: LinkedConsultation[] = [];
export const SEED_VACCINES: Vaccine[] = [];
export const SEED_DEWORMINGS: Deworming[] = [];
export const SEED_SURGERIES: Surgery[] = [];
export const SEED_PET_PHOTOS: PetPhoto[] = [];
export const SEED_HOSPITALIZATIONS: Hospitalization[] = [];

function mergeWithSeed<T extends { id: string }>(fetched: T[], seed: T[]): T[] {
  const ids = new Set(fetched.map((x) => x.id));
  const missingSeed = seed.filter((s) => !ids.has(s.id));
  return [...fetched, ...missingSeed];
}

let state: State = {
  appointments: mergeWithSeed(getLocalAppts(), SEED_APPOINTMENTS),
  consultations: mergeWithSeed(getLocalConsults(), SEED_CONSULTATIONS),
  vaccines: SEED_VACCINES,
  dewormings: SEED_DEWORMINGS,
  surgeries: SEED_SURGERIES,
  surgeryFollowups: [],
  hospitalizations: SEED_HOSPITALIZATIONS,
  hospitalizationProgress: [],
  petFiles: [],
  petPhotos: SEED_PET_PHOTOS,
};

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const emit = () => listeners.forEach((l) => l());
const setState = (updater: (s: State) => State) => {
  state = updater(state);
  emit();
};

// ---------------------------------------------------------------------------
// Hidratación desde Supabase (RLS filtra por las clínicas accesibles; el
// filtro de clínica activa lo aplica useTenantSlice).
// ---------------------------------------------------------------------------
export async function hydrateClinic(_clinicId: string): Promise<void> {
  const [a, c, v, d, su, sf, ho, hp, pf, pp] = await Promise.all([
    db.from("appointments").select("*"),
    db.from("consultations").select("*"),
    db.from("vaccines").select("*"),
    db.from("dewormings").select("*"),
    db.from("surgeries").select("*"),
    db.from("surgery_followups").select("*"),
    db.from("hospitalizations").select("*"),
    db.from("hospitalization_progress").select("*"),
    db.from("pet_files").select("*"),
    db.from("pet_photos").select("*"),
  ]);
  if (
    a.error || c.error || v.error || d.error || su.error ||
    sf.error || ho.error || hp.error || pf.error || pp.error
  ) {
    console.error(
      "[store] hydrate error",
      a.error ?? c.error ?? v.error ?? d.error ?? su.error ??
        sf.error ?? ho.error ?? hp.error ?? pf.error ?? pp.error
    );
  }

  const localAppts = getLocalAppts();
  const localConsults = getLocalConsults();

  setState((s) => ({
    ...s,
    appointments: mergeWithSeed(
      mergeWithSeed(
        (a.data ?? []).map((r) => ({
          id: String(r.id),
          date: toLocalDateStr(r.date),
          time: String(r.time ?? ""),
          clientId: String(r.client_id ?? ""),
          petId: String(r.pet_id ?? ""),
          vetId: String(r.vet_id ?? ""),
          reason: String(r.reason ?? ""),
          status: (r.status as AppointmentStatus) ?? "Pendiente",
          clinicId: String(r.clinic_id),
        })),
        localAppts
      ),
      SEED_APPOINTMENTS
    ),
    consultations: mergeWithSeed(
      mergeWithSeed(
        (c.data ?? []).map((r) => ({
          id: String(r.id),
          date: toLocalDateStr(r.date),
          vetId: String(r.vet_id ?? ""),
          petId: String(r.pet_id ?? ""),
          reason: String(r.reason ?? ""),
          weight: Number(r.weight ?? 0),
          temperature: Number(r.temperature ?? 0),
          diagnosis: String(r.diagnosis ?? ""),
          treatment: String(r.treatment ?? ""),
          medications: String(r.medications ?? ""),
          notes: String(r.notes ?? ""),
          appointmentId: r.appointment_id ? String(r.appointment_id) : undefined,
          clinicId: String(r.clinic_id),
        })),
        localConsults
      ),
      SEED_CONSULTATIONS
    ),
    vaccines: mergeWithSeed(
      (v.data ?? []).map((r) => ({
        id: String(r.id),
        petId: String(r.pet_id ?? ""),
        vaccineName: String(r.vaccine_name ?? ""),
        laboratory: String(r.laboratory ?? ""),
        batchNumber: String(r.batch_number ?? ""),
        applicationDate: String(r.application_date ?? ""),
        nextDueDate: String(r.next_due_date ?? ""),
        veterinarian: String(r.veterinarian ?? ""),
        notes: String(r.notes ?? ""),
        createdAt: String(r.created_at ?? new Date().toISOString()),
        clinicId: String(r.clinic_id),
      })),
      SEED_VACCINES
    ),
    dewormings: mergeWithSeed(
      (d.data ?? []).map((r) => ({
        id: String(r.id),
        petId: String(r.pet_id ?? ""),
        productName: String(r.product_name ?? ""),
        activeIngredient: String(r.active_ingredient ?? ""),
        dewormingType: (r.deworming_type as DewormingType) ?? "Interna",
        applicationDate: String(r.application_date ?? ""),
        nextApplicationDate: String(r.next_application_date ?? ""),
        weight: Number(r.weight ?? 0),
        dose: String(r.dose ?? ""),
        veterinarian: String(r.veterinarian ?? ""),
        notes: String(r.notes ?? ""),
        createdAt: String(r.created_at ?? new Date().toISOString()),
        clinicId: String(r.clinic_id),
      })),
      SEED_DEWORMINGS
    ),
    surgeries: mergeWithSeed(
      (su.data ?? []).map((r) => ({
        id: String(r.id),
        petId: String(r.pet_id ?? ""),
        surgeryDate: String(r.surgery_date ?? ""),
        procedureType: String(r.procedure_type ?? ""),
        veterinarian: String(r.veterinarian ?? ""),
        assistant: String(r.assistant ?? ""),
        preoperativeDiagnosis: String(r.preoperative_diagnosis ?? ""),
        procedurePerformed: String(r.procedure_performed ?? ""),
        anesthesiaType: String(r.anesthesia_type ?? ""),
        medications: String(r.medications ?? ""),
        durationMinutes: Number(r.duration_minutes ?? 0),
        status: (r.status as SurgeryStatus) ?? "Programada",
        observations: String(r.observations ?? ""),
        postoperativeRecommendations: String(r.postoperative_recommendations ?? ""),
        createdAt: String(r.created_at ?? new Date().toISOString()),
        clinicId: String(r.clinic_id),
      })),
      SEED_SURGERIES
    ),
    surgeryFollowups: (sf.data ?? []).map((r) => ({
      id: String(r.id),
      surgeryId: String(r.surgery_id ?? ""),
      followupDate: String(r.followup_date ?? ""),
      veterinarian: String(r.veterinarian ?? ""),
      progressNotes: String(r.progress_notes ?? ""),
      observations: String(r.observations ?? ""),
      createdAt: String(r.created_at ?? new Date().toISOString()),
      clinicId: String(r.clinic_id),
    })),
    hospitalizations: mergeWithSeed(
      (ho.data ?? []).map((r) => ({
        id: String(r.id),
        petId: String(r.pet_id ?? ""),
        admissionDate: String(r.admission_date ?? ""),
        admissionTime: String(r.admission_time ?? ""),
        veterinarian: String(r.veterinarian ?? ""),
        reason: String(r.reason ?? ""),
        initialDiagnosis: String(r.initial_diagnosis ?? ""),
        treatmentPlan: String(r.treatment_plan ?? ""),
        patientStatus: String(r.patient_status ?? ""),
        roomNumber: String(r.room_number ?? ""),
        observations: String(r.observations ?? ""),
        dischargeDate: String(r.discharge_date ?? ""),
        dischargeSummary: String(r.discharge_summary ?? ""),
        ownerInstructions: String(r.owner_instructions ?? ""),
        dischargeMedications: String(r.discharge_medications ?? ""),
        followupDate: String(r.followup_date ?? ""),
        status: (r.status as HospitalizationStatus) ?? "Hospitalizado",
        createdAt: String(r.created_at ?? new Date().toISOString()),
        clinicId: String(r.clinic_id),
      })),
      SEED_HOSPITALIZATIONS
    ),
    hospitalizationProgress: (hp.data ?? []).map((r) => ({
      id: String(r.id),
      hospitalizationId: String(r.hospitalization_id ?? ""),
      progressDate: String(r.progress_date ?? ""),
      progressTime: String(r.progress_time ?? ""),
      veterinarian: String(r.veterinarian ?? ""),
      temperature: String(r.temperature ?? ""),
      weight: String(r.weight ?? ""),
      medicationsAdministered: String(r.medications_administered ?? ""),
      observations: String(r.observations ?? ""),
      createdAt: String(r.created_at ?? new Date().toISOString()),
      clinicId: String(r.clinic_id),
    })),
    petFiles: (pf.data ?? []).map((r) => ({
      id: String(r.id),
      petId: String(r.pet_id ?? ""),
      fileName: String(r.file_name ?? ""),
      fileCategory: (r.file_category as PetFileCategory) ?? "Otros",
      fileUrl: String(r.file_url ?? ""),
      fileSize: Number(r.file_size ?? 0),
      fileType: String(r.file_type ?? ""),
      documentDate: String(r.document_date ?? ""),
      veterinarian: String(r.veterinarian ?? ""),
      description: String(r.description ?? ""),
      uploadedBy: String(r.uploaded_by ?? ""),
      createdAt: String(r.created_at ?? new Date().toISOString()),
      clinicId: String(r.clinic_id),
    })),
    petPhotos: mergeWithSeed(
      (pp.data ?? []).map((r) => ({
        id: String(r.id),
        petId: String(r.pet_id ?? ""),
        title: String(r.title ?? ""),
        category: (r.category as PetPhotoCategory) ?? "General",
        photoUrl: String(r.photo_url ?? ""),
        photoDate: String(r.photo_date ?? ""),
        veterinarian: String(r.veterinarian ?? ""),
        clinicalNotes: String(r.clinical_notes ?? ""),
        uploadedBy: String(r.uploaded_by ?? ""),
        createdAt: String(r.created_at ?? new Date().toISOString()),
        clinicId: String(r.clinic_id),
      })),
      SEED_PET_PHOTOS
    ),
  }));
}
registerHydrator(hydrateClinic);

const getHospitalizations = () => state.hospitalizations;
const getHospitalizationProgress = () => state.hospitalizationProgress;
const getPetFiles = () => state.petFiles;

export const useHospitalizations = () => useTenantSlice(subscribe, getHospitalizations);
export const useAllHospitalizations = () => useSyncExternalStore(subscribe, getHospitalizations, getHospitalizations);
export const useHospitalizationProgress = () => useTenantSlice(subscribe, getHospitalizationProgress);
export const useAllHospitalizationProgress = () => useSyncExternalStore(subscribe, getHospitalizationProgress, getHospitalizationProgress);
export const usePetFiles = () => useTenantSlice(subscribe, getPetFiles);
export const useAllPetFiles = () => useSyncExternalStore(subscribe, getPetFiles, getPetFiles);

export function addHospitalization(h: Omit<Hospitalization, "id" | "createdAt" | "clinicId">) {
  const item: Hospitalization = { ...h, id: crypto.randomUUID(), clinicId: getCurrentClinicId(), createdAt: new Date().toISOString() };
  setState((st) => ({ ...st, hospitalizations: [item, ...st.hospitalizations] }));
  void Promise.resolve(db.from("hospitalizations").insert({
    id: item.id,
    clinic_id: item.clinicId,
    pet_id: item.petId,
    admission_date: item.admissionDate || null,
    admission_time: item.admissionTime,
    veterinarian: item.veterinarian,
    reason: item.reason,
    initial_diagnosis: item.initialDiagnosis,
    treatment_plan: item.treatmentPlan,
    patient_status: item.patientStatus,
    room_number: item.roomNumber,
    observations: item.observations,
    discharge_date: item.dischargeDate || null,
    discharge_summary: item.dischargeSummary,
    owner_instructions: item.ownerInstructions,
    discharge_medications: item.dischargeMedications,
    followup_date: item.followupDate || null,
    status: item.status,
    created_at: item.createdAt,
  })).then(() => {}).catch((e) => console.error(e));
  return item;
}
export function updateHospitalization(id: string, patch: Partial<Hospitalization>) {
  setState((st) => ({
    ...st,
    hospitalizations: st.hospitalizations.map((h) => (h.id === id ? { ...h, ...patch } : h)),
  }));
  const row: Record<string, unknown> = {};
  if (patch.petId !== undefined) row.pet_id = patch.petId;
  if (patch.admissionDate !== undefined) row.admission_date = patch.admissionDate || null;
  if (patch.admissionTime !== undefined) row.admission_time = patch.admissionTime;
  if (patch.veterinarian !== undefined) row.veterinarian = patch.veterinarian;
  if (patch.reason !== undefined) row.reason = patch.reason;
  if (patch.initialDiagnosis !== undefined) row.initial_diagnosis = patch.initialDiagnosis;
  if (patch.treatmentPlan !== undefined) row.treatment_plan = patch.treatmentPlan;
  if (patch.patientStatus !== undefined) row.patient_status = patch.patientStatus;
  if (patch.roomNumber !== undefined) row.room_number = patch.roomNumber;
  if (patch.observations !== undefined) row.observations = patch.observations;
  if (patch.dischargeDate !== undefined) row.discharge_date = patch.dischargeDate || null;
  if (patch.dischargeSummary !== undefined) row.discharge_summary = patch.dischargeSummary;
  if (patch.ownerInstructions !== undefined) row.owner_instructions = patch.ownerInstructions;
  if (patch.dischargeMedications !== undefined) row.discharge_medications = patch.dischargeMedications;
  if (patch.followupDate !== undefined) row.followup_date = patch.followupDate || null;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.clinicId !== undefined) row.clinic_id = patch.clinicId;
  if (patch.createdAt !== undefined) row.created_at = patch.createdAt;
  void Promise.resolve(db.from("hospitalizations").update(row).eq("id", id)).then(() => {}).catch((e) => console.error(e));
}
export function deleteHospitalization(id: string) {
  setState((st) => ({
    ...st,
    hospitalizations: st.hospitalizations.filter((h) => h.id !== id),
    hospitalizationProgress: st.hospitalizationProgress.filter((p) => p.hospitalizationId !== id),
  }));
  void Promise.resolve(db.from("hospitalizations").delete().eq("id", id)).then(() => {}).catch((e) => console.error(e));
}
export function dischargeHospitalization(
  id: string,
  data: {
    dischargeDate: string;
    dischargeSummary: string;
    ownerInstructions: string;
    dischargeMedications: string;
    followupDate: string;
    followupTime?: string;
  }
) {
  updateHospitalization(id, { ...data, status: "Alta médica" });
}
export function addHospitalizationProgress(p: Omit<HospitalizationProgress, "id" | "createdAt" | "clinicId">) {
  const item: HospitalizationProgress = { ...p, id: crypto.randomUUID(), clinicId: getCurrentClinicId(), createdAt: new Date().toISOString() };
  setState((st) => ({ ...st, hospitalizationProgress: [item, ...st.hospitalizationProgress] }));
  void Promise.resolve(db.from("hospitalization_progress").insert({
    id: item.id,
    clinic_id: item.clinicId,
    hospitalization_id: item.hospitalizationId,
    progress_date: item.progressDate || null,
    progress_time: item.progressTime,
    veterinarian: item.veterinarian,
    temperature: item.temperature,
    weight: item.weight,
    medications_administered: item.medicationsAdministered,
    observations: item.observations,
    created_at: item.createdAt,
  })).then(() => {}).catch((e) => console.error(e));
  return item;
}
export function deleteHospitalizationProgress(id: string) {
  setState((st) => ({ ...st, hospitalizationProgress: st.hospitalizationProgress.filter((p) => p.id !== id) }));
  void Promise.resolve(db.from("hospitalization_progress").delete().eq("id", id)).then(() => {}).catch((e) => console.error(e));
}

export function addPetFile(f: Omit<PetFile, "id" | "createdAt" | "clinicId">) {
  const item: PetFile = { ...f, id: crypto.randomUUID(), clinicId: getCurrentClinicId(), createdAt: new Date().toISOString() };
  setState((st) => ({ ...st, petFiles: [item, ...st.petFiles] }));
  void Promise.resolve(db.from("pet_files").insert({
    id: item.id,
    clinic_id: item.clinicId,
    pet_id: item.petId,
    file_name: item.fileName,
    file_category: item.fileCategory,
    file_url: item.fileUrl,
    file_size: Number(item.fileSize),
    file_type: item.fileType,
    document_date: item.documentDate || null,
    veterinarian: item.veterinarian,
    description: item.description,
    uploaded_by: item.uploadedBy,
    created_at: item.createdAt,
  })).then(() => {}).catch((e) => console.error(e));
  return item;
}
export function updatePetFile(id: string, patch: Partial<PetFile>) {
  setState((st) => ({
    ...st,
    petFiles: st.petFiles.map((f) => (f.id === id ? { ...f, ...patch } : f)),
  }));
  const row: Record<string, unknown> = {};
  if (patch.petId !== undefined) row.pet_id = patch.petId;
  if (patch.fileName !== undefined) row.file_name = patch.fileName;
  if (patch.fileCategory !== undefined) row.file_category = patch.fileCategory;
  if (patch.fileUrl !== undefined) row.file_url = patch.fileUrl;
  if (patch.fileSize !== undefined) row.file_size = Number(patch.fileSize);
  if (patch.fileType !== undefined) row.file_type = patch.fileType;
  if (patch.documentDate !== undefined) row.document_date = patch.documentDate || null;
  if (patch.veterinarian !== undefined) row.veterinarian = patch.veterinarian;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.uploadedBy !== undefined) row.uploaded_by = patch.uploadedBy;
  if (patch.clinicId !== undefined) row.clinic_id = patch.clinicId;
  if (patch.createdAt !== undefined) row.created_at = patch.createdAt;
  void Promise.resolve(db.from("pet_files").update(row).eq("id", id)).then(() => {}).catch((e) => console.error(e));
}
export function deletePetFile(id: string) {
  setState((st) => ({ ...st, petFiles: st.petFiles.filter((f) => f.id !== id) }));
  void Promise.resolve(db.from("pet_files").delete().eq("id", id)).then(() => {}).catch((e) => console.error(e));
}

const getPetPhotos = () => state.petPhotos;
export const usePetPhotos = () => useTenantSlice(subscribe, getPetPhotos);
export const useAllPetPhotos = () => useSyncExternalStore(subscribe, getPetPhotos, getPetPhotos);
export function addPetPhoto(p: Omit<PetPhoto, "id" | "createdAt" | "clinicId">) {
  const item: PetPhoto = { ...p, id: crypto.randomUUID(), clinicId: getCurrentClinicId(), createdAt: new Date().toISOString() };
  setState((st) => ({ ...st, petPhotos: [item, ...st.petPhotos] }));
  void Promise.resolve(db.from("pet_photos").insert({
    id: item.id,
    clinic_id: item.clinicId,
    pet_id: item.petId,
    title: item.title,
    category: item.category,
    photo_url: item.photoUrl,
    photo_date: item.photoDate || null,
    veterinarian: item.veterinarian,
    clinical_notes: item.clinicalNotes,
    uploaded_by: item.uploadedBy,
    created_at: item.createdAt,
  })).then(() => {}).catch((e) => console.error(e));
  return item;
}
export function updatePetPhoto(id: string, patch: Partial<PetPhoto>) {
  setState((st) => ({
    ...st,
    petPhotos: st.petPhotos.map((p) => (p.id === id ? { ...p, ...patch } : p)),
  }));
  const row: Record<string, unknown> = {};
  if (patch.petId !== undefined) row.pet_id = patch.petId;
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.photoUrl !== undefined) row.photo_url = patch.photoUrl;
  if (patch.photoDate !== undefined) row.photo_date = patch.photoDate || null;
  if (patch.veterinarian !== undefined) row.veterinarian = patch.veterinarian;
  if (patch.clinicalNotes !== undefined) row.clinical_notes = patch.clinicalNotes;
  if (patch.uploadedBy !== undefined) row.uploaded_by = patch.uploadedBy;
  if (patch.clinicId !== undefined) row.clinic_id = patch.clinicId;
  if (patch.createdAt !== undefined) row.created_at = patch.createdAt;
  void Promise.resolve(db.from("pet_photos").update(row).eq("id", id)).then(() => {}).catch((e) => console.error(e));
}
export function deletePetPhoto(id: string) {
  setState((st) => ({ ...st, petPhotos: st.petPhotos.filter((p) => p.id !== id) }));
  void Promise.resolve(db.from("pet_photos").delete().eq("id", id)).then(() => {}).catch((e) => console.error(e));
}

const getAppointments = () => state.appointments;
const getConsultations = () => state.consultations;
const getVaccines = () => state.vaccines;
const getDewormings = () => state.dewormings;
const getSurgeries = () => state.surgeries;
const getSurgeryFollowups = () => state.surgeryFollowups;

export const useAppointments = () => useTenantSlice(subscribe, getAppointments);
export const useAllAppointments = () => useSyncExternalStore(subscribe, getAppointments, getAppointments);
export const useConsultations = () => useTenantSlice(subscribe, getConsultations);
export const useAllConsultations = () => useSyncExternalStore(subscribe, getConsultations, getConsultations);
export const useVaccines = () => useTenantSlice(subscribe, getVaccines);
export const useAllVaccines = () => useSyncExternalStore(subscribe, getVaccines, getVaccines);
export const useDewormings = () => useTenantSlice(subscribe, getDewormings);
export const useAllDewormings = () => useSyncExternalStore(subscribe, getDewormings, getDewormings);
export const useSurgeries = () => useTenantSlice(subscribe, getSurgeries);
export const useAllSurgeries = () => useSyncExternalStore(subscribe, getSurgeries, getSurgeries);
export const useSurgeryFollowups = () => useTenantSlice(subscribe, getSurgeryFollowups);
export const useAllSurgeryFollowups = () => useSyncExternalStore(subscribe, getSurgeryFollowups, getSurgeryFollowups);

export function addSurgery(s: Omit<Surgery, "id" | "createdAt" | "clinicId">) {
  const item: Surgery = { ...s, id: crypto.randomUUID(), clinicId: getCurrentClinicId(), createdAt: new Date().toISOString() };
  setState((st) => ({ ...st, surgeries: [item, ...st.surgeries] }));
  void Promise.resolve(db.from("surgeries").insert({
    id: item.id,
    clinic_id: item.clinicId,
    pet_id: item.petId,
    surgery_date: item.surgeryDate || null,
    procedure_type: item.procedureType,
    veterinarian: item.veterinarian,
    assistant: item.assistant,
    preoperative_diagnosis: item.preoperativeDiagnosis,
    procedure_performed: item.procedurePerformed,
    anesthesia_type: item.anesthesiaType,
    medications: item.medications,
    duration_minutes: Number(item.durationMinutes),
    status: item.status,
    observations: item.observations,
    postoperative_recommendations: item.postoperativeRecommendations,
    created_at: item.createdAt,
  })).then(() => {}).catch((e) => console.error(e));
  return item;
}
export function updateSurgery(id: string, patch: Partial<Surgery>) {
  setState((st) => ({
    ...st,
    surgeries: st.surgeries.map((s) => (s.id === id ? { ...s, ...patch } : s)),
  }));
  const row: Record<string, unknown> = {};
  if (patch.petId !== undefined) row.pet_id = patch.petId;
  if (patch.surgeryDate !== undefined) row.surgery_date = patch.surgeryDate || null;
  if (patch.procedureType !== undefined) row.procedure_type = patch.procedureType;
  if (patch.veterinarian !== undefined) row.veterinarian = patch.veterinarian;
  if (patch.assistant !== undefined) row.assistant = patch.assistant;
  if (patch.preoperativeDiagnosis !== undefined) row.preoperative_diagnosis = patch.preoperativeDiagnosis;
  if (patch.procedurePerformed !== undefined) row.procedure_performed = patch.procedurePerformed;
  if (patch.anesthesiaType !== undefined) row.anesthesia_type = patch.anesthesiaType;
  if (patch.medications !== undefined) row.medications = patch.medications;
  if (patch.durationMinutes !== undefined) row.duration_minutes = Number(patch.durationMinutes);
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.observations !== undefined) row.observations = patch.observations;
  if (patch.postoperativeRecommendations !== undefined) row.postoperative_recommendations = patch.postoperativeRecommendations;
  if (patch.clinicId !== undefined) row.clinic_id = patch.clinicId;
  if (patch.createdAt !== undefined) row.created_at = patch.createdAt;
  void Promise.resolve(db.from("surgeries").update(row).eq("id", id)).then(() => {}).catch((e) => console.error(e));
}
export function deleteSurgery(id: string) {
  setState((st) => ({
    ...st,
    surgeries: st.surgeries.filter((s) => s.id !== id),
    surgeryFollowups: st.surgeryFollowups.filter((f) => f.surgeryId !== id),
  }));
  void Promise.resolve(db.from("surgeries").delete().eq("id", id)).then(() => {}).catch((e) => console.error(e));
}
export function addSurgeryFollowup(f: Omit<SurgeryFollowup, "id" | "createdAt" | "clinicId">) {
  const item: SurgeryFollowup = { ...f, id: crypto.randomUUID(), clinicId: getCurrentClinicId(), createdAt: new Date().toISOString() };
  setState((st) => ({ ...st, surgeryFollowups: [item, ...st.surgeryFollowups] }));
  void Promise.resolve(db.from("surgery_followups").insert({
    id: item.id,
    clinic_id: item.clinicId,
    surgery_id: item.surgeryId,
    followup_date: item.followupDate || null,
    veterinarian: item.veterinarian,
    progress_notes: item.progressNotes,
    observations: item.observations,
    created_at: item.createdAt,
  })).then(() => {}).catch((e) => console.error(e));
  return item;
}
export function deleteSurgeryFollowup(id: string) {
  setState((st) => ({ ...st, surgeryFollowups: st.surgeryFollowups.filter((f) => f.id !== id) }));
  void Promise.resolve(db.from("surgery_followups").delete().eq("id", id)).then(() => {}).catch((e) => console.error(e));
}

export function addDeworming(d: Omit<Deworming, "id" | "createdAt" | "clinicId">) {
  const item: Deworming = { ...d, id: crypto.randomUUID(), clinicId: getCurrentClinicId(), createdAt: new Date().toISOString() };
  setState((s) => ({ ...s, dewormings: [item, ...s.dewormings] }));
  void Promise.resolve(db.from("dewormings").insert({
    id: item.id,
    clinic_id: item.clinicId,
    pet_id: item.petId,
    product_name: item.productName,
    active_ingredient: item.activeIngredient,
    deworming_type: item.dewormingType,
    application_date: item.applicationDate || null,
    next_application_date: item.nextApplicationDate || null,
    weight: Number(item.weight),
    dose: item.dose,
    veterinarian: item.veterinarian,
    notes: item.notes,
    created_at: item.createdAt,
  })).then(() => {}).catch((e) => console.error(e));
  return item;
}
export function updateDeworming(id: string, patch: Partial<Deworming>) {
  setState((s) => ({
    ...s,
    dewormings: s.dewormings.map((d) => (d.id === id ? { ...d, ...patch } : d)),
  }));
  const row: Record<string, unknown> = {};
  if (patch.petId !== undefined) row.pet_id = patch.petId;
  if (patch.productName !== undefined) row.product_name = patch.productName;
  if (patch.activeIngredient !== undefined) row.active_ingredient = patch.activeIngredient;
  if (patch.dewormingType !== undefined) row.deworming_type = patch.dewormingType;
  if (patch.applicationDate !== undefined) row.application_date = patch.applicationDate || null;
  if (patch.nextApplicationDate !== undefined) row.next_application_date = patch.nextApplicationDate || null;
  if (patch.weight !== undefined) row.weight = Number(patch.weight);
  if (patch.dose !== undefined) row.dose = patch.dose;
  if (patch.veterinarian !== undefined) row.veterinarian = patch.veterinarian;
  if (patch.notes !== undefined) row.notes = patch.notes;
  if (patch.clinicId !== undefined) row.clinic_id = patch.clinicId;
  if (patch.createdAt !== undefined) row.created_at = patch.createdAt;
  void Promise.resolve(db.from("dewormings").update(row).eq("id", id)).then(() => {}).catch((e) => console.error(e));
}
export function deleteDeworming(id: string) {
  setState((s) => ({ ...s, dewormings: s.dewormings.filter((d) => d.id !== id) }));
  void Promise.resolve(db.from("dewormings").delete().eq("id", id)).then(() => {}).catch((e) => console.error(e));
}

export type DewormingStatus = "Vigente" | "Próxima a vencer" | "Vencida";
export function getDewormingStatus(nextDate: string): { label: DewormingStatus; daysLeft: number } {
  if (!nextDate) return { label: "Vigente", daysLeft: Infinity };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(nextDate);
  const daysLeft = Math.ceil((due.getTime() - today.getTime()) / 86400000);
  if (daysLeft < 0) return { label: "Vencida", daysLeft };
  if (daysLeft <= 15) return { label: "Próxima a vencer", daysLeft };
  return { label: "Vigente", daysLeft };
}

export function addVaccine(v: Omit<Vaccine, "id" | "createdAt" | "clinicId">) {
  const vaccine: Vaccine = { ...v, id: crypto.randomUUID(), clinicId: getCurrentClinicId(), createdAt: new Date().toISOString() };
  setState((s) => ({ ...s, vaccines: [vaccine, ...s.vaccines] }));
  void Promise.resolve(db.from("vaccines").insert({
    id: vaccine.id,
    clinic_id: vaccine.clinicId,
    pet_id: vaccine.petId,
    vaccine_name: vaccine.vaccineName,
    laboratory: vaccine.laboratory,
    batch_number: vaccine.batchNumber,
    application_date: vaccine.applicationDate || null,
    next_due_date: vaccine.nextDueDate || null,
    veterinarian: vaccine.veterinarian,
    notes: vaccine.notes,
    created_at: vaccine.createdAt,
  })).then(() => {}).catch((e) => console.error(e));
  return vaccine;
}
export function updateVaccine(id: string, patch: Partial<Vaccine>) {
  setState((s) => ({
    ...s,
    vaccines: s.vaccines.map((v) => (v.id === id ? { ...v, ...patch } : v)),
  }));
  const row: Record<string, unknown> = {};
  if (patch.petId !== undefined) row.pet_id = patch.petId;
  if (patch.vaccineName !== undefined) row.vaccine_name = patch.vaccineName;
  if (patch.laboratory !== undefined) row.laboratory = patch.laboratory;
  if (patch.batchNumber !== undefined) row.batch_number = patch.batchNumber;
  if (patch.applicationDate !== undefined) row.application_date = patch.applicationDate || null;
  if (patch.nextDueDate !== undefined) row.next_due_date = patch.nextDueDate || null;
  if (patch.veterinarian !== undefined) row.veterinarian = patch.veterinarian;
  if (patch.notes !== undefined) row.notes = patch.notes;
  if (patch.clinicId !== undefined) row.clinic_id = patch.clinicId;
  if (patch.createdAt !== undefined) row.created_at = patch.createdAt;
  void Promise.resolve(db.from("vaccines").update(row).eq("id", id)).then(() => {}).catch((e) => console.error(e));
}
export function deleteVaccine(id: string) {
  setState((s) => ({ ...s, vaccines: s.vaccines.filter((v) => v.id !== id) }));
  void Promise.resolve(db.from("vaccines").delete().eq("id", id)).then(() => {}).catch((e) => console.error(e));
}

export type VaccineStatus = "Vigente" | "Próxima a vencer" | "Vencida";
export function getVaccineStatus(nextDueDate: string): { label: VaccineStatus; daysLeft: number } {
  if (!nextDueDate) return { label: "Vigente", daysLeft: Infinity };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(nextDueDate);
  const daysLeft = Math.ceil((due.getTime() - today.getTime()) / 86400000);
  if (daysLeft < 0) return { label: "Vencida", daysLeft };
  if (daysLeft <= 30) return { label: "Próxima a vencer", daysLeft };
  return { label: "Vigente", daysLeft };
}

export function addAppointment(a: Appointment) {
  const finalId = asUUID(a.id);
  const finalDate = toLocalDateStr(a.date);
  const item: TenantAppointment = {
    ...a,
    id: finalId,
    date: finalDate,
    clinicId: getCurrentClinicId(),
  };

  saveLocalAppt(item);
  setState((s) => ({
    ...s,
    appointments: [item, ...s.appointments.filter((x) => x.id !== item.id)],
  }));

  void Promise.resolve(
    db.from("appointments").insert({
      id: item.id,
      clinic_id: item.clinicId,
      date: item.date,
      time: item.time,
      client_id: item.clientId ? asUUID(item.clientId) : null,
      pet_id: item.petId ? asUUID(item.petId) : null,
      vet_id: item.vetId || null,
      reason: item.reason,
      status: item.status,
    })
  ).then((res) => {
    if (res?.error) console.error("[store] Supabase appointment insert error:", res.error);
  }).catch((e) => console.error(e));
}

export function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  setState((s) => {
    const updated = s.appointments.map((a) => (a.id === id ? { ...a, status } : a));
    const target = updated.find((a) => a.id === id);
    if (target) saveLocalAppt(target);
    return { ...s, appointments: updated };
  });
  void Promise.resolve(db.from("appointments").update({ status }).eq("id", id)).then(() => {}).catch((e) => console.error(e));
}

export function updateAppointment(id: string, patch: Partial<Appointment>) {
  setState((s) => {
    const updated = s.appointments.map((a) => (a.id === id ? { ...a, ...patch } : a));
    const target = updated.find((a) => a.id === id);
    if (target) saveLocalAppt(target);
    return { ...s, appointments: updated };
  });
  const row: Record<string, unknown> = {};
  if (patch.date !== undefined) row.date = toLocalDateStr(patch.date);
  if (patch.time !== undefined) row.time = patch.time;
  if (patch.clientId !== undefined) row.client_id = patch.clientId ? asUUID(patch.clientId) : null;
  if (patch.petId !== undefined) row.pet_id = patch.petId ? asUUID(patch.petId) : null;
  if (patch.vetId !== undefined) row.vet_id = patch.vetId;
  if (patch.reason !== undefined) row.reason = patch.reason;
  if (patch.status !== undefined) row.status = patch.status;
  void Promise.resolve(db.from("appointments").update(row).eq("id", id)).then(() => {}).catch((e) => console.error(e));
}

export function deleteAppointment(id: string) {
  if (typeof window !== "undefined") {
    try {
      const filtered = getLocalAppts().filter((x) => x.id !== id);
      localStorage.setItem("go2vet_appointments_v2", JSON.stringify(filtered));
    } catch {}
  }
  setState((s) => ({ ...s, appointments: s.appointments.filter((a) => a.id !== id) }));
  void Promise.resolve(db.from("appointments").delete().eq("id", id)).then(() => {}).catch((e) => console.error(e));
}

export function updateConsultation(id: string, patch: Partial<LinkedConsultation>) {
  setState((s) => {
    const updated = s.consultations.map((c) => (c.id === id ? { ...c, ...patch } : c));
    const target = updated.find((c) => c.id === id);
    if (target) saveLocalConsult(target);
    return { ...s, consultations: updated };
  });
  const row: Record<string, unknown> = {};
  if (patch.date !== undefined) row.date = toLocalDateStr(patch.date);
  if (patch.vetId !== undefined) row.vet_id = patch.vetId;
  if (patch.petId !== undefined) row.pet_id = patch.petId ? asUUID(patch.petId) : null;
  if (patch.reason !== undefined) row.reason = patch.reason;
  if (patch.weight !== undefined) row.weight = Number(patch.weight);
  if (patch.temperature !== undefined) row.temperature = Number(patch.temperature);
  if (patch.diagnosis !== undefined) row.diagnosis = patch.diagnosis;
  if (patch.treatment !== undefined) row.treatment = patch.treatment;
  if (patch.medications !== undefined) row.medications = patch.medications;
  if (patch.notes !== undefined) row.notes = patch.notes;
  if (patch.appointmentId !== undefined) row.appointment_id = patch.appointmentId ? asUUID(patch.appointmentId) : null;
  if (patch.clinicId !== undefined) row.clinic_id = patch.clinicId;
  void Promise.resolve(db.from("consultations").update(row).eq("id", id)).then(() => {}).catch((e) => console.error(e));
}

export function deleteConsultation(id: string) {
  if (typeof window !== "undefined") {
    try {
      const filtered = getLocalConsults().filter((x) => x.id !== id);
      localStorage.setItem("go2vet_consultations_v1", JSON.stringify(filtered));
    } catch {}
  }
  setState((s) => ({ ...s, consultations: s.consultations.filter((c) => c.id !== id) }));
  void Promise.resolve(db.from("consultations").delete().eq("id", id)).then(() => {}).catch((e) => console.error(e));
}

export function addConsultation(c: Omit<LinkedConsultation, "clinicId"> & { clientId?: string }) {
  const clinicId = getCurrentClinicId();
  const finalId = asUUID(c.id);
  const finalDate = toLocalDateStr(c.date);
  let appointmentId = c.appointmentId ? asUUID(c.appointmentId) : undefined;
  const s = state;
  let newAppointment: TenantAppointment | null = null;

  if (!appointmentId) {
    const existing = s.appointments.find(
      (a) => a.petId === c.petId && a.date === finalDate && a.status !== "Cancelada"
    );
    if (existing) {
      appointmentId = existing.id;
    } else {
      const pet = s.pets.find((p) => p.id === c.petId);
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      newAppointment = {
        id: asUUID(),
        clinicId,
        date: finalDate,
        time: timeStr,
        clientId: c.clientId || pet?.clientId || "",
        petId: c.petId,
        vetId: c.vetId,
        reason: c.reason || "Consulta médica",
        status: "Finalizada",
      };
      appointmentId = newAppointment.id;
      saveLocalAppt(newAppointment);
    }
  }

  const item: LinkedConsultation = {
    ...c,
    id: finalId,
    date: finalDate,
    appointmentId,
    clinicId,
  };
  saveLocalConsult(item);

  setState((st) => ({
    ...st,
    consultations: [item, ...st.consultations.filter((x) => x.id !== item.id)],
    appointments: newAppointment
      ? [newAppointment, ...st.appointments.filter((x) => x.id !== newAppointment.id)]
      : appointmentId
      ? st.appointments.map((a) => (a.id === appointmentId ? { ...a, status: "Finalizada" as AppointmentStatus } : a))
      : st.appointments,
  }));

  if (newAppointment) {
    void Promise.resolve(
      db.from("appointments").insert({
        id: newAppointment.id,
        clinic_id: newAppointment.clinicId,
        date: newAppointment.date,
        time: newAppointment.time,
        client_id: newAppointment.clientId ? asUUID(newAppointment.clientId) : null,
        pet_id: newAppointment.petId ? asUUID(newAppointment.petId) : null,
        vet_id: newAppointment.vetId || null,
        reason: newAppointment.reason,
        status: newAppointment.status,
      })
    ).then((res) => {
      if (res?.error) console.error("[store] appointment insert error:", res.error);
    }).catch((e) => console.error(e));
  } else if (appointmentId) {
    void Promise.resolve(db.from("appointments").update({ status: "Finalizada" }).eq("id", appointmentId)).catch((e) => console.error(e));
  }

  void Promise.resolve(
    db.from("consultations").insert({
      id: item.id,
      clinic_id: item.clinicId,
      date: item.date,
      vet_id: item.vetId || null,
      pet_id: item.petId ? asUUID(item.petId) : null,
      reason: item.reason,
      weight: Number(item.weight),
      temperature: Number(item.temperature),
      diagnosis: item.diagnosis,
      treatment: item.treatment,
      medications: item.medications,
      notes: item.notes,
      appointment_id: item.appointmentId ? asUUID(item.appointmentId) : null,
    })
  ).then((res) => {
    if (res?.error) console.error("[store] consultation insert error:", res.error);
  }).catch((e) => console.error(e));
}
export function addConsultationFromAppointment(
  c: Omit<LinkedConsultation, "id" | "appointmentId" | "clinicId">,
  appointmentId: string
) {
  const consultation: LinkedConsultation = {
    ...c,
    id: crypto.randomUUID(),
    appointmentId,
    clinicId: getCurrentClinicId(),
  };
  setState((s) => ({
    ...s,
    consultations: [consultation, ...s.consultations],
    appointments: s.appointments.map((a) =>
      a.id === appointmentId ? { ...a, status: "Finalizada" as AppointmentStatus } : a
    ),
  }));
  void Promise.resolve(db.from("consultations").insert({
    id: consultation.id,
    clinic_id: consultation.clinicId,
    date: consultation.date,
    vet_id: consultation.vetId,
    pet_id: consultation.petId,
    reason: consultation.reason,
    weight: Number(consultation.weight),
    temperature: Number(consultation.temperature),
    diagnosis: consultation.diagnosis,
    treatment: consultation.treatment,
    medications: consultation.medications,
    notes: consultation.notes,
    appointment_id: consultation.appointmentId || null,
  })).then(() => {}).catch((e) => console.error(e));
  void Promise.resolve(db.from("appointments").update({ status: "Finalizada" }).eq("id", appointmentId)).then(() => {}).catch((e) => console.error(e));
  return consultation;
}
