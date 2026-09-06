import { useSyncExternalStore } from "react";
import { useTenantSlice } from "./tenant";
import { getCurrentClinicId } from "./saas-store";

export const RBAC_MODULES = [
  "dashboard",
  "clientes",
  "mascotas",
  "agenda",
  "consultas",
  "vacunas",
  "desparasitacion",
  "cirugias",
  "hospitalizacion",
  "archivos",
  "fotografias",
  "veterinarios",
  "servicios",
  "especies",
  "caja",
  "inventario",
  "facturacion",
  "punto_venta",
  "automatizacion",
  "clinicas",
  "roles",
  "configuracion",
] as const;
export type RbacModule = (typeof RBAC_MODULES)[number];

export const RBAC_ACTIONS = ["view", "create", "edit", "delete", "export", "configure"] as const;
export type RbacAction = (typeof RBAC_ACTIONS)[number];

export const MODULE_LABEL: Record<RbacModule, string> = {
  dashboard: "Dashboard",
  clientes: "Clientes",
  mascotas: "Mascotas",
  agenda: "Agenda",
  consultas: "Consultas",
  vacunas: "Vacunas",
  desparasitacion: "Desparasitación",
  cirugias: "Cirugías",
  hospitalizacion: "Hospitalización",
  archivos: "Archivos",
  fotografias: "Fotografías",
  veterinarios: "Veterinarios",
  servicios: "Servicios",
  especies: "Especies",
  caja: "Caja",
  inventario: "Inventario",
  facturacion: "Facturación",
  punto_venta: "Punto de Venta",
  automatizacion: "Automatización",
  clinicas: "Multi-Clínica",
  roles: "Roles y Permisos",
  configuracion: "Configuración",
};

export const ACTION_LABEL: Record<RbacAction, string> = {
  view: "Ver",
  create: "Crear",
  edit: "Editar",
  delete: "Eliminar",
  export: "Exportar",
  configure: "Configurar",
};

export type PermissionMatrix = Record<RbacModule, Record<RbacAction, boolean>>;

export type Role = {
  id: string;
  name: string;
  description: string;
  system: boolean; // no se puede eliminar
  permissions: PermissionMatrix;
  createdAt: string;
};

export type UserStatus = "Activo" | "Inactivo" | "Suspendido";

export type RbacUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  roleId: string;
  status: UserStatus;
  clinicId: string;
  branchId?: string;
  lastAccess?: string;
};

export type AuditEntry = {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: RbacModule | string;
  recordId?: string;
  ip: string;
  createdAt: string;
};

function emptyMatrix(value: boolean): PermissionMatrix {
  const out = {} as PermissionMatrix;
  for (const m of RBAC_MODULES) {
    out[m] = {} as Record<RbacAction, boolean>;
    for (const a of RBAC_ACTIONS) out[m][a] = value;
  }
  return out;
}

function matrixFor(overrides: Partial<Record<RbacModule, Partial<Record<RbacAction, boolean>>>>, base = false): PermissionMatrix {
  const m = emptyMatrix(base);
  for (const [mod, acts] of Object.entries(overrides)) {
    for (const [a, v] of Object.entries(acts ?? {})) {
      m[mod as RbacModule][a as RbacAction] = v as boolean;
    }
  }
  return m;
}

const readOnlyAll = () => {
  const m = emptyMatrix(false);
  for (const mod of RBAC_MODULES) m[mod].view = true;
  return m;
};

const now = new Date().toISOString();

