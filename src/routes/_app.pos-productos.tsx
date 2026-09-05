import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { PosNav } from "@/components/pos-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Can } from "@/lib/rbac";
import { usePlanCapabilities } from "@/lib/saas-store";
import { ImageInput } from "@/components/image-input";
import { formatMoney, getCurrencySymbol, useCurrency } from "@/lib/config-store";
import {
  addPosProduct,
  deletePosProduct,
  isLowStock,
  updatePosProduct,
  usePosCategories,
  usePosProducts,
  type PosEstado,
  type PosProduct,
} from "@/lib/pos-store";
import { Package, Pencil, Plus, Search, Trash2, X, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/pos-productos")({ component: PosProductosPage });

type ProductForm = Omit<PosProduct, "id" | "createdAt" | "clinicId">;
const emptyForm = (categoryId: string): ProductForm => ({
  code: "", barcode: "", name: "", categoryId, price: 0, cost: 0, stock: 0, minStock: 0, unit: "unidad", estado: "Activo", online: true,
});

function PosProductosPage() {
  const products = usePosProducts();
  const categorias = usePosCategories();
  const currency = useCurrency();
  const caps = usePlanCapabilities();
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("todas");
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PosProduct | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (catFilter !== "todas" && p.categoryId !== catFilter) return false;
      if (estadoFilter !== "todos" && p.estado !== estadoFilter) return false;
      if (q && ![p.name, p.code, p.barcode].some((x) => (x || "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [products, query, catFilter, estadoFilter]);

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (p: PosProduct) => { setEditing(p); setDialogOpen(true); };

  const handleSave = (data: ProductForm) => {
    if (editing) { updatePosProduct(editing.id, data); toast.success("Producto actualizado"); }
    else {
      if (products.length >= caps.maxProducts) {
        toast.error(`Alcanzaste el límite de ${caps.maxProducts} productos de tu plan ${caps.plan?.name}. Mejora tu plan para agregar más.`);
        return;
      }
      addPosProduct(data); toast.success("Producto creado");
    }
    setDialogOpen(false);
  };

  const catLabel = (id: string) => categorias.find((c) => c.id === id)?.nombre ?? "Sin categoría";

  return (
    <AppLayout>
      <div className="space-y-6 max-w-6xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Package className="h-6 w-6 text-primary" /> Productos</h1>
            <p className="text-muted-foreground text-sm mt-1">Catálogo del punto de venta con stock y alertas.</p>
          </div>
          <Can module="punto_venta" action="create">
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Nuevo producto</Button>
          </Can>
        </div>

        <PosNav />

        <Card className="p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_220px_180px]">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, código o barras..." className="pl-9" />
            </div>
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las categorías</SelectItem>
                {categorias.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="Activo">Activo</SelectItem>
                <SelectItem value="Inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Costo</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-muted grid place-items-center">
                        {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <Package className="h-6 w-6 text-muted-foreground/40" />}
                      </div>
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.code} · {p.barcode}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{catLabel(p.categoryId)}</Badge></TableCell>
                  <TableCell className="font-semibold whitespace-nowrap">{formatMoney(p.price, currency)}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{formatMoney(p.cost, currency)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 font-medium ${isLowStock(p) ? "text-rose-600" : ""}`}>
                      {isLowStock(p) && <TriangleAlert className="h-3.5 w-3.5" />}
                      {p.stock}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.unit}</TableCell>
                  <TableCell><Badge className={p.estado === "Activo" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}>{p.estado}</Badge></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Can module="punto_venta" action="edit"><Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button></Can>
                    <Can module="punto_venta" action="delete"><Button size="sm" variant="ghost" className="text-destructive" onClick={() => { deletePosProduct(p.id); toast.success("Producto eliminado"); }}><Trash2 className="h-4 w-4" /></Button></Can>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Sin productos.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <ProductoDialog open={dialogOpen} onOpenChange={setDialogOpen} initial={editing} defaultCategoryId={categorias[0]?.id ?? ""} onSave={handleSave} />
    </AppLayout>
  );
}

function ProductoDialog({ open, onOpenChange, initial, defaultCategoryId, onSave }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: PosProduct | null;
  defaultCategoryId: string;
  onSave: (d: ProductForm) => void;
}) {
  const categorias = usePosCategories();
  const currency = useCurrency();
  const [form, setForm] = useState<ProductForm>(emptyForm(defaultCategoryId));
  useEffect(() => {
    if (!open) return;
    setForm(initial ? { ...initial, categoryId: initial.categoryId } : emptyForm(defaultCategoryId));
  }, [open, initial, defaultCategoryId]);

  const save = () => {
    if (!form.name.trim()) return toast.error("Ingresa el nombre");
    if (form.price < 0) return toast.error("Precio inválido");
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{initial ? "Editar producto" : "Nuevo producto"}</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1.5"><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Código</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Código de barras</Label><Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} /></div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Categoría</Label>
            <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
              <SelectTrigger><SelectValue placeholder="Selecciona categoría" /></SelectTrigger>
              <SelectContent>{categorias.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Precio ({getCurrencySymbol(currency)})</Label><Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
          <div className="space-y-1.5"><Label>Costo</Label><Input type="number" min={0} value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} /></div>
          <div className="space-y-1.5"><Label>Stock</Label><Input type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} /></div>
          <div className="space-y-1.5"><Label>Stock mínimo</Label><Input type="number" min={0} value={form.minStock} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} /></div>
          <div className="space-y-1.5"><Label>Unidad</Label><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="unidad, ml, saco..." /></div>
          <div className="space-y-1.5">
            <Label>Estado</Label>
            <Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v as PosEstado })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Activo">Activo</SelectItem><SelectItem value="Inactivo">Inactivo</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2 flex items-center justify-between gap-2 border rounded-md px-3 py-2.5">
            <div>
              <Label className="text-sm font-medium">Publicar en tienda online</Label>
              <p className="text-xs text-muted-foreground">El producto aparecerá en el punto de venta online.</p>
            </div>
            <Switch checked={form.online} onCheckedChange={(v) => setForm({ ...form, online: v })} />
          </div>
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
