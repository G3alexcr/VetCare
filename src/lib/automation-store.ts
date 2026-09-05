import { db } from "./supabase";
import { registerHydrator, type DbRow } from "./db-hooks";
import { getCurrentClinicId } from "./saas-store";
import { useTenantSlice } from "./tenant";

export type Channel = "WhatsApp" | "Email" | "SMS";
export type ReminderType =
  | "Vacuna"
  | "Desparasitación"
  | "Cita"
  | "Control postoperatorio";
export type ReminderStatus = "Programado" | "Enviado" | "Confirmado" | "Cancelado" | "Fallido";

export type Reminder = {
  id: string;
  type: ReminderType;
  petName: string;
  clientName: string;
  phone: string;
  scheduledFor: string; // ISO
  channel: Channel;
  status: ReminderStatus;
  message: string;
  createdAt: string;
};

export type MessageTemplate = {
  id: string;
  name: string;
  category:
    | "Bienvenida"
    | "Recordatorio"
    | "Confirmación"
    | "Seguimiento"
    | "Alta médica"
    | "Resultados"
    | "Cumpleaños";
  channel: Channel;
  body: string;
  active: boolean;
  createdAt: string;
};

export type ConversationStatus = "Abierta" | "En espera" | "Cerrada";
export type Conversation = {
  id: string;
  clientName: string;
  petName: string;
  phone: string;
  channel: Channel;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  status: ConversationStatus;
  assignee: string;
};

export type Message = {
  id: string;
  conversationId: string;
  direction: "in" | "out";
  body: string;
  sentAt: string;
  status: "Enviado" | "Entregado" | "Leído" | "Fallido";
};

// Filas almacenadas en el estado: los tipos de la app + la clínica (para el slice).
type ReminderRow = Reminder & { clinicId: string };
type TemplateRow = MessageTemplate & { clinicId: string };
type ConversationRow = Conversation & { clinicId: string };
type MessageRow = Message & { clinicId: string };

type State = {
  reminders: ReminderRow[];
  templates: TemplateRow[];
  conversations: ConversationRow[];
  messages: MessageRow[];
};

let state: State = { reminders: [], templates: [], conversations: [], messages: [] };

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
const emit = () => listeners.forEach((l) => l());
const setState = (u: (s: State) => State) => { state = u(state); emit(); };

const getReminders = () => state.reminders;
const getTemplates = () => state.templates;
const getConversations = () => state.conversations;
const getMessages = () => state.messages;

export const useReminders = () => useTenantSlice(subscribe, getReminders);
export const useTemplates = () => useTenantSlice(subscribe, getTemplates);
export const useConversations = () => useTenantSlice(subscribe, getConversations);
export const useMessages = () => useTenantSlice(subscribe, getMessages);

// ---------------------------------------------------------------------------
// Mapeo DB (snake_case) → tipos de la app (camelCase)
// ---------------------------------------------------------------------------
function mapReminder(r: DbRow): ReminderRow {
  return {
    id: String(r.id ?? ""),
    clinicId: String(r.clinic_id ?? ""),
    type: (r.type as ReminderType) ?? "Vacuna",
    petName: String(r.pet_name ?? ""),
    clientName: String(r.client_name ?? ""),
    phone: String(r.phone ?? ""),
    scheduledFor: String(r.scheduled_for ?? new Date().toISOString()),
    channel: (r.channel as Channel) ?? "WhatsApp",
    status: (r.status as ReminderStatus) ?? "Programado",
    message: String(r.message ?? ""),
    createdAt: String(r.created_at ?? new Date().toISOString()),
  };
}

function mapTemplate(r: DbRow): TemplateRow {
  return {
    id: String(r.id ?? ""),
    clinicId: String(r.clinic_id ?? ""),
    name: String(r.name ?? ""),
    category: (r.category as MessageTemplate["category"]) ?? "Recordatorio",
    channel: (r.channel as Channel) ?? "WhatsApp",
    body: String(r.body ?? ""),
    active: Boolean(r.active),
    createdAt: String(r.created_at ?? new Date().toISOString()),
  };
}

function mapConversation(r: DbRow): ConversationRow {
  return {
    id: String(r.id ?? ""),
    clinicId: String(r.clinic_id ?? ""),
    clientName: String(r.client_name ?? ""),
    petName: String(r.pet_name ?? ""),
    phone: String(r.phone ?? ""),
    channel: (r.channel as Channel) ?? "WhatsApp",
    lastMessage: String(r.last_message ?? ""),
    lastMessageAt: String(r.last_message_at ?? new Date().toISOString()),
    unread: Number(r.unread ?? 0),
    status: (r.status as ConversationStatus) ?? "Abierta",
    assignee: String(r.assignee ?? ""),
  };
}

function mapMessage(r: DbRow): MessageRow {
  return {
    id: String(r.id ?? ""),
    clinicId: String(r.clinic_id ?? ""),
    conversationId: String(r.conversation_id ?? ""),
    direction: (r.direction as "in" | "out") ?? "out",
    body: String(r.body ?? ""),
    sentAt: String(r.sent_at ?? new Date().toISOString()),
    status: (r.status as Message["status"]) ?? "Enviado",
  };
}

