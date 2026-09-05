import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { PosNav } from "@/components/pos-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Can } from "@/lib/rbac";
import { ImageInput } from "@/components/image-input";
import { usePlanCapabilities } from "@/lib/saas-store";
import { PlanGate } from "@/components/plan-gate";
import { formatMoney, useCurrency } from "@/lib/config-store";
import {
  POS_ORDER_STATUSES,
  addPosProduct,
  deletePosOrder,
  deletePosProduct,
  isLowStock,
  updatePosOrder,
  updatePosProduct,
  usePosCategories,
  usePosOrders,
  usePosProducts,
  type PosProduct,
  type PosOrderStatus,
} from "@/lib/pos-store";
import { Store, Pencil, Plus, Search, Trash2, X, ExternalLink, Globe, Package } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/pos-online")({ component: PosOnlinePage });

type ProductForm = Omit<PosProduct, "id" | "createdAt" | "clinicId">;
const emptyForm = (categoryId: string): ProductForm => ({
  code: "", barcode: "", name: "", categoryId, price: 0, cost: 0, stock: 0, minStock: 0, unit: "unidad", estado: "Activo", online: true,
});

function PosOnlinePage() {
  const caps = usePlanCapabilities();
  const products = usePosProducts();
  const orders = usePosOrders();
  const categories = usePosCategories();
  const currency = useCurrency();

  const [tab, setTab] = useState("catalogo");
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PosProduct | null>(null);

  const onlineOrders = useMemo(() => orders.filter((o) => o.source === "online"), [orders]);
  const publicados = products.filter((p) => p.online).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => !q || [p.name, p.code].some((x) => (x || "").toLowerCase().includes(q)));
  }, [products, query]);

  const catLabel = (id: string) => categories.find((c) => c.id === id)?.nombre ?? "Sin categoría";

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (p: PosProduct) => { setEditing(p); setDialogOpen(true); };

  const handleSave = (data: ProductForm) => {
    if (editing) { updatePosProduct(editing.id, data); toast.success("Producto actualizado"); }
    else {
      if (products.length >= caps.maxProducts) {
        toast.error(`Alcanzaste el límite de ${caps.maxProducts} productos de tu plan ${caps.plan?.name}. Mejora tu plan.`);
        return;
      }
      addPosProduct(data); toast.success("Producto creado");
    }
    setDialogOpen(false);
  };

  if (!caps.tiendaOnlineEnabled) return <AppLayout><PlanGate planKey="tienda" /></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-6xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Store className="h-6 w-6 text-primary" /> Tienda Online</h1>
            <p className="text-muted-foreground text-sm mt-1">Administra el catálogo publicado y los pedidos que llegan desde la tienda online.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/tienda"><Globe className="h-4 w-4 mr-1" /> Ver tienda pública</Link>
            </Button>
            <Can module="punto_venta" action="create">
              <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Agregar producto</Button>
            </Can>
          </div>
        </div>

        <PosNav />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Stat label="Productos publicados" value={String(publicados)} tone="text-emerald-600" />
          <Stat label="No publicados" value={String(products.length - publicados)} />
          <Stat label="Pedidos online pendientes" value={String(onlineOrders.filter((o) => o.status === "Pendiente").length)} tone="text-amber-600" />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="catalogo"><Store className="h-4 w-4 mr-2" />Catálogo online</TabsTrigger>
            <TabsTrigger value="pedidos"><Globe className="h-4 w-4 mr-2" />Pedidos online ({onlineOrders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="catalogo" className="mt-4 space-y-3">
            <Card className="p-4">
              <div className="relative max-w-sm">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar producto..." className="pl-9" />
              </div>
            </Card>
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Publicado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <span className="flex items-center gap-3 font-medium">
                          <span className="h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-muted grid place-items-center">
                            {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <Package className="h-5 w-5 text-muted-foreground/40" />}
                          </span>
                          {p.name}
                          {p.online ? <Badge className="bg-emerald-100 text-emerald-700">Online</Badge> : <Badge variant="outline">Offline</Badge>}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{catLabel(p.categoryId)}</TableCell>
                      <TableCell className="font-semibold whitespace-nowrap">{formatMoney(p.price, currency)}</TableCell>
                      <TableCell><span className={isLowStock(p) ? "text-rose-600 font-medium" : ""}>{p.stock}</span></TableCell>
                      <TableCell>
                        <Switch checked={p.online} onCheckedChange={(v) => { updatePosProduct(p.id, { online: v }); toast.success(v ? "Publicado en tienda" : "Ocultado de la tienda"); }} />
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Can module="punto_venta" action="edit"><Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button></Can>
                        <Can module="punto_venta" action="delete"><Button size="sm" variant="ghost" className="text-destructive" onClick={() => { deletePosProduct(p.id); toast.success("Producto eliminado"); }}><Trash2 className="h-4 w-4" /></Button></Can>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sin productos.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="pedidos" className="mt-4">
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Ítems</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {onlineOrders.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Aún no hay pedidos online.</TableCell></TableRow>}
                  {onlineOrders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.number}</TableCell>
                      <TableCell>{o.clientName}</TableCell>
                      <TableCell>{o.items.reduce((a, i) => a + i.quantity, 0)}</TableCell>
                      <TableCell className="font-semibold whitespace-nowrap">{formatMoney(o.total, currency)}</TableCell>
                      <TableCell>
                        <Select value={o.status} onValueChange={(v) => { updatePosOrder(o.id, { status: v as PosOrderStatus }); toast.success("Estado actualizado"); }}>
                          <SelectTrigger className="h-7 w-[150px]"><SelectValue /></SelectTrigger>
                          <SelectContent>{POS_ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Can module="punto_venta" action="delete">
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm(`¿Eliminar pedido ${o.number}?`)) { deletePosOrder(o.id); toast.success("Pedido eliminado"); } }}><Trash2 className="h-4 w-4" /></Button>
                        </Can>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ProductoDialog open={dialogOpen} onOpenChange={setDialogOpen} initial={editing} defaultCategoryId={categories[0]?.id ?? ""} onSave={handleSave} />
    </AppLayout>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${tone ?? ""}`}>{value}</div>
    </Card>
  );
}

function ProductoDialog({ open, onOpenChange, initial, defaultCategoryId, onSave }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: PosProduct | null;
  defaultCategoryId: string;
  onSave: (d: ProductForm) => void;
}) {
  const categories = usePosCategories();
  const currency = useCurrency();
  const [form, setForm] = useState<ProductForm>(emptyForm(defaultCategoryId));
  useEffect(() => {
    if (!open) return;
    setForm(initial ? { ...initial } : emptyForm(defaultCategoryId));
  }, [open, initial, defaultCategoryId]);

  const save = () => {
    if (!form.name.trim()) return toast.error("Ingresa el nombre");
    onSave({ ...form, online: true }); // al crear/editar desde la tienda se publica
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{initial ? "Editar producto online" : "Agregar producto online"}</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1.5"><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Código</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Unidad</Label><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Categoría</Label>
            <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Precio</Label><Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
          <div className="space-y-1.5"><Label>Costo</Label><Input type="number" min={0} value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} /></div>
          <div className="space-y-1.5"><Label>Stock</Label><Input type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} /></div>
          <div className="space-y-1.5"><Label>Stock mínimo</Label><Input type="number" min={0} value={form.minStock} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} /></div>
          <div className="sm:col-span-2 space-y-1.5"><ImageInput label="Imagen" value={form.image ?? null} onChange={(v) => setForm({ ...form, image: v ?? undefined })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}><X className="h-4 w-4 mr-1" /> Cancelar</Button>
          <Button onClick={save}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
