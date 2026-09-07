import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { usePets } from "@/lib/pets-store";
import { useVeterinarios } from "@/lib/veterinarios-store";
import { useClientes } from "@/lib/clientes-store";
import type { LinkedConsultation } from "@/lib/store";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Receipt, Mail } from "lucide-react";
import { PayConsultationDialog, type PayConsultationData } from "@/components/pay-consultation-dialog";
import { ConsultationEmailDialog } from "@/components/consultation-email-dialog";
import type { ConsultationEmailData } from "@/lib/email-templates";

export function ConsultationDetailDialog({
  consultation,
  onClose,
}: {
  consultation: LinkedConsultation | null;
  onClose: () => void;
}) {
  const c = consultation;
  const pets = usePets();
  const vets = useVeterinarios();
  const clientes = useClientes();
  const pet = c ? pets.find((p) => p.id === c.petId) : undefined;
  const vet = c ? vets.find((v) => v.id === c.vetId) : undefined;
  const owner = pet ? clientes.find((cl) => cl.id === pet.clientId) : undefined;

  const [payData, setPayData] = useState<PayConsultationData | null>(null);
  const [emailData, setEmailData] = useState<ConsultationEmailData | null>(null);

  return (
    <>
      <Dialog open={!!c} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {c && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Consulta — {pet?.name}
                  {c.appointmentId && <Badge variant="secondary">Desde cita</Badge>}
                </DialogTitle>
              </DialogHeader>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <Row label="Fecha" value={c.date} />
                <Row label="Veterinario" value={vet?.nombre ?? "—"} />
                <Row label="Mascota" value={pet?.name ?? "—"} />
                <Row label="Cliente" value={owner?.fullName ?? "—"} />
                <Row label="Peso" value={`${c.weight} kg`} />
                <Row label="Temperatura" value={`${c.temperature} °C`} />
              </div>
              <div className="space-y-3 text-sm border-t pt-4">
                <Block label="Motivo" value={c.reason} />
                <Block label="Diagnóstico" value={c.diagnosis || "—"} />
                <Block label="Tratamiento" value={c.treatment || "—"} />
                <Block label="Medicamentos" value={c.medications || "—"} />
                <Block label="Observaciones" value={c.notes || "—"} />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t mt-2">
                <Button variant="outline" onClick={onClose} className="rounded-xl">
                  Cerrar
                </Button>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="rounded-xl border-sky-300 text-sky-700 hover:bg-sky-50 dark:border-sky-800 dark:text-sky-300 gap-1.5"
                    onClick={() => {
                      setEmailData({
                        clientName: owner?.fullName || "Tutor",
                        clientEmail: owner?.email || "",
                        petName: pet?.name || "Mascota",
                        petSpecies: pet?.species,
                        petBreed: pet?.breed,
                        vetName: vet?.nombre,
                        date: c.date,
                        diagnosis: c.diagnosis || c.reason,
                        treatment: c.treatment || "Seguir indicaciones médicas",
                        medications: c.medications,
                        weight: c.weight,
                        temperature: c.temperature,
                        notes: c.notes,
                      });
                    }}
                  >
                    <Mail className="h-4 w-4 text-sky-600" /> Enviar Correo al Tutor
                  </Button>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl gap-2 shadow-xs"
                    onClick={() => {
                      setPayData({
                        clientName: owner?.fullName || "Cliente general",
                        clientId: owner?.id,
                        petName: pet?.name,
                        vetName: vet?.nombre,
                        reason: c.reason,
                        defaultAmount: 15000,
                      });
                    }}
                  >
                    <Receipt className="h-4 w-4" /> Cobrar y Facturar
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <PayConsultationDialog
        open={payData !== null}
        onOpenChange={(open) => {
          if (!open) setPayData(null);
        }}
        data={payData}
        onSuccess={() => {
          setPayData(null);
          onClose();
        }}
      />

      <ConsultationEmailDialog
        open={emailData !== null}
        onOpenChange={(open) => {
          if (!open) setEmailData(null);
        }}
        data={emailData}
      />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1 border-b border-border/50">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
function Block({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
      <div className="whitespace-pre-wrap">{value}</div>
    </div>
  );
}
