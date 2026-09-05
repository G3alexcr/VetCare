import { useTenantSlice } from "./tenant";
import { getCurrentClinicId } from "./saas-store";
import { db } from "./supabase";
import { registerHydrator, type DbRow } from "./db-hooks";
import { formatMoney } from "./config-store";

export type PaymentMethod = "Efectivo" | "Tarjeta" | "SINPE" | "Transferencia" | "Mixto";

export type CashSession = {
  id: string;
  openedAt: string;
  openedBy: string;
  openingAmount: number;
  closedAt?: string;
  closingAmount?: number;
  notes?: string;
};

export type CashMovement = {
  id: string;
  sessionId: string;
  type: "Ingreso" | "Egreso";
  concept: string;
  amount: number;
  createdAt: string;
};

export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  kind: "Consulta" | "Cirugía" | "Hospitalización" | "Medicamento" | "Producto" | "Otro";
};

export type InvoiceStatus = "Emitida" | "Anulada";

export type Invoice = {
  id: string;
  number: string;
  date: string;
  clientName: string;
  petName?: string;
  vetName?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: InvoiceStatus;
  createdAt: string;
};

type BillingState = {
  sessions: Array<CashSession & { clinicId: string }>;
  movements: Array<CashMovement & { clinicId: string }>;
  invoices: Array<Invoice & { clinicId: string }>;
  invoiceCounter: number;
};

let state: BillingState = {
  sessions: [],
  movements: [],
  invoices: [],
  invoiceCounter: 1,
};

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const setState = (updater: (s: BillingState) => BillingState) => {
  state = updater(state);
  listeners.forEach((l) => l());
};

const getSessions = () => state.sessions;
const getMovements = () => state.movements;
const getInvoices = () => state.invoices;

// ---------------------------------------------------------------------------
// Mapeo DB (snake_case) → tipos de la app (camelCase)
// ---------------------------------------------------------------------------
function mapSession(r: DbRow): CashSession & { clinicId: string } {
  return {
    id: String(r.id ?? ""),
    clinicId: String(r.clinic_id ?? ""),
    openedAt: String(r.created_at ?? new Date().toISOString()),
    openedBy: String(r.opened_by ?? "Caja"),
    openingAmount: Number(r.opening_amount ?? 0),
    closedAt: r.closed_at != null ? String(r.closed_at) : undefined,
    closingAmount: r.closing_amount != null ? Number(r.closing_amount) : undefined,
    notes: r.notes != null ? String(r.notes) : undefined,
  };
}

function mapCashMovement(r: DbRow): CashMovement & { clinicId: string } {
  return {
    id: String(r.id ?? ""),
    sessionId: String(r.session_id ?? ""),
    clinicId: String(r.clinic_id ?? ""),
    type: (r.type as "Ingreso" | "Egreso") ?? "Ingreso",
    concept: String(r.concept ?? ""),
    amount: Number(r.amount ?? 0),
    createdAt: String(r.created_at ?? new Date().toISOString()),
  };
}

function mapInvoiceItem(r: DbRow): InvoiceItem {
  return {
    id: String(r.id ?? ""),
    description: String(r.name ?? ""),
    quantity: Number(r.quantity ?? 0),
    unitPrice: Number(r.unit_price ?? 0),
    kind: "Otro", // sale_items no tiene columna kind
  };
}

function mapInvoice(r: DbRow, items: InvoiceItem[]): Invoice & { clinicId: string } {
  return {
    id: String(r.id ?? ""),
    number: String(r.number ?? ""),
    date: String(r.date ?? ""),
    clientName: String(r.client_name ?? "Cliente de mostrador"),
    petName: undefined, // sales no tiene columna pet_name
    vetName: undefined, // sales no tiene columna vet_name
    items,
    subtotal: Number(r.subtotal ?? 0),
    tax: Number(r.tax ?? 0),
    total: Number(r.total ?? 0),
    paymentMethod: (r.payment_method as PaymentMethod) ?? "Efectivo",
    status: (r.status as InvoiceStatus) ?? "Emitida",
    clinicId: String(r.clinic_id ?? ""),
    createdAt: String(r.created_at ?? new Date().toISOString()),
  };
}

// ---------------------------------------------------------------------------
// Hidratación desde Supabase (RLS filtra por las clínicas accesibles)
// ---------------------------------------------------------------------------
export async function hydrateBilling(_clinicId: string): Promise<void> {
  const [sessionsRes, movementsRes, salesRes, saleItemsRes] = await Promise.all([
    db.from("cash_sessions").select("*"),
    db.from("cash_movements").select("*"),
    db.from("sales").select("*"),
    db.from("sale_items").select("*"),
  ]);
  const sessions = (sessionsRes.data ?? []).map(mapSession);
  const movements = (movementsRes.data ?? []).map(mapCashMovement);

  // Agrupar ítems hijos por su venta padre.
  const itemsBySale: Record<string, InvoiceItem[]> = {};
  for (const raw of saleItemsRes.data ?? []) {
    const sid = String(raw.sale_id ?? "");
    (itemsBySale[sid] ??= []).push(mapInvoiceItem(raw));
  }
  const invoices = (salesRes.data ?? []).map((r) => mapInvoice(r, itemsBySale[String(r.id)] ?? []));

  // Renumerar a partir del mayor sufijo numérico ya persistido.
  const maxNum = invoices.reduce((a, i) => Math.max(a, parseInt(i.number.replace(/\D/g, ""), 10) || 0), 0);
  setState((st) => ({ ...st, sessions, movements, invoices, invoiceCounter: maxNum + 1 }));
}
registerHydrator(hydrateBilling);

