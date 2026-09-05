import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { usePets } from "@/lib/pets-store";
import { useVeterinarios } from "@/lib/veterinarios-store";
import { useClientes } from "@/lib/clientes-store";
import type { LinkedConsultation } from "@/lib/store";

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

  return (
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
          </>
        )}
      </DialogContent>
    </Dialog>
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
