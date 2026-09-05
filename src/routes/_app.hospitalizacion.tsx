import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Activity,
  AlertTriangle,
  Bed,
  Clock,
  Hospital,
  LogOut,
  Pencil,
  Pill,
  Plus,
  Stethoscope,
  Thermometer,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  useHospitalRooms,
  useCareLogs,
  useHospitalMeds,
  useTreatmentPlans,
  addRoom,
  updateRoom,
  deleteRoom,
  assignRoom,
  releaseRoom,
  addCareLog,
  deleteCareLog,
  addHospitalMed,
  markMedStatus,
  deleteHospitalMed,
  addTreatmentPlan,
  deleteTreatmentPlan,
  isMedOverdue,
  daysBetween,
  roomStatusColor,
  ROOM_STATUSES,
  ROOM_TYPES,
  type HospitalRoom,
  type RoomStatus,
  type RoomType,
} from "@/lib/hospital-store";
import {
  useHospitalizations,
  addHospitalization,
  dischargeHospitalization,
  type Hospitalization,
} from "@/lib/store";
import { usePets } from "@/lib/pets-store";
import { useVeterinarios } from "@/lib/veterinarios-store";
import { Can, useCan } from "@/lib/rbac";

export const Route = createFileRoute("/_app/hospitalizacion")({ component: HospitalPage });

const usePetName = () => {
  const pets = usePets();
  return (id: string) => pets.find((p) => p.id === id)?.name ?? "—";
};
const roomLabel = (rooms: HospitalRoom[], hosp: Hospitalization) => {
  const r = rooms.find((x) => x.currentHospId === hosp.id);
  return r?.code ?? hosp.roomNumber ?? "—";
};

