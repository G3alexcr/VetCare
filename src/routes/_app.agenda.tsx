import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Stethoscope,
  Calendar as CalendarIcon,
  Clock,
  MessageCircle,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Activity,
  CalendarCheck,
  Phone,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppLayout } from "@/components/app-layout";
import { ConsultationForm } from "@/components/consultation-form";
import { PayConsultationDialog, type PayConsultationData } from "@/components/pay-consultation-dialog";
import { type Appointment, type AppointmentStatus } from "@/lib/mock-data";
import { useClientes } from "@/lib/clientes-store";
import { usePets } from "@/lib/pets-store";
import { useVeterinarios } from "@/lib/veterinarios-store";
import {
  useAppointments,
  addAppointment,
  updateAppointmentStatus,
  addConsultationFromAppointment,
  STANDARD_HOURS,
} from "@/lib/store";
import { toLocalDateStr } from "@/lib/utils";
import { toast } from "sonner";
import { Receipt } from "lucide-react";

export const Route = createFileRoute("/_app/agenda")({
  head: () => ({ meta: [{ title: "Agenda — Go2Vet" }] }),
  component: () => (
    <AppLayout>
      <AgendaPage />
    </AppLayout>
  ),
});

const statusColors: Record<AppointmentStatus, string> = {
  Pendiente: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  Confirmada: "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
  "En atención": "bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
  Finalizada: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  Cancelada: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
};

const statuses: AppointmentStatus[] = [
  "Pendiente",
  "Confirmada",
  "En atención",
  "Finalizada",
  "Cancelada",
];

