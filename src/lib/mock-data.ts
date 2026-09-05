// Definiciones de TIPOS compartidas por la app. No hay datos hardcodeados aquí:
// todos los datos de muestra viven en la BD (migraciones Supabase) y la app los
// lee/escribe vía las capas de datos (lib/*-store.ts).

export type Role = "super" | "admin" | "vet" | "reception";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type Client = {
  id: string;
  fullName: string;
  identification: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  registeredAt: string;
  notes: string;
  avatarUrl?: string;
};

export type Pet = {
  id: string;
  photo: string;
  name: string;
  species: string;
  breed: string;
  sex: "Macho" | "Hembra";
  color: string;
  birthDate: string;
  weight: number;
  microchip: string;
  sterilized: boolean;
  allergies: string;
  notes: string;
  clientId: string;
};

export type AppointmentStatus =
  | "Pendiente"
  | "Confirmada"
  | "En atención"
  | "Finalizada"
  | "Cancelada";

export type Appointment = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  clientId: string;
  petId: string;
  vetId: string;
  reason: string;
  status: AppointmentStatus;
};

export type Consultation = {
  id: string;
  date: string;
  vetId: string;
  petId: string;
  reason: string;
  weight: number;
  temperature: number;
  diagnosis: string;
  treatment: string;
  medications: string;
  notes: string;
};
