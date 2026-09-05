import { useMemo, useSyncExternalStore } from "react";
import { getCurrentClinicId, useCurrentClinicId } from "./saas-store";
import { db } from "./supabase";
import { registerHydrator, type DbRow } from "./db-hooks";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
export type PosEstado = "Activo" | "Inactivo";

export type PosCategory = {
  id: string;
  nombre: string;
  descripcion: string;
  color: string; // clase tailwind del chip
  estado: PosEstado;
  clinicId: string;
  createdAt: string;
};

export type PosProduct = {
  id: string;
  code: string;
  barcode: string;
  name: string;
  categoryId: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit: string; // unidad, ml, tabletas, saco
  image?: string;
  estado: PosEstado;
  online: boolean; // publicado en la tienda online
  clinicId: string;
  createdAt: string;
};

export type PosMovementType = "Entrada" | "Salida" | "Ajuste" | "Transferencia";
export type PosMovement = {
  id: string;
  productId: string;
  type: PosMovementType;
  quantity: number;
  reason: string;
  reference?: string; // venta, pedido, ajuste
  clinicId: string;
  createdAt: string;
};

export type PaymentMethod = "Efectivo" | "Tarjeta" | "SINPE" | "Transferencia" | "Mixto";
export const PAYMENT_METHODS: PaymentMethod[] = ["Efectivo", "Tarjeta", "SINPE", "Transferencia", "Mixto"];

export type SaleItem = {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number; // descuento del ítem
};

export type SaleStatus = "Completada" | "Anulada";
export type Sale = {
  id: string;
  number: string;
  date: string; // ISO
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  received?: number;
  change?: number;
  clientName?: string;
  status: SaleStatus;
  clinicId: string;
  createdAt: string;
};

export type PosOrderStatus = "Pendiente" | "En preparación" | "Listo" | "Entregado" | "Cancelado";
export const POS_ORDER_STATUSES: PosOrderStatus[] = ["Pendiente", "En preparación", "Listo", "Entregado", "Cancelado"];
export type PosOrderItem = {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
};
export type PosOrder = {
  id: string;
  number: string;
  clientName: string;
  items: PosOrderItem[];
  total: number;
  status: PosOrderStatus;
  notes: string;
  source?: "presencial" | "online";
  clinicId: string;
  createdAt: string;
};

export type PosCashSession = {
  id: string;
  clinicId: string;
  openedAt: string;
  openedBy: string;
  openingAmount: number;
  closedAt?: string;
  closingAmount?: number;
  notes?: string;
};
export type PosCashMovement = {
  id: string;
  sessionId: string;
  clinicId: string;
  type: "Ingreso" | "Egreso";
  concept: string;
  amount: number;
  createdAt: string;
};

export type PosSaleDraftInput = {
  items: { productId: string; quantity: number; discount?: number }[];
  discount: number;
  paymentMethod: PaymentMethod;
  received?: number;
  clientName?: string;
};

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------
export const TAX_RATE = 0.13; // IVA 13%

export const CATEGORY_COLORS = [
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-rose-100 text-rose-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
  "bg-slate-100 text-slate-700",
];

const now = () => new Date().toISOString();
const todayISO = () => new Date().toISOString().split("T")[0];

export const SALE_PREFIX = "V-";
export const ORDER_PREFIX = "PED-";

