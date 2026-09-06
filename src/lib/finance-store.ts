import { db } from "./supabase";
import { registerHydrator, type DbRow } from "./db-hooks";
import { getCurrentClinicId } from "./saas-store";
import { useTenantSlice } from "./tenant";
import { formatCRC } from "./billing-store";
import { toLocalDateStr } from "./utils";

export { formatCRC };

export type FinancePaymentMethod =
  | "Efectivo"
  | "Tarjeta"
  | "Transferencia"
  | "SINPE"
  | "Cheque"
  | "Mixto";

export type FinanceInvoiceStatus =
  | "Borrador"
  | "Pendiente"
  | "Pagada"
  | "Parcialmente pagada"
  | "Anulada";

export type QuoteStatus = "Borrador" | "Enviada" | "Aceptada" | "Rechazada" | "Vencida";

export type FinanceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number; // porcentaje
  kind: "Servicio" | "Producto" | "Medicamento" | "Consulta" | "Cirugía" | "Hospitalización";
};

export type FinanceInvoice = {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  clientId?: string;
  clientName: string;
  petName?: string;
  vetName?: string;
  items: FinanceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  balance: number;
  status: FinanceInvoiceStatus;
  notes?: string;
  createdAt: string;
};

export type FinancePayment = {
  id: string;
  invoiceId: string;
  method: FinancePaymentMethod;
  amount: number;
  reference?: string;
  date: string;
  createdBy?: string;
};

export type Quote = {
  id: string;
  number: string;
  date: string;
  validUntil: string;
  clientName: string;
  petName?: string;
  items: FinanceItem[];
  total: number;
  status: QuoteStatus;
};

// Filas almacenadas en el estado: los tipos de la app + la clínica (para el slice).
type InvoiceRow = FinanceInvoice & { clinicId: string };
type PaymentRow = FinancePayment & { clinicId: string };
type QuoteRow = Quote & { clinicId: string };

type State = {
  invoices: InvoiceRow[];
  payments: PaymentRow[];
  quotes: QuoteRow[];
  invCounter: number;
  quoCounter: number;
};

const today = () => toLocalDateStr(new Date());
const addDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toLocalDateStr(d);
};

const calcTotals = (items: FinanceItem[], globalDiscount: number, taxRate = 0.13) => {
  const gross = items.reduce((a, it) => a + it.quantity * it.unitPrice * (1 - (it.discount || 0) / 100), 0);
  const subtotal = Math.round(gross);
  const discount = Math.round(subtotal * (globalDiscount / 100));
  const base = subtotal - discount;
  const tax = Math.round(base * taxRate);
  const total = base + tax;
  return { subtotal, discount, tax, total };
};

let state: State = { invoices: [], payments: [], quotes: [], invCounter: 1, quoCounter: 1 };
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
const set = (u: (s: State) => State) => { state = u(state); listeners.forEach((l) => l()); };

const getInvoices = () => state.invoices;
const getPayments = () => state.payments;
const getQuotes = () => state.quotes;

export const useFinanceInvoices = () => useTenantSlice(subscribe, getInvoices);
export const useFinancePayments = () => useTenantSlice(subscribe, getPayments);
export const useQuotes = () => useTenantSlice(subscribe, getQuotes);

// ---------------------------------------------------------------------------
// Mapeo DB (snake_case) → tipos de la app (camelCase)
// ---------------------------------------------------------------------------
function mapItem(r: DbRow): FinanceItem {
  return {
    id: String(r.id ?? ""),
    description: String(r.description ?? ""),
    quantity: Number(r.quantity ?? 0),
    unitPrice: Number(r.unit_price ?? 0),
    discount: Number(r.discount ?? 0),
    kind: (r.kind as FinanceItem["kind"]) ?? "Servicio",
  };
}

function mapInvoice(r: DbRow, items: FinanceItem[]): InvoiceRow {
  return {
    id: String(r.id ?? ""),
    clinicId: String(r.clinic_id ?? ""),
    number: String(r.number ?? ""),
    date: String(r.date ?? ""),
    dueDate: String(r.due_date ?? ""),
    clientId: r.client_id != null ? String(r.client_id) : undefined,
    clientName: String(r.client_name ?? ""),
    petName: r.pet_name != null ? String(r.pet_name) : undefined,
    vetName: r.vet_name != null ? String(r.vet_name) : undefined,
    items,
    subtotal: Number(r.subtotal ?? 0),
    discount: Number(r.discount ?? 0),
    tax: Number(r.tax ?? 0),
    total: Number(r.total ?? 0),
    paid: Number(r.paid ?? 0),
    balance: Number(r.balance ?? 0),
    status: (r.status as FinanceInvoiceStatus) ?? "Pendiente",
    notes: r.notes != null ? String(r.notes) : undefined,
    createdAt: String(r.created_at ?? new Date().toISOString()),
  };
}

