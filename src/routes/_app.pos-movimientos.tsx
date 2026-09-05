import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { PosNav } from "@/components/pos-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Can } from "@/lib/rbac";
import { addPosMovement, updatePosProduct, usePosMovements, usePosProducts, type PosMovementType } from "@/lib/pos-store";
import { ArrowLeftRight, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/pos-movimientos")({ component: PosMovimientosPage });

const typeColor: Record<PosMovementType, string> = {
  Entrada: "bg-emerald-100 text-emerald-700",
  Salida: "bg-rose-100 text-rose-700",
  Ajuste: "bg-amber-100 text-amber-700",
  Transferencia: "bg-sky-100 text-sky-700",
};

function PosMovimientosPage() {
  const movements = usePosMovements();
  const products = usePosProducts();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ productId: "", type: "Entrada" as PosMovementType, quantity: 1, reason: "" });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return movements.filter((m) => {
      if (typeFilter !== "todos" && m.type !== typeFilter) return false;
      const p = products.find((x) => x.id === m.productId);
      if (q && !((p?.name ?? "").toLowerCase().includes(q) || (m.reason ?? "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [movements, products, query, typeFilter]);

  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? "—";

  const save = () => {
    if (!form.productId) return toast.error("Selecciona un producto");
    if (!form.quantity) return toast.error("Cantidad inválida");
    const delta = form.type === "Salida" ? -Math.abs(form.quantity) : form.quantity;
    addPosMovement({ productId: form.productId, type: form.type, quantity: form.quantity, reason: form.reason || form.type });
    updatePosProduct(form.productId, { stock: Math.max(0, (products.find((p) => p.id === form.productId)?.stock ?? 0) + delta) });
    toast.success("Movimiento registrado");
    setDialogOpen(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-6xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><ArrowLeftRight className="h-6 w-6 text-primary" /> Movimientos</h1>
            <p className="text-muted-foreground text-sm mt-1">Entradas, salidas y ajustes de inventario.</p>
          </div>
          <Can module="punto_venta" action="create">
            <Button onClick={() => { setForm({ productId: products[0]?.id ?? "", type: "Entrada", quantity: 1, reason: "" }); setDialogOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Registrar movimiento</Button>
          </Can>
        </div>

        <PosNav />

        <Card className="p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_200px]">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por producto o motivo..." className="pl-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                {(["Entrada", "Salida", "Ajuste", "Transferencia"] as PosMovementType[]).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Referencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(m.createdAt).toLocaleString()}</TableCell>
                  <TableCell className="font-medium">{productName(m.productId)}</TableCell>
                  <TableCell><Badge className={typeColor[m.type]}>{m.type}</Badge></TableCell>
                  <TableCell className="font-semibold">{m.type === "Salida" ? "−" : "+"}{Math.abs(m.quantity)}</TableCell>
                  <TableCell className="text-muted-foreground">{m.reason || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{m.reference ?? "—"}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sin movimientos.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Registrar movimiento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Producto</Label>
              <Select value={form.productId} onValueChange={(v) => setForm({ ...form, productId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as PosMovementType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(["Entrada", "Salida", "Ajuste", "Transferencia"] as PosMovementType[]).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Cantidad{form.type === "Ajuste" ? " (usa − para restar)" : ""}</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></div>
            <div className="space-y-1.5"><Label>Motivo</Label><Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Ej: Recepción de compra, merma..." /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}><X className="h-4 w-4 mr-1" /> Cancelar</Button><Button onClick={save}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
