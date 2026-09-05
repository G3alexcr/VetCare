import { useSyncExternalStore } from "react";
import { db } from "./supabase";
import { registerHydrator, type DbRow } from "./db-hooks";

export type SubscriptionStatus = "Activa" | "Prueba" | "Suspendida" | "Cancelada";
export type Clinic = {
  id: string;
  name: string;
  legalName: string;
  taxId: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  country: string;
  logoUrl: string;
  timezone: string;
  currency: string;
  subscriptionPlanId: string;
  subscriptionStatus: SubscriptionStatus;
  subdomain?: string;
  createdAt: string;
  // AI & Emergency Configuration
  aiProvider?: "openai" | "gemini";
  aiApiKey?: string;
  aiModel?: string;
  emergencyPhone?: string;
  // extended settings
  openingHours: string;
  specialties: string[];
  socials: { facebook?: string; instagram?: string; tiktok?: string; web?: string };
  brandColor: string;
};

export type SubscriptionPlan = {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  maxUsers: number;
  maxStorageGb: number;
  maxPets: number;
  maxBranches: number;
  aiEnabled: boolean;
  whatsappEnabled: boolean;
  posEnabled: boolean;
  tiendaOnlineEnabled: boolean;
  maxProducts: number;
  maxVeterinarios: number;
  createdAt: string;
};

export type Subscription = {
  id: string;
  clinicId: string;
  planId: string;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
  renewalType: "Mensual" | "Anual";
};

export type Branch = {
  id: string;
  clinicId: string;
  name: string;
  address: string;
  phone: string;
  manager: string;
};

export type SaasRole =
  | "Owner"
  | "Administrador"
  | "Veterinario"
  | "Recepción"
  | "Asistente"
  | "Inventario"
  | "Caja"
  | "Super Administrador";

export type ClinicUser = {
  id: string;
  clinicId: string; // clínica principal
  clinicIds: string[]; // todas las clínicas que administra
  name: string;
  email: string;
  role: SaasRole;
  active: boolean;
};

type State = {
  clinics: Clinic[];
  plans: SubscriptionPlan[];
  subscriptions: Subscription[];
  branches: Branch[];
  users: ClinicUser[];
  currentClinicId: string;
  actingClinicId: string | null; // Super Admin "dentro" de una clínica
};

let state: State = {
  clinics: [],
  plans: [],
  subscriptions: [],
  branches: [],
  users: [],
  currentClinicId: "",
  actingClinicId: null,
};

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
const emit = () => listeners.forEach((l) => l());
const setState = (u: (s: State) => State) => { state = u(state); emit(); };

// ---------------------------------------------------------------------------
// Mapeo DB → tipos de la app
// ---------------------------------------------------------------------------
function mapClinic(r: DbRow): Clinic {
  return {
    id: String(r.id),
    name: String(r.name ?? ""),
    legalName: String(r.legal_name ?? ""),
    taxId: String(r.tax_id ?? ""),
    email: String(r.email ?? ""),
    phone: String(r.phone ?? ""),
    whatsapp: String(r.whatsapp ?? ""),
    address: String(r.address ?? ""),
    city: String(r.city ?? ""),
    country: String(r.country ?? "Costa Rica"),
    logoUrl: String(r.logo_url ?? ""),
    timezone: String(r.timezone ?? "America/Costa_Rica"),
    currency: String(r.currency ?? "CRC"),
    subscriptionPlanId: String(r.plan_id ?? ""),
    subscriptionStatus: (r.subscription_status as SubscriptionStatus) ?? "Prueba",
    subdomain: String(r.subdomain ?? ""),
    createdAt: String(r.created_at ?? new Date().toISOString()),
    aiProvider: (r.ai_provider as Clinic["aiProvider"]) ?? "openai",
    aiApiKey: String(r.ai_api_key ?? ""),
    aiModel: String(
      r.ai_model && !String(r.ai_model).includes("gpt-5") && !String(r.ai_model).includes("sol")
        ? r.ai_model
        : "gpt-4o-mini"
    ),
    emergencyPhone: String(r.emergency_phone ?? "+506 2222-9999"),
    openingHours: String(r.opening_hours ?? ""),
    specialties: Array.isArray(r.specialties) ? (r.specialties as string[]) : [],
    socials: (r.socials as Clinic["socials"]) ?? {},
    brandColor: String(r.brand_color ?? "#009d9e"),
  };
}

