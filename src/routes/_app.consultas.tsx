import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Plus,
  Stethoscope,
  Sparkles,
  Calendar,
  Clock,
  User,
  Search,
  CheckCircle2,
  Clock3,
  Activity,
  Play,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AppLayout } from "@/components/app-layout";
import { ConsultationForm } from "@/components/consultation-form";
import { ConsultationDetailDialog } from "@/components/consultation-detail";
import { usePets } from "@/lib/pets-store";
import { useVeterinarios } from "@/lib/veterinarios-store";
import { useClientes } from "@/lib/clientes-store";
import {
  useConsultations,
  useAppointments,
  addConsultation,
  addConsultationFromAppointment,
  updateAppointmentStatus,
  type LinkedConsultation,
} from "@/lib/store";
import { openVetCareAI } from "@/lib/ai-store";
import { toast } from "sonner";
import { toLocalDateStr } from "@/lib/utils";
import { PayConsultationDialog, type PayConsultationData } from "@/components/pay-consultation-dialog";
import { Mail } from "lucide-react";
import { ConsultationEmailDialog } from "@/components/consultation-email-dialog";
import type { ConsultationEmailData } from "@/lib/email-templates";

export const Route = createFileRoute("/_app/consultas")({
  head: () => ({ meta: [{ title: "Consultas y Atención Médica — VetCare" }] }),
  component: () => (
    <AppLayout>
      <ConsultationsPage />
    </AppLayout>
  ),
});

const statusBadgeStyles: Record<string, string> = {
  Pendiente: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300",
  Confirmada: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300",
  "En atención": "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 animate-pulse",
  Finalizada: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200",
  Cancelada: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300",
};

