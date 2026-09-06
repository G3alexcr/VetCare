import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { finance, formatCRC, type FinancePaymentMethod } from "@/lib/finance-store";
import { addMovement, getOpenSession } from "@/lib/billing-store";
import { Receipt, User, HeartPulse } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export type PayConsultationData = {
  clientName: string;
  clientId?: string;
  petName?: string;
  vetName?: string;
  reason?: string;
  defaultAmount?: number;
};

export function PayConsultationDialog({
  open,
  onOpenChange,
  data,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PayConsultationData | null;
  onSuccess?: () => void;
}) {
  const [concept, setConcept] = useState("Consulta médica veterinaria");
  const [amount, setAmount] = useState<number>(data?.defaultAmount || 15000);
  const [method, setMethod] = useState<FinancePaymentMethod>("Efectivo");
  const [reference, setReference] = useState("");
  const [createdInvoiceNum, setCreatedInvoiceNum] = useState<string | null>(null);

  if (!data) return null;

  const handleConfirm = () => {
    if (amount <= 0) return toast.error("El monto debe ser mayor a 0");

    const baseUnitPrice = Math.round(amount / 1.13);

    const inv = finance.createInvoice({
      clientId: data.clientId,
      clientName: data.clientName || "Cliente general",
      petName: data.petName,
      vetName: data.vetName,
      items: [
        {
          description: `${concept}${data.reason ? ` — ${data.reason}` : ""}`,
          quantity: 1,
          unitPrice: baseUnitPrice,
          discount: 0,
          kind: "Consulta",
        },
      ],
      notes: `Atención médica veterinaria de ${data.petName || "paciente"}.`,
    });

    finance.registerPayment({
      invoiceId: inv.id,
      method,
      amount: inv.total,
      reference: reference.trim() || undefined,
    });

    const openSess = getOpenSession();
    if (openSess && method === "Efectivo") {
      addMovement({
        sessionId: openSess.id,
        type: "Ingreso",
        concept: `Cobro Consulta ${inv.number} - ${data.petName || ""}`,
        amount: inv.total,
      });
    }

    setCreatedInvoiceNum(inv.number);
    toast.success(`Factura ${inv.number} generada y cobrada con éxito`);
    if (onSuccess) onSuccess();
  };

  const handleClose = () => {
    setCreatedInvoiceNum(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-5 w-5 text-emerald-600" />
            {createdInvoiceNum ? "Comprobante de Pago Generado" : "Cobrar Atención Médica"}
          </DialogTitle>
        </DialogHeader>

        {createdInvoiceNum ? (
          <div className="space-y-4 py-2 text-center sm:text-left">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-900">Factura emitida:</span>
                <Badge className="bg-emerald-700 text-white font-mono font-bold">
                  {createdInvoiceNum}
                </Badge>
              </div>
              <p className="text-xs text-emerald-800">
                La consulta ha sido cancelada y registrada en <strong>Facturación y Finanzas</strong> y en el turno de <strong>Caja</strong>.
              </p>
            </div>

            <div className="p-3 bg-muted/20 rounded-xl border text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paciente:</span>
                <span className="font-semibold">{data.petName || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tutor:</span>
                <span className="font-semibold">{data.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Método de pago:</span>
                <span className="font-semibold">{method}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-1 border-t">
                <span>Total cancelado:</span>
                <span className="text-emerald-600">{formatCRC(amount)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button asChild className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                <Link to="/facturacion">Ver en Facturación</Link>
              </Button>
              <Button variant="outline" className="flex-1 rounded-xl" onClick={handleClose}>
                Cerrar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5 text-xs sm:text-sm">
            <div className="p-3 bg-muted/20 border rounded-xl space-y-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  <HeartPulse className="h-3.5 w-3.5 text-rose-500" /> Paciente
                </span>
                <span className="font-bold text-foreground">{data.petName || "Mascota"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  <User className="h-3.5 w-3.5" /> Tutor
                </span>
                <span className="font-semibold text-foreground">{data.clientName}</span>
              </div>
              {data.vetName && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Médico tratante:</span>
                  <span>{data.vetName}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Concepto</Label>
              <Input
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <Label className="text-xs">Monto Total (₡)</Label>
                <Input
                  type="number"
                  min={0}
                  step={500}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  className="h-9 text-xs font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Método de Pago</Label>
                <Select value={method} onValueChange={(v) => setMethod(v as FinancePaymentMethod)}>
                  <SelectTrigger className="h-9 text-xs font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Efectivo">💵 Efectivo</SelectItem>
                    <SelectItem value="Tarjeta">💳 Tarjeta (POS)</SelectItem>
                    <SelectItem value="SINPE">📱 SINPE Móvil</SelectItem>
                    <SelectItem value="Transferencia">🏦 Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(method === "SINPE" || method === "Transferencia" || method === "Tarjeta") && (
              <div className="space-y-1.5 animate-in fade-in-50">
                <Label className="text-xs">N° Comprobante / Referencia (opcional)</Label>
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ej: Ref #123456 o últimos 4 dígitos"
                  className="h-9 text-xs"
                />
              </div>
            )}

            <div className="p-3 bg-muted/40 rounded-xl space-y-1 text-xs border">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal neto</span>
                <span>{formatCRC(Math.round(amount / 1.13))}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>IVA (13%)</span>
                <span>{formatCRC(amount - Math.round(amount / 1.13))}</span>
              </div>
              <div className="flex justify-between font-bold text-sm border-t pt-1">
                <span>Total a Cobrar</span>
                <span className="text-emerald-600">{formatCRC(amount)}</span>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
              <Button variant="outline" onClick={handleClose} className="rounded-xl">
                Cancelar
              </Button>
              <Button
                onClick={handleConfirm}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl"
              >
                <Receipt className="h-4 w-4 mr-1.5" /> Confirmar Cobro ({formatCRC(amount)})
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