function mapPlan(r: DbRow): SubscriptionPlan {
  return {
    id: String(r.id),
    name: String(r.name ?? ""),
    monthlyPrice: Number(r.monthly_price ?? 0),
    annualPrice: Number(r.annual_price ?? 0),
    maxUsers: Number(r.max_users ?? 0),
    maxStorageGb: Number(r.max_storage_gb ?? 0),
    maxPets: Number(r.max_pets ?? 0),
    maxBranches: Number(r.max_branches ?? 0),
    aiEnabled: Boolean(r.ai_enabled),
    whatsappEnabled: Boolean(r.whatsapp_enabled),
    posEnabled: Boolean(r.pos_enabled),
    tiendaOnlineEnabled: Boolean(r.tienda_online_enabled),
    maxProducts: Number(r.max_products ?? 0),
    maxVeterinarios: Number(r.max_veterinarios ?? 0),
    createdAt: String(r.created_at ?? new Date().toISOString()),
  };
}

// Las suscripciones se derivan de clinics (plan_id + subscription_status).
function deriveSubscription(c: Clinic): Subscription {
  return {
    id: `sub_${c.id}`,
    clinicId: c.id,
    planId: c.subscriptionPlanId,
    startDate: c.createdAt,
    endDate: new Date(new Date(c.createdAt).getTime() + 30 * 86400000).toISOString(),
    status: c.subscriptionStatus,
    renewalType: "Mensual",
  };
}

const SAAS_ROLE_MAP: Record<string, SaasRole> = {
  "Super Administrador": "Super Administrador",
  Owner: "Owner",
  Administrador: "Administrador",
  "Administrativo": "Administrador",
  Veterinario: "Veterinario",
  "Recepción": "Recepción",
  Caja: "Caja",
  Inventario: "Inventario",
  Asistente: "Asistente",
};

// Agrupa clinic_members por user_id para construir los usuarios de la plataforma.
function mapUsers(rows: DbRow[]): ClinicUser[] {
  const byUser = new Map<string, { clinicIds: Set<string>; rows: DbRow[] }>();
  for (const r of rows) {
    const uid = String(r.user_id);
    if (!byUser.has(uid)) byUser.set(uid, { clinicIds: new Set(), rows: [] });
    const e = byUser.get(uid)!;
    e.clinicIds.add(String(r.clinic_id));
    e.rows.push(r);
  }
  const users: ClinicUser[] = [];
  for (const [uid, e] of byUser) {
    const first = e.rows[0];
    users.push({
      id: uid,
      clinicId: String(first.clinic_id),
      clinicIds: [...e.clinicIds],
      name: "", // auth.users no es legible por el cliente anónimo
      email: "",
      role: SAAS_ROLE_MAP[String(first.role)] ?? "Veterinario",
      active: Boolean(first.active),
    });
  }
  return users;
}

// ---------------------------------------------------------------------------
// Hidratación desde Supabase (RLS filtra por las clínicas accesibles)
// ---------------------------------------------------------------------------
export async function hydrateSaas(clinicId: string): Promise<void> {
  const [clinicsRes, plansRes, membersRes] = await Promise.all([
    db.from("clinics").select("*"),
    db.from("plans").select("*"),
    db.from("clinic_members").select("*"),
  ]);
  const clinics = (clinicsRes.data ?? []).map(mapClinic);
  const plans = (plansRes.data ?? []).map(mapPlan);
  const users = mapUsers(membersRes.data ?? []);
  const subscriptions = clinics.map(deriveSubscription);

  // Sin branches en la BD por ahora (se queda vacío; se añade en la migración).
  setState((s) => {
    const current = s.currentClinicId && clinics.some((c) => c.id === s.currentClinicId)
      ? s.currentClinicId
      : clinics[0]?.id ?? "";
    const acting = s.actingClinicId && clinics.some((c) => c.id === s.actingClinicId)
      ? s.actingClinicId
      : s.actingClinicId;
    return { ...s, clinics, plans, users, subscriptions, currentClinicId: current, actingClinicId: acting };
  });
}