function ConsultationsPage() {
  const consultations = useConsultations();
  const appointments = useAppointments();
  const pets = usePets();
  const vets = useVeterinarios();
  const clientes = useClientes();

  const [openNew, setOpenNew] = useState(false);
  const [attendingAppt, setAttendingAppt] = useState<any | null>(null);
  const [detail, setDetail] = useState<LinkedConsultation | null>(null);
  const [payData, setPayData] = useState<PayConsultationData | null>(null);
  const [emailData, setEmailData] = useState<ConsultationEmailData | null>(null);
  const [search, setSearch] = useState("");

  const todayStr = useMemo(() => toLocalDateStr(new Date()), []);

  // Filter pending appointments (queue)
  const pendingAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.status !== "Cancelada" && a.status !== "Finalizada")
      .sort((a, b) => {
        const dA = `${a.date} ${a.time || "00:00"}`;
        const dB = `${b.date} ${b.time || "00:00"}`;
        return dA.localeCompare(dB);
      });
  }, [appointments]);

  // Filter by search query
  const filteredPending = useMemo(() => {
    if (!search.trim()) return pendingAppointments;
    const q = search.toLowerCase();
    return pendingAppointments.filter((a) => {
      const pet = pets.find((p) => p.id === a.petId);
      const client = clientes.find((c) => c.id === a.clientId);
      const vet = vets.find((v) => v.id === a.vetId);
      return (
        pet?.name?.toLowerCase().includes(q) ||
        client?.fullName?.toLowerCase().includes(q) ||
        vet?.nombre?.toLowerCase().includes(q) ||
        a.reason?.toLowerCase().includes(q) ||
        a.date?.includes(q) ||
        a.time?.includes(q)
      );
    });
  }, [pendingAppointments, pets, clientes, vets, search]);

  const filteredConsultations = useMemo(() => {
    if (!search.trim()) return consultations;
    const q = search.toLowerCase();
    return consultations.filter((c) => {
      const pet = pets.find((p) => p.id === c.petId);
      const vet = vets.find((v) => v.id === c.vetId);
      return (
        pet?.name?.toLowerCase().includes(q) ||
        vet?.nombre?.toLowerCase().includes(q) ||
        c.reason?.toLowerCase().includes(q) ||
        c.diagnosis?.toLowerCase().includes(q) ||
        c.treatment?.toLowerCase().includes(q) ||
        c.date?.includes(q)
      );
    });
  }, [consultations, pets, vets, search]);

  const defaultTab = pendingAppointments.length > 0 ? "pendientes" : consultations.length > 0 ? "historial" : "pendientes";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-primary" />
            Consultas y Atención Médica
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona la cola de atención de citas y el historial clínico médico.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => openVetCareAI("diagnostico")}>
            <Sparkles className="h-4 w-4 mr-2 text-primary" /> Diagnósticos IA
          </Button>

          {/* Dialog for Independent New Walk-in Consultation */}
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Nueva consulta directa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Consulta Médica Inmediata</DialogTitle>
              </DialogHeader>
              <ConsultationForm
                onCancel={() => setOpenNew(false)}
                onSubmit={(data) => {
                  addConsultation({ ...data, id: crypto.randomUUID() });
                  setOpenNew(false);
                  toast.success("Consulta registrada exitosamente");
                  const pet = pets.find((p) => p.id === data.petId);
                  const client = clientes.find((cl) => cl.id === (data.clientId || pet?.clientId));
                  const vet = vets.find((v) => v.id === data.vetId);
                  setPayData({
                    clientName: client?.fullName || "Cliente general",
                    clientId: client?.id,
                    petName: pet?.name,
                    vetName: vet?.nombre,
                    reason: data.reason,
                    defaultAmount: 15000,
                  });
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3 border-l-4 border-l-amber-500 shadow-sm">
          <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 grid place-items-center flex-shrink-0">
            <Clock3 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">{pendingAppointments.length}</div>
            <div className="text-xs text-muted-foreground font-medium">Citas en espera</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 border-l-4 border-l-blue-500 shadow-sm">
          <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 grid place-items-center flex-shrink-0">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">
              {appointments.filter((a) => a.status === "En atención").length}
            </div>
            <div className="text-xs text-muted-foreground font-medium">En atención ahora</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 border-l-4 border-l-emerald-500 shadow-sm">
          <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 grid place-items-center flex-shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">{consultations.length}</div>
            <div className="text-xs text-muted-foreground font-medium">Consultas registradas</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 border-l-4 border-l-primary shadow-sm">
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary grid place-items-center flex-shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">
              {consultations.filter((c) => c.date === todayStr).length}
            </div>
            <div className="text-xs text-muted-foreground font-medium">Atendidos hoy</div>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por paciente, propietario, veterinario, motivo o diagnóstico..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-card"
        />
      </div>

      {/* Main Tabs Navigation */}
      <Tabs defaultValue={defaultTab} className="w-full space-y-4">
        <TabsList className="grid w-full sm:w-auto grid-cols-2 sm:inline-flex">
          <TabsTrigger value="pendientes" className="flex items-center gap-2">
            <Clock3 className="h-4 w-4" />
            <span>Citas Pendientes de Atención</span>
            {pendingAppointments.length > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full">
                {pendingAppointments.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="historial" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            <span>Historial de Consultas</span>
            {consultations.length > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold bg-muted-foreground/20 text-foreground rounded-full">
                {consultations.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab Content: Pending Appointments Queue */}
        <TabsContent value="pendientes" className="space-y-4">
          {filteredPending.length > 0 ? (
            <div className="grid gap-3">
              {filteredPending.map((appt) => {
                const pet = pets.find((p) => p.id === appt.petId);
                const client = clientes.find((c) => c.id === appt.clientId);
                const vet = vets.find((v) => v.id === appt.vetId);
                const isToday = appt.date === todayStr;

                return (
                  <Card
                    key={appt.id}
                    className={`p-5 transition-all border ${
                      isToday ? "border-amber-300 dark:border-amber-900 bg-amber-500/[0.02]" : ""
                    } hover:shadow-md`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Patient & Appointment Info */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 grid place-items-center flex-shrink-0 font-bold text-base shadow-sm">
                          {pet?.name ? pet.name.charAt(0).toUpperCase() : "🐾"}
                        </div>

                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-lg text-foreground">
                              {pet?.name || "Paciente no especificado"}
                            </span>
                            {pet?.species && (
                              <span className="text-xs text-muted-foreground font-medium">
                                ({pet.species}{pet?.breed ? ` · ${pet.breed}` : ""})
                              </span>
                            )}
                            <Badge
                              variant="outline"
                              className={statusBadgeStyles[appt.status] || "border-muted"}
                            >
                              {appt.status}
                            </Badge>
                            {isToday && (
                              <Badge className="bg-amber-500 text-white font-semibold text-[10px]">
                                Cita para Hoy
                              </Badge>
                            )}
                          </div>

                          <div className="text-sm font-medium text-foreground/90">
                            Motivo: <span className="font-normal text-muted-foreground">{appt.reason || "Consulta médica general"}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                            <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                              <Calendar className="h-3.5 w-3.5 text-amber-600" /> {appt.date}
                            </span>
                            <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                              <Clock className="h-3.5 w-3.5 text-amber-600" /> {appt.time || "Sin hora definida"}
                            </span>
                            {client && (
                              <span className="inline-flex items-center gap-1">
                                <User className="h-3.5 w-3.5" /> {client.fullName}
                                {client.phone && ` · ${client.phone}`}
                              </span>
                            )}
                            {vet && (
                              <span className="inline-flex items-center gap-1">
                                <Stethoscope className="h-3.5 w-3.5" /> Dr(a). {vet.nombre}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 flex-wrap justify-end pt-2 md:pt-0 border-t md:border-t-0">
                        {appt.status !== "En atención" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              updateAppointmentStatus(appt.id, "En atención");
                              toast.info(`Paciente ${pet?.name || ""} marcado en atención`);
                            }}
                          >
                            <Play className="h-3.5 w-3.5 mr-1 text-blue-500" /> En atención
                          </Button>
                        )}
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary/90 shadow-sm"
                          onClick={() => setAttendingAppt(appt)}
                        >
                          <Stethoscope className="h-4 w-4 mr-1.5" />
                          Atender Consulta
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center border-dashed">
              <div className="max-w-md mx-auto space-y-3">
                <div className="h-12 w-12 rounded-full bg-muted grid place-items-center mx-auto text-muted-foreground">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="font-semibold text-lg">No hay citas pendientes de atención</h3>
                <p className="text-sm text-muted-foreground">
                  Todas las citas programadas han sido atendidas o no hay citas pendientes por atender.
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <Button variant="outline" asChild>
                    <Link to="/_app/agenda">Ir a la Agenda</Link>
                  </Button>
                  <Button onClick={() => setOpenNew(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Nueva Consulta Directa
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Tab Content: Completed Consultations History */}
        <TabsContent value="historial" className="space-y-4">
          <div className="grid gap-4">
            {filteredConsultations.map((c) => {
              const pet = pets.find((p) => p.id === c.petId);
              const vet = vets.find((v) => v.id === c.vetId);
              return (
                <Card
                  key={c.id}
                  className="p-5 cursor-pointer hover:shadow-md transition-shadow border hover:border-primary/40"
                  onClick={() => setDetail(c)}
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary grid place-items-center flex-shrink-0">
                      <Stethoscope className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div>
                          <div className="font-semibold text-base flex items-center gap-2">
                            {pet?.name || "Paciente"} — {c.reason}
                            {c.appointmentId && (
                              <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">
                                Desde cita
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {c.date} · {vet?.nombre || "Veterinario"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex gap-2 text-xs text-muted-foreground">
                            {c.weight > 0 && (
                              <span>
                                Peso: <strong>{c.weight} kg</strong>
                              </span>
                            )}
                            {c.temperature > 0 && (
                              <span>
                                T°: <strong>{c.temperature}°C</strong>
                              </span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs rounded-lg gap-1 border-sky-300 text-sky-700 hover:bg-sky-50 dark:border-sky-800 dark:text-sky-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              const owner = pet ? clientes.find((cl) => cl.id === pet.clientId) : undefined;
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
                            <Mail className="h-3.5 w-3.5 text-sky-600" />
                            <span>Enviar Correo</span>
                          </Button>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3 mt-3 text-sm">
                        <div>
                          <span className="text-muted-foreground font-medium">Diagnóstico:</span>{" "}
                          {c.diagnosis || "—"}
                        </div>
                        <div>
                          <span className="text-muted-foreground font-medium">Tratamiento:</span>{" "}
                          {c.treatment || "—"}
                        </div>
                        <div>
                          <span className="text-muted-foreground font-medium">Medicamentos:</span>{" "}
                          {c.medications || "—"}
                        </div>
                        <div>
                          <span className="text-muted-foreground font-medium">Notas:</span>{" "}
                          {c.notes || "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
            {filteredConsultations.length === 0 && (
              <Card className="p-12 text-center text-muted-foreground border-dashed">
                No hay consultas registradas en el historial.
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog for Attending a Scheduled Appointment */}
      <Dialog
        open={attendingAppt !== null}
        onOpenChange={(open) => {
          if (!open) setAttendingAppt(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              Atender Consulta Médica
            </DialogTitle>
          </DialogHeader>
          {attendingAppt && (
            <ConsultationForm
              lockContext
              defaults={{
                petId: attendingAppt.petId,
                clientId: attendingAppt.clientId,
                vetId: attendingAppt.vetId,
                date: attendingAppt.date,
                reason: attendingAppt.reason,
              }}
              submitLabel="Guardar Consulta y Finalizar Cita"
              onCancel={() => setAttendingAppt(null)}
              onSubmit={(data) => {
                addConsultationFromAppointment(data, attendingAppt.id);
                const appt = attendingAppt;
                setAttendingAppt(null);
                toast.success("Consulta clínica registrada y cita finalizada");

                const pet = pets.find((p) => p.id === appt.petId);
                const client = clientes.find((cl) => cl.id === (appt.clientId || pet?.clientId));
                const vet = vets.find((v) => v.id === appt.vetId);

                // Prompt to bill the consultation
                setPayData({
                  clientName: client?.fullName || "Cliente general",
                  clientId: client?.id,
                  petName: pet?.name,
                  vetName: vet?.nombre,
                  reason: data.reason || appt.reason,
                  defaultAmount: 15000,
                });
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Payment / Billing Dialog after Consultation */}
      <PayConsultationDialog
        open={payData !== null}
        onOpenChange={(o) => {
          if (!o) setPayData(null);
        }}
        data={payData}
        onSuccess={() => setPayData(null)}
      />

      {/* Detail Dialog */}
      <ConsultationDetailDialog consultation={detail} onClose={() => setDetail(null)} />

      {/* Email Dialog */}
      <ConsultationEmailDialog
        open={emailData !== null}
        onOpenChange={(open) => {
          if (!open) setEmailData(null);
        }}
        data={emailData}
      />
    </div>
  );
}

