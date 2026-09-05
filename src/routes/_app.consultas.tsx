import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Stethoscope, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AppLayout } from "@/components/app-layout";
import { ConsultationForm } from "@/components/consultation-form";
import { ConsultationDetailDialog } from "@/components/consultation-detail";
import { usePets } from "@/lib/pets-store";
import { useVeterinarios } from "@/lib/veterinarios-store";
import { useConsultations, addConsultation, type LinkedConsultation } from "@/lib/store";
import { openVetCareAI } from "@/lib/ai-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/consultas")({
  head: () => ({ meta: [{ title: "Consultas — VetCare" }] }),
  component: () => <AppLayout><ConsultationsPage /></AppLayout>,
});

function ConsultationsPage() {
  const items = useConsultations();
  const pets = usePets();
  const vets = useVeterinarios();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<LinkedConsultation | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Consultas</h1>
          <p className="text-sm text-muted-foreground mt-1">Historial de atenciones médicas.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openVetCareAI("diagnostico")}>
            <Sparkles className="h-4 w-4 mr-2" /> Diagnósticos IA
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Nueva consulta</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Registrar consulta</DialogTitle></DialogHeader>
              <ConsultationForm
                onCancel={() => setOpen(false)}
                onSubmit={(data) => {
                  addConsultation({ ...data, id: `co${Date.now()}` });
                  setOpen(false);
                  toast.success("Consulta registrada");
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {items.map((c) => {
          const pet = pets.find((p) => p.id === c.petId);
          const vet = vets.find((v) => v.id === c.vetId);
          return (
            <Card
              key={c.id}
              className="p-5 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setDetail(c)}
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary grid place-items-center flex-shrink-0">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {pet?.name} — {c.reason}
                        {c.appointmentId && <Badge variant="secondary" className="text-[10px]">Desde cita</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">{c.date} · {vet?.nombre}</div>
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>Peso: <strong>{c.weight} kg</strong></span>
                      <span>T°: <strong>{c.temperature}°C</strong></span>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 mt-3 text-sm">
                    <div><span className="text-muted-foreground">Diagnóstico:</span> {c.diagnosis}</div>
                    <div><span className="text-muted-foreground">Tratamiento:</span> {c.treatment}</div>
                    <div><span className="text-muted-foreground">Medicamentos:</span> {c.medications || "—"}</div>
                    <div><span className="text-muted-foreground">Notas:</span> {c.notes || "—"}</div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
        {items.length === 0 && (
          <Card className="p-12 text-center text-muted-foreground">No hay consultas registradas.</Card>
        )}
      </div>

      <ConsultationDetailDialog consultation={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
