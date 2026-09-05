import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Calendar as CalIcon, Plus, X, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PortalLayout } from "@/components/portal-layout";
import { usePortalAuth } from "@/lib/portal-auth";
import { type AppointmentStatus } from "@/lib/mock-data";
import { useAllPets } from "@/lib/pets-store";
import { useAllAppointments, addAppointment, updateAppointment, updateAppointmentStatus } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/agenda")({
  head: () => ({ meta: [{ title: "Agenda — Portal" }] }),
  component: () => (
    <PortalLayout>
      <PortalAgendaPage />
    </PortalLayout>
  ),
});

const statusColors: Record<AppointmentStatus, string> = {
  "Pendiente": "bg-amber-100 text-amber-700 border-amber-200",
  "Confirmada": "bg-sky-100 text-sky-700 border-sky-200",
  "En atención": "bg-violet-100 text-violet-700 border-violet-200",
  "Finalizada": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Cancelada": "bg-rose-100 text-rose-700 border-rose-200",
};

function PortalAgendaPage() {
  const { owner } = usePortalAuth();
  const all = useAllAppointments();
  const pets = useAllPets();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [petId, setPetId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("09:00");
  const [reason, setReason] = useState("");

  if (!owner) return null;
  const isMaria = owner.email?.toLowerCase() === "maria@gmail.com" || owner.id === "00000000-0000-0000-0000-00000000f101" || owner.id === "cl_1";
  const isJuan = owner.email?.toLowerCase() === "juan@hotmail.com" || owner.id === "00000000-0000-0000-0000-00000000f102";
  const targetClientId = isMaria
    ? "00000000-0000-0000-0000-00000000f101"
    : isJuan
    ? "00000000-0000-0000-0000-00000000f102"
    : owner.id;

  const myPets = pets.filter((p) => p.clientId === targetClientId || (isMaria && p.name === "Rocky"));
  const petIds = new Set(myPets.map((p) => p.id));
  const today = new Date().toISOString().split("T")[0];
  const mine = all.filter((a) => petIds.has(a.petId));
  const upcoming = mine.filter((a) => a.date >= today).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const history = mine.filter((a) => a.date < today).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  const resetForm = () => {
    setPetId(myPets[0]?.id ?? "");
    setDate(new Date().toISOString().split("T")[0]);
    setTime("09:00");
    setReason("");
    setRescheduleId(null);
  };

  const openNew = () => { resetForm(); setDialogOpen(true); };
  const openReschedule = (id: string) => {
    const appt = all.find((a) => a.id === id);
    if (!appt) return;
    setPetId(appt.petId); setDate(appt.date); setTime(appt.time); setReason(appt.reason);
    setRescheduleId(id); setDialogOpen(true);
  };

  const submit = () => {
    if (!petId || !reason) { toast.error("Selecciona mascota y motivo"); return; }
    if (rescheduleId) {
      updateAppointment(rescheduleId, { date, time, reason, status: "Pendiente" });
      toast.success("Cita reprogramada");
    } else {
      addAppointment({
        id: `pa${Date.now()}`, date, time, petId, clientId: owner.id,
        vetId: "u2", reason, status: "Pendiente",
      });
      toast.success("Solicitud de cita enviada");
    }
    setDialogOpen(false);
    resetForm();
  };

  const cancel = (id: string) => {
    updateAppointmentStatus(id, "Cancelada");
    toast.success("Cita cancelada");
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-muted-foreground text-sm">Solicita, reprograma o cancela las citas de tus mascotas.</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Solicitar cita</Button>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><CalIcon className="h-4 w-4" /> Próximas citas</h2>
        {upcoming.length === 0 ? (
          <div className="text-sm text-muted-foreground">No tienes citas próximas.</div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((a) => {
              const pet = myPets.find((p) => p.id === a.petId);
              return (
                <div key={a.id} className="p-3 border rounded-lg flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <div className="font-medium text-sm">{pet?.name} — {a.reason}</div>
                    <div className="text-xs text-muted-foreground">{a.date} · {a.time}</div>
                  </div>
                  <Badge variant="outline" className={statusColors[a.status]}>{a.status}</Badge>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openReschedule(a.id)}>
                      <RotateCcw className="h-3 w-3 mr-1" /> Reprogramar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => cancel(a.id)}>
                      <X className="h-3 w-3 mr-1" /> Cancelar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold mb-4">Historial de citas</h2>
        {history.length === 0 ? (
          <div className="text-sm text-muted-foreground">Sin historial.</div>
        ) : (
          <div className="space-y-2">
            {history.map((a) => {
              const pet = myPets.find((p) => p.id === a.petId);
              return (
                <div key={a.id} className="p-3 border rounded-lg flex items-center gap-3 text-sm">
                  <div className="flex-1">
                    <div className="font-medium">{pet?.name} — {a.reason}</div>
                    <div className="text-xs text-muted-foreground">{a.date} · {a.time}</div>
                  </div>
                  <Badge variant="outline" className={statusColors[a.status]}>{a.status}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{rescheduleId ? "Reprogramar cita" : "Solicitar nueva cita"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Mascota</Label>
              <Select value={petId} onValueChange={setPetId}>
                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  {myPets.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <Label>Hora</Label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Motivo</Label>
              <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej: Control anual, vacunación..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={submit}>{rescheduleId ? "Reprogramar" : "Solicitar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
