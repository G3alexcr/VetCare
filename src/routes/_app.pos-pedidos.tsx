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
import { Textarea } from "@/components/ui/textarea";
import { Can } from "@/lib/rbac";
import { formatMoney, useCurrency } from "@/lib/config-store";
import {
  POS_ORDER_STATUSES,
  TAX_RATE,
  addPosOrder,
  deletePosOrder,
  updatePosOrder,
  usePosOrders,
  usePosProducts,
  type PosOrderStatus,
} from "@/lib/pos-store";
import { ListOrdered, Plus, Trash2, X, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/pos-pedidos")({ component: PosPedidosPage });

const statusColor: Record<PosOrderStatus, string> = {
  "Pendiente": "bg-amber-100 text-amber-700",
  "En preparación": "bg-sky-100 text-sky-700",
  "Listo": "bg-emerald-100 text-emerald-700",
  "Entregado": "bg-slate-100 text-slate-700",
  "Cancelado": "bg-rose-100 text-rose-700",
};

function PosPedidosPage() {
  const orders = usePosOrders();
  const products = usePosProducts();
  const currency = useCurrency();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ clientName: "", notes: "", items: [{ id: `li_${Date.now()}`, productId: "", quantity: 1 }] });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "todos" && o.status !== statusFilter) return false;
      if (q && ![o.number, o.clientName].some((x) => (x || "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [orders, query, statusFilter]);

  const formTotal = useMemo(() => {
    const subtotal = form.items.reduce((a, i) => {
      const p = products.find((x) => x.id === i.productId);
      return a + (p ? p.price * i.quantity : 0);
    }, 0);
    return subtotal + Math.round(subtotal * TAX_RATE);
  }, [form.items, products]);

  const openForm = () => {
    setForm({ clientName: "", notes: "", items: [{ id: `li_${Date.now()}`, productId: products[0]?.id ?? "", quantity: 1 }] });
    setDialogOpen(true);
  };

  const updateItem = <K extends keyof (typeof form.items)[number]>(id: string, key: K, value: (typeof form.items)[number][K]) =>
    setForm((f) => ({ ...f, items: f.items.map((it) => (it.id === id ? { ...it, [key]: value } : it)) }));
  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, { id: `li_${Date.now()}`, productId: products[0]?.id ?? "", quantity: 1 }] }));
  const removeItem = (id: string) => setForm((f) => ({ ...f, items: f.items.filter((it) => it.id !== id) }));

  const save = () => {
    if (!form.clientName.trim()) return toast.error("Ingresa el cliente");
    const items = form.items.filter((i) => i.productId);
    if (items.length === 0) return toast.error("Agrega al menos un producto");
    addPosOrder({
      clientName: form.clientName,
      items: items.map((i) => {
        const p = products.find((x) => x.id === i.productId)!;
        return { id: `oi_${Date.now()}`, productId: p.id, name: p.name, quantity: i.quantity, unitPrice: p.price };
      }),
      total: formTotal,
      status: "Pendiente",
      notes: form.notes,
    });
    toast.success("Pedido creado");
    setDialogOpen(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-6xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><ListOrdered className="h-6 w-6 text-primary" /> Pedidos</h1>
            <p className="text-muted-foreground text-sm mt-1">Encargos de clientes con seguimiento de estado.</p>
          </div>
          <Can module="punto_venta" action="create">
            <Button onClick={openForm}><Plus className="h-4 w-4 mr-1" /> Nuevo pedido</Button>
          </Can>
        </div>

        <PosNav />

        <Card className="p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por número o cliente..." className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {POS_ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Ítems</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2">
                      {o.number}
                      {o.source === "online" && <Badge className="bg-sky-100 text-sky-700">Online</Badge>}
                    </span>
                  </TableCell>
                  <TableCell>{o.clientName}</TableCell>
                  <TableCell>{o.items.reduce((a, i) => a + i.quantity, 0)}</TableCell>
                  <TableCell className="font-semibold whitespace-nowrap">{formatMoney(o.total, currency)}</TableCell>
                  <TableCell>
                    <Select value={o.status} onValueChange={(v) => { updatePosOrder(o.id, { status: v as PosOrderStatus }); toast.success("Estado actualizado"); }}>
                      <SelectTrigger className="h-7 w-[150px]"><SelectValue /></SelectTrigger>
                      <SelectContent>{POS_ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">{o.notes || "—"}</TableCell>
                  <TableCell className="text-right">
                    <Can module="punto_venta" action="delete">
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm(`¿Eliminar pedido ${o.number}?`)) { deletePosOrder(o.id); toast.success("Pedido eliminado"); } }}><Trash2 className="h-4 w-4" /></Button>
                    </Can>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Sin pedidos.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>Nuevo pedido</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Cliente</Label><Input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Productos</Label>
              {form.items.map((it) => (
                <div key={it.id} className="flex items-center gap-2">
                  <Select value={it.productId} onValueChange={(v) => updateItem(it.id, "productId", v)}>
                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="number" min={1} className="w-20" value={it.quantity} onChange={(e) => updateItem(it.id, "quantity", Number(e.target.value) || 1)} />
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeItem(it.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={addItem}><Plus className="h-4 w-4 mr-1" /> Agregar producto</Button>
            </div>
            <div className="space-y-1.5"><Label>Notas</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="flex justify-between text-sm border-t pt-2"><span className="text-muted-foreground">Total estimado</span><span className="font-bold">{formatMoney(formTotal, currency)}</span></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}><X className="h-4 w-4 mr-1" /> Cancelar</Button><Button onClick={save}>Crear pedido</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