export const useClinics = () => useSyncExternalStore(subscribe, () => state.clinics, () => state.clinics);
export const usePlans = () => useSyncExternalStore(subscribe, () => state.plans, () => state.plans);
export const useSubscriptions = () => useSyncExternalStore(subscribe, () => state.subscriptions, () => state.subscriptions);
export const useBranches = () => useSyncExternalStore(subscribe, () => state.branches, () => state.branches);
export const useClinicUsers = () => useSyncExternalStore(subscribe, () => state.users, () => state.users);
export const useCurrentClinicId = () => useSyncExternalStore(subscribe, () => state.currentClinicId, () => state.currentClinicId);

export const setCurrentClinic = (id: string) => {
  setState((s) => ({ ...s, currentClinicId: id }));
};
export const getCurrentClinicId = () => state.currentClinicId;
export const useActingClinicId = () => useSyncExternalStore(subscribe, () => state.actingClinicId, () => state.actingClinicId);
export const setActingClinic = (id: string | null) => {
  setState((s) => ({ ...s, actingClinicId: id }));
};
// Abre la clínica en una pestaña nueva y la aterriza en su Dashboard
// usando el query param ?clinic= (sin localStorage).
export function enterClinicInNewTab(id: string) {
  const url = new URL(`${window.location.origin}/dashboard`);
  url.searchParams.set("clinic", id);
  window.open(url.toString(), "_blank");
}

export function usePlanCapabilities() {
  const clinicId = useCurrentClinicId();
  const clinics = useClinics();
  const plans = usePlans();
  const clinic = clinics.find((c) => c.id === clinicId);
  const plan = plans.find((p) => p.id === clinic?.subscriptionPlanId);
  // Si el plan no se pudo cargar (RLS de plans aún sin aplicar), no se ocultan
  // los módulos de la app: se asume habilitado. La fuente real sigue siendo la BD.
  const available = !!plan;
  return {
    plan,
    clinic,
    subscriptionStatus: clinic?.subscriptionStatus,
    posEnabled: plan ? !!plan.posEnabled : true,
    tiendaOnlineEnabled: plan ? !!plan.tiendaOnlineEnabled : true,
    aiEnabled: plan ? !!plan.aiEnabled : true,
    whatsappEnabled: plan ? !!plan.whatsappEnabled : true,
    maxProducts: plan?.maxProducts ?? 99999,
    maxVeterinarios: plan?.maxVeterinarios ?? 999,
    maxStorageGb: plan?.maxStorageGb ?? 500,
    maxUsers: plan?.maxUsers ?? 999,
    maxPets: plan?.maxPets ?? 999999,
    _planAvailable: available,
  };
}

// ---------------------------------------------------------------------------
// Mutaciones → escriben en Supabase y luego refrescan el caché local
// ---------------------------------------------------------------------------
export async function hydrateClinics() {
  const { data } = await db.from("clinics").select("*");
  const clinics = (data ?? []).map(mapClinic);
  setState((s) => ({ ...s, clinics, subscriptions: clinics.map(deriveSubscription) }));
}

export const addClinic = async (c: Omit<Clinic, "id" | "createdAt">) => {
  const row = {
    name: c.name,
    legal_name: c.legalName,
    tax_id: c.taxId,
    email: c.email,
    phone: c.phone,
    whatsapp: c.whatsapp,
    address: c.address,
    city: c.city,
    country: c.country,
    logo_url: c.logoUrl,
    timezone: c.timezone,
    currency: c.currency,
    plan_id: c.subscriptionPlanId || null,
    subscription_status: c.subscriptionStatus,
    subdomain: c.subdomain || null,
    opening_hours: c.openingHours,
    specialties: c.specialties ?? [],
    socials: c.socials ?? {},
    brand_color: c.brandColor,
  };
  const { data, error } = await db.from("clinics").insert(row).select().single();
  if (error) throw new Error(error.message);
  const item = mapClinic(data as DbRow);
  setState((s) => ({ ...s, clinics: [item, ...s.clinics] }));
  // Sincronizar o crear registro en website_settings con el slug/subdominio asignado
  if (item.subdomain) {
    void db.from("website_settings").upsert({
      clinic_id: item.id,
      slug: item.subdomain,
      is_published: true,
    }, { onConflict: "clinic_id" }).then(() => {}).catch(console.error);
  }
  return item;
};

