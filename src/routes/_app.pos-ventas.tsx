import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { PosNav } from "@/components/pos-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Can } from "@/lib/rbac";
import { formatMoney, useCurrency } from "@/lib/config-store";
import { anularSale, usePosKpis, usePosSales, type Sale } from "@/lib/pos-store";
import { ReceiptText, Eye, Ban, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/pos-ventas")({ component: PosVentasPage });

function PosVentasPage() {
  const sales = usePosSales();
  const currency = useCurrency();
  const kpis = usePosKpis();
  const [query, setQuery] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("todas");
  const [detail, setDetail] = useState<Sale | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sales.filter((s) => {
      if (estadoFilter !== "todas" && s.status !== estadoFilter) return false;
      if (q && ![s.number, s.clientName].some((x) => (x || "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [sales, query, estadoFilter]);

  const anular = (s: Sale) => {
    if (s.status === "Anulada") return;
    if (!confirm(`¿Anular la venta ${s.number}? Se repondrá el stock.`)) return;
    anularSale(s.id);
    toast.success("Venta anulada");
    setDetail(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-6xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><ReceiptText className="h-6 w-6 text-primary" /> Ventas</h1>
            <p className="text-muted-foreground text-sm mt-1">Historial y detalle de ventas del punto de venta.</p>
          </div>
        </div>

        <PosNav />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Ventas hoy" value={String(kpis.salesToday)} />
          <Stat label="Ingresos hoy" value={formatMoney(kpis.revenueToday, currency)} tone="text-emerald-600" />
          <Stat label="Ingresos del mes" value={formatMoney(kpis.revenueMonth, currency)} tone="text-teal-600" />
          <Stat label="Ticket promedio" value={formatMoney(kpis.avgTicket, currency)} />
        </div>

        <Card className="p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_200px]">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por número o cliente..." className="pl-9" />
            </div>
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="Completada">Completada</SelectItem>
                <SelectItem value="Anulada">Anulada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Ítems</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.number}</TableCell>
                  <TableCell className="text-muted-foreground">{s.date}</TableCell>
                  <TableCell>{s.clientName}</TableCell>
                  <TableCell>{s.items.reduce((a, i) => a + i.quantity, 0)}</TableCell>
                  <TableCell className="font-semibold whitespace-nowrap">{formatMoney(s.total, currency)}</TableCell>
                  <TableCell>{s.paymentMethod}</TableCell>
                  <TableCell><Badge className={s.status === "Completada" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}>{s.status}</Badge></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => setDetail(s)}><Eye className="h-4 w-4" /></Button>
                    <Can module="punto_venta" action="delete">
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => anular(s)}><Ban className="h-4 w-4" /></Button>
                    </Can>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Sin ventas.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Dialog open={detail != null} onOpenChange={(o) => { if (!o) setDetail(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{detail?.number}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Fecha</span><span>{detail.date}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Cliente</span><span>{detail.clientName}</span></div>
              <div className="border-t pt-2 space-y-1">
                {detail.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between gap-2">
                    <span className="flex-1">{i.quantity}× {i.name}</span>
                    <span className="whitespace-nowrap">{formatMoney(i.unitPrice * i.quantity - i.discount, currency)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-muted-foreground"><span>Descuento</span><span>{formatMoney(detail.discount, currency)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>IVA</span><span>{formatMoney(detail.tax, currency)}</span></div>
              <div className="flex justify-between font-bold text-base border-t pt-2"><span>TOTAL</span><span>{formatMoney(detail.total, currency)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Método</span><span>{detail.paymentMethod}</span></div>
              {detail.received != null && (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">Recibido</span><span>{formatMoney(detail.received, currency)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Cambio</span><span>{formatMoney(detail.change ?? 0, currency)}</span></div>
                </>
              )}
              <div className="flex justify-end pt-2">
                <Button size="sm" variant="outline" onClick={() => setDetail(null)}>Cerrar</Button>
                {detail.status === "Completada" && <Button size="sm" className="ml-2 text-destructive" variant="outline" onClick={() => anular(detail)}><Ban className="h-4 w-4 mr-1" /> Anular</Button>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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
