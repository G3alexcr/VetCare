import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Stethoscope } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppLayout } from "@/components/app-layout";
import { ConsultationForm } from "@/components/consultation-form";
import {
  type Appointment,
  type AppointmentStatus,
} from "@/lib/mock-data";
import { useClientes } from "@/lib/clientes-store";
import { usePets } from "@/lib/pets-store";
import { useVeterinarios } from "@/lib/veterinarios-store";
import {
  useAppointments,
  addAppointment,
  updateAppointmentStatus,
  addConsultationFromAppointment,
} from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/agenda")({
  head: () => ({ meta: [{ title: "Agenda — VetCare" }] }),
  component: () => <AppLayout><AgendaPage /></AppLayout>,
});

const statusColors: Record<AppointmentStatus, string> = {
  "Pendiente": "bg-amber-100 text-amber-700 border-amber-200",
  "Confirmada": "bg-sky-100 text-sky-700 border-sky-200",
  "En atención": "bg-violet-100 text-violet-700 border-violet-200",
  "Finalizada": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Cancelada": "bg-rose-100 text-rose-700 border-rose-200",
};

const statuses: AppointmentStatus[] = ["Pendiente", "Confirmada", "En atención", "Finalizada", "Cancelada"];

function isoDate(d: Date) { return d.toISOString().split("T")[0]; }

function AgendaPage() {
  const appointments = useAppointments();
  const clientes = useClientes();
  const pets = usePets();
  const vets = useVeterinarios();
  const [cursor, setCursor] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);
  const [startConsultFor, setStartConsultFor] = useState<Appointment | null>(null);

  const weekStart = useMemo(() => {
    const d = new Date(cursor);
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
    return d;
  }, [cursor]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const dayAppts = appointments
    .filter((a) => a.date === isoDate(cursor))
    .sort((a, b) => a.time.localeCompare(b.time));

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const d = Object.fromEntries(fd.entries()) as Record<string, string>;
    addAppointment({
      id: `a${Date.now()}`,
      date: d.date,
      time: d.time,
      clientId: d.clientId,
      petId: d.petId,
      vetId: d.vetId,
      reason: d.reason,
      status: "Pendiente",
    });
    setOpen(false);
    toast.success("Cita programada");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
          <p className="text-sm text-muted-foreground mt-1">Programación de citas veterinarias.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Nueva cita</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva cita</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Fecha</Label><Input name="date" type="date" required defaultValue={isoDate(cursor)} /></div>
              <div className="space-y-2"><Label>Hora</Label><Input name="time" type="time" required defaultValue="09:00" /></div>
              <div className="space-y-2 col-span-2">
                <Label>Cliente</Label>
                <Select name="clientId" defaultValue={clientes[0]?.id ?? ""}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Mascota</Label>
                <Select name="petId" defaultValue={pets[0]?.id ?? ""}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{pets.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Veterinario</Label>
                <Select name="vetId" defaultValue={vets[0]?.id ?? ""}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{vets.map((v) => <SelectItem key={v.id} value={v.id}>{v.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2"><Label>Motivo</Label><Input name="reason" required /></div>
              <DialogFooter className="col-span-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit">Crear</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" size="icon" onClick={() => setCursor(new Date(cursor.getTime() - 86400000))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <div className="font-semibold">
              {cursor.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>
            <button onClick={() => setCursor(new Date())} className="text-xs text-primary hover:underline">Hoy</button>
          </div>
          <Button variant="outline" size="icon" onClick={() => setCursor(new Date(cursor.getTime() + 86400000))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="day">
          <TabsList>
            <TabsTrigger value="day">Vista diaria</TabsTrigger>
            <TabsTrigger value="week">Vista semanal</TabsTrigger>
          </TabsList>

          <TabsContent value="day" className="mt-4">
            <div className="space-y-2">
              {dayAppts.length === 0 && (
                <div className="text-center text-muted-foreground py-12 border border-dashed rounded-lg">
                  Sin citas para este día.
                </div>
              )}
              {dayAppts.map((a) => {
                const pet = pets.find((p) => p.id === a.petId);
                const client = clientes.find((c) => c.id === a.clientId);
                const vet = vets.find((v) => v.id === a.vetId);
                const canStart = a.status !== "Finalizada" && a.status !== "Cancelada";
                return (
                  <div key={a.id} className="flex items-center gap-4 p-4 rounded-lg border bg-card flex-wrap">
                    <div className="text-center w-16">
                      <div className="text-xl font-semibold">{a.time}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{pet?.name} — {client?.fullName}</div>
                      <div className="text-xs text-muted-foreground">{a.reason} · {vet?.nombre}</div>
                    </div>
                    {canStart && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          if (a.status === "Pendiente" || a.status === "Confirmada") {
                            updateAppointmentStatus(a.id, "En atención");
                          }
                          setStartConsultFor(a);
                        }}
                      >
                        <Stethoscope className="h-4 w-4 mr-2" /> Iniciar consulta
                      </Button>
                    )}
                    <Select value={a.status} onValueChange={(v) => updateAppointmentStatus(a.id, v as AppointmentStatus)}>
                      <SelectTrigger className={`w-40 ${statusColors[a.status]}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="week" className="mt-4">
            <div className="grid grid-cols-7 gap-2 min-w-[700px]">
              {weekDays.map((d) => {
                const list = appointments.filter((a) => a.date === isoDate(d));
                const isToday = isoDate(d) === isoDate(new Date());
                return (
                  <div key={d.toISOString()} className={`rounded-lg border p-2 min-h-[200px] ${isToday ? "bg-primary/5 border-primary/30" : "bg-card"}`}>
                    <div className="text-center mb-2">
                      <div className="text-xs uppercase text-muted-foreground">{d.toLocaleDateString("es-ES", { weekday: "short" })}</div>
                      <div className="text-lg font-semibold">{d.getDate()}</div>
                    </div>
                    <div className="space-y-1">
                      {list.map((a) => (
                        <div key={a.id} className={`text-xs p-1.5 rounded border ${statusColors[a.status]}`}>
                          <div className="font-medium">{a.time}</div>
                          <div className="truncate">{pets.find((p) => p.id === a.petId)?.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      <div className="flex gap-2 flex-wrap text-xs">
        {statuses.map((s) => (
          <Badge key={s} variant="outline" className={statusColors[s]}>{s}</Badge>
        ))}
      </div>

      <Dialog open={!!startConsultFor} onOpenChange={(o) => !o && setStartConsultFor(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Iniciar consulta</DialogTitle>
          </DialogHeader>
          {startConsultFor && (
            <ConsultationForm
              lockContext
              defaults={{
                date: startConsultFor.date,
                vetId: startConsultFor.vetId,
                petId: startConsultFor.petId,
                clientId: startConsultFor.clientId,
                reason: startConsultFor.reason,
              }}
              onCancel={() => setStartConsultFor(null)}
              onSubmit={(data) => {
                addConsultationFromAppointment(data, startConsultFor.id);
                setStartConsultFor(null);
                toast.success("Consulta guardada · Cita finalizada");
              }}
              submitLabel="Guardar consulta"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
