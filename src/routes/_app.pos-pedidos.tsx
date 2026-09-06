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
import { useClientes } from "@/lib/clientes-store";
import {
  POS_ORDER_STATUSES,
  TAX_RATE,
  addPosOrder,
  deletePosOrder,
  updatePosOrder,
  usePosOrders,
  usePosProducts,
  type PosOrder,
  type PosOrderStatus,
} from "@/lib/pos-store";
import {
  ListOrdered,
  Plus,
  Trash2,
  X,
  Search,
  MessageCircle,
  Truck,
  Building2,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/pos-pedidos")({ component: PosPedidosPage });

const statusColor: Record<PosOrderStatus, string> = {
  "Pendiente": "bg-amber-100 text-amber-800 border-amber-300",
  "En preparación": "bg-sky-100 text-sky-800 border-sky-300",
  "Listo": "bg-emerald-100 text-emerald-800 border-emerald-300",
  "Entregado": "bg-slate-100 text-slate-800 border-slate-300",
  "Cancelado": "bg-rose-100 text-rose-800 border-rose-300",
};

export function PosPedidosPage() {
  const orders = usePosOrders();
  const products = usePosProducts();
  const currency = useCurrency();
  const clientes = useClientes();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<PosOrder | null>(null);

  const [form, setForm] = useState({
    clientId: "manual",
    clientName: "",
    clientPhone: "",
    deliveryMethod: "retiro" as "retiro" | "domicilio",
    deliveryAddress: "",
    paymentMethod: "Efectivo",
    paymentStatus: "Pendiente" as "Pendiente" | "Pagado",
    notes: "",
    items: [{ id: `li_${Date.now()}`, productId: "", quantity: 1 }],
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "todos" && o.status !== statusFilter) return false;
      if (q && ![o.number, o.clientName, o.clientPhone, o.deliveryAddress].some((x) => (x || "").toLowerCase().includes(q))) {
        return false;
      }
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
    setForm({
      clientId: "manual",
      clientName: "",
      clientPhone: "",
      deliveryMethod: "retiro",
      deliveryAddress: "",
      paymentMethod: "Efectivo",
      paymentStatus: "Pendiente",
      notes: "",
      items: [{ id: `li_${Date.now()}`, productId: products[0]?.id ?? "", quantity: 1 }],
    });
    setDialogOpen(true);
  };

  const handleSelectClient = (cid: string) => {
    if (cid === "manual") {
      setForm((f) => ({ ...f, clientId: "manual" }));
    } else {
      const cl = clientes.find((c) => c.id === cid);
      if (cl) {
        setForm((f) => ({
          ...f,
          clientId: cid,
          clientName: cl.nombre,
          clientPhone: cl.telefono || "",
          deliveryAddress: cl.direccion || "",
        }));
      }
    }
  };

  const updateItem = <K extends keyof (typeof form.items)[number]>(id: string, key: K, value: (typeof form.items)[number][K]) =>
    setForm((f) => ({ ...f, items: f.items.map((it) => (it.id === id ? { ...it, [key]: value } : it)) }));
  const addItem = () =>
    setForm((f) => ({ ...f, items: [...f.items, { id: `li_${Date.now()}`, productId: products[0]?.id ?? "", quantity: 1 }] }));
  const removeItem = (id: string) => setForm((f) => ({ ...f, items: f.items.filter((it) => it.id !== id) }));

  const save = () => {
    if (!form.clientName.trim()) return toast.error("Ingresa el nombre del cliente");
    const items = form.items.filter((i) => i.productId);
    if (items.length === 0) return toast.error("Agrega al menos un producto");

    addPosOrder({
      clientName: form.clientName.trim(),
      clientPhone: form.clientPhone.trim() || undefined,
      deliveryMethod: form.deliveryMethod,
      deliveryAddress: form.deliveryMethod === "domicilio" ? form.deliveryAddress.trim() : undefined,
      paymentMethod: form.paymentMethod,
      paymentStatus: form.paymentStatus,
      items: items.map((i) => {
        const p = products.find((x) => x.id === i.productId)!;
        return { id: `oi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, productId: p.id, name: p.name, quantity: i.quantity, unitPrice: p.price };
      }),
      total: formTotal,
      status: "Pendiente",
      notes: form.notes,
      source: "presencial",
    });

    toast.success("Pedido creado correctamente");
    setDialogOpen(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-6xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ListOrdered className="h-6 w-6 text-primary" /> Pedidos y Tienda Online
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Encargos presenciales y pedidos recibidos desde la tienda online con seguimiento y contacto directo.
            </p>
          </div>
          <Can module="punto_venta" action="create">
            <Button onClick={openForm}>
              <Plus className="h-4 w-4 mr-1" /> Nuevo pedido
            </Button>
          </Can>
        </div>

        <PosNav />

        <Card className="p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por número, cliente, teléfono o dirección..."
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {POS_ORDER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente y Contacto</TableHead>
                <TableHead>Entrega</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead>Ítems / Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => {
                const phone = o.clientPhone || clientes.find((c) => c.nombre.toLowerCase() === o.clientName.toLowerCase())?.telefono;
                return (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs">{o.number}</span>
                        {o.source === "online" ? (
                          <Badge className="bg-sky-100 text-sky-800 border-sky-200 text-[10px] px-1.5 py-0">Online</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">Local</Badge>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(o.createdAt).toLocaleDateString("es-CR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-semibold text-xs leading-tight">{o.clientName}</div>
                      {phone ? (
                        <a
                          href={`https://wa.me/506${phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                            `Hola ${o.clientName}, te contactamos de la clínica sobre tu pedido ${o.number}.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 hover:underline mt-0.5 font-medium"
                          title="Escribir por WhatsApp"
                        >
                          <MessageCircle className="h-3 w-3 fill-emerald-100" />
                          {phone}
                        </a>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">Sin teléfono</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {o.deliveryMethod === "domicilio" ? (
                        <div>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                            <Truck className="h-3.5 w-3.5" /> Domicilio
                          </span>
                          {o.deliveryAddress && (
                            <div className="text-[11px] text-muted-foreground truncate max-w-[160px]" title={o.deliveryAddress}>
                              {o.deliveryAddress}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" /> Retiro en clínica
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={o.paymentStatus === "Pagado" ? "default" : "outline"}
                        className={`text-[10px] px-1.5 py-0 font-semibold ${
                          o.paymentStatus === "Pagado"
                            ? "bg-emerald-600 text-white"
                            : "border-amber-400 text-amber-700 bg-amber-50"
                        }`}
                      >
                        {o.paymentStatus === "Pagado" ? "Pagado" : "Pendiente"}
                      </Badge>
                      <div className="text-[10px] text-muted-foreground mt-0.5 max-w-[130px] truncate" title={o.paymentMethod}>
                        {o.paymentMethod || "Efectivo"}
                      </div>
                    </TableCell>

                    <TableCell className="whitespace-nowrap">
                      <div className="font-bold text-xs">{formatMoney(o.total, currency)}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {o.items.reduce((a, i) => a + i.quantity, 0)} {o.items.length === 1 ? "artículo" : "artículos"}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Select
                        value={o.status}
                        onValueChange={(v) => {
                          updatePosOrder(o.id, { status: v as PosOrderStatus });
                          toast.success(`Pedido ${o.number} actualizado a "${v}"`);
                        }}
                      >
                        <SelectTrigger className={`h-7 w-[140px] text-xs font-semibold ${statusColor[o.status]}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {POS_ORDER_STATUSES.map((s) => (
                            <SelectItem key={s} value={s} className="text-xs">
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell className="text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => setDetailOrder(o)}
                        title="Ver detalle del pedido"
                      >
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Can module="punto_venta" action="delete">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (confirm(`¿Eliminar pedido ${o.number}?`)) {
                              deletePosOrder(o.id);
                              toast.success("Pedido eliminado");
                            }
                          }}
                          title="Eliminar pedido"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </Can>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                    No se encontraron pedidos.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Modal Detalle de Pedido */}
      <Dialog open={detailOrder != null} onOpenChange={(o) => { if (!o) setDetailOrder(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-base">
              <span>Detalle de Pedido {detailOrder?.number}</span>
              {detailOrder && (
                <Badge className={`text-xs ${statusColor[detailOrder.status]}`}>
                  {detailOrder.status}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {detailOrder && (
            <div className="space-y-3.5 text-xs sm:text-sm">
              {/* Cliente */}
              <div className="p-3 bg-muted/20 border rounded-xl space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-bold text-foreground">{detailOrder.clientName}</span>
                </div>
                {detailOrder.clientPhone && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Teléfono:</span>
                    <a
                      href={`https://wa.me/506${detailOrder.clientPhone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:underline"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      {detailOrder.clientPhone}
                    </a>
                  </div>
                )}
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Entrega:</span>
                  <span className="font-medium text-right">
                    {detailOrder.deliveryMethod === "domicilio"
                      ? `Domicilio: ${detailOrder.deliveryAddress || "Sin dirección"}`
                      : "Retiro en clínica"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Pago:</span>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-[10px]">
                      {detailOrder.paymentMethod || "Efectivo"}
                    </Badge>
                    <Badge
                      className={`text-[10px] ${
                        detailOrder.paymentStatus === "Pagado" ? "bg-emerald-600 text-white" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {detailOrder.paymentStatus || "Pendiente"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Lista de productos */}
              <div className="space-y-1.5 border rounded-xl p-3">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Productos del Pedido</div>
                {detailOrder.items.map((it) => (
                  <div key={it.id} className="flex justify-between items-center text-xs py-1 border-b last:border-b-0">
                    <div>
                      <div className="font-semibold">{it.name}</div>
                      <div className="text-muted-foreground">{it.quantity} x {formatMoney(it.unitPrice, currency)}</div>
                    </div>
                    <div className="font-bold">{formatMoney(it.quantity * it.unitPrice, currency)}</div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 font-bold text-sm">
                  <span>Total</span>
                  <span className="text-emerald-600">{formatMoney(detailOrder.total, currency)}</span>
                </div>
              </div>

              {detailOrder.notes && (
                <div className="p-2.5 bg-muted/30 rounded-lg text-xs">
                  <span className="font-semibold text-muted-foreground">Notas: </span>
                  <span>{detailOrder.notes}</span>
                </div>
              )}

              {/* Acciones de WhatsApp y Estado */}
              {detailOrder.clientPhone && (
                <Button
                  asChild
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 rounded-xl shadow-xs gap-2"
                >
                  <a
                    href={`https://wa.me/506${detailOrder.clientPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                      `Hola ${detailOrder.clientName}, tu pedido ${detailOrder.number} está ${detailOrder.status.toLowerCase()}.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="h-4 w-4" /> Enviar mensaje por WhatsApp
                  </a>
                </Button>
              )}

              <Button variant="outline" className="w-full rounded-xl" onClick={() => setDetailOrder(null)}>
                Cerrar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Nuevo Pedido */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo pedido</DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5">
            {/* Cliente */}
            <div className="space-y-1.5">
              <Label className="text-xs">Seleccionar cliente registrado o nuevo</Label>
              <Select value={form.clientId} onValueChange={handleSelectClient}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Seleccionar cliente..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">➕ Escribir cliente manualmente</SelectItem>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      👤 {c.nombre} {c.telefono ? `(${c.telefono})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-xs">Nombre del cliente *</Label>
                <Input
                  value={form.clientName}
                  onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Teléfono / WhatsApp</Label>
                <Input
                  value={form.clientPhone}
                  onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
                  placeholder="Ej: +506 8888-8888"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Entrega */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, deliveryMethod: "retiro" })}
                className={`p-2 rounded-lg border text-left text-xs font-semibold flex items-center gap-1.5 ${
                  form.deliveryMethod === "retiro" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                }`}
              >
                <Building2 className="h-4 w-4" /> Retiro en clínica
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, deliveryMethod: "domicilio" })}
                className={`p-2 rounded-lg border text-left text-xs font-semibold flex items-center gap-1.5 ${
                  form.deliveryMethod === "domicilio" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                }`}
              >
                <Truck className="h-4 w-4" /> A domicilio
              </button>
            </div>

            {form.deliveryMethod === "domicilio" && (
              <div className="space-y-1">
                <Label className="text-xs">Dirección de entrega</Label>
                <Input
                  value={form.deliveryAddress}
                  onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
                  placeholder="Dirección exacta..."
                  className="h-9 text-xs"
                />
              </div>
            )}

            {/* Productos */}
            <div className="space-y-2 border-t pt-2">
              <Label className="text-xs font-semibold">Productos del pedido</Label>
              {form.items.map((it) => (
                <div key={it.id} className="flex items-center gap-2">
                  <Select value={it.productId} onValueChange={(v) => updateItem(it.id, "productId", v)}>
                    <SelectTrigger className="flex-1 h-9 text-xs">
                      <SelectValue placeholder="Seleccionar producto..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-xs">
                          {p.name} ({formatMoney(p.price, currency)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    className="w-16 h-9 text-xs text-center"
                    value={it.quantity}
                    onChange={(e) => updateItem(it.id, "quantity", Number(e.target.value) || 1)}
                  />
                  <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive" onClick={() => removeItem(it.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={addItem} className="text-xs">
                <Plus className="h-3.5 w-3.5 mr-1" /> Agregar producto
              </Button>
            </div>

            <div className="space-y-1.5 border-t pt-2">
              <Label className="text-xs">Notas</Label>
              <Textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Observaciones..."
                className="text-xs"
              />
            </div>

            <div className="flex justify-between text-sm border-t pt-2">
              <span className="text-muted-foreground">Total estimado</span>
              <span className="font-bold text-emerald-600">{formatMoney(formTotal, currency)}</span>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="h-4 w-4 mr-1" /> Cancelar
            </Button>
            <Button onClick={save}>Crear pedido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