export function useCashSessions() {
  return useTenantSlice(subscribe, getSessions);
}
export function useCashMovements() {
  return useTenantSlice(subscribe, getMovements);
}
export function useInvoices() {
  return useTenantSlice(subscribe, getInvoices);
}

export function getOpenSession() {
  const cid = getCurrentClinicId();
  return state.sessions.find((s) => !s.closedAt && s.clinicId === cid);
}

export function openCashSession(input: { openedBy: string; openingAmount: number; notes?: string }) {
  const item: CashSession & { clinicId: string } = {
    id: crypto.randomUUID(),
    clinicId: getCurrentClinicId(),
    openedAt: new Date().toISOString(),
    ...input,
  };
  setState((st) => ({ ...st, sessions: [item, ...st.sessions] }));
  void Promise.resolve(db.from("cash_sessions").insert({
    id: item.id,
    clinic_id: item.clinicId,
    opened_by: item.openedBy,
    opening_amount: item.openingAmount,
    notes: item.notes ?? null,
  })).then(() => {}).catch((e) => console.error(e));
  return item;
}

export function closeCashSession(id: string, closingAmount: number, notes?: string) {
  setState((st) => ({
    ...st,
    sessions: st.sessions.map((s) =>
      s.id === id ? { ...s, closedAt: new Date().toISOString(), closingAmount, notes: notes ?? s.notes } : s
    ),
  }));
  void Promise.resolve(db.from("cash_sessions").update({
    closed_at: new Date().toISOString(),
    closing_amount: closingAmount,
    notes: notes ?? null,
  }).eq("id", id)).then(() => {}).catch((e) => console.error(e));
}

export function addMovement(m: Omit<CashMovement, "id" | "createdAt">) {
  const item: CashMovement & { clinicId: string } = { ...m, id: crypto.randomUUID(), clinicId: getCurrentClinicId(), createdAt: new Date().toISOString() };
  setState((st) => ({ ...st, movements: [item, ...st.movements] }));
  void Promise.resolve(db.from("cash_movements").insert({
    id: item.id,
    clinic_id: item.clinicId,
    session_id: item.sessionId,
    type: item.type,
    concept: item.concept,
    amount: item.amount,
  })).then(() => {}).catch((e) => console.error(e));
  return item;
}

export function calcSessionBalance(sessionId: string) {
  const session = state.sessions.find((s) => s.id === sessionId);
  if (!session) return 0;
  const moves = state.movements.filter((m) => m.sessionId === sessionId);
  const sum = moves.reduce((a, m) => a + (m.type === "Ingreso" ? m.amount : -m.amount), 0);
  return session.openingAmount + sum;
}

export function createInvoice(input: Omit<Invoice, "id" | "number" | "createdAt" | "status" | "subtotal" | "tax" | "total"> & { taxRate?: number }) {
  const subtotal = input.items.reduce((a, it) => a + it.quantity * it.unitPrice, 0);
  const taxRate = input.taxRate ?? 0.13;
  const tax = Math.round(subtotal * taxRate);
  const total = subtotal + tax;
  const num = String(state.invoiceCounter).padStart(6, "0");
  const invoice: Invoice & { clinicId: string } = {
    id: crypto.randomUUID(),
    number: `F-${num}`,
    date: input.date,
    clientName: input.clientName,
    petName: input.petName,
    vetName: input.vetName,
    items: input.items,
    subtotal,
    tax,
    total,
    paymentMethod: input.paymentMethod,
    status: "Emitida",
    clinicId: getCurrentClinicId(),
    createdAt: new Date().toISOString(),
  };
  setState((st) => ({
    ...st,
    invoices: [invoice, ...st.invoices],
    invoiceCounter: st.invoiceCounter + 1,
  }));

  // Persistir la factura (sales) y sus ítems (sale_items), sin await.
  void Promise.resolve(db.from("sales").insert({
    id: invoice.id,
    clinic_id: invoice.clinicId,
    number: invoice.number,
    date: invoice.date,
    subtotal: invoice.subtotal,
    tax: invoice.tax,
    total: invoice.total,
    payment_method: invoice.paymentMethod,
    client_name: invoice.clientName,
    status: invoice.status,
  })).then(() => {}).catch((e) => console.error(e));
  void Promise.resolve(db.from("sale_items").insert(
    invoice.items.map((it) => ({
      sale_id: invoice.id,
      name: it.description,
      quantity: it.quantity,
      unit_price: it.unitPrice,
    }))
  )).then(() => {}).catch((e) => console.error(e));

  // Registrar ingreso a caja si hay sesión abierta
  const open = getOpenSession();
  if (open) {
    addMovement({
      sessionId: open.id,
      type: "Ingreso",
      concept: `Factura ${invoice.number} · ${invoice.clientName}`,
      amount: invoice.total,
    });
  }

  return invoice;
}

export function voidInvoice(id: string) {
  setState((st) => ({
    ...st,
    invoices: st.invoices.map((i) => (i.id === id ? { ...i, status: "Anulada" } : i)),
  }));
  void Promise.resolve(db.from("sales").update({ status: "Anulada" }).eq("id", id)).then(() => {}).catch((e) => console.error(e));
}

export function formatCRC(n: number) {
  // Formatea según la moneda configurada en Configuración (colones por defecto).
  return formatMoney(n);
}
