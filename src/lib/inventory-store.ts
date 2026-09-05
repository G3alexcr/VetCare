import { useTenantSlice } from "./tenant";
import { getCurrentClinicId } from "./saas-store";
import { db } from "./supabase";
import { registerHydrator, type DbRow } from "./db-hooks";

export type ProductCategory =
  | "Medicamento"
  | "Vacuna"
  | "Producto"
  | "Alimento"
  | "Accesorio"
  | "Insumo médico";

export type Product = {
  id: string;
  code: string;
  barcode: string;
  name: string;
  category: ProductCategory;
  supplierId?: string;
  cost: number;
  price: number;
  stock: number;
  minStock: number;
  lot: string;
  expiresAt: string; // YYYY-MM-DD
  unit: string; // ml, tabletas, unidad
  createdAt: string;
};

export type MovementType = "Entrada" | "Salida" | "Ajuste" | "Transferencia";
export type InventoryMovement = {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;
  reason: string;
  reference?: string; // consulta, factura, etc.
  createdAt: string;
  createdBy?: string;
};

export type Supplier = {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
};

export type PurchaseOrderStatus = "Borrador" | "Enviada" | "Recibida" | "Cancelada";
export type PurchaseOrderItem = { productId: string; quantity: number; cost: number };
export type PurchaseOrder = {
  id: string;
  number: string;
  supplierId: string;
  date: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  total: number;
  notes?: string;
};

type State = {
  products: Array<Product & { clinicId: string }>;
  movements: Array<InventoryMovement & { clinicId: string }>;
  suppliers: Array<Supplier & { clinicId: string }>;
  purchases: Array<PurchaseOrder & { clinicId: string }>;
  poCounter: number;
};

const now = () => new Date().toISOString();
const today = () => new Date().toISOString().split("T")[0];

let state: State = { products: [], movements: [], suppliers: [], purchases: [], poCounter: 1 };
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
const set = (u: (s: State) => State) => { state = u(state); listeners.forEach((l) => l()); };

// ---------------------------------------------------------------------------
// Mapeo DB (snake_case) → tipos de la app (camelCase)
// ---------------------------------------------------------------------------
function mapProduct(r: DbRow): Product & { clinicId: string } {
  return {
    id: String(r.id ?? ""),
    code: String(r.code ?? ""),
    barcode: String(r.barcode ?? ""),
    name: String(r.name ?? ""),
    category: (r.category as ProductCategory) ?? "Producto",
    supplierId: undefined,
    cost: Number(r.cost ?? 0),
    price: Number(r.price ?? 0),
    stock: Number(r.stock ?? 0),
    minStock: Number(r.min_stock ?? 0),
    lot: "",
    expiresAt: "",
    unit: String(r.unit ?? "unidad"),
    clinicId: String(r.clinic_id ?? ""),
    createdAt: String(r.created_at ?? new Date().toISOString()),
  };
}

function mapMovement(r: DbRow): InventoryMovement & { clinicId: string } {
  return {
    id: String(r.id ?? ""),
    productId: String(r.product_id ?? ""),
    type: (r.type as MovementType) ?? "Entrada",
    quantity: Number(r.quantity ?? 0),
    reason: String(r.reason ?? ""),
    reference: r.reference != null && String(r.reference) !== "" ? String(r.reference) : undefined,
    clinicId: String(r.clinic_id ?? ""),
    createdAt: String(r.created_at ?? new Date().toISOString()),
  };
}

// ---------------------------------------------------------------------------
// Hidratación desde Supabase (RLS filtra por las clínicas accesibles)
// ---------------------------------------------------------------------------
export async function hydrateInventory(_clinicId: string): Promise<void> {
  const [productsRes, movementsRes] = await Promise.all([
    db.from("products").select("*"),
    db.from("inventory_movements").select("*"),
  ]);
  const products = (productsRes.data ?? []).map(mapProduct);
  const movements = (movementsRes.data ?? []).map(mapMovement);
  set(() => ({ ...state, products, movements }));
}
registerHydrator(hydrateInventory);

export const useProducts = () => useTenantSlice(subscribe, () => state.products);
export const useInventoryMovements = () => useTenantSlice(subscribe, () => state.movements);
export const useSuppliers = () => useTenantSlice(subscribe, () => state.suppliers);
export const usePurchaseOrders = () => useTenantSlice(subscribe, () => state.purchases);

