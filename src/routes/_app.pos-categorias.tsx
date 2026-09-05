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
import { Textarea } from "@/components/ui/textarea";
import { Can } from "@/lib/rbac";
import {
  CATEGORY_COLORS,
  addPosCategory,
  deletePosCategory,
  updatePosCategory,
  usePosCategories,
  usePosProducts,
  type PosCategory,
  type PosEstado,
} from "@/lib/pos-store";
import { Pencil, Plus, Tags, Trash2, Search, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/pos-categorias")({ component: PosCategoriasPage });

function estadoColor(s: PosEstado) {
  return s === "Activo" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700";
}

function PosCategoriasPage() {
  const categorias = usePosCategories();
  const products = usePosProducts();
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PosCategory | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categorias.filter((c) => !q || c.nombre.toLowerCase().includes(q));
  }, [categorias, query]);

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (c: PosCategory) => { setEditing(c); setDialogOpen(true); };

  const countBy = (id: string) => products.filter((p) => p.categoryId === id).length;

  const handleSave = (data: Omit<PosCategory, "id" | "createdAt" | "clinicId">) => {
    if (editing) { updatePosCategory(editing.id, data); toast.success("Categoría actualizada"); }
    else { addPosCategory(data); toast.success("Categoría creada"); }
    setDialogOpen(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Tags className="h-6 w-6 text-primary" /> Categorías</h1>
            <p className="text-muted-foreground text-sm mt-1">Organiza los productos del punto de venta.</p>
          </div>
          <Can module="punto_venta" action="create">
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Nueva categoría</Button>
          </Can>
        </div>

        <PosNav />

        <Card className="p-4">
          <div className="relative max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar categoría..." className="pl-9" />
          </div>
        </Card>

        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nombre}</TableCell>
                  <TableCell><span className={`inline-block h-4 w-4 rounded-full ${c.color}`} /></TableCell>
                  <TableCell className="text-muted-foreground">{c.descripcion || "—"}</TableCell>
                  <TableCell><Badge variant="secondary">{countBy(c.id)}</Badge></TableCell>
                  <TableCell><Badge className={estadoColor(c.estado)}>{c.estado}</Badge></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Can module="punto_venta" action="edit">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    </Can>
                    <Can module="punto_venta" action="delete">
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { deletePosCategory(c.id); toast.success("Categoría eliminada"); }}><Trash2 className="h-4 w-4" /></Button>
                    </Can>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sin categorías.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <CategoriaDialog open={dialogOpen} onOpenChange={setDialogOpen} initial={editing} onSave={handleSave} />
    </AppLayout>
  );
}

function CategoriaDialog({ open, onOpenChange, initial, onSave }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: PosCategory | null;
  onSave: (d: Omit<PosCategory, "id" | "createdAt" | "clinicId">) => void;
}) {
  const [form, setForm] = useState<Omit<PosCategory, "id" | "createdAt" | "clinicId">>({ nombre: "", descripcion: "", color: CATEGORY_COLORS[0], estado: "Activo" });
  useEffect(() => {
    if (!open) return;
    setForm(initial ? { nombre: initial.nombre, descripcion: initial.descripcion, color: initial.color, estado: initial.estado } : { nombre: "", descripcion: "", color: CATEGORY_COLORS[0], estado: "Activo" });
  }, [open, initial]);

  const save = () => {
    if (!form.nombre.trim()) return toast.error("Ingresa el nombre");
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{initial ? "Editar categoría" : "Nueva categoría"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>Nombre</Label><Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Descripción</Label><Textarea rows={2} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((clr) => (
                <button key={clr} type="button" onClick={() => setForm({ ...form, color: clr })} className={`h-6 w-6 rounded-full ${clr} ${form.color === clr ? "ring-2 ring-primary ring-offset-2" : ""}`} />
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Estado</Label>
            <Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v as PosEstado })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Activo">Activo</SelectItem><SelectItem value="Inactivo">Inactivo</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}><X className="h-4 w-4 mr-1" /> Cancelar</Button>
          <Button onClick={save}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
