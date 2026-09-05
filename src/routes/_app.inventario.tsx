import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Barcode, Boxes, Download, Package, Pencil, Plus, QrCode, Search, ShoppingCart, Trash2, TrendingDown, TrendingUp, Truck } from "lucide-react";
import { toast } from "sonner";
import {
  inventory,
  inventoryAlerts,
  inventoryStats,
  useInventoryMovements,
  useProducts,
  usePurchaseOrders,
  useSuppliers,
  type MovementType,
  type Product,
  type ProductCategory,
  type PurchaseOrderItem,
} from "@/lib/inventory-store";
import { formatCRC } from "@/lib/billing-store";
import { Can, useCan } from "@/lib/rbac";

export const Route = createFileRoute("/_app/inventario")({ component: InventoryPage });

const CATEGORIES: ProductCategory[] = ["Medicamento", "Vacuna", "Producto", "Alimento", "Accesorio", "Insumo médico"];

function stockBadge(p: Product) {
  if (p.stock <= 0) return { label: "Sin stock", cls: "bg-rose-100 text-rose-700" };
  if (p.stock <= p.minStock) return { label: "Stock bajo", cls: "bg-amber-100 text-amber-700" };
  return { label: "OK", cls: "bg-emerald-100 text-emerald-700" };
}

function expiryBadge(p: Product) {
  const d = new Date(p.expiresAt);
  const now = new Date();
  const days = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  if (days < 0) return { label: "Vencido", cls: "bg-rose-100 text-rose-700" };
  if (days <= 60) return { label: `Vence en ${days}d`, cls: "bg-amber-100 text-amber-700" };
  return { label: "Vigente", cls: "bg-emerald-100 text-emerald-700" };
}