function mapPayment(r: DbRow): PaymentRow {
  return {
    id: String(r.id ?? ""),
    invoiceId: String(r.invoice_id ?? ""),
    clinicId: String(r.clinic_id ?? ""),
    method: (r.method as FinancePaymentMethod) ?? "Efectivo",
    amount: Number(r.amount ?? 0),
    reference: r.reference != null ? String(r.reference) : undefined,
    date: String(r.date ?? ""),
    createdBy: r.created_by != null ? String(r.created_by) : undefined,
  };
}

function mapQuote(r: DbRow, items: FinanceItem[]): QuoteRow {
  return {
    id: String(r.id ?? ""),
    clinicId: String(r.clinic_id ?? ""),
    number: String(r.number ?? ""),
    date: String(r.date ?? ""),
    validUntil: String(r.valid_until ?? ""),
    clientName: String(r.client_name ?? ""),
    petName: r.pet_name != null ? String(r.pet_name) : undefined,
    items,
    total: Number(r.total ?? 0),
    status: (r.status as QuoteStatus) ?? "Borrador",
  };
}

// ---------------------------------------------------------------------------
// Hidratación desde Supabase (RLS filtra por las clínicas accesibles)
// ---------------------------------------------------------------------------
export async function hydrateFinance(_clinicId: string): Promise<void> {
  const [invoicesRes, invoiceItemsRes, paymentsRes, quotesRes, quoteItemsRes] = await Promise.all([
    db.from("invoices").select("*"),
    db.from("invoice_items").select("*"),
    db.from("payments").select("*"),
    db.from("quotes").select("*"),
    db.from("quote_items").select("*"),
  ]);

  // Agrupar ítems hijos por su factura padre.
  const itemsByInvoice: Record<string, FinanceItem[]> = {};
  for (const raw of invoiceItemsRes.data ?? []) {
    const iid = String(raw.invoice_id ?? "");
    (itemsByInvoice[iid] ??= []).push(mapItem(raw));
  }
  const invoices = (invoicesRes.data ?? []).map((r) => mapInvoice(r, itemsByInvoice[String(r.id)] ?? []));

  // Agrupar ítems hijos por su cotización padre.
  const itemsByQuote: Record<string, FinanceItem[]> = {};
  for (const raw of quoteItemsRes.data ?? []) {
    const qid = String(raw.quote_id ?? "");
    (itemsByQuote[qid] ??= []).push(mapItem(raw));
  }
  const quotes = (quotesRes.data ?? []).map((r) => mapQuote(r, itemsByQuote[String(r.id)] ?? []));

  const payments = (paymentsRes.data ?? []).map(mapPayment);

  // Renumerar desde el mayor sufijo numérico ya persistido.
  const invMax = invoices.reduce((a, i) => Math.max(a, parseInt(i.number.replace(/\D/g, ""), 10) || 0), 0);
  const quoMax = quotes.reduce((a, q) => Math.max(a, parseInt(q.number.replace(/\D/g, ""), 10) || 0), 0);

  set((s) => ({ ...s, invoices, payments, quotes, invCounter: invMax + 1, quoCounter: quoMax + 1 }));
}
registerHydrator(hydrateFinance);

// Mapea un patch de factura (camelCase) a una fila snake_case.
function invoicePatchRow(p: Partial<FinanceInvoice>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (p.number !== undefined) row.number = p.number;
  if (p.date !== undefined) row.date = p.date;
  if (p.dueDate !== undefined) row.due_date = p.dueDate;
  if (p.clientId !== undefined) row.client_id = p.clientId;
  if (p.clientName !== undefined) row.client_name = p.clientName;
  if (p.petName !== undefined) row.pet_name = p.petName;
  if (p.vetName !== undefined) row.vet_name = p.vetName;
  if (p.subtotal !== undefined) row.subtotal = p.subtotal;
  if (p.discount !== undefined) row.discount = p.discount;
  if (p.tax !== undefined) row.tax = p.tax;
  if (p.total !== undefined) row.total = p.total;
  if (p.paid !== undefined) row.paid = p.paid;
  if (p.balance !== undefined) row.balance = p.balance;
  if (p.status !== undefined) row.status = p.status;
  if (p.notes !== undefined) row.notes = p.notes;
  return row;
}

