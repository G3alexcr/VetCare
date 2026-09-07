import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { finance, formatCRC, type FinancePaymentMethod } from "@/lib/finance-store";
import { addMovement, getOpenSession } from "@/lib/billing-store";
import { Receipt, User, HeartPulse, Building2, CheckCircle2, Wallet } from "lucide-react";
import { toast } from "sonner";

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
  const [mode, setMode] = useState<"reception" | "direct">("reception");

  if (!data) return null;

  // Opción 1: Cobrar de inmediato en el consultorio
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

    toast.success(`✓ Factura ${inv.number} cobrada exitosamente`);
    if (onSuccess) onSuccess();
    onOpenChange(false);
  };

  // Opción 2: Enviar orden de cobro a recepción/caja para que la cobre la recepcionista
  const handleSendToReception = () => {
    if (amount <= 0) return toast.error("El monto debe ser mayor a 0");

    const baseUnitPrice = Math.round(amount / 1.13);

    const inv = finance.createInvoice({
      clientId: data.clientId,
      clientName: data.clientName || "Cliente general",
      petName: data.petName,
      vetName: data.vetName,
      status: "Pendiente",
      items: [
        {
          description: `${concept}${data.reason ? ` — ${data.reason}` : ""}`,
          quantity: 1,
          unitPrice: baseUnitPrice,
          discount: 0,
          kind: "Consulta",
        },
      ],
      notes: `Atención médica de ${data.petName || "paciente"} enviada para cobro en recepción.`,
    });

    toast.success(`✓ Orden de cobro ${inv.number} enviada a Recepción y Punto de Venta`);
    if (onSuccess) onSuccess();
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg p-6 space-y-4">
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 grid place-items-center">
              <Receipt className="h-4 w-4" />
            </div>
            Cobro de Atención Médica
          </DialogTitle>
        </DialogHeader>

        {/* Resumen del Paciente y Tutor */}
        <div className="bg-muted/40 p-3 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
              <HeartPulse className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-foreground truncate">{data.petName || "Mascota"}</div>
              <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                <User className="h-3 w-3" /> {data.clientName}
              </div>
            </div>
          </div>
          {data.vetName && (
            <Badge variant="outline" className="text-[11px] shrink-0 font-medium text-muted-foreground">
              {data.vetName}
            </Badge>
          )}
        </div>

        {/* Tabs de Modo: Enviar a Recepción vs Cobrar en Consultorio */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as "reception" | "direct")} className="w-full">
          <TabsList className="grid grid-cols-2 w-full h-10 p-1 bg-muted/60">
            <TabsTrigger value="reception" className="text-xs font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-primary">
              <Building2 className="h-3.5 w-3.5" /> Enviar a Recepción
            </TabsTrigger>
            <TabsTrigger value="direct" className="text-xs font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:text-emerald-600">
              <Wallet className="h-3.5 w-3.5" /> Cobrar en Consultorio
            </TabsTrigger>
          </TabsList>

          {/* Modo 1: Enviar a Recepción */}
          <TabsContent value="reception" className="space-y-4 pt-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Monto de la Consulta (₡)</Label>
                <Input
                  type="number"
                  min={0}
                  step={500}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  className="h-10 text-sm font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Concepto</Label>
                <Input
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>
            </div>

            <div className="p-3 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900 rounded-xl text-xs space-y-1 text-sky-900 dark:text-sky-200">
              <div className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-sky-600" /> Cobro en Recepción / Caja
              </div>
              <p className="text-[11px] text-sky-700 dark:text-sky-300">
                La orden de cobro aparecerá inmediatamente en <strong>Punto de Venta</strong>, <strong>Caja</strong> y <strong>Facturación</strong> para que el cliente pague al salir con su recepcionista.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-xs text-muted-foreground"
              >
                Omitir
              </Button>
              <Button
                type="button"
                onClick={handleSendToReception}
                className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs h-10 px-4 rounded-xl shadow-xs"
              >
                <Building2 className="h-4 w-4 mr-1.5" /> Enviar a Recepción ({formatCRC(amount)})
              </Button>
            </div>
          </TabsContent>

          {/* Modo 2: Cobrar Aquí */}
          <TabsContent value="direct" className="space-y-3.5 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Monto Total (₡)</Label>
                <Input
                  type="number"
                  min={0}
                  step={500}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  className="h-10 text-sm font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Método de Pago</Label>
                <Select value={method} onValueChange={(v) => setMethod(v as FinancePaymentMethod)}>
                  <SelectTrigger className="h-10 text-xs font-medium">
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

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Concepto</Label>
              <Input
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            {(method === "SINPE" || method === "Transferencia" || method === "Tarjeta") && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">N° Comprobante / Referencia (opcional)</Label>
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ej: Ref #123456"
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

            <div className="flex items-center justify-between pt-2 border-t gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-xs text-muted-foreground"
              >
                Omitir
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-10 px-4 rounded-xl shadow-xs"
              >
                <Receipt className="h-4 w-4 mr-1.5" /> Cobrar y Emitir Factura ({formatCRC(amount)})
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