// ---------------------------------------------------------------------------
// Hidratación desde Supabase (RLS filtra por las clínicas accesibles)
// ---------------------------------------------------------------------------
export async function hydrateAutomation(_clinicId: string): Promise<void> {
  const [remindersRes, templatesRes, conversationsRes, messagesRes] = await Promise.all([
    db.from("reminders").select("*"),
    db.from("message_templates").select("*"),
    db.from("conversations").select("*"),
    db.from("messages").select("*"),
  ]);
  const reminders = (remindersRes.data ?? []).map(mapReminder);
  const templates = (templatesRes.data ?? []).map(mapTemplate);
  const conversations = (conversationsRes.data ?? []).map(mapConversation);
  const messages = (messagesRes.data ?? []).map(mapMessage);
  setState((s) => ({ ...s, reminders, templates, conversations, messages }));
}
registerHydrator(hydrateAutomation);

// Mapea un patch de recordatorio (camelCase) a una fila snake_case.
function reminderPatchRow(p: Partial<Reminder>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (p.type !== undefined) row.type = p.type;
  if (p.petName !== undefined) row.pet_name = p.petName;
  if (p.clientName !== undefined) row.client_name = p.clientName;
  if (p.phone !== undefined) row.phone = p.phone;
  if (p.scheduledFor !== undefined) row.scheduled_for = p.scheduledFor;
  if (p.channel !== undefined) row.channel = p.channel;
  if (p.status !== undefined) row.status = p.status;
  if (p.message !== undefined) row.message = p.message;
  return row;
}

export const addReminder = (r: Omit<Reminder, "id" | "createdAt">) => {
  const item: ReminderRow = {
    ...r,
    id: crypto.randomUUID(),
    clinicId: getCurrentClinicId(),
    createdAt: new Date().toISOString(),
  };
  setState((s) => ({ ...s, reminders: [item, ...s.reminders] }));
  void Promise.resolve(db.from("reminders").insert({
    id: item.id,
    clinic_id: item.clinicId,
    type: item.type,
    pet_name: item.petName,
    client_name: item.clientName,
    phone: item.phone,
    scheduled_for: item.scheduledFor,
    channel: item.channel,
    status: item.status,
    message: item.message,
  })).then(() => {}).catch((e) => console.error(e));
  return item;
};

export const updateReminder = (id: string, patch: Partial<Reminder>) => {
  setState((s) => ({ ...s, reminders: s.reminders.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  void Promise.resolve(db.from("reminders").update(reminderPatchRow(patch)).eq("id", id))
    .then(() => {}).catch((e) => console.error(e));
};

export const deleteReminder = (id: string) => {
  setState((s) => ({ ...s, reminders: s.reminders.filter((r) => r.id !== id) }));
  void Promise.resolve(db.from("reminders").delete().eq("id", id)).then(() => {}).catch((e) => console.error(e));
};

export const addTemplate = (t: Omit<MessageTemplate, "id" | "createdAt">) => {
  const item: TemplateRow = {
    ...t,
    id: crypto.randomUUID(),
    clinicId: getCurrentClinicId(),
    createdAt: new Date().toISOString(),
  };
  setState((s) => ({ ...s, templates: [item, ...s.templates] }));
  void Promise.resolve(db.from("message_templates").insert({
    id: item.id,
    clinic_id: item.clinicId,
    name: item.name,
    category: item.category,
    channel: item.channel,
    body: item.body,
    active: item.active,
  })).then(() => {}).catch((e) => console.error(e));
  return item;
};

export const updateTemplate = (id: string, patch: Partial<MessageTemplate>) => {
  setState((s) => ({ ...s, templates: s.templates.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.channel !== undefined) row.channel = patch.channel;
  if (patch.body !== undefined) row.body = patch.body;
  if (patch.active !== undefined) row.active = patch.active;
  void Promise.resolve(db.from("message_templates").update(row).eq("id", id))
    .then(() => {}).catch((e) => console.error(e));
};

export const deleteTemplate = (id: string) => {
  setState((s) => ({ ...s, templates: s.templates.filter((t) => t.id !== id) }));
  void Promise.resolve(db.from("message_templates").delete().eq("id", id)).then(() => {}).catch((e) => console.error(e));
};

export const sendMessage = (conversationId: string, body: string) => {
  const msg: MessageRow = {
    id: crypto.randomUUID(),
    conversationId,
    clinicId: getCurrentClinicId(),
    direction: "out",
    body,
    sentAt: new Date().toISOString(),
    status: "Enviado",
  };
  setState((s) => ({
    ...s,
    messages: [...s.messages, msg],
    conversations: s.conversations.map((c) =>
      c.id === conversationId ? { ...c, lastMessage: body, lastMessageAt: msg.sentAt, unread: 0 } : c,
    ),
  }));
  void Promise.resolve(db.from("messages").insert({
    id: msg.id,
    clinic_id: msg.clinicId,
    conversation_id: msg.conversationId,
    direction: msg.direction,
    body: msg.body,
    sent_at: msg.sentAt,
    status: msg.status,
  })).then(() => {}).catch((e) => console.error(e));
  void Promise.resolve(db.from("conversations").update({
    last_message: body,
    last_message_at: msg.sentAt,
    unread: 0,
  }).eq("id", conversationId)).then(() => {}).catch((e) => console.error(e));
  return msg;
};

export const setConversationStatus = (id: string, status: ConversationStatus) => {
  setState((s) => ({ ...s, conversations: s.conversations.map((c) => (c.id === id ? { ...c, status } : c)) }));
  void Promise.resolve(db.from("conversations").update({ status }).eq("id", id)).then(() => {}).catch((e) => console.error(e));
};

export const markConversationRead = (id: string) => {
  setState((s) => ({ ...s, conversations: s.conversations.map((c) => (c.id === id ? { ...c, unread: 0 } : c)) }));
  void Promise.resolve(db.from("conversations").update({ unread: 0 }).eq("id", id)).then(() => {}).catch((e) => console.error(e));
};