const seedRoles: Role[] = [
  {
    id: "role_super",
    name: "Super Administrador",
    description: "Acceso total a la plataforma y a todas las clínicas.",
    system: true,
    permissions: emptyMatrix(true),
    createdAt: now,
  },
  {
    id: "role_owner",
    name: "Propietario de Clínica",
    description: "Dueño de la clínica. Control total excepto administración global.",
    system: true,
    permissions: (() => {
      const m = emptyMatrix(true);
      m.clinicas = { view: true, create: false, edit: false, delete: false, export: true, configure: false };
      return m;
    })(),
    createdAt: now,
  },
  {
    id: "role_admin",
    name: "Administrador",
    description: "Administra usuarios, finanzas y operación de la clínica.",
    system: true,
    permissions: (() => {
      const m = emptyMatrix(true);
      // El admin/administrativo NO gestiona la plataforma (sin Centro de Mando).
      // Solo ve sus clínicas en Multi-Clínica y puede entrar a ellas.
      m.clinicas = { view: true, create: false, edit: false, delete: false, export: true, configure: false };
      return m;
    })(),
    createdAt: now,
  },
  {
    id: "role_vet",
    name: "Veterinario",
    description: "Atención clínica: consultas, vacunas, cirugías, hospitalización.",
    system: true,
    permissions: matrixFor({
      dashboard: { view: true },
      clientes: { view: true, create: true, edit: true },
      mascotas: { view: true, create: true, edit: true },
      agenda: { view: true, create: true, edit: true },
      consultas: { view: true, create: true, edit: true, export: true },
      vacunas: { view: true, create: true, edit: true },
      desparasitacion: { view: true, create: true, edit: true },
      cirugias: { view: true, create: true, edit: true },
      hospitalizacion: { view: true, create: true, edit: true },
      archivos: { view: true, create: true },
      fotografias: { view: true, create: true, edit: true },
      veterinarios: { view: true },
      servicios: { view: true },
      especies: { view: true, create: true, edit: true, delete: true },
      inventario: { view: true },
      facturacion: { view: true },
      punto_venta: { view: true },
      caja: { view: true },
      automatizacion: { view: true },
      configuracion: { view: true },
    }),
    createdAt: now,
  },
  {
    id: "role_reception",
    name: "Recepción",
    description: "Agenda, clientes y mascotas. Cobros básicos en caja.",
    system: true,
    permissions: matrixFor({
      dashboard: { view: true },
      clientes: { view: true, create: true, edit: true },
      mascotas: { view: true, create: true, edit: true },
      agenda: { view: true, create: true, edit: true, delete: true },
      consultas: { view: true },
      vacunas: { view: true },
      desparasitacion: { view: true },
      caja: { view: true, create: true },
      facturacion: { view: true, create: true },
      punto_venta: { view: true, create: true },
      servicios: { view: true, create: true },
      especies: { view: true, create: true, edit: true },
      automatizacion: { view: true, create: true },
    }),
    createdAt: now,
  },
  {
    id: "role_cash",
    name: "Caja",
    description: "Apertura/cierre de caja, cobros y facturación.",
    system: true,
    permissions: matrixFor({
      dashboard: { view: true },
      caja: { view: true, create: true, edit: true, export: true },
      facturacion: { view: true, create: true, edit: true, export: true },
      punto_venta: { view: true, create: true, edit: true, export: true },
      clientes: { view: true },
    }),
    createdAt: now,
  },
  {
    id: "role_inventory",
    name: "Inventario",
    description: "Gestión de productos, proveedores y compras.",
    system: true,
    permissions: matrixFor({
      dashboard: { view: true },
      inventario: { view: true, create: true, edit: true, delete: true, export: true },
    }),
    createdAt: now,
  },
  {
    id: "role_assistant",
    name: "Asistente Veterinario",
    description: "Apoya al veterinario en atenciones y registros.",
    system: true,
    permissions: matrixFor({
      dashboard: { view: true },
      clientes: { view: true },
      mascotas: { view: true, edit: true },
      agenda: { view: true, edit: true },
      consultas: { view: true, create: true },
      vacunas: { view: true, create: true },
      desparasitacion: { view: true, create: true },
      hospitalizacion: { view: true, edit: true },
      archivos: { view: true, create: true },
      fotografias: { view: true, create: true },
      especies: { view: true, create: true, edit: true },
      punto_venta: { view: true },
      inventario: { view: true },
    }),
    createdAt: now,
  },
  {
    id: "role_readonly",
    name: "Solo Lectura",
    description: "Consulta todo el sistema sin modificar nada.",
    system: true,
    permissions: readOnlyAll(),
    createdAt: now,
  },
];

const seedUsers: RbacUser[] = [
  { id: "usr_1", name: "Dra. Ana Martínez", email: "admin@vetcare.com", phone: "+593 99 111 2233", roleId: "role_admin", status: "Activo", clinicId: "cl1", branchId: "br1", lastAccess: now },
  { id: "usr_2", name: "Dr. Luis Pérez", email: "vet@vetcare.com", phone: "+593 99 222 3344", roleId: "role_vet", status: "Activo", clinicId: "cl1", branchId: "br1", lastAccess: now },
  { id: "usr_3", name: "Carla Gómez", email: "recepcion@vetcare.com", phone: "+593 99 333 4455", roleId: "role_reception", status: "Activo", clinicId: "cl1", branchId: "br1", lastAccess: now },
  { id: "usr_4", name: "Mario Rojas", email: "caja@vetcare.com", phone: "+593 99 444 5566", roleId: "role_cash", status: "Activo", clinicId: "cl1", branchId: "br1" },
  { id: "usr_5", name: "Sofía Andrade", email: "inventario@vetcare.com", phone: "+593 99 555 6677", roleId: "role_inventory", status: "Inactivo", clinicId: "cl1", branchId: "br1" },
];