export const finance = {
  calcTotals,
  createInvoice(input: {
    clientName: string; petName?: string; vetName?: string;
    items: Array<Omit<FinanceItem, "id"> | FinanceItem>;
    dueDate?: string; discount?: number; notes?: string; status?: FinanceInvoiceStatus;
  }) {
    const items: FinanceItem[] = input.items.map((it, i) =>
      "id" in it ? (it as FinanceItem) : { id: crypto.randomUUID(), ...(it as Omit<FinanceItem, "id">) }
    );
    const t = calcTotals(items, input.discount ?? 0);
    const num = `F-${String(state.invCounter).padStart(6, "0")}`;
    const inv: InvoiceRow = {
      id: crypto.randomUUID(), number: num, date: today(), dueDate: input.dueDate ?? today(),
      clientName: input.clientName, petName: input.petName, vetName: input.vetName,
      items, ...t, paid: 0, balance: t.total,
      status: input.status ?? "Pendiente", notes: input.notes,
      createdAt: new Date().toISOString(),
      clinicId: getCurrentClinicId(),
    };
    set((s) => ({ ...s, invoices: [inv, ...s.invoices], invCounter: s.invCounter + 1 }));

    // Persistir la factura y sus ítems, sin await.
    void Promise.resolve(db.from("invoices").insert({
      id: inv.id,
      clinic_id: inv.clinicId,
      number: inv.number,
      date: inv.date,
      due_date: inv.dueDate,
      client_id: inv.clientId ?? null,
      client_name: inv.clientName,
      pet_name: inv.petName ?? null,
      vet_name: inv.vetName ?? null,
      subtotal: inv.subtotal,
      discount: inv.discount,
      tax: inv.tax,
      total: inv.total,
      paid: inv.paid,
      balance: inv.balance,
      status: inv.status,
      notes: inv.notes ?? null,
    })).then(() => {}).catch((e) => console.error(e));
    void Promise.resolve(db.from("invoice_items").insert(
      inv.items.map((it) => ({
        id: it.id,
        invoice_id: inv.id,
        clinic_id: inv.clinicId,
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unitPrice,
        discount: it.discount,
        kind: it.kind,
      }))
    )).then(() => {}).catch((e) => console.error(e));
    return inv;
  },
  updateInvoice(id: string, patch: Partial<FinanceInvoice>) {
    set((s) => ({ ...s, invoices: s.invoices.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
    void Promise.resolve(db.from("invoices").update(invoicePatchRow(patch)).eq("id", id))
      .then(() => {}).catch((e) => console.error(e));
  },
  voidInvoice(id: string) {
    set((s) => ({ ...s, invoices: s.invoices.map((i) => (i.id === id ? { ...i, status: "Anulada", balance: 0 } : i)) }));
    void Promise.resolve(db.from("invoices").update({ status: "Anulada", balance: 0 }).eq("id", id))
      .then(() => {}).catch((e) => console.error(e));
  },
  deleteInvoice(id: string) {
    set((s) => ({ ...s, invoices: s.invoices.filter((i) => i.id !== id) }));
    void Promise.resolve(db.from("invoices").delete().eq("id", id)).then(() => {}).catch((e) => console.error(e));
  },
  registerPayment(input: { invoiceId: string; method: FinancePaymentMethod; amount: number; reference?: string; createdBy?: string }) {
    const p: PaymentRow = {
      id: crypto.randomUUID(),
      invoiceId: input.invoiceId,
      clinicId: getCurrentClinicId(),
      date: today(),
      method: input.method,
      amount: input.amount,
      reference: input.reference ?? undefined,
      createdBy: input.createdBy ?? undefined,
    };
    let updatedInv: InvoiceRow | undefined;
    set((s) => {
      const invoices = s.invoices.map((i) => {
        if (i.id !== input.invoiceId) return i;
        const paid = i.paid + input.amount;
        const balance = Math.max(0, i.total - paid);
        const status: FinanceInvoiceStatus = balance <= 0 ? "Pagada" : "Parcialmente pagada";
        updatedInv = { ...i, paid, balance, status };
        return updatedInv;
      });
      return { ...s, payments: [p, ...s.payments], invoices };
    });

    void Promise.resolve(db.from("payments").insert({
      id: p.id,
      clinic_id: p.clinicId,
      invoice_id: p.invoiceId,
      method: p.method,
      amount: p.amount,
      reference: p.reference ?? null,
      date: p.date,
      created_by: p.createdBy ?? null,
    })).then(() => {}).catch((e) => console.error(e));

    if (updatedInv) {
      void Promise.resolve(db.from("invoices").update({
        paid: updatedInv.paid,
        balance: updatedInv.balance,
        status: updatedInv.status,
      }).eq("id", input.invoiceId)).then(() => {}).catch((e) => console.error(e));
    }
    return p;
  },
  createQuote(input: { clientName: string; petName?: string; items: Array<Omit<FinanceItem, "id"> | FinanceItem>; validUntil?: string }) {
    const items: FinanceItem[] = input.items.map((it, i) =>
      "id" in it ? (it as FinanceItem) : { id: crypto.randomUUID(), ...(it as Omit<FinanceItem, "id">) }
    );
    const t = calcTotals(items, 0);
    const q: QuoteRow = {
      id: crypto.randomUUID(), number: `P-${String(state.quoCounter).padStart(6, "0")}`,
      date: today(), validUntil: input.validUntil ?? addDays(15),
      clientName: input.clientName, petName: input.petName, items, total: t.total,
      status: "Borrador", clinicId: getCurrentClinicId(),
    };
    set((s) => ({ ...s, quotes: [q, ...s.quotes], quoCounter: s.quoCounter + 1 }));

    void Promise.resolve(db.from("quotes").insert({
      id: q.id,
      clinic_id: q.clinicId,
      number: q.number,
      date: q.date,
      valid_until: q.validUntil,
      client_name: q.clientName,
      pet_name: q.petName ?? null,
      subtotal: t.subtotal,
      discount: t.discount,
      tax: t.tax,
      total: q.total,
      status: q.status,
    })).then(() => {}).catch((e) => console.error(e));
    void Promise.resolve(db.from("quote_items").insert(
      q.items.map((it) => ({
        id: it.id,
        quote_id: q.id,
        clinic_id: q.clinicId,
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unitPrice,
        discount: it.discount,
        kind: it.kind,
      }))
    )).then(() => {}).catch((e) => console.error(e));
    return q;
  },
  updateQuoteStatus(id: string, status: QuoteStatus) {
    set((s) => ({ ...s, quotes: s.quotes.map((q) => (q.id === id ? { ...q, status } : q)) }));
    void Promise.resolve(db.from("quotes").update({ status }).eq("id", id)).then(() => {}).catch((e) => console.error(e));
  },
  convertQuoteToInvoice(id: string) {
    const q = state.quotes.find((x) => x.id === id);
    if (!q) return null;
    const inv = finance.createInvoice({ clientName: q.clientName, petName: q.petName, items: q.items });
    finance.updateQuoteStatus(id, "Aceptada");
    return inv;
  },
};

export function receivables() {
  const cid = getCurrentClinicId();
  return state.invoices.filter((i) => i.clinicId === cid && i.balance > 0 && i.status !== "Anulada");
}

export function financeStats() {
  const cid = getCurrentClinicId();
  const t = today();
  const monthPrefix = t.slice(0, 7);
  const paid = state.invoices.filter((i) => i.clinicId === cid && i.status !== "Anulada");
  const salesToday = paid.filter((i) => i.date === t).reduce((a, i) => a + i.total, 0);
  const salesMonth = paid.filter((i) => i.date.startsWith(monthPrefix)).reduce((a, i) => a + i.total, 0);
  const pending = paid.filter((i) => i.balance > 0).reduce((a, i) => a + i.balance, 0);
  const income = state.payments.filter((p) => p.clinicId === cid).reduce((a, p) => a + p.amount, 0);
  const avg = paid.length ? Math.round(paid.reduce((a, i) => a + i.total, 0) / paid.length) : 0;
  return { salesToday, salesMonth, pending, income, avg, invoicesCount: paid.length };
}
