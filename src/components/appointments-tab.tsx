import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Eye, CalendarClock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  useAppointments,
  addAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
} from "@/lib/store";
import {
  type Appointment,
  type AppointmentStatus,
} from "@/lib/mock-data";
import { useClientes } from "@/lib/clientes-store";
import { usePets } from "@/lib/pets-store";
import { useVeterinarios } from "@/lib/veterinarios-store";
import { toast } from "sonner";

const statuses: AppointmentStatus[] = ["Pendiente", "Confirmada", "En atención", "Finalizada", "Cancelada"];

const statusColors: Record<AppointmentStatus, string> = {
  "Pendiente": "bg-amber-100 text-amber-700 border-amber-200",
  "Confirmada": "bg-sky-100 text-sky-700 border-sky-200",
  "En atención": "bg-violet-100 text-violet-700 border-violet-200",
  "Finalizada": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Cancelada": "bg-rose-100 text-rose-700 border-rose-200",
};

const today = () => new Date().toISOString().split("T")[0];

function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function alertFor(a: Appointment) {
  const t = today();
  if (a.status === "Finalizada" || a.status === "Cancelada") return null;
  if (a.date < t) return { label: "Vencida", cls: "bg-rose-100 text-rose-700 border-rose-200" };
  if (a.date === t) return { label: "Hoy", cls: "bg-primary/10 text-primary border-primary/20" };
  if (a.date === tomorrowISO()) return { label: "Mañana", cls: "bg-amber-100 text-amber-700 border-amber-200" };
  return null;
}

export function AppointmentsTab({ petId }: { petId: string }) {
  const all = useAppointments();
  const vets = useVeterinarios();
  const pets = usePets();
  const clientes = useClientes();
  const list = useMemo(() => {
    const t = today();
    return all
      .filter((a) => a.petId === petId && a.status !== "Cancelada" && (a.date >= t || a.status === "En atención"))
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }, [all, petId]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [viewing, setViewing] = useState<Appointment | null>(null);
  const [confirmDel, setConfirmDel] = useState<Appointment | null>(null);

  const pet = pets.find((p) => p.id === petId);
  const defaultClientId = pet?.clientId ?? clientes[0]?.id ?? "";

  const openNew = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (a: Appointment) => { setEditing(a); setFormOpen(true); setViewing(null); };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const d = Object.fromEntries(fd.entries()) as Record<string, string>;
    if (editing) {
      updateAppointment(editing.id, {
        date: d.date,
        time: d.time,
        vetId: d.vetId,
        reason: d.reason,
        status: d.status as AppointmentStatus,
      });
      toast.success("Cita actualizada");
    } else {
      addAppointment({
        id: `a${Date.now()}`,
        date: d.date,
        time: d.time,
        clientId: defaultClientId,
        petId,
        vetId: d.vetId,
        reason: d.reason,
        status: "Pendiente",
      });
      toast.success("Cita agendada");
    }
    setFormOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {list.length} cita{list.length === 1 ? "" : "s"} futura{list.length === 1 ? "" : "s"}
        </p>
        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Agendar cita</Button>
      </div>

      {list.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
          <CalendarClock className="h-8 w-8 opacity-50" />
          Sin próximas citas.
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Veterinario</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((a) => {
                const vet = vets.find((v) => v.id === a.vetId);
                const alert = alertFor(a);
                return (
                  <TableRow key={a.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {a.date}
                        {alert && (
                          <Badge variant="outline" className={`${alert.cls} text-[10px]`}>
                            {alert.label === "Vencida" && <AlertTriangle className="h-3 w-3 mr-1" />}
                            {alert.label}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{a.time}</TableCell>
                    <TableCell>{vet?.nombre ?? "—"}</TableCell>
                    <TableCell className="max-w-[220px] truncate">{a.reason}</TableCell>
                    <TableCell>
                      <Select
                        value={a.status}
                        onValueChange={(v) => updateAppointmentStatus(a.id, v as AppointmentStatus)}
                      >
                        <SelectTrigger className={`h-8 w-36 ${statusColors[a.status]}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setViewing(a)} title="Ver">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(a)} title="Editar / Reprogramar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setConfirmDel(a)} title="Cancelar">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Reprogramar / editar cita" : "Agendar cita"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" name="date" required defaultValue={editing?.date ?? today()} />
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <Input type="time" name="time" required defaultValue={editing?.time ?? "09:00"} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Veterinario</Label>
              <Select name="vetId" defaultValue={editing?.vetId ?? vets[0]?.id ?? ""}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {vets.map((v) => <SelectItem key={v.id} value={v.id}>{v.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Motivo</Label>
              <Input name="reason" required defaultValue={editing?.reason} />
            </div>
            {editing && (
              <div className="col-span-2 space-y-2">
                <Label>Estado</Label>
                <Select name="status" defaultValue={editing.status}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
              <Button type="submit">{editing ? "Guardar" : "Agendar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent>
          {viewing && (
            <>
              <DialogHeader><DialogTitle>Detalle de cita</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Info label="Fecha" value={viewing.date} />
                <Info label="Hora" value={viewing.time} />
                <Info label="Veterinario" value={vets.find((v) => v.id === viewing.vetId)?.nombre ?? "—"} />
                <Info label="Estado" value={viewing.status} />
                <div className="col-span-2">
                  <div className="text-xs text-muted-foreground">Motivo</div>
                  <div className="font-medium">{viewing.reason}</div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewing(null)}>Cerrar</Button>
                <Button onClick={() => openEdit(viewing)}>
                  <Pencil className="h-4 w-4 mr-2" /> Reprogramar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cancelar cita</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Deseas cancelar esta cita? Esto la marcará como cancelada.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDel(null)}>Volver</Button>
            <Button
              variant="outline"
              onClick={() => {
                if (confirmDel) updateAppointmentStatus(confirmDel.id, "Cancelada");
                setConfirmDel(null);
                toast.success("Cita cancelada");
              }}
            >
              Marcar cancelada
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmDel) deleteAppointment(confirmDel.id);
                setConfirmDel(null);
                toast.success("Cita eliminada");
              }}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
