import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { Calendar as CalIcon, Plus, X, RotateCcw, Clock, AlertCircle } from "lucide-react";
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
import { useAllClientes } from "@/lib/clientes-store";
import { useAllAppointments, addAppointment, updateAppointment, updateAppointmentStatus, STANDARD_HOURS } from "@/lib/store";
import { toLocalDateStr, cn } from "@/lib/utils";
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
  const clientes = useAllClientes();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [petId, setPetId] = useState("");
  const todayStr = toLocalDateStr(new Date());
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");

  if (!owner) return null;

  const emailLower = (owner.email || "").trim().toLowerCase();
  const clientIdsForOwner = new Set<string>();
  if (owner.id) clientIdsForOwner.add(owner.id);
  if (emailLower) {
    clientes
      .filter((c) => (c.email || "").trim().toLowerCase() === emailLower)
      .forEach((c) => clientIdsForOwner.add(c.id));
  }

  const isMaria = emailLower === "maria@gmail.com" || clientIdsForOwner.has("00000000-0000-0000-0000-00000000f101") || clientIdsForOwner.has("cl_1");
  const isGhiulina = emailLower === "ghiulyscr@gmail.com" || clientIdsForOwner.has("5e700fd9-3323-433c-9570-294e46c10785") || clientIdsForOwner.has("00000000-0000-0000-0000-00000000f103");
  const myPets = pets.filter((p) => clientIdsForOwner.has(p.clientId) || (isMaria && p.name === "Rocky") || (isGhiulina && p.name === "Nani"));
  const petIds = new Set(myPets.map((p) => p.id));
  const mine = all.filter((a) => petIds.has(a.petId));
  const upcoming = mine.filter((a) => a.date >= todayStr).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const history = mine.filter((a) => a.date < todayStr).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  // Horas ya ocupadas por otras citas de la clínica en la fecha seleccionada
  const bookedHoursOnDate = useMemo(() => {
    return new Set(
      all
        .filter((a) => a.date === date && a.status !== "Cancelada" && a.id !== rescheduleId)
        .map((a) => a.time)
    );
  }, [all, date, rescheduleId]);

  // Cálculo en tiempo real de slots disponibles según horario de la clínica
  const now = new Date();
  const currentHourStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const isPastDate = date < todayStr;
  const isToday = date === todayStr;

  const availableHours = useMemo(() => {
    if (isPastDate) return [];
    if (isToday) {
      return STANDARD_HOURS.filter((h) => h > currentHourStr && !bookedHoursOnDate.has(h));
    }
    return STANDARD_HOURS.filter((h) => !bookedHoursOnDate.has(h));
  }, [isPastDate, isToday, currentHourStr, bookedHoursOnDate]);

  // Si la hora seleccionada no está disponible en la fecha, auto-seleccionar la primera disponible
  useEffect(() => {
    if (availableHours.length > 0) {
      if (!time || !availableHours.includes(time)) {
        setTime(availableHours[0]);
      }
    } else {
      setTime("");
    }
  }, [availableHours, time]);

  const resetForm = () => {
    setPetId(myPets[0]?.id ?? "");
    setDate(todayStr);
    setTime(availableHours[0] || "");
    setReason("");
    setRescheduleId(null);
  };

  const openNew = () => { resetForm(); setDialogOpen(true); };
  const openReschedule = (id: string) => {
    const appt = all.find((a) => a.id === id);
    if (!appt) return;
    setPetId(appt.petId);
    setDate(appt.date);
    setTime(appt.time);
    setReason(appt.reason);
    setRescheduleId(id);
    setDialogOpen(true);
  };

  const submit = () => {
    if (!petId || !reason) { toast.error("Selecciona mascota y motivo"); return; }
    if (!time || !availableHours.includes(time)) {
      toast.error("Por favor selecciona un horario disponible de la clínica");
      return;
    }
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{rescheduleId ? "Reprogramar cita" : "Solicitar nueva cita"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div>
              <Label>Mascota</Label>
              <Select value={petId} onValueChange={setPetId}>
                <SelectTrigger><SelectValue placeholder="Selecciona mascota" /></SelectTrigger>
                <SelectContent>
                  {myPets.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Fecha</Label>
                <Input
                  type="date"
                  min={todayStr}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Hora disponible</Label>
                <Select
                  value={time}
                  onValueChange={setTime}
                  disabled={availableHours.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={availableHours.length === 0 ? "Sin turnos" : "Selecciona hora"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableHours.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h} hrs
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Turnos disponibles de la clínica */}
            {availableHours.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    Horarios disponibles ({availableHours.length})
                  </Label>
                  <span className="text-[11px] text-muted-foreground">Selecciona un turno</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-36 overflow-y-auto p-2 bg-muted/40 rounded-lg border border-border/60">
                  {availableHours.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setTime(h)}
                      className={cn(
                        "px-2 py-1.5 rounded-md text-xs font-medium border transition-all text-center",
                        time === h
                          ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold scale-105"
                          : "bg-background hover:bg-muted text-foreground border-border/70 hover:border-primary/50"
                      )}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                <span>No hay turnos disponibles para esta fecha. Por favor selecciona otro día.</span>
              </div>
            )}

            <div>
              <Label>Motivo</Label>
              <Textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Control anual, vacunación, desparasitación..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={submit}
              disabled={availableHours.length === 0 || !time || !petId}
            >
              {rescheduleId ? "Reprogramar" : "Solicitar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