function AgendaPage() {
  const appointments = useAppointments();
  const clientes = useClientes();
  const pets = usePets();
  const vets = useVeterinarios();
  const [cursor, setCursor] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);
  const [defaultTime, setDefaultTime] = useState("09:00");
  const [startConsultFor, setStartConsultFor] = useState<Appointment | null>(null);
  const [payData, setPayData] = useState<PayConsultationData | null>(null);

  const cursorDateStr = toLocalDateStr(cursor);
  const todayStr = toLocalDateStr(new Date());

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

  // Appointments for selected cursor day
  const dayAppts = useMemo(() => {
    return appointments
      .filter((a) => a.date === cursorDateStr)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, cursorDateStr]);

  // Daily statistics for KPI Strip
  const todayStats = useMemo(() => {
    const todayList = appointments.filter((a) => a.date === todayStr);
    const pending = todayList.filter((a) => a.status === "Pendiente").length;
    const confirmed = todayList.filter((a) => a.status === "Confirmada").length;
    const inProgress = todayList.filter((a) => a.status === "En atención").length;
    const completed = todayList.filter((a) => a.status === "Finalizada").length;
    const total = todayList.length;
    const activeVets = new Set(todayList.map((a) => a.vetId)).size;
    const occupancyRate = Math.min(100, Math.round((total / Math.max(1, STANDARD_HOURS.length)) * 100));

    return { total, pending, confirmed, inProgress, completed, activeVets, occupancyRate };
  }, [appointments, todayStr]);

  // Workload per veterinarian for current cursor date
  const vetWorkloads = useMemo(() => {
    return vets.map((v) => {
      const vetAppts = dayAppts.filter((a) => a.vetId === v.id);
      const activeCount = vetAppts.filter((a) => a.status !== "Cancelada").length;
      const completedCount = vetAppts.filter((a) => a.status === "Finalizada").length;
      return {
        vet: v,
        total: vetAppts.length,
        active: activeCount,
        completed: completedCount,
        capacityPct: Math.min(100, Math.round((activeCount / 6) * 100)),
      };
    });
  }, [vets, dayAppts]);

  // Quick booked hours set to find available slots
  const bookedHours = useMemo(() => {
    return new Set(dayAppts.filter((a) => a.status !== "Cancelada").map((a) => a.time));
  }, [dayAppts]);

  // Current real-time info for business hours filtering
  const now = new Date();
  const currentHourStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const isPastDate = cursorDateStr < todayStr;
  const isToday = cursorDateStr === todayStr;
  const isFutureDate = cursorDateStr > todayStr;
  const isAfterHours = isToday && STANDARD_HOURS.every((h) => h <= currentHourStr);

  const availableHours = useMemo(() => {
    if (isPastDate) return [];
    if (isToday) {
      // Only hours later than current real-time and not booked
      return STANDARD_HOURS.filter((h) => h > currentHourStr && !bookedHours.has(h));
    }
    // Future dates: any slot not booked
    return STANDARD_HOURS.filter((h) => !bookedHours.has(h));
  }, [isPastDate, isToday, currentHourStr, bookedHours]);

  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = toLocalDateStr(tomorrow);

  // Ensure initial pet and client are synced when modal opens
  const openNewForTime = (time: string, targetDateStr?: string) => {
    setDefaultTime(time);
    if (targetDateStr) {
      const [y, m, d] = targetDateStr.split("-").map(Number);
      setCursor(new Date(y, m - 1, d));
    }
    const initialPet = pets[0];
    if (initialPet) {
      setSelectedPetId(initialPet.id);
      setSelectedClientId(initialPet.clientId || clientes[0]?.id || "");
    }
    setOpen(true);
  };

  const openNewAppointment = () => {
    // If today is past working hours or date is in the past, default to tomorrow morning 09:00
    if (isPastDate || (isToday && isAfterHours)) {
      setCursor(tomorrow);
      setDefaultTime("09:00");
    } else {
      // Pick first available hour today or 09:00
      setDefaultTime(availableHours[0] || "09:00");
    }

    const initialPet = pets[0];
    if (initialPet) {
      setSelectedPetId(initialPet.id);
      setSelectedClientId(initialPet.clientId || clientes[0]?.id || "");
    }
    setOpen(true);
  };

  // When pet is selected, AUTOMATICALLY sync to that pet's owner
  const handlePetChange = (petId: string) => {
    setSelectedPetId(petId);
    const pet = pets.find((p) => p.id === petId);
    if (pet?.clientId) {
      setSelectedClientId(pet.clientId);
    }
  };

  // When client is selected, sync to one of that client's pets
  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    const clientPets = pets.filter((p) => p.clientId === clientId);
    if (clientPets.length > 0 && !clientPets.some((p) => p.id === selectedPetId)) {
      setSelectedPetId(clientPets[0].id);
    }
  };

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const d = Object.fromEntries(fd.entries()) as Record<string, string>;
    const chosenPetId = selectedPetId || d.petId || pets[0]?.id || "";
    const chosenPet = pets.find((p) => p.id === chosenPetId);
    const finalClientId = selectedClientId || d.clientId || chosenPet?.clientId || clientes[0]?.id || "";

    addAppointment({
      id: crypto.randomUUID(),
      date: d.date,
      time: d.time,
      clientId: finalClientId,
      petId: chosenPetId,
      vetId: d.vetId,
      reason: d.reason,
      status: "Pendiente",
    });
    setOpen(false);
    toast.success("Cita programada con éxito");
  };

  // Mini calendar days calculation
  const miniCalendarDays = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0
    const totalDays = lastDay.getDate();

    const days: { date: Date; dateStr: string; isCurrentMonth: boolean; hasAppts: boolean }[] = [];

    // Previous month padding
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevDate = new Date(year, month, -startingDayOfWeek + i + 1);
      const str = toLocalDateStr(prevDate);
      days.push({
        date: prevDate,
        dateStr: str,
        isCurrentMonth: false,
        hasAppts: appointments.some((a) => a.date === str),
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const curDate = new Date(year, month, i);
      const str = toLocalDateStr(curDate);
      days.push({
        date: curDate,
        dateStr: str,
        isCurrentMonth: true,
        hasAppts: appointments.some((a) => a.date === str),
      });
    }

    return days;
  }, [cursor, appointments]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Agenda Clínica</h1>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              Go2Vet Live
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestión inteligente de turnos, citas médicas y flujo de atención veterinaria.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCursor(new Date())}
            className="text-xs font-medium"
          >
            Hoy ({new Date().toLocaleDateString("es-ES", { day: "numeric", month: "short" })})
          </Button>
          <Dialog open={open} onOpenChange={(o) => {
            if (o) openNewAppointment();
            else setOpen(false);
          }}>
            <DialogTrigger asChild>
              <Button onClick={openNewAppointment}>
                <Plus className="h-4 w-4 mr-1.5" /> Nueva cita
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Programar nueva cita</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Fecha</Label>
                  <Input
                    name="date"
                    type="date"
                    required
                    min={isAfterHours ? tomorrowStr : todayStr}
                    defaultValue={isPastDate || (isToday && isAfterHours) ? tomorrowStr : cursorDateStr}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Hora</Label>
                  <Input name="time" type="time" required defaultValue={defaultTime} />
                </div>

                {/* Paciente / Mascota */}
                <div className="space-y-1.5 col-span-2">
                  <Label>Paciente / Mascota</Label>
                  <Select
                    name="petId"
                    value={selectedPetId || (pets[0]?.id ?? "")}
                    onValueChange={handlePetChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar mascota..." />
                    </SelectTrigger>
                    <SelectContent>
                      {pets.map((p) => {
                        const owner = clientes.find((c) => c.id === p.clientId);
                        return (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({p.species} · {p.breed}) {owner ? `— Tutor: ${owner.fullName}` : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tutor / Cliente (Sincronizado automáticamente) */}
                <div className="space-y-1.5 col-span-2">
                  <div className="flex items-center justify-between">
                    <Label>Tutor / Dueño de la mascota</Label>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      ✓ Vinculado automáticamente
                    </span>
                  </div>
                  <Select
                    name="clientId"
                    value={selectedClientId || (pets.find((p) => p.id === (selectedPetId || pets[0]?.id))?.clientId ?? clientes[0]?.id ?? "")}
                    onValueChange={handleClientChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tutor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.fullName} — {c.phone || "Sin teléfono"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Veterinario asignado</Label>
                  <Select name="vetId" defaultValue={vets[0]?.id ?? ""}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {vets.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.nombre} ({v.especialidad})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Motivo de consulta o procedimiento</Label>
                  <Input name="reason" placeholder="Ej. Vacunación séxtuple, Control postquirúrgico..." required />
                </div>
                <DialogFooter className="col-span-2 mt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Guardar Cita</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5 flex items-center gap-3 border shadow-xs">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <CalendarCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight">{todayStats.total}</div>
            <div className="text-xs text-muted-foreground">Citas para hoy</div>
          </div>
        </Card>

        <Card className="p-3.5 flex items-center gap-3 border shadow-xs">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-purple-700 dark:text-purple-400">
              {todayStats.inProgress}
            </div>
            <div className="text-xs text-muted-foreground">En atención ahora</div>
          </div>
        </Card>

        <Card className="p-3.5 flex items-center gap-3 border shadow-xs">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
              {todayStats.completed}
            </div>
            <div className="text-xs text-muted-foreground">Atenciones finalizadas</div>
          </div>
        </Card>

        <Card className="p-3.5 flex items-center gap-3 border shadow-xs">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight">{todayStats.activeVets}</div>
            <div className="text-xs text-muted-foreground">Veterinarios con agenda</div>
          </div>
        </Card>
      </div>

      {/* Two-Column Clinical Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Agenda & Calendar (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="p-4 md:p-6 shadow-xs border">
            {/* Day Switcher Bar */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCursor(new Date(cursor.getTime() - 86400000))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCursor(new Date(cursor.getTime() + 86400000))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="ml-2">
                  <div className="font-semibold text-base capitalize">
                    {cursor.toLocaleDateString("es-ES", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {cursorDateStr === todayStr ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">● Día de hoy</span>
                    ) : (
                      `Visualizando ${dayAppts.length} citas`
                    )}
                  </div>
                </div>
              </div>

              {/* Direct date picker */}
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={cursorDateStr}
                  onChange={(e) => {
                    if (e.target.value) {
                      const [y, m, d] = e.target.value.split("-").map(Number);
                      setCursor(new Date(y, m - 1, d));
                    }
                  }}
                  className="w-36 h-8 text-xs"
                />
              </div>
            </div>

            <Tabs defaultValue="day">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <TabsList className="grid grid-cols-2 w-56 h-8">
                  <TabsTrigger value="day" className="text-xs">Vista Diaria</TabsTrigger>
                  <TabsTrigger value="week" className="text-xs">Vista Semanal</TabsTrigger>
                </TabsList>
                <div className="text-xs text-muted-foreground">
                  {dayAppts.length} {dayAppts.length === 1 ? "cita registrada" : "citas registradas"}
                </div>
              </div>

              {/* Vista Diaria */}
              <TabsContent value="day" className="mt-2 space-y-3">
                {dayAppts.length === 0 ? (
                  <div className="py-8 px-4 text-center border border-dashed rounded-xl space-y-4 bg-muted/20">
                    <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                      {isPastDate ? (
                        <CalendarIcon className="h-6 w-6 text-muted-foreground" />
                      ) : isToday && isAfterHours ? (
                        <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <CalendarIcon className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      {isPastDate ? (
                        <>
                          <h3 className="text-sm font-semibold text-muted-foreground">Día concluido — Registro histórico</h3>
                          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                            Esta fecha ya transcurrió y no se registraron citas médicas. No es posible agendar turnos en días pasados.
                          </p>
                          <div className="pt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8"
                              onClick={() => setCursor(new Date())}
                            >
                              Volver a la fecha de hoy
                            </Button>
                          </div>
                        </>
                      ) : isToday && isAfterHours ? (
                        <>
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 mb-1">
                            Jornada regular finalizada ({currentHourStr})
                          </div>
                          <h3 className="text-sm font-semibold">Horario de atención regular cerrado por hoy</h3>
                          <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                            Han concluido los turnos regulares del día. Si se trata de una urgencia médica, ingresa directamente desde Urgencias. Para consultas estándar, te invitamos a agendar turnos a partir de mañana.
                          </p>
                          <div className="pt-3 flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              className="text-xs h-8"
                              onClick={() => {
                                setCursor(tomorrow);
                              }}
                            >
                              <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                              Ver agenda de mañana
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8"
                              onClick={() => openNewForTime("09:00", tomorrowStr)}
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              Agendar para mañana
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <h3 className="text-sm font-semibold">Sin citas programadas para este día</h3>
                          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                            {isToday
                              ? "Puedes registrar una consulta o reservar uno de los siguientes turnos disponibles hoy:"
                              : "Puedes reservar con anticipación un horario disponible a continuación:"}
                          </p>
                          {availableHours.length > 0 && (
                            <div className="pt-3">
                              <div className="text-xs font-medium text-muted-foreground mb-2">Horarios disponibles:</div>
                              <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                                {availableHours.slice(0, 8).map((time) => (
                                  <Button
                                    key={time}
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-7 gap-1 border-dashed hover:border-primary hover:text-primary"
                                    onClick={() => openNewForTime(time)}
                                  >
                                    <Clock className="h-3 w-3" />
                                    {time}
                                    <Plus className="h-3 w-3 ml-0.5 opacity-60" />
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  dayAppts.map((a) => {
                    const pet = pets.find((p) => p.id === a.petId);
                    const client = clientes.find((c) => c.id === a.clientId);
                    const vet = vets.find((v) => v.id === a.vetId);
                    const canStart = a.status !== "Finalizada" && a.status !== "Cancelada";
                    const isDone = a.status === "Finalizada";

                    // Formulate pre-filled WhatsApp reminder
                    const clientPhone = (client?.whatsapp || client?.phone || "").replace(/\D/g, "");
                    const waText = encodeURIComponent(
                      `Hola ${client?.fullName || "Tutor"}, te saludamos de Go2Vet Clínica Veterinaria. Te recordamos tu cita hoy a las ${a.time} para ${pet?.name || "tu mascota"} con ${vet?.nombre || "el médico veterinario"}. Por favor confirma tu asistencia. ¡Te esperamos!`
                    );
                    const waLink = clientPhone ? `https://wa.me/${clientPhone}?text=${waText}` : null;

                    return (
                      <div
                        key={a.id}
                        className={`p-4 rounded-xl border transition-all hover:shadow-sm ${
                          a.status === "En atención"
                            ? "border-violet-300 dark:border-violet-700 bg-violet-50/40 dark:bg-violet-950/20"
                            : isDone
                            ? "border-border/60 bg-card/60 opacity-90"
                            : "border-border bg-card"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          {/* Time & Pet Info */}
                          <div className="flex items-start gap-3">
                            <div className="shrink-0 text-center w-16 px-2 py-1.5 rounded-lg bg-muted/60 border font-mono">
                              <div className="text-base font-bold tracking-tight">{a.time}</div>
                              <div className="text-[10px] text-muted-foreground uppercase">Hora</div>
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-base">{pet?.name ?? "Paciente"}</span>
                                <Badge variant="secondary" className="text-[11px] py-0 px-1.5 h-5">
                                  {pet?.species ?? "Mascota"} {pet?.breed ? `· ${pet.breed}` : ""}
                                </Badge>
                                {a.status === "En atención" && (
                                  <Badge className="text-[10px] py-0 px-1.5 bg-violet-600 text-white animate-pulse">
                                    En box
                                  </Badge>
                                )}
                              </div>

                              <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                                <span>Tutor: <strong className="font-medium text-foreground">{client?.fullName ?? "Sin tutor"}</strong></span>
                                {client?.phone && <span>· Tel: {client.phone}</span>}
                              </div>

                              <div className="text-xs font-medium text-primary mt-1 flex items-center gap-1.5">
                                <span className="text-muted-foreground">Motivo:</span>
                                <span>{a.reason}</span>
                                <span className="text-muted-foreground">· Dr(a). {vet?.nombre ?? "Veterinario"}</span>
                              </div>
                            </div>
                          </div>

                          {/* Actions & Status */}
                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
                            {/* WhatsApp Button */}
                            {waLink && (
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 gap-1 px-2.5"
                                title="Enviar recordatorio por WhatsApp"
                              >
                                <a href={waLink} target="_blank" rel="noreferrer">
                                  <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                                  <span className="hidden sm:inline">WhatsApp</span>
                                </a>
                              </Button>
                            )}

                            {/* Start Consultation Action */}
                            {canStart && (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 text-xs gap-1.5 font-medium shadow-xs"
                                onClick={() => {
                                  if (a.status === "Pendiente" || a.status === "Confirmada") {
                                    updateAppointmentStatus(a.id, "En atención");
                                  }
                                  setStartConsultFor(a);
                                }}
                              >
                                <Stethoscope className="h-3.5 w-3.5 text-primary" />
                                Atender
                              </Button>
                            )}

                            {/* Cobrar consulta si fue atendida o finalizada */}
                            {(a.status === "Finalizada" || a.status === "En atención") && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs gap-1.5 font-medium border-emerald-300 text-emerald-700 hover:bg-emerald-50 shadow-xs"
                                onClick={() => {
                                  setPayData({
                                    clientName: client?.fullName || "Cliente general",
                                    clientId: client?.id,
                                    petName: pet?.name,
                                    vetName: vet?.nombre,
                                    reason: a.reason,
                                    defaultAmount: 15000,
                                  });
                                }}
                              >
                                <Receipt className="h-3.5 w-3.5 text-emerald-600" />
                                Cobrar
                              </Button>
                            )}

                            {/* Status Selector */}
                            <Select
                              value={a.status}
                              onValueChange={(v) => updateAppointmentStatus(a.id, v as AppointmentStatus)}
                            >
                              <SelectTrigger className={`w-32 h-8 text-xs font-medium border ${statusColors[a.status]}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {statuses.map((s) => (
                                  <SelectItem key={s} value={s} className="text-xs">
                                    {s}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </TabsContent>

              {/* Vista Semanal */}
              <TabsContent value="week" className="mt-4">
                <div className="grid grid-cols-7 gap-2 min-w-[650px] overflow-x-auto pb-2">
                  {weekDays.map((d) => {
                    const dateStr = toLocalDateStr(d);
                    const list = appointments.filter((a) => a.date === dateStr);
                    const isSelected = dateStr === cursorDateStr;
                    const isToday = dateStr === todayStr;

                    return (
                      <div
                        key={dateStr}
                        onClick={() => setCursor(d)}
                        className={`rounded-xl border p-2 min-h-[220px] cursor-pointer transition-all ${
                          isSelected
                            ? "ring-2 ring-primary border-primary bg-primary/5"
                            : isToday
                            ? "bg-muted/40 border-primary/40"
                            : "bg-card hover:bg-muted/20"
                        }`}
                      >
                        <div className="text-center pb-2 mb-2 border-b">
                          <div className="text-[11px] uppercase font-semibold text-muted-foreground">
                            {d.toLocaleDateString("es-ES", { weekday: "short" })}
                          </div>
                          <div
                            className={`text-base font-bold inline-block px-1.5 rounded-full ${
                              isToday ? "bg-primary text-primary-foreground" : ""
                            }`}
                          >
                            {d.getDate()}
                          </div>
                        </div>

                        <div className="space-y-1">
                          {list.map((a) => (
                            <div
                              key={a.id}
                              className={`text-[11px] p-1.5 rounded-md border font-medium truncate ${statusColors[a.status]}`}
                              title={`${a.time} - ${pets.find((p) => p.id === a.petId)?.name}`}
                            >
                              <div className="font-semibold">{a.time}</div>
                              <div className="truncate">{pets.find((p) => p.id === a.petId)?.name ?? "Paciente"}</div>
                            </div>
                          ))}
                          {list.length === 0 && (
                            <div className="text-[10px] text-center text-muted-foreground/60 pt-4">
                              Libre
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Right Column: Mini Calendar & Vet Workload (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Mini Calendar Widget */}
          <Card className="p-4 shadow-xs border">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-sm capitalize">
                {cursor.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    const d = new Date(cursor);
                    d.setMonth(d.getMonth() - 1);
                    setCursor(d);
                  }}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    const d = new Date(cursor);
                    d.setMonth(d.getMonth() + 1);
                    setCursor(d);
                  }}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 text-center text-[10px] font-medium text-muted-foreground mb-1.5">
              <span>Lu</span><span>Ma</span><span>Mi</span><span>Ju</span><span>Vi</span><span>Sá</span><span>Do</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {miniCalendarDays.map((item, idx) => {
                const isSelected = item.dateStr === cursorDateStr;
                const isToday = item.dateStr === todayStr;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCursor(item.date)}
                    className={`h-7 rounded-md relative flex items-center justify-center transition-colors text-xs ${
                      isSelected
                        ? "bg-primary text-primary-foreground font-bold"
                        : isToday
                        ? "bg-muted font-bold text-primary"
                        : item.isCurrentMonth
                        ? "text-foreground hover:bg-muted/60"
                        : "text-muted-foreground/40 hover:bg-muted/40"
                    }`}
                  >
                    {item.date.getDate()}
                    {item.hasAppts && (
                      <span
                        className={`absolute bottom-0.5 w-1 h-1 rounded-full ${
                          isSelected ? "bg-white" : "bg-primary"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Veterinarians Workload */}
          <Card className="p-4 shadow-xs border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Carga de trabajo del día</h3>
              <Badge variant="outline" className="text-[10px]">
                {dayAppts.length} citas
              </Badge>
            </div>

            <div className="space-y-3">
              {vetWorkloads.map(({ vet, total, completed, capacityPct }) => (
                <div key={vet.id} className="space-y-1.5 p-2 rounded-lg bg-muted/30 border border-muted">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{vet.nombre}</span>
                    <span className="text-muted-foreground font-mono">
                      {total} {total === 1 ? "cita" : "citas"} {completed > 0 ? `(${completed} listas)` : ""}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all rounded-full ${
                        capacityPct > 80
                          ? "bg-rose-500"
                          : capacityPct > 50
                          ? "bg-amber-500"
                          : "bg-primary"
                      }`}
                      style={{ width: `${Math.max(5, capacityPct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Available slots for quick booking */}
          <Card className="p-4 shadow-xs border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Espacios disponibles</h3>
              {isPastDate ? (
                <Badge variant="secondary" className="text-[10px]">Fecha pasada</Badge>
              ) : isToday && isAfterHours ? (
                <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                  Jornada cerrada
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground">{availableHours.length} libres</span>
              )}
            </div>

            {isPastDate ? (
              <p className="text-xs text-muted-foreground">
                La fecha seleccionada ya concluyó. No hay espacios disponibles para agendar citas en el pasado.
              </p>
            ) : isToday && isAfterHours ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  El horario regular de consultas ha concluido por hoy. Puedes consultar y agendar turnos a partir de mañana:
                </p>
                <Button
                  size="sm"
                  className="w-full text-xs h-8"
                  onClick={() => setCursor(tomorrow)}
                >
                  <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                  Ver agenda de mañana
                </Button>
              </div>
            ) : availableHours.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No hay turnos disponibles restantes para este día.
              </p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-3">
                  Haz clic en cualquier hora para agendar un turno inmediato:
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                  {availableHours.map((time) => (
                    <Button
                      key={time}
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs px-2 hover:border-primary hover:bg-primary/5"
                      onClick={() => openNewForTime(time)}
                    >
                      <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                      {time}
                    </Button>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Start Consultation Modal */}
      <Dialog open={!!startConsultFor} onOpenChange={(o) => !o && setStartConsultFor(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Atención Médica Inmediata</DialogTitle>
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
                const appt = startConsultFor;
                setStartConsultFor(null);
                toast.success("Consulta clínica guardada y cita finalizada");

                const pet = pets.find((p) => p.id === appt.petId);
                const client = clientes.find((c) => c.id === appt.clientId);
                const vet = vets.find((v) => v.id === appt.vetId);

                // Abrir directamente el diálogo para cobrar la atención
                setPayData({
                  clientName: client?.fullName || "Cliente general",
                  clientId: client?.id,
                  petName: pet?.name,
                  vetName: vet?.nombre,
                  reason: appt.reason,
                  defaultAmount: 15000,
                });
              }}
              submitLabel="Finalizar y Registrar Consulta"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo para cobrar consulta */}
      <PayConsultationDialog
        open={payData !== null}
        onOpenChange={(o) => { if (!o) setPayData(null); }}
        data={payData}
        onSuccess={() => setPayData(null)}
      />
    </div>
  );
}