export const updateClinic = async (id: string, patch: Partial<Clinic>) => {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.legalName !== undefined) row.legal_name = patch.legalName;
  if (patch.taxId !== undefined) row.tax_id = patch.taxId;
  if (patch.email !== undefined) row.email = patch.email;
  if (patch.phone !== undefined) row.phone = patch.phone;
  if (patch.whatsapp !== undefined) row.whatsapp = patch.whatsapp;
  if (patch.address !== undefined) row.address = patch.address;
  if (patch.city !== undefined) row.city = patch.city;
  if (patch.country !== undefined) row.country = patch.country;
  if (patch.logoUrl !== undefined) row.logo_url = patch.logoUrl;
  if (patch.timezone !== undefined) row.timezone = patch.timezone;
  if (patch.currency !== undefined) row.currency = patch.currency;
  if (patch.subscriptionPlanId !== undefined) row.plan_id = patch.subscriptionPlanId || null;
  if (patch.subscriptionStatus !== undefined) row.subscription_status = patch.subscriptionStatus;
  if (patch.subdomain !== undefined) {
    row.subdomain = patch.subdomain || null;
    if (patch.subdomain) {
      void db.from("website_settings").update({ slug: patch.subdomain }).eq("clinic_id", id).then(() => {}).catch(console.error);
    }
  }
  if (patch.openingHours !== undefined) row.opening_hours = patch.openingHours;
  if (patch.specialties !== undefined) row.specialties = patch.specialties;
  if (patch.socials !== undefined) row.socials = patch.socials;
  if (patch.brandColor !== undefined) row.brand_color = patch.brandColor;
  if (patch.aiProvider !== undefined) row.ai_provider = patch.aiProvider;
  if (patch.aiApiKey !== undefined) row.ai_api_key = patch.aiApiKey;
  if (patch.aiModel !== undefined) row.ai_model = patch.aiModel;
  if (patch.emergencyPhone !== undefined) row.emergency_phone = patch.emergencyPhone;
  const { error } = await db.from("clinics").update(row).eq("id", id);
  if (error) throw new Error(error.message);
  setState((s) => {
    const clinics = s.clinics.map((c) => (c.id === id ? { ...c, ...patch } : c));
    const patched = clinics.find((c) => c.id === id);
    return {
      ...s,
      clinics,
      subscriptions: patched
        ? s.subscriptions.map((sub) => (sub.clinicId === id ? deriveSubscription(patched) : sub))
        : s.subscriptions,
    };
  });
};

export const deleteClinic = async (id: string) => {
  const { error } = await db.from("clinics").delete().eq("id", id);
  if (error) throw new Error(error.message);
  setState((s) => ({
    ...s,
    clinics: s.clinics.filter((c) => c.id !== id),
    subscriptions: s.subscriptions.filter((sub) => sub.clinicId !== id),
    currentClinicId: s.currentClinicId === id ? "" : s.currentClinicId,
  }));
};

export const suspendClinic = (id: string) => updateClinic(id, { subscriptionStatus: "Suspendida" });
export const reactivateClinic = (id: string) => updateClinic(id, { subscriptionStatus: "Activa" });

// Simula el pago de la suscripción (Stripe/SINPE/PayPal) y activa el plan en la BD.
export async function paySubscription(clinicId: string, planId: string, method: string) {
  await updateClinic(clinicId, { subscriptionPlanId: planId, subscriptionStatus: "Activa" });
}

