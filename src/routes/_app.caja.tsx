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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Printer, Ban, DollarSign, TrendingUp, Receipt, Wallet } from "lucide-react";
import { toast } from "sonner";
import {
  useCashSessions,
  useCashMovements,
  useInvoices,
  openCashSession,
  closeCashSession,
  addMovement,
  createInvoice,
  voidInvoice,
  calcSessionBalance,
  getOpenSession,
  formatCRC,
  type InvoiceItem,
  type PaymentMethod,
} from "@/lib/billing-store";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/caja")({
  head: () => ({ meta: [{ title: "Caja y Facturación — VetCare" }] }),
  component: () => <AppLayout><CajaPage /></AppLayout>,
});

const PAYMENT_METHODS: PaymentMethod[] = ["Efectivo", "Tarjeta", "SINPE", "Transferencia", "Mixto"];

function CajaPage() {
  const sessions = useCashSessions();
  const movements = useCashMovements();
  const invoices = useInvoices();
  const openSession = sessions.find((s) => !s.closedAt);

  const today = new Date().toISOString().split("T")[0];
  const todayInvoices = invoices.filter((i) => i.date === today && i.status === "Emitida");
  const salesToday = todayInvoices.reduce((a, i) => a + i.total, 0);
  const currentBalance = openSession ? calcSessionBalance(openSession.id) : 0;
  const avgTicket = todayInvoices.length ? Math.round(salesToday / todayInvoices.length) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Caja y Facturación</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestión de caja, cobros y comprobantes.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={<DollarSign className="h-4 w-4" />} label="Ventas hoy" value={formatCRC(salesToday)} accent="bg-emerald-100 text-emerald-700" />
        <KPI icon={<Wallet className="h-4 w-4" />} label="Caja actual" value={openSession ? formatCRC(currentBalance) : "Cerrada"} accent="bg-sky-100 text-sky-700" />
        <KPI icon={<Receipt className="h-4 w-4" />} label="Facturas hoy" value={todayInvoices.length} accent="bg-violet-100 text-violet-700" />
        <KPI icon={<TrendingUp className="h-4 w-4" />} label="Ticket promedio" value={formatCRC(avgTicket)} accent="bg-amber-100 text-amber-700" />
      </div>

      <Tabs defaultValue="caja">
        <TabsList>
          <TabsTrigger value="caja">Caja</TabsTrigger>
          <TabsTrigger value="facturas">Facturas</TabsTrigger>
          <TabsTrigger value="reportes">Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="caja" className="mt-4">
          <CajaSection />
        </TabsContent>
        <TabsContent value="facturas" className="mt-4">
          <FacturasSection />
        </TabsContent>
        <TabsContent value="reportes" className="mt-4">
          <ReportesSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KPI({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string | number; accent: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className={`h-9 w-9 rounded-lg grid place-items-center ${accent}`}>{icon}</div>
      </div>
      <div className="mt-3 text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold mt-0.5">{value}</div>
    </Card>
  );
}

/* ---------------- Caja ---------------- */

function CajaSection() {
  const { user } = useAuth();
  const sessions = useCashSessions();
  const movements = useCashMovements();
  const openSession = sessions.find((s) => !s.closedAt);

  const [openAmount, setOpenAmount] = useState("0");
  const [openNotes, setOpenNotes] = useState("");
  const [closeAmount, setCloseAmount] = useState("0");
  const [closeNotes, setCloseNotes] = useState("");
  const [mvType, setMvType] = useState<"Ingreso" | "Egreso">("Ingreso");
  const [mvConcept, setMvConcept] = useState("");
  const [mvAmount, setMvAmount] = useState("0");

  const sessionMovements = openSession ? movements.filter((m) => m.sessionId === openSession.id) : [];
  const balance = openSession ? calcSessionBalance(openSession.id) : 0;

  if (!openSession) {
    return (
      <Card className="p-6 max-w-md">
        <h3 className="font-semibold mb-1">Apertura de caja</h3>
        <p className="text-sm text-muted-foreground mb-4">No hay caja abierta. Ingresa el monto inicial.</p>
        <div className="space-y-3">
          <div>
            <Label>Monto de apertura</Label>
            <Input type="number" value={openAmount} onChange={(e) => setOpenAmount(e.target.value)} />
          </div>
          <div>
            <Label>Notas</Label>
            <Textarea value={openNotes} onChange={(e) => setOpenNotes(e.target.value)} rows={2} />
          </div>
          <Button
            className="w-full"
            onClick={() => {
              openCashSession({
                openedBy: user?.name ?? "Usuario",
                openingAmount: Number(openAmount) || 0,
                notes: openNotes,
              });
              toast.success("Caja abierta");
              setOpenAmount("0");
              setOpenNotes("");
            }}
          >
            Abrir caja
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs text-muted-foreground">Caja abierta por</div>
            <div className="font-semibold">{openSession.openedBy}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Desde {new Date(openSession.openedAt).toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Saldo actual</div>
            <div className="text-2xl font-bold">{formatCRC(balance)}</div>
            <div className="text-xs text-muted-foreground">
              Apertura: {formatCRC(openSession.openingAmount)}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Nuevo movimiento</h3>
          <div className="space-y-3">
            <div>
              <Label>Tipo</Label>
              <Select value={mvType} onValueChange={(v) => setMvType(v as "Ingreso" | "Egreso")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ingreso">Ingreso</SelectItem>
                  <SelectItem value="Egreso">Egreso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Concepto</Label>
              <Input value={mvConcept} onChange={(e) => setMvConcept(e.target.value)} />
            </div>
            <div>
              <Label>Monto</Label>
              <Input type="number" value={mvAmount} onChange={(e) => setMvAmount(e.target.value)} />
            </div>
            <Button
              onClick={() => {
                if (!mvConcept.trim()) return toast.error("Ingresa un concepto");
                addMovement({
                  sessionId: openSession.id,
                  type: mvType,
                  concept: mvConcept,
                  amount: Number(mvAmount) || 0,
                });
                setMvConcept("");
                setMvAmount("0");
                toast.success("Movimiento registrado");
              }}
            >
              Registrar
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-3">Cierre de caja</h3>
          <div className="space-y-3">
            <div>
              <Label>Monto contado</Label>
              <Input type="number" value={closeAmount} onChange={(e) => setCloseAmount(e.target.value)} />
            </div>
            <div>
              <Label>Notas de cierre</Label>
              <Textarea value={closeNotes} onChange={(e) => setCloseNotes(e.target.value)} rows={2} />
            </div>
            <div className="text-xs text-muted-foreground">
              Saldo esperado: <strong>{formatCRC(balance)}</strong>
              {" · "}Diferencia: <strong>{formatCRC((Number(closeAmount) || 0) - balance)}</strong>
            </div>
            <Button
              variant="destructive"
              onClick={() => {
                closeCashSession(openSession.id, Number(closeAmount) || 0, closeNotes);
                toast.success("Caja cerrada");
                setCloseAmount("0");
                setCloseNotes("");
              }}
            >
              Cerrar caja
            </Button>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Movimientos de la sesión</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Concepto</TableHead>
              <TableHead className="text-right">Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessionMovements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                  Sin movimientos aún.
                </TableCell>
              </TableRow>
            ) : (
              sessionMovements.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{new Date(m.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={m.type === "Ingreso" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}>
                      {m.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{m.concept}</TableCell>
                  <TableCell className="text-right font-medium">
                    {m.type === "Ingreso" ? "+" : "−"}{formatCRC(m.amount)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

/* ---------------- Facturas ---------------- */

function FacturasSection() {
  const invoices = useInvoices();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<string | null>(null);
  const viewing = invoices.find((i) => i.id === view);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Nueva factura</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Generar factura</DialogTitle></DialogHeader>
            <InvoiceForm onDone={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N°</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Mascota</TableHead>
              <TableHead>Método</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-mono">{i.number}</TableCell>
                <TableCell>{i.date}</TableCell>
                <TableCell>{i.clientName}</TableCell>
                <TableCell>{i.petName ?? "—"}</TableCell>
                <TableCell>{i.paymentMethod}</TableCell>
                <TableCell className="text-right font-medium">{formatCRC(i.total)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={i.status === "Emitida" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}>
                    {i.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setView(i.id)}>
                    <Receipt className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setView(i.id); setTimeout(() => window.print(), 200); }}>
                    <Printer className="h-4 w-4" />
                  </Button>
                  {i.status === "Emitida" && (
                    <Button variant="ghost" size="sm" onClick={() => { voidInvoice(i.id); toast.success("Factura anulada"); }}>
                      <Ban className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Factura {viewing?.number}</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <div><strong>Cliente:</strong> {viewing.clientName}</div>
                <div>{viewing.date}</div>
              </div>
              {viewing.petName && <div><strong>Mascota:</strong> {viewing.petName}</div>}
              {viewing.vetName && <div><strong>Veterinario:</strong> {viewing.vetName}</div>}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Cant</TableHead>
                    <TableHead className="text-right">Unit.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewing.items.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell>{it.description}</TableCell>
                      <TableCell className="text-right">{it.quantity}</TableCell>
                      <TableCell className="text-right">{formatCRC(it.unitPrice)}</TableCell>
                      <TableCell className="text-right">{formatCRC(it.quantity * it.unitPrice)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="space-y-1 text-right">
                <div>Subtotal: {formatCRC(viewing.subtotal)}</div>
                <div>Impuesto: {formatCRC(viewing.tax)}</div>
                <div className="text-lg font-bold">Total: {formatCRC(viewing.total)}</div>
                <div className="text-xs text-muted-foreground">Método: {viewing.paymentMethod}</div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-2" /> Imprimir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InvoiceForm({ onDone }: { onDone: () => void }) {
  const [clientName, setClientName] = useState("");
  const [petName, setPetName] = useState("");
  const [vetName, setVetName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Efectivo");
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: `it${Date.now()}`, description: "", quantity: 1, unitPrice: 0, kind: "Consulta" },
  ]);

  const subtotal = items.reduce((a, i) => a + i.quantity * i.unitPrice, 0);
  const tax = Math.round(subtotal * 0.13);
  const total = subtotal + tax;

  const updateItem = (id: string, patch: Partial<InvoiceItem>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label>Cliente</Label>
          <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
        </div>
        <div>
          <Label>Mascota</Label>
          <Input value={petName} onChange={(e) => setPetName(e.target.value)} />
        </div>
        <div>
          <Label>Veterinario</Label>
          <Input value={vetName} onChange={(e) => setVetName(e.target.value)} />
        </div>
        <div>
          <Label>Método de pago</Label>
          <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Ítems</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setItems((prev) => [
                ...prev,
                { id: `it${Date.now()}`, description: "", quantity: 1, unitPrice: 0, kind: "Otro" },
              ])
            }
          >
            <Plus className="h-4 w-4 mr-1" /> Agregar
          </Button>
        </div>
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-5">
                <Input placeholder="Descripción" value={it.description} onChange={(e) => updateItem(it.id, { description: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Select value={it.kind} onValueChange={(v) => updateItem(it.id, { kind: v as InvoiceItem["kind"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Consulta", "Cirugía", "Hospitalización", "Medicamento", "Producto", "Otro"].map((k) => (
                      <SelectItem key={k} value={k}>{k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1">
                <Input type="number" value={it.quantity} onChange={(e) => updateItem(it.id, { quantity: Number(e.target.value) || 0 })} />
              </div>
              <div className="col-span-3">
                <Input type="number" placeholder="Precio" value={it.unitPrice} onChange={(e) => updateItem(it.id, { unitPrice: Number(e.target.value) || 0 })} />
              </div>
              <div className="col-span-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => setItems((prev) => prev.filter((x) => x.id !== it.id))}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-right space-y-1 text-sm">
        <div>Subtotal: <strong>{formatCRC(subtotal)}</strong></div>
        <div>IVA 13%: <strong>{formatCRC(tax)}</strong></div>
        <div className="text-lg">Total: <strong>{formatCRC(total)}</strong></div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onDone}>Cancelar</Button>
        <Button
          onClick={() => {
            if (!clientName.trim()) return toast.error("Ingresa un cliente");
            if (items.some((i) => !i.description.trim())) return toast.error("Completa la descripción de todos los ítems");
            const inv = createInvoice({
              date: new Date().toISOString().split("T")[0],
              clientName,
              petName: petName || undefined,
              vetName: vetName || undefined,
              items,
              paymentMethod,
            });
            toast.success(`Factura ${inv.number} generada`);
            onDone();
          }}
        >
          Generar factura
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Reportes ---------------- */

function ReportesSection() {
  const invoices = useInvoices();
  const active = invoices.filter((i) => i.status === "Emitida");
  const today = new Date().toISOString().split("T")[0];
  const monthPrefix = today.slice(0, 7);

  const daily = active.filter((i) => i.date === today).reduce((a, i) => a + i.total, 0);
  const monthly = active.filter((i) => i.date.startsWith(monthPrefix)).reduce((a, i) => a + i.total, 0);

  const byVet = useMemo(() => {
    const map = new Map<string, number>();
    active.forEach((i) => map.set(i.vetName ?? "Sin asignar", (map.get(i.vetName ?? "Sin asignar") ?? 0) + i.total));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [active]);

  const byService = useMemo(() => {
    const map = new Map<string, number>();
    active.forEach((i) => i.items.forEach((it) => {
      const key = it.kind;
      map.set(key, (map.get(key) ?? 0) + it.quantity * it.unitPrice);
    }));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [active]);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-2">Ventas</h3>
        <div className="space-y-1 text-sm">
          <Row label="Ventas del día" value={formatCRC(daily)} />
          <Row label="Ventas del mes" value={formatCRC(monthly)} />
          <Row label="Facturas emitidas" value={active.length} />
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-2">Ingresos por veterinario</h3>
        <div className="space-y-1 text-sm">
          {byVet.length === 0 && <div className="text-muted-foreground">Sin datos</div>}
          {byVet.map(([name, amount]) => <Row key={name} label={name} value={formatCRC(amount)} />)}
        </div>
      </Card>

      <Card className="p-4 md:col-span-2">
        <h3 className="font-semibold mb-2">Ingresos por servicio / producto</h3>
        <div className="space-y-1 text-sm">
          {byService.length === 0 && <div className="text-muted-foreground">Sin datos</div>}
          {byService.map(([kind, amount]) => <Row key={kind} label={kind} value={formatCRC(amount)} />)}
        </div>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between border-b border-border/50 py-1 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