const seedAudit: AuditEntry[] = [
  { id: "au1", userId: "usr_1", userName: "Dra. Ana Martínez", action: "Inicio de sesión", module: "dashboard", ip: "190.12.4.11", createdAt: now },
  { id: "au2", userId: "usr_2", userName: "Dr. Luis Pérez", action: "Creó consulta", module: "consultas", recordId: "cons_128", ip: "190.12.4.22", createdAt: now },
  { id: "au3", userId: "usr_3", userName: "Carla Gómez", action: "Agendó cita", module: "agenda", recordId: "apt_44", ip: "190.12.4.33", createdAt: now },
];

type State = { roles: Role[]; users: RbacUser[]; audit: AuditEntry[] };
let state: State = { roles: seedRoles, users: seedUsers, audit: seedAudit };
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
const set = (u: (s: State) => State) => { state = u(state); listeners.forEach((l) => l()); };

export const useRoles = () => useSyncExternalStore(subscribe, () => state.roles, () => state.roles);
export const useRbacUsers = () => useTenantSlice(subscribe, () => state.users);
export const useAuditLog = () => useSyncExternalStore(subscribe, () => state.audit, () => state.audit);

export const getRoleById = (id: string) => state.roles.find((r) => r.id === id);

export const addRole = (r: Omit<Role, "id" | "createdAt" | "system">) => {
  const item: Role = { ...r, id: `role_${Date.now()}`, system: false, createdAt: new Date().toISOString() };
  set((s) => ({ ...s, roles: [...s.roles, item] }));
  return item;
};
export const duplicateRole = (id: string) => {
  const r = state.roles.find((x) => x.id === id);
  if (!r) return;
  const copy: Role = { ...r, id: `role_${Date.now()}`, name: `${r.name} (copia)`, system: false, createdAt: new Date().toISOString(), permissions: JSON.parse(JSON.stringify(r.permissions)) };
  set((s) => ({ ...s, roles: [...s.roles, copy] }));
  return copy;
};
export const updateRole = (id: string, patch: Partial<Role>) =>
  set((s) => ({ ...s, roles: s.roles.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
export const togglePermission = (roleId: string, mod: RbacModule, action: RbacAction) =>
  set((s) => ({
    ...s,
    roles: s.roles.map((r) => {
      if (r.id !== roleId) return r;
      const perms = JSON.parse(JSON.stringify(r.permissions)) as PermissionMatrix;
      perms[mod][action] = !perms[mod][action];
      return { ...r, permissions: perms };
    }),
  }));
export const deleteRole = (id: string) =>
  set((s) => ({ ...s, roles: s.roles.filter((r) => r.id !== id || r.system) }));

export const addUser = (u: Omit<RbacUser, "id">) => {
  const item = { ...u, id: `usr_${Date.now()}`, clinicId: getCurrentClinicId() };
  set((s) => ({ ...s, users: [...s.users, item] }));
  return item;
};
export const updateUser = (id: string, patch: Partial<RbacUser>) =>
  set((s) => ({ ...s, users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) }));
export const deleteUser = (id: string) =>
  set((s) => ({ ...s, users: s.users.filter((u) => u.id !== id) }));

export const logAudit = (entry: Omit<AuditEntry, "id" | "createdAt" | "ip"> & { ip?: string }) => {
  const item: AuditEntry = { ...entry, id: `au_${Date.now()}`, ip: entry.ip ?? "127.0.0.1", createdAt: new Date().toISOString() };
  set((s) => ({ ...s, audit: [item, ...s.audit].slice(0, 500) }));
  return item;
};

// Mapea el rol del mock auth (admin/vet/reception) al roleId RBAC
export function mapLegacyRoleToRoleId(legacy: string): string {
  switch (legacy) {
    case "super": return "role_super";
    case "admin": return "role_admin";
    case "vet": return "role_vet";
    case "reception": return "role_reception";
    default: return "role_readonly";
  }
}

export function hasPermission(roleId: string | undefined, mod: RbacModule, action: RbacAction): boolean {
  if (!roleId) return false;
  // El dueño/superadministrador de la plataforma tiene acceso total e irrestricto sin depender de roles locales de clínica
  if (roleId === "role_super") return true;
  const role = state.roles.find((r) => r.id === roleId);
  if (!role) return false;
  return !!role.permissions[mod]?.[action];
}
