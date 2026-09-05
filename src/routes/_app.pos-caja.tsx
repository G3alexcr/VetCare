import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { PosNav } from "@/components/pos-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Can } from "@/lib/rbac";
import { formatMoney, getCurrencySymbol, useCurrency } from "@/lib/config-store";
import {
  addPosCashMovement,
  closePosSession,
  getOpenSession,
  openPosSession,
  usePosCashMovements,
  usePosSessions,
} from "@/lib/pos-store";
import { Wallet, LockKeyhole, Plus, Minus, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/pos-caja")({ component: PosCajaPage });

function PosCajaPage() {
  const sessions = usePosSessions();
  const cashMovements = usePosCashMovements();
  const currency = useCurrency();
  const session = getOpenSession();

  const [openDialog, setOpenDialog] = useState(false);
  const [openingAmount, setOpeningAmount] = useState(0);
  const [closeDialog, setCloseDialog] = useState(false);
  const [closingAmount, setClosingAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [moveDialog, setMoveDialog] = useState<null | "Ingreso" | "Egreso">(null);
  const [moveConcept, setMoveConcept] = useState("");
  const [moveAmount, setMoveAmount] = useState(0);

  const movs = session ? cashMovements.filter((m) => m.sessionId === session.id) : [];
  const ingresos = movs.filter((m) => m.type === "Ingreso").reduce((a, m) => a + m.amount, 0);
  const egresos = movs.filter((m) => m.type === "Egreso").reduce((a, m) => a + m.amount, 0);
  const expected = session ? session.openingAmount + ingresos - egresos : 0;

  const doOpen = () => {
    if (openingAmount < 0) return toast.error("Monto inválido");
    openPosSession(openingAmount, "Caja");
    toast.success("Caja abierta");
    setOpenDialog(false);
  };
  const doClose = () => {
    if (!session) return;
    closePosSession(session.id, closingAmount, notes || undefined);
    toast.success("Caja cerrada");
    setCloseDialog(false);
  };
  const doMove = () => {
    if (!moveDialog || !session) return;
    if (moveAmount <= 0) return toast.error("Monto inválido");
    addPosCashMovement(session.id, moveDialog, moveConcept || (moveDialog === "Ingreso" ? "Ingreso manual" : "Egreso manual"), moveAmount);
    toast.success(`${moveDialog} registrado`);
    setMoveDialog(null);
    setMoveConcept("");
    setMoveAmount(0);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-6xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Wallet className="h-6 w-6 text-primary" /> Caja diaria</h1>
            <p className="text-muted-foreground text-sm mt-1">Control de efectivo del día: apertura, movimientos y cierre.</p>
          </div>
          {session ? (
            <Can module="punto_venta" action="configure">
              <Button variant="outline" onClick={() => { setClosingAmount(expected); setNotes(""); setCloseDialog(true); }}>
                <LockKeyhole className="h-4 w-4 mr-1" /> Cerrar caja
              </Button>
            </Can>
          ) : (
            <Can module="punto_venta" action="create">
              <Button onClick={() => setOpenDialog(true)}><LockKeyhole className="h-4 w-4 mr-1" /> Abrir caja</Button>
            </Can>
          )}
        </div>

        <PosNav />

        {!session ? (
          <Card className="p-10 text-center text-muted-foreground border-dashed">
            No hay una sesión de caja abierta. Abre la caja para comenzar a registrar ventas y movimientos.
          </Card>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Apertura" value={formatMoney(session.openingAmount, currency)} />
              <Stat label="Ingresos" value={formatMoney(ingresos, currency)} tone="text-emerald-600" />
              <Stat label="Egresos" value={formatMoney(egresos, currency)} tone="text-rose-600" />
              <Stat label="Saldo esperado" value={formatMoney(expected, currency)} />
            </div>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold">Movimientos de caja</div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setMoveConcept(""); setMoveAmount(0); setMoveDialog("Ingreso"); }}><Plus className="h-4 w-4 mr-1" /> Ingreso</Button>
                  <Button size="sm" variant="outline" onClick={() => { setMoveConcept(""); setMoveAmount(0); setMoveDialog("Egreso"); }}><Minus className="h-4 w-4 mr-1" /> Egreso</Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Tipo</TableHead><TableHead>Concepto</TableHead><TableHead className="text-right">Monto</TableHead><TableHead>Fecha</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {movs.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Sin movimientos.</TableCell></TableRow>}
                    {movs.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell><Badge className={m.type === "Ingreso" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}>{m.type}</Badge></TableCell>
                        <TableCell>{m.concept}</TableCell>
                        <TableCell className="text-right font-semibold">{m.type === "Ingreso" ? "+" : "−"}{formatMoney(m.amount, currency)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Abrir */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Abrir caja</DialogTitle></DialogHeader>
          <div className="space-y-1.5"><Label>Fondo inicial ({getCurrencySymbol(currency)})</Label><Input type="number" min={0} value={openingAmount} onChange={(e) => setOpeningAmount(Number(e.target.value))} autoFocus /></div>
          <DialogFooter><Button variant="outline" onClick={() => setOpenDialog(false)}><X className="h-4 w-4 mr-1" /> Cancelar</Button><Button onClick={doOpen}>Abrir caja</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cerrar */}
      <Dialog open={closeDialog} onOpenChange={setCloseDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Cerrar caja</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <div className="text-sm">Saldo esperado: <strong>{formatMoney(expected, currency)}</strong></div>
            <div className="space-y-1.5"><Label>Arqueo real</Label><Input type="number" value={closingAmount} onChange={(e) => setClosingAmount(Number(e.target.value))} /></div>
            <div className="space-y-1.5"><Label>Notas</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Diferencia, observaciones..." /></div>
            {closingAmount !== 0 && (
              <div className={`text-sm ${closingAmount - expected === 0 ? "text-emerald-600" : "text-rose-600"}`}>
                Diferencia: {formatMoney(closingAmount - expected, currency)}
              </div>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCloseDialog(false)}>Cancelar</Button><Button onClick={doClose}>Cerrar caja</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Movimiento manual */}
      <Dialog open={moveDialog != null} onOpenChange={(o) => { if (!o) setMoveDialog(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{moveDialog === "Ingreso" ? "Registrar ingreso" : "Registrar egreso"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Concepto</Label><Input value={moveConcept} onChange={(e) => setMoveConcept(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Monto</Label><Input type="number" min={0} value={moveAmount} onChange={(e) => setMoveAmount(Number(e.target.value))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setMoveDialog(null)}>Cancelar</Button><Button onClick={doMove}>Guardar</Button></DialogFooter>
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