export const addPlan = async (p: Omit<SubscriptionPlan, "id" | "createdAt">) => {
  const row = {
    name: p.name,
    monthly_price: p.monthlyPrice,
    annual_price: p.annualPrice,
    max_users: p.maxUsers,
    max_storage_gb: p.maxStorageGb,
    max_pets: p.maxPets,
    max_branches: p.maxBranches,
    ai_enabled: p.aiEnabled,
    whatsapp_enabled: p.whatsappEnabled,
    pos_enabled: p.posEnabled,
    tienda_online_enabled: p.tiendaOnlineEnabled,
    max_products: p.maxProducts,
    max_veterinarios: p.maxVeterinarios,
  };
  const { data, error } = await db.from("plans").insert(row).select().single();
  if (error) throw new Error(error.message);
  const item = mapPlan(data as DbRow);
  setState((s) => ({ ...s, plans: [...s.plans, item] }));
  return item;
};

export const updatePlan = async (id: string, patch: Partial<SubscriptionPlan>) => {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.monthlyPrice !== undefined) row.monthly_price = patch.monthlyPrice;
  if (patch.annualPrice !== undefined) row.annual_price = patch.annualPrice;
  if (patch.maxUsers !== undefined) row.max_users = patch.maxUsers;
  if (patch.maxStorageGb !== undefined) row.max_storage_gb = patch.maxStorageGb;
  if (patch.maxPets !== undefined) row.max_pets = patch.maxPets;
  if (patch.maxBranches !== undefined) row.max_branches = patch.maxBranches;
  if (patch.aiEnabled !== undefined) row.ai_enabled = patch.aiEnabled;
  if (patch.whatsappEnabled !== undefined) row.whatsapp_enabled = patch.whatsappEnabled;
  if (patch.posEnabled !== undefined) row.pos_enabled = patch.posEnabled;
  if (patch.tiendaOnlineEnabled !== undefined) row.tienda_online_enabled = patch.tiendaOnlineEnabled;
  if (patch.maxProducts !== undefined) row.max_products = patch.maxProducts;
  if (patch.maxVeterinarios !== undefined) row.max_veterinarios = patch.maxVeterinarios;
  const { error } = await db.from("plans").update(row).eq("id", id);
  if (error) throw new Error(error.message);
  setState((s) => ({ ...s, plans: s.plans.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
};

export const deletePlan = async (id: string) => {
  const { error } = await db.from("plans").delete().eq("id", id);
  if (error) throw new Error(error.message);
  setState((s) => ({ ...s, plans: s.plans.filter((p) => p.id !== id) }));
};

export const addBranch = async (b: Omit<Branch, "id">) => {
  // Las branches aún no tienen tabla en la BD: se guarda en caché local.
  const item: Branch = { ...b, id: `br_${Date.now()}` };
  setState((s) => ({ ...s, branches: [...s.branches, item] }));
  return item;
};
export const updateBranch = (id: string, patch: Partial<Branch>) =>
  setState((s) => ({ ...s, branches: s.branches.map((b) => (b.id === id ? { ...b, ...patch } : b)) }));
export const deleteBranch = (id: string) =>
  setState((s) => ({ ...s, branches: s.branches.filter((b) => b.id !== id) }));

// La gestión de "staff" requiere crear cuentas en Supabase Auth; por ahora el
// CRUD de usuarios se mantiene en caché (la lista se hidrata desde clinic_members).
export const addClinicUser = (u: Omit<ClinicUser, "id" | "clinicIds">) => {
  const item: ClinicUser = { ...u, id: `su_${Date.now()}`, clinicIds: u.clinicId ? [u.clinicId] : [] };
  setState((s) => ({ ...s, users: [...s.users, item] }));
  return item;
};
export const updateClinicUser = (id: string, patch: Partial<ClinicUser>) =>
  setState((s) => ({ ...s, users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) }));
export const deleteClinicUser = (id: string) =>
  setState((s) => ({ ...s, users: s.users.filter((u) => u.id !== id) }));

registerHydrator(hydrateSaas);
