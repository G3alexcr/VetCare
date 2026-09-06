import { useMemo, useState, useEffect } from "react";
import { Plus, Eye, Pencil, Trash2, Hospital, LogOut, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useVeterinarios } from "@/lib/veterinarios-store";
import { usePets } from "@/lib/pets-store";
import {
  useHospitalizations,
  useHospitalizationProgress,
  addHospitalization,
  updateHospitalization,
  deleteHospitalization,
  dischargeHospitalization,
  addHospitalizationProgress,
  deleteHospitalizationProgress,
  useAppointments,
  addAppointment,
  STANDARD_HOURS,
  type Hospitalization,
  type HospitalizationStatus,
} from "@/lib/store";
import { toLocalDateStr } from "@/lib/utils";
import { toast } from "sonner";

const STATUSES: HospitalizationStatus[] = [
  "Hospitalizado",
  "Observación",
  "Recuperación",
  "Alta médica",
  "Fallecido",
];

function statusVariant(s: HospitalizationStatus): "default" | "secondary" | "destructive" | "outline" {
  if (s === "Alta médica") return "default";
  if (s === "Hospitalizado" || s === "Observación") return "secondary";
  if (s === "Fallecido") return "destructive";
  return "outline";
}

export function HospitalizationTab({ petId }: { petId: string }) {
  const all = useHospitalizations();
  const items = useMemo(
    () =>
      all
        .filter((h) => h.petId === petId)
        .sort((a, b) => `${b.admissionDate}${b.admissionTime}`.localeCompare(`${a.admissionDate}${a.admissionTime}`)),
    [all, petId]
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Hospitalization | null>(null);
  const [viewing, setViewing] = useState<Hospitalization | null>(null);
  const [discharging, setDischarging] = useState<Hospitalization | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">Total: {items.length}</span>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nueva hospitalización
        </Button>
      </div>

      {items.length === 0 ? (
        <Card className="p-10 text-center">
          <Hospital className="h-8 w-8 mx-auto text-muted-foreground mb-2 opacity-40" />
          <p className="text-sm text-muted-foreground">No hay hospitalizaciones registradas.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha ingreso</TableHead>
                <TableHead>Fecha alta</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Veterinario</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="whitespace-nowrap">{h.admissionDate}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{h.dischargeDate || "—"}</TableCell>
                  <TableCell className="font-medium">{h.reason}</TableCell>
                  <TableCell>{h.veterinarian || "—"}</TableCell>
                  <TableCell><Badge variant={statusVariant(h.status)}>{h.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setViewing(h)} title="Ver">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(h); setFormOpen(true); }} title="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {h.status !== "Alta médica" && h.status !== "Fallecido" && (
                      <Button variant="ghost" size="sm" title="Dar de alta" onClick={() => setDischarging(h)}>
                        <LogOut className="h-4 w-4 text-primary" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Eliminar"
                      onClick={() => { deleteHospitalization(h.id); toast.success("Hospitalización eliminada"); }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <HospForm
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}
        editing={editing}
        petId={petId}
      />
      <HospDetail item={viewing} onClose={() => setViewing(null)} />
      <DischargeDialog item={discharging} onClose={() => setDischarging(null)} />
    </div>
  );
}