function InventoryPage() {
  const products = useProducts();
  const movements = useInventoryMovements();
  const suppliers = useSuppliers();
  const purchases = usePurchaseOrders();
  const stats = inventoryStats();
  const alerts = inventoryAlerts();
  const can = useCan();

  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (cat !== "all" && p.category !== cat) return false;
      if (!q) return true;
      const s = q.toLowerCase();
      return p.name.toLowerCase().includes(s) || p.code.toLowerCase().includes(s) || p.barcode.includes(s);
    });
  }, [products, q, cat]);

  const [prodDialog, setProdDialog] = useState(false);
  const [prodForm, setProdForm] = useState<Omit<Product, "id" | "createdAt"> & { id?: string }>({
    code: "", barcode: "", name: "", category: "Medicamento", supplierId: "", cost: 0, price: 0, stock: 0, minStock: 0, lot: "", expiresAt: "", unit: "unidad",
  });

  const [movDialog, setMovDialog] = useState(false);
  const [movForm, setMovForm] = useState<{ productId: string; type: MovementType; quantity: number; reason: string }>({ productId: "", type: "Entrada", quantity: 1, reason: "" });

  const [supDialog, setSupDialog] = useState(false);
  const [supForm, setSupForm] = useState<{ id?: string; name: string; contact: string; email: string; phone: string; address: string }>({ name: "", contact: "", email: "", phone: "", address: "" });

  const [poDialog, setPoDialog] = useState(false);
  const [poForm, setPoForm] = useState<{ supplierId: string; items: PurchaseOrderItem[]; notes: string }>({ supplierId: suppliers[0]?.id ?? "", items: [{ productId: products[0]?.id ?? "", quantity: 1, cost: 0 }], notes: "" });

  const openNewProd = () => { setProdForm({ code: "", barcode: "", name: "", category: "Medicamento", supplierId: "", cost: 0, price: 0, stock: 0, minStock: 0, lot: "", expiresAt: "", unit: "unidad" }); setProdDialog(true); };
  const openEditProd = (p: Product) => { setProdForm({ ...p }); setProdDialog(true); };
  const saveProd = () => {
    if (!prodForm.name.trim() || !prodForm.code.trim()) return toast.error("Código y nombre requeridos");
    if (prodForm.id) { inventory.updateProduct(prodForm.id, prodForm); toast.success("Producto actualizado"); }
    else { inventory.addProduct(prodForm); toast.success("Producto creado"); }
    setProdDialog(false);
  };

  const saveMov = () => {
    if (!movForm.productId || movForm.quantity <= 0) return toast.error("Completa el movimiento");
    inventory.addMovement(movForm);
    setMovDialog(false);
    toast.success("Movimiento registrado");
  };

  const saveSup = () => {
    if (!supForm.name.trim()) return toast.error("Nombre requerido");
    if (supForm.id) { inventory.updateSupplier(supForm.id, supForm); toast.success("Proveedor actualizado"); }
    else { inventory.addSupplier(supForm); toast.success("Proveedor creado"); }
    setSupDialog(false);
    setSupForm({ name: "", contact: "", email: "", phone: "", address: "" });
  };

  const savePo = () => {
    if (!poForm.supplierId || poForm.items.some((i) => !i.productId || i.quantity <= 0)) return toast.error("Completa la compra");
    inventory.createPurchaseOrder(poForm);
    setPoDialog(false);
    setPoForm({ supplierId: suppliers[0]?.id ?? "", items: [{ productId: products[0]?.id ?? "", quantity: 1, cost: 0 }], notes: "" });
    toast.success("Compra creada");
  };

  const exportCsv = () => {
    const header = "Codigo,Nombre,Categoria,Stock,Min,Costo,Precio,Lote,Vence\n";
    const body = products.map((p) => [p.code, p.name, p.category, p.stock, p.minStock, p.cost, p.price, p.lot, p.expiresAt].join(",")).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `inventario-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exportado");
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Boxes className="h-6 w-6 text-primary" /> Inventario</h1>
            <p className="text-muted-foreground text-sm mt-1">Productos, proveedores, movimientos y compras</p>
          </div>
          <div className="flex gap-2">
            <Can module="inventario" action="export">
              <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-1" />Exportar</Button>
            </Can>
            <Can module="inventario" action="create">
              <Button onClick={openNewProd}><Plus className="h-4 w-4 mr-1" />Nuevo producto</Button>
            </Can>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4"><div className="text-xs text-muted-foreground flex items-center gap-1"><Package className="h-3 w-3" />Valor del inventario</div><div className="text-2xl font-bold mt-1">{formatCRC(stats.totalValue)}</div></Card>
          <Card className="p-4 border-amber-200 bg-amber-50/40"><div className="text-xs text-muted-foreground flex items-center gap-1"><TrendingDown className="h-3 w-3" />Stock bajo</div><div className="text-2xl font-bold mt-1">{stats.low}</div></Card>
          <Card className="p-4 border-rose-200 bg-rose-50/40"><div className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Vencidos</div><div className="text-2xl font-bold mt-1">{stats.expired}</div></Card>
          <Card className="p-4"><div className="text-xs text-muted-foreground">Por vencer (60 días)</div><div className="text-2xl font-bold mt-1">{stats.expiring}</div></Card>
        </div>

        {(alerts.low.length + alerts.expired.length + alerts.expiring.length) > 0 && (
          <Card className="p-4 border-amber-200">
            <div className="font-semibold text-sm mb-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600" />Alertas de inventario</div>
            <div className="flex flex-wrap gap-2 text-xs">
              {alerts.low.map((p) => <Badge key={"l" + p.id} variant="secondary" className="bg-amber-100 text-amber-700">Stock bajo: {p.name} ({p.stock}/{p.minStock})</Badge>)}
              {alerts.expired.map((p) => <Badge key={"e" + p.id} variant="secondary" className="bg-rose-100 text-rose-700">Vencido: {p.name}</Badge>)}
              {alerts.expiring.map((p) => <Badge key={"x" + p.id} variant="secondary" className="bg-amber-100 text-amber-700">Vence pronto: {p.name} ({p.expiresAt})</Badge>)}
            </div>
          </Card>
        )}

        <Tabs defaultValue="productos">
          <TabsList>
            <TabsTrigger value="productos">Productos</TabsTrigger>
            <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
            <TabsTrigger value="proveedores">Proveedores</TabsTrigger>
            <TabsTrigger value="compras">Compras</TabsTrigger>
            <TabsTrigger value="reportes">Reportes</TabsTrigger>
          </TabsList>

          <TabsContent value="productos" className="mt-4">
            <Card className="p-4">
              <div className="flex flex-wrap gap-2 mb-3">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, código o barcode" className="pl-9" />
                </div>
                <Select value={cat} onValueChange={setCat}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Can module="inventario" action="create">
                  <Button variant="outline" onClick={() => setMovDialog(true)}><Truck className="h-4 w-4 mr-1" />Movimiento</Button>
                </Can>
              </div>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Código</TableHead><TableHead>Nombre</TableHead><TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Stock</TableHead><TableHead className="text-right">Costo</TableHead>
                  <TableHead className="text-right">Precio</TableHead><TableHead>Lote / Vence</TableHead>
                  <TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filtered.map((p) => {
                    const sb = stockBadge(p); const eb = expiryBadge(p);
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs">{p.code}</TableCell>
                        <TableCell className="font-medium">{p.name}<div className="text-xs text-muted-foreground">{p.barcode}</div></TableCell>
                        <TableCell><Badge variant="secondary">{p.category}</Badge></TableCell>
                        <TableCell className="text-right">{p.stock} <span className="text-xs text-muted-foreground">/ min {p.minStock}</span></TableCell>
                        <TableCell className="text-right">{formatCRC(p.cost)}</TableCell>
                        <TableCell className="text-right">{formatCRC(p.price)}</TableCell>
                        <TableCell className="text-xs">{p.lot}<div className="text-muted-foreground">{p.expiresAt}</div></TableCell>
                        <TableCell className="space-y-1">
                          <div className={`px-2 py-0.5 rounded-full text-xs inline-block ${sb.cls}`}>{sb.label}</div>
                          <div className={`px-2 py-0.5 rounded-full text-xs inline-block ${eb.cls}`}>{eb.label}</div>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Can module="inventario" action="edit">
                            <Button size="sm" variant="ghost" onClick={() => openEditProd(p)}><Pencil className="h-4 w-4" /></Button>
                          </Can>
                          <Can module="inventario" action="delete">
                            <Button size="sm" variant="ghost" onClick={() => { inventory.deleteProduct(p.id); toast.success("Producto eliminado"); }}><Trash2 className="h-4 w-4" /></Button>
                          </Can>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="movimientos" className="mt-4">
            <Card className="p-4">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Fecha</TableHead><TableHead>Producto</TableHead><TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead><TableHead>Motivo</TableHead><TableHead>Referencia</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {movements.map((m) => {
                    const p = products.find((x) => x.id === m.productId);
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="text-xs">{new Date(m.createdAt).toLocaleString()}</TableCell>
                        <TableCell>{p?.name ?? "—"}</TableCell>
                        <TableCell><Badge variant={m.type === "Entrada" ? "default" : "secondary"}>{m.type}</Badge></TableCell>
                        <TableCell className="text-right">{m.quantity}</TableCell>
                        <TableCell className="text-xs">{m.reason}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{m.reference ?? "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="proveedores" className="mt-4">
            <Card className="p-4">
              <div className="flex justify-end mb-3">
                <Can module="inventario" action="create">
                  <Button size="sm" onClick={() => { setSupForm({ name: "", contact: "", email: "", phone: "", address: "" }); setSupDialog(true); }}><Plus className="h-4 w-4 mr-1" />Nuevo proveedor</Button>
                </Can>
              </div>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Nombre</TableHead><TableHead>Contacto</TableHead><TableHead>Correo</TableHead>
                  <TableHead>Teléfono</TableHead><TableHead>Dirección</TableHead><TableHead className="text-right">Acciones</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {suppliers.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.contact}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{s.email}</TableCell>
                      <TableCell>{s.phone}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.address}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Can module="inventario" action="edit">
                          <Button size="sm" variant="ghost" onClick={() => { setSupForm({ id: s.id, name: s.name, contact: s.contact, email: s.email, phone: s.phone, address: s.address }); setSupDialog(true); }}><Pencil className="h-4 w-4" /></Button>
                        </Can>
                        <Can module="inventario" action="delete">
                          <Button size="sm" variant="ghost" onClick={() => { inventory.deleteSupplier(s.id); toast.success("Proveedor eliminado"); }}><Trash2 className="h-4 w-4" /></Button>
                        </Can>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="compras" className="mt-4">
            <Card className="p-4">
              <div className="flex justify-end mb-3">
                <Can module="inventario" action="create">
                  <Button size="sm" onClick={() => setPoDialog(true)}><Plus className="h-4 w-4 mr-1" />Nueva compra</Button>
                </Can>
              </div>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Número</TableHead><TableHead>Fecha</TableHead><TableHead>Proveedor</TableHead>
                  <TableHead>Ítems</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {purchases.map((po) => {
                    const sup = suppliers.find((x) => x.id === po.supplierId);
                    return (
                      <TableRow key={po.id}>
                        <TableCell className="font-mono text-xs">{po.number}</TableCell>
                        <TableCell className="text-xs">{po.date}</TableCell>
                        <TableCell>{sup?.name ?? "—"}</TableCell>
                        <TableCell>{po.items.length}</TableCell>
                        <TableCell className="text-right">{formatCRC(po.total)}</TableCell>
                        <TableCell><Badge variant={po.status === "Recibida" ? "default" : "secondary"}>{po.status}</Badge></TableCell>
                        <TableCell className="text-right space-x-1">
                          {po.status !== "Recibida" && po.status !== "Cancelada" && (
                            <Can module="inventario" action="edit">
                              <Button size="sm" onClick={() => { inventory.receivePurchaseOrder(po.id); toast.success("Compra recibida — stock actualizado"); }}>Recibir</Button>
                            </Can>
                          )}
                          {po.status !== "Recibida" && po.status !== "Cancelada" && (
                            <Can module="inventario" action="delete">
                              <Button size="sm" variant="ghost" onClick={() => { inventory.cancelPurchaseOrder(po.id); toast.success("Compra cancelada"); }}>Cancelar</Button>
                            </Can>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="reportes" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-4">
                <div className="font-semibold mb-2 flex items-center gap-2"><TrendingUp className="h-4 w-4" />Productos más usados</div>
                {stats.top.length === 0 ? <div className="text-xs text-muted-foreground">Sin datos</div> : (
                  <div className="space-y-2">
                    {stats.top.map((t) => (
                      <div key={t.product?.id} className="flex justify-between text-sm">
                        <span>{t.product?.name}</span>
                        <span className="font-medium">{t.qty}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
              <Card className="p-4">
                <div className="font-semibold mb-2">Valor por categoría</div>
                {(() => {
                  const map: Record<string, number> = {};
                  for (const p of products) map[p.category] = (map[p.category] || 0) + p.cost * p.stock;
                  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
                  const max = entries[0]?.[1] || 1;
                  return (
                    <div className="space-y-2">
                      {entries.map(([k, v]) => (
                        <div key={k}>
                          <div className="flex justify-between text-xs mb-1"><span>{k}</span><span className="font-medium">{formatCRC(v)}</span></div>
                          <div className="h-2 bg-muted rounded"><div className="h-2 bg-primary rounded" style={{ width: `${(v / max) * 100}%` }} /></div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </Card>
              <Card className="p-4 md:col-span-2 border-dashed">
                <div className="font-semibold mb-1">Integraciones preparadas</div>
                <div className="text-xs text-muted-foreground mb-3">Escáner de código de barras · QR · App móvil · Compras automáticas</div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary"><Barcode className="h-3 w-3 mr-1" />Escáner · próximamente</Badge>
                  <Badge variant="secondary"><QrCode className="h-3 w-3 mr-1" />QR · próximamente</Badge>
                  <Badge variant="secondary"><ShoppingCart className="h-3 w-3 mr-1" />Compras automáticas · próximamente</Badge>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog Producto */}
      <Dialog open={prodDialog} onOpenChange={setProdDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{prodForm.id ? "Editar producto" : "Nuevo producto"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 md:grid-cols-3">
            <div><Label>Código</Label><Input value={prodForm.code} onChange={(e) => setProdForm({ ...prodForm, code: e.target.value })} /></div>
            <div><Label>Código de barras</Label><Input value={prodForm.barcode} onChange={(e) => setProdForm({ ...prodForm, barcode: e.target.value })} /></div>
            <div>
              <Label>Categoría</Label>
              <Select value={prodForm.category} onValueChange={(v) => setProdForm({ ...prodForm, category: v as ProductCategory })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3"><Label>Nombre</Label><Input value={prodForm.name} onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })} /></div>
            <div>
              <Label>Proveedor</Label>
              <Select value={prodForm.supplierId ?? ""} onValueChange={(v) => setProdForm({ ...prodForm, supplierId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Unidad</Label><Input value={prodForm.unit} onChange={(e) => setProdForm({ ...prodForm, unit: e.target.value })} /></div>
            <div><Label>Lote</Label><Input value={prodForm.lot} onChange={(e) => setProdForm({ ...prodForm, lot: e.target.value })} /></div>
            <div><Label>Costo</Label><Input type="number" value={prodForm.cost} onChange={(e) => setProdForm({ ...prodForm, cost: Number(e.target.value) || 0 })} /></div>
            <div><Label>Precio</Label><Input type="number" value={prodForm.price} onChange={(e) => setProdForm({ ...prodForm, price: Number(e.target.value) || 0 })} /></div>
            <div><Label>Vence</Label><Input type="date" value={prodForm.expiresAt} onChange={(e) => setProdForm({ ...prodForm, expiresAt: e.target.value })} /></div>
            <div><Label>Stock actual</Label><Input type="number" value={prodForm.stock} onChange={(e) => setProdForm({ ...prodForm, stock: Number(e.target.value) || 0 })} /></div>
            <div><Label>Stock mínimo</Label><Input type="number" value={prodForm.minStock} onChange={(e) => setProdForm({ ...prodForm, minStock: Number(e.target.value) || 0 })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProdDialog(false)}>Cancelar</Button>
            <Button onClick={saveProd}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Movimiento */}
      <Dialog open={movDialog} onOpenChange={setMovDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo movimiento</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Producto</Label>
              <Select value={movForm.productId} onValueChange={(v) => setMovForm({ ...movForm, productId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.stock})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={movForm.type} onValueChange={(v) => setMovForm({ ...movForm, type: v as MovementType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(["Entrada", "Salida", "Ajuste", "Transferencia"] as MovementType[]).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Cantidad</Label><Input type="number" min={1} value={movForm.quantity} onChange={(e) => setMovForm({ ...movForm, quantity: Number(e.target.value) || 1 })} /></div>
            </div>
            <div><Label>Motivo</Label><Textarea value={movForm.reason} onChange={(e) => setMovForm({ ...movForm, reason: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovDialog(false)}>Cancelar</Button>
            <Button onClick={saveMov}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Proveedor */}
      <Dialog open={supDialog} onOpenChange={setSupDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{supForm.id ? "Editar proveedor" : "Nuevo proveedor"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2"><Label>Nombre</Label><Input value={supForm.name} onChange={(e) => setSupForm({ ...supForm, name: e.target.value })} /></div>
            <div><Label>Contacto</Label><Input value={supForm.contact} onChange={(e) => setSupForm({ ...supForm, contact: e.target.value })} /></div>
            <div><Label>Teléfono</Label><Input value={supForm.phone} onChange={(e) => setSupForm({ ...supForm, phone: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Correo</Label><Input type="email" value={supForm.email} onChange={(e) => setSupForm({ ...supForm, email: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Dirección</Label><Input value={supForm.address} onChange={(e) => setSupForm({ ...supForm, address: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSupDialog(false)}>Cancelar</Button>
            <Button onClick={saveSup}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Compra */}
      <Dialog open={poDialog} onOpenChange={setPoDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Nueva orden de compra</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Proveedor</Label>
              <Select value={poForm.supplierId} onValueChange={(v) => setPoForm({ ...poForm, supplierId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              {poForm.items.map((it, i) => (
                <div key={i} className="grid gap-2 md:grid-cols-[1fr_100px_140px_40px]">
                  <Select value={it.productId} onValueChange={(v) => setPoForm({ ...poForm, items: poForm.items.map((x, idx) => idx === i ? { ...x, productId: v } : x) })}>
                    <SelectTrigger><SelectValue placeholder="Producto" /></SelectTrigger>
                    <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="number" min={1} value={it.quantity} onChange={(e) => setPoForm({ ...poForm, items: poForm.items.map((x, idx) => idx === i ? { ...x, quantity: Number(e.target.value) || 1 } : x) })} />
                  <Input type="number" min={0} placeholder="Costo unit." value={it.cost} onChange={(e) => setPoForm({ ...poForm, items: poForm.items.map((x, idx) => idx === i ? { ...x, cost: Number(e.target.value) || 0 } : x) })} />
                  <Button size="sm" variant="ghost" onClick={() => setPoForm({ ...poForm, items: poForm.items.filter((_, idx) => idx !== i) })}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => setPoForm({ ...poForm, items: [...poForm.items, { productId: products[0]?.id ?? "", quantity: 1, cost: 0 }] })}><Plus className="h-4 w-4 mr-1" />Agregar ítem</Button>
            </div>
            <div><Label>Notas</Label><Textarea value={poForm.notes} onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })} /></div>
            <div className="text-right text-sm font-medium">Total: {formatCRC(poForm.items.reduce((a, i) => a + i.quantity * i.cost, 0))}</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPoDialog(false)}>Cancelar</Button>
            <Button onClick={savePo}>Crear compra</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
