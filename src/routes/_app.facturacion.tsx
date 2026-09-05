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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ban, DollarSign, Download, FileText, Mail, Plus, Printer, Receipt, Trash2, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";
import {
  finance,
  financeStats,
  formatCRC,
  receivables,
  useFinanceInvoices,
  useFinancePayments,
  useQuotes,
  type FinanceInvoice,
  type FinanceItem,
  type FinancePaymentMethod,
} from "@/lib/finance-store";
import { Can, useCan } from "@/lib/rbac";

export const Route = createFileRoute("/_app/facturacion")({ component: FinancePage });

const empty = (): Omit<FinanceItem, "id"> => ({ description: "", quantity: 1, unitPrice: 0, discount: 0, kind: "Servicio" });

function statusColor(s: FinanceInvoice["status"]) {
  return s === "Pagada" ? "bg-emerald-100 text-emerald-700"
    : s === "Pendiente" ? "bg-amber-100 text-amber-700"
    : s === "Parcialmente pagada" ? "bg-sky-100 text-sky-700"
    : s === "Anulada" ? "bg-rose-100 text-rose-700"
    : "bg-slate-100 text-slate-700";
}

function FinancePage() {
  const invoices = useFinanceInvoices();
  const payments = useFinancePayments();
  const quotes = useQuotes();
  const stats = financeStats();
  const ar = receivables();
  const can = useCan();

  const [invDialogOpen, setInvDialogOpen] = useState(false);
  const [invForm, setInvForm] = useState<{ clientName: string; petName: string; vetName: string; dueDate: string; discount: number; items: Array<Omit<FinanceItem, "id">> }>({
    clientName: "", petName: "", vetName: "", dueDate: "", discount: 0, items: [empty()],
  });

  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payFor, setPayFor] = useState<FinanceInvoice | null>(null);
  const [payForm, setPayForm] = useState<{ method: FinancePaymentMethod; amount: number; reference: string }>({ method: "Efectivo", amount: 0, reference: "" });

  const [detail, setDetail] = useState<FinanceInvoice | null>(null);

  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [quoteForm, setQuoteForm] = useState<{ clientName: string; petName: string; items: Array<Omit<FinanceItem, "id">>; validUntil: string }>({
    clientName: "", petName: "", items: [empty()], validUntil: "",
  });

  const totalsPreview = useMemo(() => finance.calcTotals(invForm.items.map((it, i) => ({ id: `p${i}`, ...it })), invForm.discount), [invForm]);

  const addItem = () => setInvForm({ ...invForm, items: [...invForm.items, empty()] });
  const rmItem = (i: number) => setInvForm({ ...invForm, items: invForm.items.filter((_, idx) => idx !== i) });
  const setItem = (i: number, patch: Partial<Omit<FinanceItem, "id">>) => setInvForm({ ...invForm, items: invForm.items.map((it, idx) => idx === i ? { ...it, ...patch } : it) });

  const saveInvoice = () => {
    if (!invForm.clientName.trim()) return toast.error("Cliente requerido");
    if (invForm.items.some((i) => !i.description || i.unitPrice <= 0)) return toast.error("Completa los ítems");
    finance.createInvoice({ ...invForm, items: invForm.items });
    setInvDialogOpen(false);
    setInvForm({ clientName: "", petName: "", vetName: "", dueDate: "", discount: 0, items: [empty()] });
    toast.success("Factura creada");
  };

  const openPayment = (inv: FinanceInvoice) => {
    setPayFor(inv);
    setPayForm({ method: "Efectivo", amount: inv.balance, reference: "" });
    setPayDialogOpen(true);
  };
  const savePayment = () => {
    if (!payFor) return;
    if (payForm.amount <= 0) return toast.error("Monto inválido");
    finance.registerPayment({ invoiceId: payFor.id, ...payForm });
    setPayDialogOpen(false);
    toast.success("Pago registrado");
  };

  const saveQuote = () => {
    if (!quoteForm.clientName.trim()) return toast.error("Cliente requerido");
    finance.createQuote(quoteForm);
    setQuoteDialogOpen(false);
    setQuoteForm({ clientName: "", petName: "", items: [empty()], validUntil: "" });
    toast.success("Cotización creada");
  };

  const printInvoice = (inv: FinanceInvoice) => {
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) return;
    const rows = inv.items.map((it) => `<tr><td>${it.description}</td><td style="text-align:center">${it.quantity}</td><td style="text-align:right">${formatCRC(it.unitPrice)}</td><td style="text-align:right">${formatCRC(it.quantity * it.unitPrice)}</td></tr>`).join("");
    w.document.write(`<!doctype html><html><head><title>${inv.number}</title><style>body{font-family:system-ui;padding:32px;color:#0f172a}h1{margin:0}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{padding:8px;border-bottom:1px solid #e2e8f0;font-size:14px}.right{text-align:right}.muted{color:#64748b;font-size:12px}</style></head><body>
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div><h1>VetCare</h1><div class="muted">Clínica veterinaria</div></div>
        <div style="text-align:right"><h2>Factura ${inv.number}</h2><div class="muted">${inv.date} · Vence ${inv.dueDate}</div></div>
      </div>
      <div style="margin-top:16px"><strong>Cliente:</strong> ${inv.clientName}${inv.petName ? ` · Mascota: ${inv.petName}` : ""}${inv.vetName ? ` · Vet: ${inv.vetName}` : ""}</div>
      <table><thead><tr><th style="text-align:left">Descripción</th><th>Cant.</th><th class="right">Precio</th><th class="right">Total</th></tr></thead><tbody>${rows}</tbody></table>
      <div style="margin-top:16px;text-align:right">
        <div>Subtotal: ${formatCRC(inv.subtotal)}</div>
        <div>Descuento: ${formatCRC(inv.discount)}</div>
        <div>Impuestos: ${formatCRC(inv.tax)}</div>
        <div style="font-size:18px;font-weight:700;margin-top:8px">TOTAL: ${formatCRC(inv.total)}</div>
        <div class="muted">Pagado: ${formatCRC(inv.paid)} · Saldo: ${formatCRC(inv.balance)}</div>
      </div>
      <script>window.print()</script>
    </body></html>`);
    w.document.close();
  };

  const exportCsv = () => {
    const header = "Numero,Fecha,Cliente,Mascota,Total,Pagado,Saldo,Estado\n";
    const body = invoices.map((i) => [i.number, i.date, i.clientName, i.petName ?? "", i.total, i.paid, i.balance, i.status].join(",")).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `facturas-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exportado");
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Receipt className="h-6 w-6 text-primary" /> Facturación y Finanzas</h1>
            <p className="text-muted-foreground text-sm mt-1">Facturas, cotizaciones, pagos y cuentas por cobrar</p>
          </div>
          <div className="flex gap-2">
            <Can module="facturacion" action="export">
              <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-1" />Exportar</Button>
            </Can>
            <Can module="facturacion" action="create">
              <Button onClick={() => setInvDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />Nueva factura</Button>
            </Can>
          </div>
        </div>

        {/* Dashboard */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="p-4"><div className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" />Ventas hoy</div><div className="text-2xl font-bold mt-1">{formatCRC(stats.salesToday)}</div></Card>
          <Card className="p-4"><div className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" />Ventas del mes</div><div className="text-2xl font-bold mt-1">{formatCRC(stats.salesMonth)}</div></Card>
          <Card className="p-4"><div className="text-xs text-muted-foreground flex items-center gap-1"><Wallet className="h-3 w-3" />Ingresos</div><div className="text-2xl font-bold mt-1">{formatCRC(stats.income)}</div></Card>
          <Card className="p-4"><div className="text-xs text-muted-foreground">Facturas pendientes</div><div className="text-2xl font-bold mt-1">{formatCRC(stats.pending)}</div></Card>
          <Card className="p-4"><div className="text-xs text-muted-foreground">Ticket promedio</div><div className="text-2xl font-bold mt-1">{formatCRC(stats.avg)}</div></Card>
        </div>

        <Tabs defaultValue="facturas">
          <TabsList>
            <TabsTrigger value="facturas">Facturas</TabsTrigger>
            <TabsTrigger value="cotizaciones">Cotizaciones</TabsTrigger>
            <TabsTrigger value="pagos">Pagos</TabsTrigger>
            <TabsTrigger value="cxc">Cuentas por cobrar</TabsTrigger>
            <TabsTrigger value="reportes">Reportes</TabsTrigger>
          </TabsList>

          <TabsContent value="facturas" className="mt-4">
            <Card className="p-4">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Número</TableHead><TableHead>Fecha</TableHead><TableHead>Cliente</TableHead><TableHead>Mascota</TableHead>
                  <TableHead className="text-right">Total</TableHead><TableHead className="text-right">Saldo</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {invoices.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-mono text-xs">{i.number}</TableCell>
                      <TableCell className="text-xs">{i.date}</TableCell>
                      <TableCell className="font-medium">{i.clientName}</TableCell>
                      <TableCell>{i.petName ?? "—"}</TableCell>
                      <TableCell className="text-right font-medium">{formatCRC(i.total)}</TableCell>
                      <TableCell className="text-right">{formatCRC(i.balance)}</TableCell>
                      <TableCell><span className={`px-2 py-0.5 rounded-full text-xs ${statusColor(i.status)}`}>{i.status}</span></TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => setDetail(i)}><FileText className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => printInvoice(i)}><Printer className="h-4 w-4" /></Button>
                        {i.balance > 0 && i.status !== "Anulada" && can("facturacion", "edit") && (
                          <Button size="sm" variant="outline" onClick={() => openPayment(i)}>Pagar</Button>
                        )}
                        {i.status !== "Anulada" && can("facturacion", "delete") && (
                          <Button size="sm" variant="ghost" onClick={() => { finance.voidInvoice(i.id); toast.success("Factura anulada"); }}><Ban className="h-4 w-4" /></Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="cotizaciones" className="mt-4">
            <Card className="p-4">
              <div className="flex justify-end mb-3">
                <Can module="facturacion" action="create">
                  <Button size="sm" onClick={() => setQuoteDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />Nueva cotización</Button>
                </Can>
              </div>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Número</TableHead><TableHead>Fecha</TableHead><TableHead>Válida hasta</TableHead>
                  <TableHead>Cliente</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {quotes.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="font-mono text-xs">{q.number}</TableCell>
                      <TableCell className="text-xs">{q.date}</TableCell>
                      <TableCell className="text-xs">{q.validUntil}</TableCell>
                      <TableCell>{q.clientName}</TableCell>
                      <TableCell className="text-right">{formatCRC(q.total)}</TableCell>
                      <TableCell><Badge variant="secondary">{q.status}</Badge></TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="sm" variant="outline" onClick={() => { finance.convertQuoteToInvoice(q.id); toast.success("Convertido a factura"); }}>Facturar</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="pagos" className="mt-4">
            <Card className="p-4">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Fecha</TableHead><TableHead>Factura</TableHead><TableHead>Método</TableHead>
                  <TableHead>Referencia</TableHead><TableHead className="text-right">Monto</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {payments.map((p) => {
                    const inv = invoices.find((i) => i.id === p.invoiceId);
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs">{p.date}</TableCell>
                        <TableCell className="font-mono text-xs">{inv?.number ?? "—"}</TableCell>
                        <TableCell>{p.method}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p.reference ?? "—"}</TableCell>
                        <TableCell className="text-right font-medium">{formatCRC(p.amount)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="cxc" className="mt-4">
            <Card className="p-4">
              <div className="text-sm text-muted-foreground mb-3">Saldo total pendiente: <span className="font-semibold text-foreground">{formatCRC(ar.reduce((a, i) => a + i.balance, 0))}</span></div>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Factura</TableHead><TableHead>Cliente</TableHead><TableHead>Vencimiento</TableHead>
                  <TableHead className="text-right">Total</TableHead><TableHead className="text-right">Saldo</TableHead><TableHead className="text-right">Acciones</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {ar.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-mono text-xs">{i.number}</TableCell>
                      <TableCell>{i.clientName}</TableCell>
                      <TableCell className="text-xs">{i.dueDate}</TableCell>
                      <TableCell className="text-right">{formatCRC(i.total)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCRC(i.balance)}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="sm" variant="outline" onClick={() => toast.success("Recordatorio enviado (simulado)")}><Mail className="h-4 w-4 mr-1" />Recordar</Button>
                        <Can module="facturacion" action="edit">
                          <Button size="sm" onClick={() => openPayment(i)}>Registrar pago</Button>
                        </Can>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="reportes" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-4">
                <div className="font-semibold mb-2">Ventas por servicio (mes)</div>
                {(() => {
                  const map: Record<string, number> = {};
                  for (const i of invoices) if (i.status !== "Anulada")
                    for (const it of i.items) map[it.kind] = (map[it.kind] || 0) + it.quantity * it.unitPrice;
                  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
                  const max = entries[0]?.[1] || 1;
                  return (
                    <div className="space-y-2 mt-2">
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
              <Card className="p-4">
                <div className="font-semibold mb-2">Ventas por veterinario</div>
                {(() => {
                  const map: Record<string, number> = {};
                  for (const i of invoices) if (i.status !== "Anulada" && i.vetName) map[i.vetName] = (map[i.vetName] || 0) + i.total;
                  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
                  if (!entries.length) return <div className="text-xs text-muted-foreground">Sin datos</div>;
                  const max = entries[0][1];
                  return (
                    <div className="space-y-2 mt-2">
                      {entries.map(([k, v]) => (
                        <div key={k}>
                          <div className="flex justify-between text-xs mb-1"><span>{k}</span><span className="font-medium">{formatCRC(v)}</span></div>
                          <div className="h-2 bg-muted rounded"><div className="h-2 bg-emerald-500 rounded" style={{ width: `${(v / max) * 100}%` }} /></div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </Card>
              <Card className="p-4 md:col-span-2">
                <div className="font-semibold mb-2">Clientes con deuda</div>
                <Table>
                  <TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Facturas</TableHead><TableHead className="text-right">Deuda</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(() => {
                      const m: Record<string, { count: number; total: number }> = {};
                      for (const i of ar) { m[i.clientName] = m[i.clientName] || { count: 0, total: 0 }; m[i.clientName].count++; m[i.clientName].total += i.balance; }
                      return Object.entries(m).map(([name, v]) => (
                        <TableRow key={name}><TableCell>{name}</TableCell><TableCell>{v.count}</TableCell><TableCell className="text-right font-medium">{formatCRC(v.total)}</TableCell></TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </Card>
              <Card className="p-4 md:col-span-2 border-dashed">
                <div className="font-semibold mb-1">Integraciones preparadas</div>
                <div className="text-xs text-muted-foreground mb-3">Facturación electrónica · Stripe · PayPal · SINPE · QuickBooks</div>
                <div className="flex flex-wrap gap-2">
                  {["Facturación electrónica", "Stripe", "PayPal", "SINPE", "QuickBooks"].map((x) => <Badge key={x} variant="secondary">{x} · próximamente</Badge>)}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Nueva Factura */}
      <Dialog open={invDialogOpen} onOpenChange={setInvDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Nueva factura</DialogTitle></DialogHeader>
          <div className="grid gap-3 md:grid-cols-3">
            <div><Label>Cliente</Label><Input value={invForm.clientName} onChange={(e) => setInvForm({ ...invForm, clientName: e.target.value })} /></div>
            <div><Label>Mascota</Label><Input value={invForm.petName} onChange={(e) => setInvForm({ ...invForm, petName: e.target.value })} /></div>
            <div><Label>Veterinario</Label><Input value={invForm.vetName} onChange={(e) => setInvForm({ ...invForm, vetName: e.target.value })} /></div>
            <div><Label>Vencimiento</Label><Input type="date" value={invForm.dueDate} onChange={(e) => setInvForm({ ...invForm, dueDate: e.target.value })} /></div>
            <div><Label>Descuento %</Label><Input type="number" value={invForm.discount} onChange={(e) => setInvForm({ ...invForm, discount: Number(e.target.value) || 0 })} /></div>
          </div>
          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between"><div className="font-medium text-sm">Ítems</div><Button size="sm" variant="outline" onClick={addItem}><Plus className="h-3 w-3 mr-1" />Agregar</Button></div>
            {invForm.items.map((it, i) => (
              <div key={i} className="grid gap-2 md:grid-cols-[1fr_100px_120px_130px_40px]">
                <Input placeholder="Descripción" value={it.description} onChange={(e) => setItem(i, { description: e.target.value })} />
                <Input type="number" min={1} value={it.quantity} onChange={(e) => setItem(i, { quantity: Number(e.target.value) || 1 })} />
                <Input type="number" min={0} placeholder="Precio" value={it.unitPrice} onChange={(e) => setItem(i, { unitPrice: Number(e.target.value) || 0 })} />
                <Select value={it.kind} onValueChange={(v) => setItem(i, { kind: v as FinanceItem["kind"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Servicio","Producto","Medicamento","Consulta","Cirugía","Hospitalización"].map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="ghost" onClick={() => rmItem(i)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
          <div className="text-right text-sm mt-3 space-y-1">
            <div>Subtotal: {formatCRC(totalsPreview.subtotal)}</div>
            <div>Descuento: {formatCRC(totalsPreview.discount)}</div>
            <div>IVA: {formatCRC(totalsPreview.tax)}</div>
            <div className="text-lg font-bold">Total: {formatCRC(totalsPreview.total)}</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveInvoice}>Emitir factura</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pago */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar pago {payFor ? `· ${payFor.number}` : ""}</DialogTitle></DialogHeader>
          {payFor && (
            <div className="text-sm text-muted-foreground mb-2">Saldo pendiente: <span className="font-medium text-foreground">{formatCRC(payFor.balance)}</span></div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Método</Label>
              <Select value={payForm.method} onValueChange={(v) => setPayForm({ ...payForm, method: v as FinancePaymentMethod })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(["Efectivo","Tarjeta","Transferencia","SINPE","Cheque","Mixto"] as FinancePaymentMethod[]).map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Monto</Label><Input type="number" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: Number(e.target.value) || 0 })} /></div>
            <div className="md:col-span-2"><Label>Referencia</Label><Input value={payForm.reference} onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })} placeholder="Nº operación, autorización, cheque..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogOpen(false)}>Cancelar</Button>
            <Button onClick={savePayment}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nueva Cotización */}
      <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Nueva cotización</DialogTitle></DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label>Cliente</Label><Input value={quoteForm.clientName} onChange={(e) => setQuoteForm({ ...quoteForm, clientName: e.target.value })} /></div>
            <div><Label>Mascota</Label><Input value={quoteForm.petName} onChange={(e) => setQuoteForm({ ...quoteForm, petName: e.target.value })} /></div>
            <div><Label>Válida hasta</Label><Input type="date" value={quoteForm.validUntil} onChange={(e) => setQuoteForm({ ...quoteForm, validUntil: e.target.value })} /></div>
          </div>
          <div className="mt-2 space-y-2">
            {quoteForm.items.map((it, i) => (
              <div key={i} className="grid gap-2 md:grid-cols-[1fr_80px_120px_40px]">
                <Input placeholder="Descripción" value={it.description} onChange={(e) => setQuoteForm({ ...quoteForm, items: quoteForm.items.map((x, idx) => idx === i ? { ...x, description: e.target.value } : x) })} />
                <Input type="number" min={1} value={it.quantity} onChange={(e) => setQuoteForm({ ...quoteForm, items: quoteForm.items.map((x, idx) => idx === i ? { ...x, quantity: Number(e.target.value) || 1 } : x) })} />
                <Input type="number" min={0} value={it.unitPrice} onChange={(e) => setQuoteForm({ ...quoteForm, items: quoteForm.items.map((x, idx) => idx === i ? { ...x, unitPrice: Number(e.target.value) || 0 } : x) })} />
                <Button size="sm" variant="ghost" onClick={() => setQuoteForm({ ...quoteForm, items: quoteForm.items.filter((_, idx) => idx !== i) })}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => setQuoteForm({ ...quoteForm, items: [...quoteForm.items, empty()] })}><Plus className="h-4 w-4 mr-1" />Agregar</Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuoteDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveQuote}>Guardar cotización</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detalle */}
      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Factura {detail?.number}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Cliente:</span> {detail.clientName}</div>
                <div><span className="text-muted-foreground">Mascota:</span> {detail.petName ?? "—"}</div>
                <div><span className="text-muted-foreground">Fecha:</span> {detail.date}</div>
                <div><span className="text-muted-foreground">Vence:</span> {detail.dueDate}</div>
                <div><span className="text-muted-foreground">Estado:</span> <span className={`px-2 py-0.5 rounded-full text-xs ${statusColor(detail.status)}`}>{detail.status}</span></div>
                <div><span className="text-muted-foreground">Veterinario:</span> {detail.vetName ?? "—"}</div>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>Descripción</TableHead><TableHead>Cant.</TableHead><TableHead className="text-right">Precio</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                <TableBody>
                  {detail.items.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell>{it.description}</TableCell>
                      <TableCell>{it.quantity}</TableCell>
                      <TableCell className="text-right">{formatCRC(it.unitPrice)}</TableCell>
                      <TableCell className="text-right">{formatCRC(it.quantity * it.unitPrice)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="text-right text-sm space-y-1">
                <div>Subtotal: {formatCRC(detail.subtotal)}</div>
                <div>Descuento: {formatCRC(detail.discount)}</div>
                <div>IVA: {formatCRC(detail.tax)}</div>
                <div className="text-lg font-bold">Total: {formatCRC(detail.total)}</div>
                <div className="text-xs text-muted-foreground">Pagado: {formatCRC(detail.paid)} · Saldo: {formatCRC(detail.balance)}</div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => printInvoice(detail)}><Printer className="h-4 w-4 mr-1" />Imprimir / PDF</Button>
                <Button variant="outline" onClick={() => toast.success("Enviado por correo (simulado)")}><Mail className="h-4 w-4 mr-1" />Enviar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