function HospitalPage() {
  const rooms = useHospitalRooms();
  const hosps = useHospitalizations();
  const meds = useHospitalMeds();
  const care = useCareLogs();
  const plans = useTreatmentPlans();

  const active = useMemo(
    () => hosps.filter((h) => h.status !== "Alta médica" && h.status !== "Fallecido"),
    [hosps]
  );

  const availableRooms = rooms.filter((r) => r.status === "Disponible").length;
  const overdueMeds = meds.filter((m) => isMedOverdue(m));
  const todayISO = new Date().toISOString().slice(0, 10);
  const dischargeToday = hosps.filter((h) => h.followupDate === todayISO || (h.status === "Recuperación"));
  const longStays = active.filter((h) => daysBetween(h.admissionDate, todayISO) >= 5);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = active.find((h) => h.id === selectedId) ?? null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Hospital className="h-6 w-6 text-primary" /> Hospital Veterinario
            </h1>
            <p className="text-sm text-muted-foreground">Gestión de pacientes hospitalizados, jaulas, medicación y evolución.</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi icon={<Stethoscope className="h-4 w-4" />} label="Hospitalizados" value={active.length} tone="text-primary" />
          <Kpi icon={<Bed className="h-4 w-4" />} label="Jaulas disponibles" value={availableRooms} tone="text-emerald-600" />
          <Kpi icon={<LogOut className="h-4 w-4" />} label="Altas / seguimiento hoy" value={dischargeToday.length} tone="text-sky-600" />
          <Kpi icon={<Pill className="h-4 w-4" />} label="Medicaciones pendientes" value={overdueMeds.length} tone={overdueMeds.length ? "text-rose-600" : "text-muted-foreground"} />
        </div>

        <Tabs defaultValue="patients" className="space-y-4">
          <TabsList>
            <TabsTrigger value="patients">Pacientes</TabsTrigger>
            <TabsTrigger value="rooms">Jaulas y Habitaciones</TabsTrigger>
            <TabsTrigger value="alerts">Alertas</TabsTrigger>
            <TabsTrigger value="timeline">Línea de tiempo</TabsTrigger>
          </TabsList>

          {/* Patients tab */}
          <TabsContent value="patients" className="space-y-4">
            <div className="grid md:grid-cols-[380px_1fr] gap-4">
              <PatientsList
                items={active}
                rooms={rooms}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
              {selected ? (
                <PatientDetail hosp={selected} rooms={rooms} meds={meds} care={care} plans={plans} />
              ) : (
                <Card className="p-10 text-center text-sm text-muted-foreground grid place-items-center min-h-[300px]">
                  Selecciona un paciente para ver su hoja de evolución, medicación y plan de tratamiento.
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Rooms tab */}
          <TabsContent value="rooms">
            <RoomsPanel rooms={rooms} active={active} />
          </TabsContent>

          {/* Alerts tab */}
          <TabsContent value="alerts">
            <AlertsPanel
              overdueMeds={overdueMeds}
              longStays={longStays}
              dischargeToday={dischargeToday}
              rooms={rooms}
            />
          </TabsContent>

          {/* Timeline */}
          <TabsContent value="timeline">
            <TimelinePanel active={active} meds={meds} care={care} />
          </TabsContent>
        </Tabs>

        <Card className="p-4 border-dashed">
          <div className="flex items-start gap-3">
            <Activity className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Integraciones futuras</p>
              <p>Monitores médicos • Dispositivos IoT • Notificaciones al propietario • Portal del propietario • IA para seguimiento clínico.</p>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

function Kpi({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number | string; tone: string }) {
  return (
    <Card className="p-4">
      <div className={`flex items-center gap-2 text-xs ${tone}`}>{icon}<span>{label}</span></div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </Card>
  );
}

// ==================== Patients ====================
function PatientsList({
  items, rooms, selectedId, onSelect,
}: {
  items: Hospitalization[];
  rooms: HospitalRoom[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const can = useCan();
  const petName = usePetName();
  return (
    <Card className="overflow-hidden">
      <div className="p-3 border-b flex items-center justify-between">
        <span className="text-sm font-medium">Activos ({items.length})</span>
        <Can module="hospitalizacion" action="create">
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Ingreso
          </Button>
        </Can>
      </div>
      <div className="divide-y max-h-[520px] overflow-y-auto">
        {items.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">Sin pacientes hospitalizados.</div>
        )}
        {items.map((h) => {
          const room = rooms.find((r) => r.currentHospId === h.id);
          const days = daysBetween(h.admissionDate, new Date().toISOString().slice(0, 10));
          return (
            <button
              key={h.id}
              onClick={() => onSelect(h.id)}
              className={`w-full text-left p-3 hover:bg-muted/40 transition ${selectedId === h.id ? "bg-muted/60" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium truncate">{petName(h.petId)}</div>
                <Badge variant="outline" className="text-xs">{h.status}</Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5 flex justify-between gap-2">
                <span>{h.reason}</span>
                <span>{days}d · {room?.code ?? h.roomNumber ?? "—"}</span>
              </div>
            </button>
          );
        })}
      </div>
      <NewAdmissionDialog open={open} onOpenChange={setOpen} rooms={rooms} />
      {!can("hospitalizacion", "view") && null}
    </Card>
  );
}

function NewAdmissionDialog({
  open, onOpenChange, rooms,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  rooms: HospitalRoom[];
}) {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toTimeString().slice(0, 5);
  const pets = usePets();
  const vets = useVeterinarios();
  const [petId, setPetId] = useState(pets[0]?.id ?? "");
  const [roomId, setRoomId] = useState<string>("");
  const available = rooms.filter((r) => r.status === "Disponible");

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = Object.fromEntries(fd.entries()) as Record<string, string>;
    const room = rooms.find((r) => r.id === roomId);
    const hosp = addHospitalization({
      petId,
      admissionDate: v.admissionDate,
      admissionTime: v.admissionTime,
      veterinarian: v.veterinarian ?? "",
      reason: v.reason ?? "",
      initialDiagnosis: v.initialDiagnosis ?? "",
      treatmentPlan: "",
      patientStatus: v.patientStatus ?? "",
      roomNumber: room?.code ?? "",
      observations: "",
      dischargeDate: "",
      dischargeSummary: "",
      ownerInstructions: "",
      dischargeMedications: "",
      followupDate: "",
      status: "Hospitalizado",
    });
    if (room) assignRoom(room.id, hosp.id, petId);
    toast.success("Paciente ingresado");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Nuevo ingreso hospitalario</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          <div className="space-y-2 col-span-2">
            <Label>Paciente</Label>
            <Select value={petId} onValueChange={setPetId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {pets.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} · {p.species}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="admissionDate">Fecha</Label>
            <Input id="admissionDate" name="admissionDate" type="date" required defaultValue={today} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admissionTime">Hora</Label>
            <Input id="admissionTime" name="admissionTime" type="time" required defaultValue={now} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="veterinarian">Veterinario</Label>
            <Input id="veterinarian" name="veterinarian" list="vets-adm" defaultValue={vets[0]?.nombre ?? ""} />
            <datalist id="vets-adm">{vets.map((v) => <option key={v.id} value={v.nombre} />)}</datalist>
          </div>
          <div className="space-y-2">
            <Label>Asignar jaula/habitación</Label>
            <Select value={roomId} onValueChange={setRoomId}>
              <SelectTrigger><SelectValue placeholder="Ninguna" /></SelectTrigger>
              <SelectContent>
                {available.length === 0 && <SelectItem value="none" disabled>Sin jaulas libres</SelectItem>}
                {available.map((r) => <SelectItem key={r.id} value={r.id}>{r.code} · {r.type}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="reason">Motivo</Label>
            <Input id="reason" name="reason" required />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="initialDiagnosis">Diagnóstico inicial</Label>
            <Textarea id="initialDiagnosis" name="initialDiagnosis" rows={2} />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="patientStatus">Estado del paciente</Label>
            <Input id="patientStatus" name="patientStatus" placeholder="Estable / Crítico..." />
          </div>
          <DialogFooter className="col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Ingresar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PatientDetail({
  hosp, rooms, meds, care, plans,
}: {
  hosp: Hospitalization;
  rooms: HospitalRoom[];
  meds: ReturnType<typeof useHospitalMeds>;
  care: ReturnType<typeof useCareLogs>;
  plans: ReturnType<typeof useTreatmentPlans>;
}) {
  const room = rooms.find((r) => r.currentHospId === hosp.id);
  const patientMeds = meds.filter((m) => m.hospId === hosp.id).sort((a, b) => `${b.scheduledDate}${b.scheduledTime}`.localeCompare(`${a.scheduledDate}${a.scheduledTime}`));
  const patientCare = care.filter((c) => c.hospId === hosp.id).sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
  const patientPlans = plans.filter((p) => p.hospId === hosp.id);
  const [dischargeOpen, setDischargeOpen] = useState(false);
  const petName = usePetName();

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">{petName(hosp.petId)}</div>
            <div className="text-xs text-muted-foreground">
              Ingreso {hosp.admissionDate} {hosp.admissionTime} · Vet: {hosp.veterinarian || "—"} · Jaula: {room?.code ?? hosp.roomNumber ?? "—"}
            </div>
            {hosp.reason && <div className="text-sm mt-2">{hosp.reason}</div>}
          </div>
          <div className="flex items-center gap-2">
            <Badge>{hosp.status}</Badge>
            <Can module="hospitalizacion" action="edit">
              <Button size="sm" variant="outline" onClick={() => setDischargeOpen(true)}>
                <LogOut className="h-4 w-4 mr-1" /> Dar de alta
              </Button>
            </Can>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="care">
        <TabsList>
          <TabsTrigger value="care">Hoja de evolución</TabsTrigger>
          <TabsTrigger value="meds">Medicación</TabsTrigger>
          <TabsTrigger value="plan">Plan de tratamiento</TabsTrigger>
        </TabsList>

        <TabsContent value="care" className="space-y-3">
          <CareLogForm hospId={hosp.id} />
          {patientCare.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin controles registrados.</p>
          ) : (
            <div className="space-y-2">
              {patientCare.map((c) => (
                <Card key={c.id} className="p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="font-medium flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {c.date} {c.time} · {c.veterinarian || "—"}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                        {c.temperature && <span><Thermometer className="h-3 w-3 inline mr-1" />T°: <b className="text-foreground">{c.temperature}</b></span>}
                        {c.weight && <span>Peso: <b className="text-foreground">{c.weight}</b></span>}
                        {c.heartRate && <span>FC: <b className="text-foreground">{c.heartRate}</b></span>}
                        {c.respiratoryRate && <span>FR: <b className="text-foreground">{c.respiratoryRate}</b></span>}
                      </div>
                      {c.generalState && <div className="text-xs"><b>Estado:</b> {c.generalState}</div>}
                      {c.observations && <div className="text-xs text-muted-foreground">{c.observations}</div>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { deleteCareLog(c.id); toast.success("Control eliminado"); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="meds" className="space-y-3">
          <MedForm hospId={hosp.id} />
          {patientMeds.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin medicaciones registradas.</p>
          ) : (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Programada</TableHead>
                    <TableHead>Medicamento</TableHead>
                    <TableHead>Dosis</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patientMeds.map((m) => {
                    const overdue = isMedOverdue(m);
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="whitespace-nowrap">
                          <div>{m.scheduledDate}</div>
                          <div className={`text-xs ${overdue ? "text-rose-600 font-medium" : "text-muted-foreground"}`}>{m.scheduledTime} {overdue ? "(atrasada)" : ""}</div>
                        </TableCell>
                        <TableCell className="font-medium">{m.medicine}</TableCell>
                        <TableCell className="text-xs">{m.dose} {m.route && <span className="text-muted-foreground">· {m.route}</span>}</TableCell>
                        <TableCell className="text-xs">{m.responsible || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={m.status === "Administrado" ? "default" : m.status === "Omitido" ? "destructive" : "secondary"}>
                            {m.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {m.status === "Pendiente" && (
                            <>
                              <Button variant="ghost" size="sm" title="Administrar" onClick={() => { markMedStatus(m.id, "Administrado"); toast.success("Medicación administrada"); }}>
                                <Check className="h-4 w-4 text-emerald-600" />
                              </Button>
                              <Button variant="ghost" size="sm" title="Omitir" onClick={() => { markMedStatus(m.id, "Omitido"); toast.info("Medicación omitida"); }}>
                                <X className="h-4 w-4 text-amber-600" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => { deleteHospitalMed(m.id); toast.success("Eliminada"); }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="plan" className="space-y-3">
          <PlanForm hospId={hosp.id} />
          {patientPlans.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin plan de tratamiento definido.</p>
          ) : (
            <div className="space-y-2">
              {patientPlans.map((p) => (
                <Card key={p.id} className="p-3 text-sm flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-medium">{p.medicine}</div>
                    <div className="text-xs text-muted-foreground">Frecuencia: {p.frequency} · Duración: {p.duration}</div>
                    {p.instructions && <div className="text-xs">{p.instructions}</div>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { deleteTreatmentPlan(p.id); toast.success("Plan eliminado"); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <DischargeInline
        open={dischargeOpen}
        onClose={() => setDischargeOpen(false)}
        hosp={hosp}
        room={room}
      />
    </div>
  );
}

function CareLogForm({ hospId }: { hospId: string }) {
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toTimeString().slice(0, 5);
  const vets = useVeterinarios();
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = Object.fromEntries(fd.entries()) as Record<string, string>;
    addCareLog({
      hospId,
      date: v.date, time: v.time,
      veterinarian: v.veterinarian ?? "",
      temperature: v.temperature ?? "",
      weight: v.weight ?? "",
      heartRate: v.heartRate ?? "",
      respiratoryRate: v.respiratoryRate ?? "",
      generalState: v.generalState ?? "",
      observations: v.observations ?? "",
    });
    toast.success("Control registrado");
    setOpen(false);
  };
  return (
    <>
      <Can module="hospitalizacion" action="create">
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Registrar control</Button>
      </Can>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nuevo control</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label htmlFor="date">Fecha</Label><Input id="date" name="date" type="date" required defaultValue={today} /></div>
            <div className="space-y-2"><Label htmlFor="time">Hora</Label><Input id="time" name="time" type="time" required defaultValue={now} /></div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="veterinarian">Veterinario</Label>
              <Input id="veterinarian" name="veterinarian" list="vets-cl" defaultValue={vets[0]?.nombre ?? ""} />
              <datalist id="vets-cl">{vets.map((v) => <option key={v.id} value={v.nombre} />)}</datalist>
            </div>
            <div className="space-y-2"><Label htmlFor="temperature">Temperatura</Label><Input id="temperature" name="temperature" placeholder="38.5 °C" /></div>
            <div className="space-y-2"><Label htmlFor="weight">Peso</Label><Input id="weight" name="weight" placeholder="12 kg" /></div>
            <div className="space-y-2"><Label htmlFor="heartRate">Frec. cardíaca</Label><Input id="heartRate" name="heartRate" placeholder="90 bpm" /></div>
            <div className="space-y-2"><Label htmlFor="respiratoryRate">Frec. respiratoria</Label><Input id="respiratoryRate" name="respiratoryRate" placeholder="24 rpm" /></div>
            <div className="space-y-2 col-span-2"><Label htmlFor="generalState">Estado general</Label><Input id="generalState" name="generalState" placeholder="Estable / Decaído..." /></div>
            <div className="space-y-2 col-span-2"><Label htmlFor="observations">Observaciones</Label><Textarea id="observations" name="observations" rows={2} /></div>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MedForm({ hospId }: { hospId: string }) {
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toTimeString().slice(0, 5);
  const vets = useVeterinarios();
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = Object.fromEntries(fd.entries()) as Record<string, string>;
    addHospitalMed({
      hospId,
      medicine: v.medicine ?? "",
      dose: v.dose ?? "",
      route: v.route ?? "",
      scheduledDate: v.scheduledDate,
      scheduledTime: v.scheduledTime,
      responsible: v.responsible ?? "",
      status: "Pendiente",
      administeredAt: "",
      notes: v.notes ?? "",
    });
    toast.success("Medicación programada");
    setOpen(false);
  };
  return (
    <>
      <Can module="hospitalizacion" action="create">
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Programar medicación</Button>
      </Can>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nueva medicación</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="grid grid-cols-2 gap-3">
            <div className="space-y-2 col-span-2"><Label htmlFor="medicine">Medicamento</Label><Input id="medicine" name="medicine" required /></div>
            <div className="space-y-2"><Label htmlFor="dose">Dosis</Label><Input id="dose" name="dose" placeholder="5 mg/kg" /></div>
            <div className="space-y-2"><Label htmlFor="route">Vía</Label><Input id="route" name="route" placeholder="IV / SC / VO" /></div>
            <div className="space-y-2"><Label htmlFor="scheduledDate">Fecha</Label><Input id="scheduledDate" name="scheduledDate" type="date" required defaultValue={today} /></div>
            <div className="space-y-2"><Label htmlFor="scheduledTime">Hora</Label><Input id="scheduledTime" name="scheduledTime" type="time" required defaultValue={now} /></div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="responsible">Responsable</Label>
              <Input id="responsible" name="responsible" list="vets-med" defaultValue={vets[0]?.nombre ?? ""} />
              <datalist id="vets-med">{vets.map((v) => <option key={v.id} value={v.nombre} />)}</datalist>
            </div>
            <div className="space-y-2 col-span-2"><Label htmlFor="notes">Notas</Label><Textarea id="notes" name="notes" rows={2} /></div>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PlanForm({ hospId }: { hospId: string }) {
  const [open, setOpen] = useState(false);
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = Object.fromEntries(fd.entries()) as Record<string, string>;
    addTreatmentPlan({
      hospId,
      medicine: v.medicine ?? "",
      frequency: v.frequency ?? "",
      duration: v.duration ?? "",
      instructions: v.instructions ?? "",
    });
    toast.success("Plan añadido");
    setOpen(false);
  };
  return (
    <>
      <Can module="hospitalizacion" action="create">
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Añadir al plan</Button>
      </Can>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nuevo tratamiento</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="grid grid-cols-2 gap-3">
            <div className="space-y-2 col-span-2"><Label htmlFor="medicine">Medicamento</Label><Input id="medicine" name="medicine" required /></div>
            <div className="space-y-2"><Label htmlFor="frequency">Frecuencia</Label><Input id="frequency" name="frequency" placeholder="Cada 8 horas" required /></div>
            <div className="space-y-2"><Label htmlFor="duration">Duración</Label><Input id="duration" name="duration" placeholder="7 días" required /></div>
            <div className="space-y-2 col-span-2"><Label htmlFor="instructions">Indicaciones</Label><Textarea id="instructions" name="instructions" rows={2} /></div>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DischargeInline({
  open, onClose, hosp, room,
}: { open: boolean; onClose: () => void; hosp: Hospitalization; room?: HospitalRoom }) {
  const today = new Date().toISOString().slice(0, 10);
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = Object.fromEntries(fd.entries()) as Record<string, string>;
    dischargeHospitalization(hosp.id, {
      dischargeDate: v.dischargeDate,
      dischargeSummary: v.dischargeSummary ?? "",
      ownerInstructions: v.ownerInstructions ?? "",
      dischargeMedications: v.dischargeMedications ?? "",
      followupDate: v.followupDate ?? "",
    });
    if (room) releaseRoom(room.id);
    toast.success("Paciente dado de alta");
    onClose();
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Dar de alta</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          <div className="space-y-2"><Label htmlFor="dischargeDate">Fecha alta</Label><Input id="dischargeDate" name="dischargeDate" type="date" required defaultValue={today} /></div>
          <div className="space-y-2"><Label htmlFor="followupDate">Próximo control</Label><Input id="followupDate" name="followupDate" type="date" /></div>
          <div className="space-y-2 col-span-2"><Label htmlFor="dischargeSummary">Resumen clínico</Label><Textarea id="dischargeSummary" name="dischargeSummary" rows={2} /></div>
          <div className="space-y-2 col-span-2"><Label htmlFor="ownerInstructions">Indicaciones al propietario</Label><Textarea id="ownerInstructions" name="ownerInstructions" rows={2} /></div>
          <div className="space-y-2 col-span-2"><Label htmlFor="dischargeMedications">Medicamentos enviados</Label><Textarea id="dischargeMedications" name="dischargeMedications" rows={2} /></div>
          <DialogFooter className="col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Confirmar alta</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Rooms ====================
function RoomsPanel({ rooms, active }: { rooms: HospitalRoom[]; active: Hospitalization[] }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HospitalRoom | null>(null);
  const petName = usePetName();
  const grouped = ROOM_STATUSES.map((s) => ({ status: s, items: rooms.filter((r) => r.status === s) }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Total: {rooms.length} espacios</div>
        <Can module="hospitalizacion" action="create">
          <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Nueva jaula/habitación
          </Button>
        </Can>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {ROOM_STATUSES.map((s) => (
          <Card key={s} className={`p-3 border ${roomStatusColor(s)}`}>
            <div className="text-xs">{s}</div>
            <div className="text-2xl font-bold">{rooms.filter((r) => r.status === s).length}</div>
          </Card>
        ))}
      </div>

      {grouped.map(({ status, items }) => items.length > 0 && (
        <div key={status} className="space-y-2">
          <h3 className="text-sm font-semibold">{status}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {items.map((r) => {
              const hosp = active.find((h) => h.id === r.currentHospId);
              return (
                <Card key={r.id} className={`p-3 border ${roomStatusColor(r.status)}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{r.code}</div>
                      <div className="text-xs opacity-80">{r.type} · {r.size || "—"}</div>
                    </div>
                    <Bed className="h-4 w-4 opacity-60" />
                  </div>
                  <div className="text-xs mt-2 opacity-90">
                    {hosp ? <>Ocupada por <b>{petName(hosp.petId)}</b></> : r.location}
                  </div>
                  {r.notes && <div className="text-xs mt-1 opacity-70 line-clamp-2">{r.notes}</div>}
                  <div className="flex items-center gap-1 mt-2">
                    <Select value={r.status} onValueChange={(v) => updateRoom(r.id, { status: v as RoomStatus })}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROOM_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(r); setFormOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => { deleteRoom(r.id); toast.success("Eliminada"); }}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      <RoomForm open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }} editing={editing} />
    </div>
  );
}

function RoomForm({
  open, onOpenChange, editing,
}: { open: boolean; onOpenChange: (o: boolean) => void; editing: HospitalRoom | null }) {
  const [type, setType] = useState<RoomType>(editing?.type ?? "Jaula");
  const [status, setStatus] = useState<RoomStatus>(editing?.status ?? "Disponible");

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = Object.fromEntries(fd.entries()) as Record<string, string>;
    const data = {
      code: v.code, type, status,
      capacity: Number(v.capacity || "1"),
      location: v.location ?? "",
      size: v.size ?? "",
      notes: v.notes ?? "",
    };
    if (editing) { updateRoom(editing.id, data); toast.success("Actualizada"); }
    else { addRoom(data); toast.success("Creada"); }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{editing ? "Editar" : "Nueva"} jaula/habitación</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          <div className="space-y-2"><Label htmlFor="code">Código</Label><Input id="code" name="code" required defaultValue={editing?.code} /></div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as RoomType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ROOM_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as RoomStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ROOM_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label htmlFor="capacity">Capacidad</Label><Input id="capacity" name="capacity" type="number" min={1} defaultValue={editing?.capacity ?? 1} /></div>
          <div className="space-y-2"><Label htmlFor="location">Ubicación</Label><Input id="location" name="location" defaultValue={editing?.location} placeholder="Ala A, UCI..." /></div>
          <div className="space-y-2"><Label htmlFor="size">Tamaño</Label><Input id="size" name="size" defaultValue={editing?.size} placeholder="Pequeña / Mediana / Grande" /></div>
          <div className="space-y-2 col-span-2"><Label htmlFor="notes">Notas</Label><Textarea id="notes" name="notes" rows={2} defaultValue={editing?.notes} /></div>
          <DialogFooter className="col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Alerts ====================
function AlertsPanel({
  overdueMeds, longStays, dischargeToday, rooms,
}: {
  overdueMeds: ReturnType<typeof useHospitalMeds>;
  longStays: Hospitalization[];
  dischargeToday: Hospitalization[];
  rooms: HospitalRoom[];
}) {
  const petName = usePetName();
  return (
    <div className="grid md:grid-cols-3 gap-3">
      <AlertList
        title="Medicación pendiente"
        icon={<Pill className="h-4 w-4 text-rose-600" />}
        empty="Sin medicaciones atrasadas"
        rows={overdueMeds.map((m) => `${m.scheduledDate} ${m.scheduledTime} · ${m.medicine} (${m.dose})`)}
        tone="border-rose-200"
      />
      <AlertList
        title="Hospitalización prolongada"
        icon={<AlertTriangle className="h-4 w-4 text-amber-600" />}
        empty="Sin estancias mayores a 5 días"
        rows={longStays.map((h) => `${petName(h.petId)} · ${daysBetween(h.admissionDate, new Date().toISOString().slice(0,10))} días · ${roomLabel(rooms, h)}`)}
        tone="border-amber-200"
      />
      <AlertList
        title="Alta / seguimiento hoy"
        icon={<LogOut className="h-4 w-4 text-sky-600" />}
        empty="Sin altas ni seguimientos programados"
        rows={dischargeToday.map((h) => `${petName(h.petId)} · ${h.status}`)}
        tone="border-sky-200"
      />
    </div>
  );
}

function AlertList({ title, icon, rows, empty, tone }: { title: string; icon: React.ReactNode; rows: string[]; empty: string; tone: string }) {
  return (
    <Card className={`p-4 border ${tone}`}>
      <div className="flex items-center gap-2 mb-2 font-medium text-sm">{icon}{title}</div>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">{empty}</p>
      ) : (
        <ul className="text-sm space-y-1">
          {rows.map((r, i) => <li key={i} className="text-xs border-b last:border-0 pb-1">{r}</li>)}
        </ul>
      )}
    </Card>
  );
}

// ==================== Timeline ====================
type TLEvent = { hospId: string; when: string; kind: string; label: string };
function TimelinePanel({
  active, meds, care,
}: {
  active: Hospitalization[];
  meds: ReturnType<typeof useHospitalMeds>;
  care: ReturnType<typeof useCareLogs>;
}) {
  const petName = usePetName();
  const events: TLEvent[] = useMemo(() => {
    const list: TLEvent[] = [];
    for (const h of active) {
      list.push({ hospId: h.id, when: `${h.admissionDate}T${h.admissionTime || "00:00"}`, kind: "Ingreso", label: `Ingreso de ${petName(h.petId)} · ${h.reason}` });
      if (h.dischargeDate) list.push({ hospId: h.id, when: `${h.dischargeDate}T23:59`, kind: "Alta", label: `Alta de ${petName(h.petId)}` });
    }
    for (const c of care) {
      const h = active.find((x) => x.id === c.hospId);
      if (!h) continue;
      list.push({ hospId: c.hospId, when: `${c.date}T${c.time}`, kind: "Evolución", label: `Control ${petName(h.petId)} · T° ${c.temperature || "—"}` });
    }
    for (const m of meds) {
      const h = active.find((x) => x.id === m.hospId);
      if (!h) continue;
      list.push({ hospId: m.hospId, when: `${m.scheduledDate}T${m.scheduledTime}`, kind: "Medicación", label: `${m.medicine} ${m.dose} · ${petName(h.petId)} (${m.status})` });
    }
    return list.sort((a, b) => b.when.localeCompare(a.when)).slice(0, 60);
  }, [active, meds, care, petName]);

  return (
    <Card className="p-4">
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Sin eventos recientes.</p>
      ) : (
        <ol className="relative border-l border-border pl-4 space-y-3">
          {events.map((e, i) => (
            <li key={i} className="text-sm">
              <div className="absolute -left-1.5 mt-1.5 h-2 w-2 rounded-full bg-primary" />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {e.when.replace("T", " ")}
                <Badge variant="outline" className="text-[10px]">{e.kind}</Badge>
              </div>
              <div>{e.label}</div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