// Las claves primarias en la BD son uuid; generamos el mismo id local para que
// los update/delete por id apunten a la fila correcta.
const uid = (): string => {
  try {
    return crypto.randomUUID();
  } catch {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
      const r = (Math.random() * 16) | 0;
      const v = ch === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
};

// Escrituras fire-and-forget: actualizan la BD sin bloquear la UI. Se registran
// los errores en consola sin interrumpir la operación síncrona.
function fire(p: PromiseLike<any>) {
  void Promise.resolve(p)
    .then((res) => {
      if (res?.error) throw res.error;
    })
    .catch((e) => console.error(e));
}

// ---------------------------------------------------------------------------
// Mapeo DB (snake_case) → tipos de la app (camelCase)
// ---------------------------------------------------------------------------
function mapCategory(r: DbRow): PosCategory {
  return {
    id: String(r.id ?? ""),
    nombre: String(r.nombre ?? ""),
    descripcion: String(r.descripcion ?? ""),
    color: String(r.color ?? "bg-slate-100 text-slate-700"),
    estado: (r.estado as PosEstado) ?? "Activo",
    clinicId: String(r.clinic_id ?? ""),
    createdAt: String(r.created_at ?? new Date().toISOString()),
  };
}

function mapProduct(r: DbRow): PosProduct {
  return {
    id: String(r.id ?? ""),
    code: String(r.code ?? ""),
    barcode: String(r.barcode ?? ""),
    name: String(r.name ?? ""),
    categoryId: String(r.category_id ?? ""),
    price: Number(r.price ?? 0),
    cost: Number(r.cost ?? 0),
    stock: Number(r.stock ?? 0),
    minStock: Number(r.min_stock ?? 0),
    unit: String(r.unit ?? "unidad"),
    image: r.image != null && String(r.image) !== "" ? String(r.image) : undefined,
    estado: (r.estado as PosEstado) ?? "Activo",
    online: Boolean(r.online),
    clinicId: String(r.clinic_id ?? ""),
    createdAt: String(r.created_at ?? new Date().toISOString()),
  };
}

function mapMovement(r: DbRow): PosMovement {
  return {
    id: String(r.id ?? ""),
    productId: String(r.product_id ?? ""),
    type: (r.type as PosMovementType) ?? "Entrada",
    quantity: Number(r.quantity ?? 0),
    reason: String(r.reason ?? ""),
    reference: r.reference != null && String(r.reference) !== "" ? String(r.reference) : undefined,
    clinicId: String(r.clinic_id ?? ""),
    createdAt: String(r.created_at ?? new Date().toISOString()),
  };
}

function mapSession(r: DbRow): PosCashSession {
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

function mapCashMovement(r: DbRow): PosCashMovement {
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

function mapSaleItem(r: DbRow): SaleItem {
  return {
    id: String(r.id ?? ""),
    productId: String(r.product_id ?? ""),
    name: String(r.name ?? ""),
    quantity: Number(r.quantity ?? 0),
    unitPrice: Number(r.unit_price ?? 0),
    discount: Number(r.discount ?? 0),
  };
}

function mapSale(r: DbRow, items: SaleItem[]): Sale {
  return {
    id: String(r.id ?? ""),
    number: String(r.number ?? ""),
    date: String(r.date ?? ""),
    items,
    subtotal: Number(r.subtotal ?? 0),
    discount: Number(r.discount ?? 0),
    tax: Number(r.tax ?? 0),
    total: Number(r.total ?? 0),
    paymentMethod: (r.payment_method as PaymentMethod) ?? "Efectivo",
    received: r.received != null ? Number(r.received) : undefined,
    change: r.change != null ? Number(r.change) : undefined,
    clientName: r.client_name != null && String(r.client_name) !== "" ? String(r.client_name) : undefined,
    status: (r.status as SaleStatus) ?? "Completada",
    clinicId: String(r.clinic_id ?? ""),
    createdAt: String(r.created_at ?? new Date().toISOString()),
  };
}

function mapOrderItem(r: DbRow): PosOrderItem {
  return {
    id: String(r.id ?? ""),
    productId: String(r.product_id ?? ""),
    name: String(r.name ?? ""),
    quantity: Number(r.quantity ?? 0),
    unitPrice: Number(r.unit_price ?? 0),
  };
}

function mapOrder(r: DbRow, items: PosOrderItem[]): PosOrder {
  return {
    id: String(r.id ?? ""),
    number: String(r.number ?? ""),
    clientName: String(r.client_name ?? ""),
    items,
    total: Number(r.total ?? 0),
    status: (r.status as PosOrderStatus) ?? "Pendiente",
    notes: String(r.notes ?? ""),
    source: r.source != null && String(r.source) !== "" ? (String(r.source) as "presencial" | "online") : undefined,
    clinicId: String(r.clinic_id ?? ""),
    createdAt: String(r.created_at ?? new Date().toISOString()),
  };
}

// ---------------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------------
type PosState = {
  categories: PosCategory[];
  products: PosProduct[];
  movements: PosMovement[];
  sales: Sale[];
  orders: PosOrder[];
  sessions: PosCashSession[];
  cashMovements: PosCashMovement[];
  saleCounter: number;
  orderCounter: number;
};

let saleCounter = 1002;
let orderCounter = 1;
let state: PosState = {
  categories: [],
  products: [],
  movements: [],
  sales: [],
  orders: [],
  sessions: [],
  cashMovements: [],
  saleCounter,
  orderCounter,
};

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
const set = (updater: (s: PosState) => PosState) => { state = updater(state); listeners.forEach((l) => l()); };

// ---------------------------------------------------------------------------
// Hidratación desde Supabase (RLS filtra por las clínicas accesibles)
// ---------------------------------------------------------------------------
export async function hydratePos(_clinicId: string): Promise<void> {
  const [categoriesRes, productsRes, movementsRes, sessionsRes, cashMovementsRes, salesRes, saleItemsRes, ordersRes, orderItemsRes] =
    await Promise.all([
      db.from("categories").select("*"),
      db.from("products").select("*"),
      db.from("inventory_movements").select("*"),
      db.from("cash_sessions").select("*"),
      db.from("cash_movements").select("*"),
      db.from("sales").select("*"),
      db.from("sale_items").select("*"),
      db.from("orders").select("*"),
      db.from("order_items").select("*"),
    ]);

  const categories = (categoriesRes.data ?? []).map(mapCategory);
  const products = (productsRes.data ?? []).map(mapProduct);
  const movements = (movementsRes.data ?? []).map(mapMovement);
  const sessions = (sessionsRes.data ?? []).map(mapSession);
  const cashMovements = (cashMovementsRes.data ?? []).map(mapCashMovement);

  // Agrupar items hijos por su padre.
  const saleItemsBySale: Record<string, SaleItem[]> = {};
  for (const raw of saleItemsRes.data ?? []) {
    const sid = String(raw.sale_id ?? "");
    (saleItemsBySale[sid] ??= []).push(mapSaleItem(raw));
  }
  const sales = (salesRes.data ?? []).map((r) => mapSale(r, saleItemsBySale[String(r.id)] ?? []));

  const orderItemsByOrder: Record<string, PosOrderItem[]> = {};
  for (const raw of orderItemsRes.data ?? []) {
    const oid = String(raw.order_id ?? "");
    (orderItemsByOrder[oid] ??= []).push(mapOrderItem(raw));
  }
  const orders = (ordersRes.data ?? []).map((r) => mapOrder(r, orderItemsByOrder[String(r.id)] ?? []));

  // Renumerar a partir del mayor sufijo numérico ya persistido.
  const stripPrefix = (number: string, prefix: string): number => {
    const stripped = number.startsWith(prefix) ? number.slice(prefix.length) : number;
    const n = parseInt(stripped, 10);
    return Number.isFinite(n) ? n : 0;
  };
  if (sales.length) {
    saleCounter = sales.reduce((m, s) => Math.max(m, stripPrefix(s.number, SALE_PREFIX)), 0) + 1;
  }
  if (orders.length) {
    orderCounter = orders.reduce((m, o) => Math.max(m, stripPrefix(o.number, ORDER_PREFIX)), 0) + 1;
  }

  set(() => ({ ...state, categories, products, movements, sales, orders, sessions, cashMovements, saleCounter, orderCounter }));
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------
const useTenant = <T extends { clinicId: string }>(get: () => T[]) => {
  const cid = useCurrentClinicId();
  useSyncExternalStore(subscribe, get, get);
  return useMemo(() => get().filter((x) => x.clinicId === cid), [get(), cid]);
};
export const usePosCategories = () => useTenant(() => state.categories);
export const usePosProducts = () => useTenant(() => state.products);
export const usePosMovements = () => useTenant(() => state.movements);
export const usePosSales = () => useTenant(() => state.sales);
export const usePosOrders = () => useTenant(() => state.orders);
export const usePosSessions = () => useTenant(() => state.sessions);
export const usePosCashMovements = () => useTenant(() => state.cashMovements);

// Acceso global (todas las clínicas) para el centro de mando del super admin.
export const useAllPosCategories = () => useSyncExternalStore(subscribe, () => state.categories, () => state.categories);
export const useAllPosProducts = () => useSyncExternalStore(subscribe, () => state.products, () => state.products);
export const useAllPosSales = () => useSyncExternalStore(subscribe, () => state.sales, () => state.sales);

export const getOpenSession = () => state.sessions.find((s) => !s.closedAt && s.clinicId === getCurrentClinicId());
export const getCategoryById = (id: string) => state.categories.find((c) => c.id === id);
export const getProductById = (id: string) => state.products.find((p) => p.id === id);
export function getCategoryLabel(id: string) { return getCategoryById(id)?.nombre ?? "Sin categoría"; }
export function getCategoryColor(id: string) { return getCategoryById(id)?.color ?? "bg-slate-100 text-slate-700"; }

// ---------------------------------------------------------------------------
// Categorías
// ---------------------------------------------------------------------------
export function addPosCategory(c: Omit<PosCategory, "id" | "createdAt" | "clinicId">) {
  const item: PosCategory = { ...c, id: uid(), clinicId: getCurrentClinicId(), createdAt: now() };
  set((s) => ({ ...s, categories: [item, ...s.categories] }));
  fire(
    db.from("categories").insert({
      id: item.id,
      clinic_id: item.clinicId,
      nombre: item.nombre,
      descripcion: item.descripcion,
      color: item.color,
      estado: item.estado,
    })
  );
  return item;
}
export function updatePosCategory(id: string, patch: Partial<PosCategory>) {
  set((s) => ({ ...s, categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  const row: Record<string, unknown> = {};
  if (patch.nombre !== undefined) row.nombre = patch.nombre;
  if (patch.descripcion !== undefined) row.descripcion = patch.descripcion;
  if (patch.color !== undefined) row.color = patch.color;
  if (patch.estado !== undefined) row.estado = patch.estado;
  if (Object.keys(row).length === 0) return;
  fire(db.from("categories").update(row).eq("id", id));
}
export function deletePosCategory(id: string) {
  set((s) => ({
    ...s,
    categories: s.categories.filter((c) => c.id !== id),
    products: s.products.map((p) => (p.categoryId === id ? { ...p, categoryId: "" } : p)),
  }));
  fire(db.from("categories").delete().eq("id", id));
}

// ---------------------------------------------------------------------------
// Productos
// ---------------------------------------------------------------------------
export function addPosProduct(p: Omit<PosProduct, "id" | "createdAt" | "clinicId">) {
  const item: PosProduct = { ...p, id: uid(), clinicId: getCurrentClinicId(), createdAt: now() };
  set((s) => ({ ...s, products: [item, ...s.products] }));
  fire(
    db.from("products").insert({
      id: item.id,
      clinic_id: item.clinicId,
      category_id: item.categoryId || null,
      code: item.code,
      barcode: item.barcode,
      name: item.name,
      price: item.price,
      cost: item.cost,
      stock: item.stock,
      min_stock: item.minStock,
      unit: item.unit,
      image: item.image ?? null,
      estado: item.estado,
      online: item.online,
    })
  );
  return item;
}
export function updatePosProduct(id: string, patch: Partial<PosProduct>) {
  set((s) => ({ ...s, products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  const row: Record<string, unknown> = {};
  if (patch.code !== undefined) row.code = patch.code;
  if (patch.barcode !== undefined) row.barcode = patch.barcode;
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.categoryId !== undefined) row.category_id = patch.categoryId || null;
  if (patch.price !== undefined) row.price = patch.price;
  if (patch.cost !== undefined) row.cost = patch.cost;
  if (patch.stock !== undefined) row.stock = patch.stock;
  if (patch.minStock !== undefined) row.min_stock = patch.minStock;
  if (patch.unit !== undefined) row.unit = patch.unit;
  if (patch.image !== undefined) row.image = patch.image ?? null;
  if (patch.estado !== undefined) row.estado = patch.estado;
  if (patch.online !== undefined) row.online = patch.online;
  if (Object.keys(row).length === 0) return;
  fire(db.from("products").update(row).eq("id", id));
}
export function deletePosProduct(id: string) {
  set((s) => ({ ...s, products: s.products.filter((p) => p.id !== id) }));
  fire(db.from("products").delete().eq("id", id));
}

// ---------------------------------------------------------------------------
// Movimientos
// ---------------------------------------------------------------------------
export function addPosMovement(m: Omit<PosMovement, "id" | "createdAt" | "clinicId">): PosMovement {
  const item: PosMovement = { ...m, id: uid(), clinicId: getCurrentClinicId(), createdAt: now() };
  set((s) => ({ ...s, movements: [item, ...s.movements] }));
  fire(
    db.from("inventory_movements").insert({
      id: item.id,
      clinic_id: item.clinicId,
      product_id: item.productId,
      type: item.type,
      quantity: item.quantity,
      reason: item.reason,
      reference: item.reference ?? null,
    })
  );
  return item;
}

// ---------------------------------------------------------------------------
// Ventas
// ---------------------------------------------------------------------------
function computeTotals(items: { unitPrice: number; quantity: number; discount: number }[], discount: number) {
  const subtotal = items.reduce((a, i) => a + i.unitPrice * i.quantity - i.discount, 0);
  const taxable = Math.max(subtotal - discount, 0);
  const tax = Math.round(taxable * TAX_RATE);
  const total = taxable + tax;
  return { subtotal, discount, tax, total };
}

export function confirmPosSale(input: PosSaleDraftInput): Sale | undefined {
  const items: SaleItem[] = input.items
    .map((i) => {
      const p = getProductById(i.productId);
      if (!p) return null;
      return { id: `it_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, productId: p.id, name: p.name, quantity: i.quantity, unitPrice: p.price, discount: i.discount ?? 0 };
    })
    .filter((x): x is SaleItem => !!x);
  if (items.length === 0) return undefined;

  const { subtotal, discount, tax, total } = computeTotals(items, input.discount);
  const next = state.saleCounter + 1;
  const sale: Sale = {
    id: `sa_${Date.now()}`,
    number: `${SALE_PREFIX}${next}`,
    date: todayISO(),
    items,
    subtotal,
    discount,
    tax,
    total,
    paymentMethod: input.paymentMethod,
    received: input.received,
    change: input.received != null ? Math.max(input.received - total, 0) : undefined,
    clientName: input.clientName?.trim() || "Cliente de mostrador",
    status: "Completada",
    clinicId: getCurrentClinicId(),
    createdAt: now(),
  };

  // Nuevo stock por producto (descontando la venta), para persistir en la BD.
  const stockUpdates = items
    .map((it) => {
      const p = state.products.find((x) => x.id === it.productId);
      if (!p) return null;
      return { productId: it.productId, newStock: Math.max(p.stock - it.quantity, 0) };
    })
    .filter((x): x is { productId: string; newStock: number } => !!x);

  set((s) => {
    // Descuento de stock + movimiento de salida
    const products = s.products.map((p) => {
      const it = items.find((i) => i.productId === p.id);
      if (!it) return p;
      const saleIt = it;
      const reduceQty = saleIt.quantity;
      const newStock = Math.max(p.stock - reduceQty, 0);
      return { ...p, stock: newStock };
    });
    const newMoves = items.map((i) => ({
      id: `mv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      productId: i.productId,
      type: "Salida" as PosMovementType,
      quantity: i.quantity,
      reason: "Venta en mostrador",
      reference: sale.number,
      clinicId: sale.clinicId,
      createdAt: now(),
    }));
    const newCash: PosCashMovement[] = getOpenSession()
      ? [{
          id: `cmv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          sessionId: getOpenSession()!.id,
          clinicId: sale.clinicId,
          type: "Ingreso" as const,
          concept: `Venta ${sale.number}`,
          amount: sale.total,
          createdAt: now(),
        }]
      : [];
    return {
      ...s,
      saleCounter: next,
      products,
      movements: [...newMoves, ...s.movements],
      sales: [sale, ...s.sales],
      cashMovements: [...newCash, ...s.cashMovements],
    };
  });

  // --- Persistencia en Supabase (sin await) ---------------------------------
  // Venta: dejamos que la BD genere el uuid y lo usamos como id local.
  void Promise.resolve(
    db
      .from("sales")
      .insert({
        clinic_id: sale.clinicId,
        number: sale.number,
        date: sale.date,
        subtotal: sale.subtotal,
        discount: sale.discount,
        tax: sale.tax,
        total: sale.total,
        payment_method: sale.paymentMethod,
        received: sale.received ?? null,
        change: sale.change ?? null,
        client_name: sale.clientName ?? null,
        status: sale.status,
      })
      .select()
  ).then((res) => {
      if (res.error) throw res.error;
      const saleId = res.data?.[0]?.id as string | undefined;
      if (!saleId) return;
      // Sincronizar el id local (temporal) con el uuid de la BD.
      set((s) => ({ ...s, sales: s.sales.map((x) => (x.id === sale.id ? { ...x, id: saleId } : x)) }));
      // Items de la venta.
      fire(
        db.from("sale_items").insert(
          items.map((it) => ({
            sale_id: saleId,
            product_id: it.productId,
            name: it.name,
            quantity: it.quantity,
            unit_price: it.unitPrice,
            discount: it.discount,
          }))
        )
      );
    })
    .catch((e) => console.error(e));

  // Stock en la BD.
  for (const u of stockUpdates) {
    fire(db.from("products").update({ stock: u.newStock }).eq("id", u.productId));
  }

  // Movimiento de salida por ítem.
  for (const it of items) {
    fire(
      db.from("inventory_movements").insert({
        clinic_id: sale.clinicId,
        product_id: it.productId,
        type: "Salida",
        quantity: it.quantity,
        reason: "Venta en mostrador",
        reference: sale.number,
      })
    );
  }

  // Movimiento de caja si hay sesión abierta.
  const openSess = getOpenSession();
  if (openSess) {
    fire(
      db.from("cash_movements").insert({
        clinic_id: sale.clinicId,
        session_id: openSess.id,
        type: "Ingreso",
        concept: `Venta ${sale.number}`,
        amount: sale.total,
      })
    );
  }

  return sale;
}

export function anularSale(id: string) {
  const sale = state.sales.find((x) => x.id === id);
  if (!sale) return;
  const stockUpdates = sale.items
    .map((i) => {
      const p = state.products.find((x) => x.id === i.productId);
      return p ? { productId: i.productId, newStock: p.stock + i.quantity } : null;
    })
    .filter((x): x is { productId: string; newStock: number } => !!x);

  set((s) => {
    // Reponer stock
    const products = s.products.map((p) => {
      const it = sale.items.find((i) => i.productId === p.id);
      return it ? { ...p, stock: p.stock + it.quantity } : p;
    });
    const newMoves = sale.items.map((i) => ({
      id: `mv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      productId: i.productId,
      type: "Entrada" as PosMovementType,
      quantity: i.quantity,
      reason: "Anulación de venta",
      reference: sale.number,
      clinicId: sale.clinicId,
      createdAt: now(),
    }));
    return {
      ...s,
      products,
      movements: [...newMoves, ...s.movements],
      sales: s.sales.map((x) => (x.id === id ? { ...x, status: "Anulada" as SaleStatus } : x)),
    };
  });

  // Reponer stock en la BD.
  for (const u of stockUpdates) {
    fire(db.from("products").update({ stock: u.newStock }).eq("id", u.productId));
  }
  // Movimiento de entrada por ítem.
  for (const i of sale.items) {
    fire(
      db.from("inventory_movements").insert({
        clinic_id: sale.clinicId,
        product_id: i.productId,
        type: "Entrada",
        quantity: i.quantity,
        reason: "Anulación de venta",
        reference: sale.number,
      })
    );
  }
  // Marcar la venta como anulada.
  fire(db.from("sales").update({ status: "Anulada" }).eq("id", id));
}

// ---------------------------------------------------------------------------
// Pedidos
// ---------------------------------------------------------------------------
export function addPosOrder(o: Omit<PosOrder, "id" | "createdAt" | "number" | "clinicId">): PosOrder {
  const next = state.orderCounter + 1;
  const item: PosOrder = { ...o, source: o.source ?? "presencial", id: uid(), number: `${ORDER_PREFIX}${next}`, clinicId: getCurrentClinicId(), createdAt: now() };
  set((s) => ({ ...s, orderCounter: next, orders: [item, ...s.orders] }));
  fire(
    db.from("orders").insert({
      id: item.id,
      clinic_id: item.clinicId,
      number: item.number,
      client_name: item.clientName,
      total: item.total,
      status: item.status,
      notes: item.notes,
      source: item.source ?? "presencial",
    })
  );
  fire(
    db.from("order_items").insert(
      item.items.map((it) => ({
        order_id: item.id,
        product_id: it.productId,
        name: it.name,
        quantity: it.quantity,
        unit_price: it.unitPrice,
      }))
    )
  );
  return item;
}
export function updatePosOrder(id: string, patch: Partial<PosOrder>) {
  set((s) => ({ ...s, orders: s.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)) }));
  const row: Record<string, unknown> = {};
  if (patch.clientName !== undefined) row.client_name = patch.clientName;
  if (patch.total !== undefined) row.total = patch.total;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.notes !== undefined) row.notes = patch.notes;
  if (patch.source !== undefined) row.source = patch.source;
  if (Object.keys(row).length === 0) return;
  fire(db.from("orders").update(row).eq("id", id));
}
export function deletePosOrder(id: string) {
  set((s) => ({ ...s, orders: s.orders.filter((o) => o.id !== id) }));
  fire(db.from("orders").delete().eq("id", id));
}

// ---------------------------------------------------------------------------
// Caja
// ---------------------------------------------------------------------------
// Tipo pago mixto: movimiento de egreso por el cambio entregado en ventas.
export function openPosSession(openingAmount: number, openedBy: string): PosCashSession {
  const item: PosCashSession = { id: uid(), clinicId: getCurrentClinicId(), openedAt: now(), openedBy, openingAmount };
  set((s) => ({ ...s, sessions: [item, ...s.sessions] }));
  fire(
    db.from("cash_sessions").insert({
      id: item.id,
      clinic_id: item.clinicId,
      opened_by: item.openedBy,
      opening_amount: item.openingAmount,
    })
  );
  return item;
}
export function closePosSession(id: string, closingAmount: number, notes?: string) {
  set((s) => ({ ...s, sessions: s.sessions.map((x) => (x.id === id ? { ...x, closedAt: now(), closingAmount, notes } : x)) }));
  fire(
    db.from("cash_sessions").update({
      closed_at: now(),
      closing_amount: closingAmount,
      notes: notes ?? null,
    }).eq("id", id)
  );
}
export function addPosCashMovement(sessionId: string, type: "Ingreso" | "Egreso", concept: string, amount: number) {
  const item: PosCashMovement = { id: uid(), sessionId, clinicId: getCurrentClinicId(), type, concept, amount, createdAt: now() };
  set((s) => ({ ...s, cashMovements: [item, ...s.cashMovements] }));
  fire(
    db.from("cash_movements").insert({
      id: item.id,
      clinic_id: item.clinicId,
      session_id: item.sessionId,
      type: item.type,
      concept: item.concept,
      amount: item.amount,
    })
  );
  return item;
}

// ---------------------------------------------------------------------------
// Helpers derivados
// ---------------------------------------------------------------------------
export const isLowStock = (p: PosProduct) => p.stock <= p.minStock;

export function usePosKpis() {
  const sales = usePosSales();
  const products = usePosProducts();
  const sessions = usePosSessions();
  const today = todayISO();
  const todaySales = sales.filter((s) => s.date === today && s.status === "Completada");
  const revenueToday = todaySales.reduce((a, s) => a + s.total, 0);
  const salesMonth = sales.filter((s) => s.date.slice(0, 7) === today.slice(0, 7) && s.status === "Completada");
  const revenueMonth = salesMonth.reduce((a, s) => a + s.total, 0);
  const avgTicket = todaySales.length ? Math.round(revenueToday / todaySales.length) : 0;
  const lowStock = products.filter(isLowStock).length;
  const session = sessions.find((s) => !s.closedAt);
  return { salesToday: todaySales.length, revenueToday, revenueMonth, avgTicket, lowStock, openSession: !!session };
}

registerHydrator(hydratePos);