export const inventory = {
  addProduct(p: Omit<Product, "id" | "createdAt">) {
    const item: Product & { clinicId: string } = { ...p, id: crypto.randomUUID(), clinicId: getCurrentClinicId(), createdAt: now() };
    set((s) => ({ ...s, products: [item, ...s.products] }));
    void Promise.resolve(db.from("products").insert({
      id: item.id,
      clinic_id: item.clinicId,
      code: item.code,
      barcode: item.barcode,
      name: item.name,
      price: item.price,
      cost: item.cost,
      stock: item.stock,
      min_stock: item.minStock,
      unit: item.unit,
    })).then(() => {}).catch((e) => console.error(e));
    return item;
  },
  updateProduct(id: string, patch: Partial<Product>) {
    set((s) => ({ ...s, products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
    const row: Record<string, unknown> = {};
    if (patch.code !== undefined) row.code = patch.code;
    if (patch.barcode !== undefined) row.barcode = patch.barcode;
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.price !== undefined) row.price = patch.price;
    if (patch.cost !== undefined) row.cost = patch.cost;
    if (patch.stock !== undefined) row.stock = patch.stock;
    if (patch.minStock !== undefined) row.min_stock = patch.minStock;
    if (patch.unit !== undefined) row.unit = patch.unit;
    if (Object.keys(row).length === 0) return;
    void Promise.resolve(db.from("products").update(row).eq("id", id)).then(() => {}).catch((e) => console.error(e));
  },
  deleteProduct(id: string) {
    set((s) => ({ ...s, products: s.products.filter((p) => p.id !== id) }));
    void Promise.resolve(db.from("products").delete().eq("id", id)).then(() => {}).catch((e) => console.error(e));
  },
  addMovement(m: Omit<InventoryMovement, "id" | "createdAt">) {
    const mv: InventoryMovement & { clinicId: string } = { ...m, id: crypto.randomUUID(), clinicId: getCurrentClinicId(), createdAt: now() };
    set((s) => {
      const products = s.products.map((p) => {
        if (p.id !== m.productId) return p;
        const delta = m.type === "Entrada" ? m.quantity : m.type === "Salida" ? -m.quantity : m.type === "Ajuste" ? m.quantity - p.stock : -m.quantity;
        return { ...p, stock: Math.max(0, p.stock + delta) };
      });
      return { ...s, movements: [mv, ...s.movements], products };
    });
    void Promise.resolve(db.from("inventory_movements").insert({
      id: mv.id,
      clinic_id: mv.clinicId,
      product_id: mv.productId,
      type: mv.type,
      quantity: mv.quantity,
      reason: mv.reason,
      reference: mv.reference ?? null,
    })).then(() => {}).catch((e) => console.error(e));
    return mv;
  },
  consumeForConsultation(productId: string, quantity: number, ref?: string) {
    return inventory.addMovement({ productId, quantity, type: "Salida", reason: "Uso en consulta", reference: ref });
  },
  addSupplier(sp: Omit<Supplier, "id" | "createdAt">) {
    const item: Supplier & { clinicId: string } = { ...sp, id: crypto.randomUUID(), clinicId: getCurrentClinicId(), createdAt: now() };
    set((s) => ({ ...s, suppliers: [item, ...s.suppliers] }));
    return item;
  },
  updateSupplier(id: string, patch: Partial<Supplier>) {
    set((s) => ({ ...s, suppliers: s.suppliers.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  },
  deleteSupplier(id: string) {
    set((s) => ({ ...s, suppliers: s.suppliers.filter((x) => x.id !== id) }));
  },
  createPurchaseOrder(input: { supplierId: string; items: PurchaseOrderItem[]; notes?: string }) {
    const total = input.items.reduce((a, it) => a + it.quantity * it.cost, 0);
    const po: PurchaseOrder & { clinicId: string } = {
      id: crypto.randomUUID(), number: `PO-${String(state.poCounter).padStart(6, "0")}`,
      supplierId: input.supplierId, date: today(), status: "Borrador", items: input.items, total, notes: input.notes,
      clinicId: getCurrentClinicId(),
    };
    set((s) => ({ ...s, purchases: [po, ...s.purchases], poCounter: s.poCounter + 1 }));
    return po;
  },
  receivePurchaseOrder(id: string) {
    const po = state.purchases.find((x) => x.id === id);
    if (!po || po.status === "Recibida") return;
    for (const it of po.items) {
      inventory.addMovement({ productId: it.productId, quantity: it.quantity, type: "Entrada", reason: `Recepción ${po.number}`, reference: po.number });
    }
    set((s) => ({ ...s, purchases: s.purchases.map((x) => (x.id === id ? { ...x, status: "Recibida" } : x)) }));
  },
  cancelPurchaseOrder(id: string) {
    set((s) => ({ ...s, purchases: s.purchases.map((x) => (x.id === id ? { ...x, status: "Cancelada" } : x)) }));
  },
};

export function inventoryAlerts() {
  const t = new Date();
  const soon = new Date();
  soon.setDate(t.getDate() + 60);
  const low = state.products.filter((p) => p.stock <= p.minStock);
  const expired = state.products.filter((p) => new Date(p.expiresAt) < t);
  const expiring = state.products.filter((p) => {
    const d = new Date(p.expiresAt);
    return d >= t && d <= soon;
  });
  return { low, expired, expiring };
}

export function inventoryStats() {
  const totalValue = state.products.reduce((a, p) => a + p.cost * p.stock, 0);
  const alerts = inventoryAlerts();
  const salidas = state.movements.filter((m) => m.type === "Salida");
  const topBySales: Record<string, number> = {};
  for (const m of salidas) topBySales[m.productId] = (topBySales[m.productId] || 0) + m.quantity;
  const top = Object.entries(topBySales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, q]) => ({ product: state.products.find((p) => p.id === id), qty: q }));
  return { totalValue, low: alerts.low.length, expired: alerts.expired.length, expiring: alerts.expiring.length, top };
}