function HospForm({
  open, onOpenChange, editing, petId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Hospitalization | null;
  petId: string;
}) {
  const today = new Date().toISOString().split("T")[0];
  const now = new Date().toTimeString().slice(0, 5);
  const [status, setStatus] = useState<HospitalizationStatus>(editing?.status ?? "Hospitalizado");
  const vets = useVeterinarios();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = Object.fromEntries(fd.entries()) as Record<string, string>;
    const data = {
      petId,
      admissionDate: v.admissionDate,
      admissionTime: v.admissionTime,
      veterinarian: v.veterinarian ?? "",
      reason: v.reason ?? "",
      initialDiagnosis: v.initialDiagnosis ?? "",
      treatmentPlan: v.treatmentPlan ?? "",
      patientStatus: v.patientStatus ?? "",
      roomNumber: v.roomNumber ?? "",
      observations: v.observations ?? "",
      dischargeDate: editing?.dischargeDate ?? "",
      dischargeSummary: editing?.dischargeSummary ?? "",
      ownerInstructions: editing?.ownerInstructions ?? "",
      dischargeMedications: editing?.dischargeMedications ?? "",
      followupDate: editing?.followupDate ?? "",
      status,
    };
    if (editing) {
      updateHospitalization(editing.id, data);
      toast.success("Hospitalización actualizada");
    } else {
      addHospitalization(data);
      toast.success("Hospitalización registrada");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar hospitalización" : "Nueva hospitalización"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="admissionDate">Fecha ingreso</Label>
            <Input id="admissionDate" name="admissionDate" type="date" required defaultValue={editing?.admissionDate ?? today} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admissionTime">Hora ingreso</Label>
            <Input id="admissionTime" name="admissionTime" type="time" required defaultValue={editing?.admissionTime ?? now} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="veterinarian">Veterinario responsable</Label>
            <Input id="veterinarian" name="veterinarian" list="vet-h-list" defaultValue={editing?.veterinarian ?? vets[0]?.nombre ?? ""} />
            <datalist id="vet-h-list">
              {vets.map((v) => <option key={v.id} value={v.nombre} />)}
            </datalist>
          </div>
          <div className="space-y-2">
            <Label htmlFor="roomNumber">Jaula / habitación</Label>
            <Input id="roomNumber" name="roomNumber" defaultValue={editing?.roomNumber} />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="reason">Motivo de hospitalización</Label>
            <Input id="reason" name="reason" required defaultValue={editing?.reason} />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="initialDiagnosis">Diagnóstico inicial</Label>
            <Textarea id="initialDiagnosis" name="initialDiagnosis" rows={2} defaultValue={editing?.initialDiagnosis} />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="treatmentPlan">Tratamiento indicado</Label>
            <Textarea id="treatmentPlan" name="treatmentPlan" rows={2} defaultValue={editing?.treatmentPlan} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="patientStatus">Estado del paciente</Label>
            <Input id="patientStatus" name="patientStatus" placeholder="Estable / Crítico..." defaultValue={editing?.patientStatus} />
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as HospitalizationStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="observations">Observaciones</Label>
            <Textarea id="observations" name="observations" rows={2} defaultValue={editing?.observations} />
          </div>
          <DialogFooter className="col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function HospDetail({ item, onClose }: { item: Hospitalization | null; onClose: () => void }) {
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {item && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 flex-wrap">
                <Hospital className="h-4 w-4" /> {item.reason}
                <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-1 text-sm">
              <Row label="Ingreso" value={`${item.admissionDate} ${item.admissionTime}`} />
              <Row label="Veterinario" value={item.veterinarian || "—"} />
              <Row label="Jaula / habitación" value={item.roomNumber || "—"} />
              <Row label="Estado del paciente" value={item.patientStatus || "—"} />
              <Block label="Diagnóstico inicial" value={item.initialDiagnosis} />
              <Block label="Tratamiento indicado" value={item.treatmentPlan} />
              <Block label="Observaciones" value={item.observations} />
              {item.dischargeDate && (
                <>
                  <Row label="Fecha de alta" value={item.dischargeDate} />
                  <Row
                    label="Próximo control"
                    value={
                      item.followupDate
                        ? item.followupTime
                          ? `${item.followupDate} a las ${item.followupTime} hrs`
                          : item.followupDate
                        : "—"
                    }
                  />
                  <Block label="Resumen clínico" value={item.dischargeSummary} />
                  <Block label="Indicaciones al propietario" value={item.ownerInstructions} />
                  <Block label="Medicamentos enviados" value={item.dischargeMedications} />
                </>
              )}
            </div>
            <ProgressSection hospitalizationId={item.id} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProgressSection({ hospitalizationId }: { hospitalizationId: string }) {
  const all = useHospitalizationProgress();
  const items = useMemo(
    () => all.filter((p) => p.hospitalizationId === hospitalizationId).sort((a, b) => `${b.progressDate}${b.progressTime}`.localeCompare(`${a.progressDate}${a.progressTime}`)),
    [all, hospitalizationId]
  );
  const today = new Date().toISOString().split("T")[0];
  const now = new Date().toTimeString().slice(0, 5);
  const [open, setOpen] = useState(false);
  const vets = useVeterinarios();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = Object.fromEntries(fd.entries()) as Record<string, string>;
    addHospitalizationProgress({
      hospitalizationId,
      progressDate: v.progressDate,
      progressTime: v.progressTime,
      veterinarian: v.veterinarian ?? "",
      temperature: v.temperature ?? "",
      weight: v.weight ?? "",
      medicationsAdministered: v.medicationsAdministered ?? "",
      observations: v.observations ?? "",
    });
    toast.success("Evolución registrada");
    setOpen(false);
  };

  return (
    <div className="mt-4 border-t pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Evoluciones</h4>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Registrar evolución
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sin evoluciones registradas.</p>
      ) : (
        <div className="space-y-2">
          {items.map((p) => (
            <Card key={p.id} className="p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="font-medium">{p.progressDate} {p.progressTime} · {p.veterinarian || "—"}</div>
                  {(p.temperature || p.weight) && (
                    <div className="text-xs text-muted-foreground">
                      {p.temperature && <>T°: <span className="text-foreground font-medium">{p.temperature}</span> </>}
                      {p.weight && <>· Peso: <span className="text-foreground font-medium">{p.weight}</span></>}
                    </div>
                  )}
                  {p.medicationsAdministered && <div className="text-muted-foreground"><span className="font-medium text-foreground">Medicamentos:</span> {p.medicationsAdministered}</div>}
                  {p.observations && <div className="text-muted-foreground"><span className="font-medium text-foreground">Observaciones:</span> {p.observations}</div>}
                </div>
                <Button variant="ghost" size="sm" onClick={() => { deleteHospitalizationProgress(p.id); toast.success("Evolución eliminada"); }}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar evolución</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="progressDate">Fecha</Label>
              <Input id="progressDate" name="progressDate" type="date" required defaultValue={today} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="progressTime">Hora</Label>
              <Input id="progressTime" name="progressTime" type="time" required defaultValue={now} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="veterinarian">Veterinario</Label>
              <Input id="veterinarian" name="veterinarian" list="vet-hp-list" defaultValue={vets[0]?.nombre ?? ""} />
              <datalist id="vet-hp-list">
                {vets.map((v) => <option key={v.id} value={v.nombre} />)}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperatura</Label>
              <Input id="temperature" name="temperature" placeholder="38.5 °C" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Peso</Label>
              <Input id="weight" name="weight" placeholder="12 kg" />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="medicationsAdministered">Medicamentos administrados</Label>
              <Textarea id="medicationsAdministered" name="medicationsAdministered" rows={2} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="observations">Observaciones</Label>
              <Textarea id="observations" name="observations" rows={2} />
            </div>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DischargeDialog({ item, onClose }: { item: Hospitalization | null; onClose: () => void }) {
  const appointments = useAppointments();
  const pets = usePets();
  const vets = useVeterinarios();

  const today = toLocalDateStr(new Date());
  const [dischargeDate, setDischargeDate] = useState(today);
  const [followupDate, setFollowupDate] = useState("");
  const [followupTime, setFollowupTime] = useState("");
  const [dischargeSummary, setDischargeSummary] = useState("");
  const [ownerInstructions, setOwnerInstructions] = useState("");
  const [dischargeMedications, setDischargeMedications] = useState("");

  useEffect(() => {
    if (item) {
      setDischargeDate(toLocalDateStr(new Date()));
      setFollowupDate("");
      setFollowupTime("");
      setDischargeSummary("");
      setOwnerInstructions("");
      setDischargeMedications("");
    }
  }, [item]);

  const bookedHours = useMemo(() => {
    if (!followupDate) return new Set<string>();
    return new Set(
      appointments
        .filter((a) => a.date === followupDate && a.status !== "Cancelada")
        .map((a) => a.time)
    );
  }, [appointments, followupDate]);

  const availableHours = useMemo(() => {
    if (!followupDate) return [];
    const now = new Date();
    const todayStr = toLocalDateStr(now);
    const currentHourStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return STANDARD_HOURS.filter((h) => {
      if (bookedHours.has(h)) return false;
      if (followupDate === todayStr && h <= currentHourStr) return false;
      return true;
    });
  }, [followupDate, bookedHours]);

  useEffect(() => {
    if (followupDate) {
      if (availableHours.length > 0) {
        if (!followupTime || !availableHours.includes(followupTime)) {
          setFollowupTime(availableHours[0]);
        }
      } else {
        setFollowupTime("");
      }
    } else {
      setFollowupTime("");
    }
  }, [followupDate, availableHours, followupTime]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!item) return;

    if (followupDate && !followupTime) {
      toast.error("Por favor selecciona una hora disponible para el control o retira la fecha.");
      return;
    }

    const pet = pets.find((p) => p.id === item.petId);
    const assignedVet =
      vets.find((v) => v.nombre === item.veterinarian || v.id === item.veterinarian) || vets[0];

    dischargeHospitalization(item.id, {
      dischargeDate,
      dischargeSummary,
      ownerInstructions,
      dischargeMedications,
      followupDate,
      followupTime: followupDate ? followupTime : undefined,
    });

    if (followupDate && followupTime) {
      addAppointment({
        id: crypto.randomUUID(),
        date: followupDate,
        time: followupTime,
        clientId: pet?.clientId || "",
        petId: item.petId,
        vetId: assignedVet?.id || "",
        reason: `Control post-hospitalización · ${pet?.name || "Paciente"}`,
        status: "Confirmada",
      });
      toast.success(
        `Alta médica registrada. Cita de control agendada para el ${followupDate} a las ${followupTime} hrs.`
      );
    } else {
      toast.success("Alta médica registrada");
    }

    onClose();
  };

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-primary" /> Dar de alta
          </DialogTitle>
        </DialogHeader>
        {item && (
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-2">
              <Label htmlFor="dischargeDate">Fecha alta</Label>
              <Input
                id="dischargeDate"
                name="dischargeDate"
                type="date"
                required
                value={dischargeDate}
                onChange={(e) => setDischargeDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="followupDate">Próximo control (Fecha)</Label>
              <Input
                id="followupDate"
                name="followupDate"
                type="date"
                min={dischargeDate || today}
                value={followupDate}
                onChange={(e) => setFollowupDate(e.target.value)}
              />
            </div>

            {followupDate && (
              <div className="space-y-2 col-span-2 p-3 bg-muted/40 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <Label htmlFor="followupTime" className="text-xs font-semibold flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    Hora del próximo control (Horario de clínica)
                  </Label>
                  {availableHours.length > 0 && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      {availableHours.length} turno(s) libre(s) sin colisión
                    </span>
                  )}
                </div>

                {availableHours.length > 0 ? (
                  <>
                    <Select value={followupTime} onValueChange={setFollowupTime}>
                      <SelectTrigger id="followupTime" className="bg-background">
                        <SelectValue placeholder="Selecciona una hora disponible" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableHours.map((hour) => (
                          <SelectItem key={hour} value={hour}>
                            {hour} hrs — Turno disponible
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Este turno se apartará automáticamente en Agenda para evitar colisiones con otras citas.
                    </p>
                  </>
                ) : (
                  <div className="p-2.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                    ⚠️ No hay turnos disponibles en el horario regular de la clínica para el {followupDate}. Por favor selecciona otra fecha para el control.
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2 col-span-2">
              <Label htmlFor="dischargeSummary">Resumen clínico</Label>
              <Textarea
                id="dischargeSummary"
                name="dischargeSummary"
                rows={2}
                value={dischargeSummary}
                onChange={(e) => setDischargeSummary(e.target.value)}
                placeholder="Evolución y estado general del paciente al alta..."
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="ownerInstructions">Indicaciones al propietario</Label>
              <Textarea
                id="ownerInstructions"
                name="ownerInstructions"
                rows={2}
                value={ownerInstructions}
                onChange={(e) => setOwnerInstructions(e.target.value)}
                placeholder="Cuidados, reposo, dieta..."
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="dischargeMedications">Medicamentos enviados</Label>
              <Textarea
                id="dischargeMedications"
                name="dischargeMedications"
                rows={2}
                value={dischargeMedications}
                onChange={(e) => setDischargeMedications(e.target.value)}
                placeholder="Dosis, horarios y duración..."
              />
            </div>
            <DialogFooter className="col-span-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={Boolean(followupDate && availableHours.length === 0)}
              >
                Confirmar alta
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function Block({ label, value }: { label: string; value: string }) {
  return (
    <div className="pt-2">
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
      <div className="whitespace-pre-wrap">{value || "—"}</div>
    </div>
  );
}
