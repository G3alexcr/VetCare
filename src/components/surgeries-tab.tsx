import { useMemo, useState } from "react";
import { Plus, Eye, Pencil, Trash2, Stethoscope, Hospital } from "lucide-react";
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
import {
  useSurgeries,
  useSurgeryFollowups,
  addSurgery,
  updateSurgery,
  deleteSurgery,
  addSurgeryFollowup,
  deleteSurgeryFollowup,
  type Surgery,
  type SurgeryStatus,
} from "@/lib/store";
import { toast } from "sonner";

const STATUSES: SurgeryStatus[] = ["Programada", "En proceso", "Finalizada", "Cancelada"];

function statusVariant(s: SurgeryStatus): "default" | "secondary" | "destructive" | "outline" {
  if (s === "Finalizada") return "default";
  if (s === "En proceso") return "secondary";
  if (s === "Cancelada") return "destructive";
  return "outline";
}

export function SurgeriesTab({ petId }: { petId: string }) {
  const all = useSurgeries();
  const items = useMemo(
    () =>
      all
        .filter((s) => s.petId === petId)
        .sort((a, b) => b.surgeryDate.localeCompare(a.surgeryDate)),
    [all, petId]
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Surgery | null>(null);
  const [viewing, setViewing] = useState<Surgery | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">Total: {items.length}</span>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nueva cirugía
        </Button>
      </div>

      {items.length === 0 ? (
        <Card className="p-10 text-center">
          <Hospital className="h-8 w-8 mx-auto text-muted-foreground mb-2 opacity-40" />
          <p className="text-sm text-muted-foreground">No hay cirugías registradas.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Procedimiento</TableHead>
                <TableHead>Veterinario</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="whitespace-nowrap">{s.surgeryDate}</TableCell>
                  <TableCell className="font-medium">{s.procedureType}</TableCell>
                  <TableCell>{s.veterinarian || "—"}</TableCell>
                  <TableCell><Badge variant={statusVariant(s.status)}>{s.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setViewing(s)} title="Ver">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(s); setFormOpen(true); }} title="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Eliminar"
                      onClick={() => {
                        deleteSurgery(s.id);
                        toast.success("Cirugía eliminada");
                      }}
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

      <SurgeryFormDialog
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}
        editing={editing}
        petId={petId}
      />
      <SurgeryDetailDialog item={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}

function SurgeryFormDialog({
  open,
  onOpenChange,
  editing,
  petId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Surgery | null;
  petId: string;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [status, setStatus] = useState<SurgeryStatus>(editing?.status ?? "Programada");
  const vets = useVeterinarios();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = Object.fromEntries(fd.entries()) as Record<string, string>;
    const data = {
      petId,
      surgeryDate: v.surgeryDate,
      procedureType: v.procedureType,
      veterinarian: v.veterinarian ?? "",
      assistant: v.assistant ?? "",
      preoperativeDiagnosis: v.preoperativeDiagnosis ?? "",
      procedurePerformed: v.procedurePerformed ?? "",
      anesthesiaType: v.anesthesiaType ?? "",
      medications: v.medications ?? "",
      durationMinutes: Number(v.durationMinutes) || 0,
      status,
      observations: v.observations ?? "",
      postoperativeRecommendations: v.postoperativeRecommendations ?? "",
    };
    if (editing) {
      updateSurgery(editing.id, data);
      toast.success("Cirugía actualizada");
    } else {
      addSurgery(data);
      toast.success("Cirugía registrada");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar cirugía" : "Nueva cirugía"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="surgeryDate">Fecha de cirugía</Label>
            <Input id="surgeryDate" name="surgeryDate" type="date" required defaultValue={editing?.surgeryDate ?? today} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="procedureType">Tipo de procedimiento</Label>
            <Input id="procedureType" name="procedureType" required defaultValue={editing?.procedureType} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="veterinarian">Veterinario responsable</Label>
            <Input id="veterinarian" name="veterinarian" list="vet-su-list" defaultValue={editing?.veterinarian ?? vets[0]?.nombre ?? ""} />
            <datalist id="vet-su-list">
              {vets.map((v) => <option key={v.id} value={v.nombre} />)}
            </datalist>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assistant">Ayudante (opcional)</Label>
            <Input id="assistant" name="assistant" defaultValue={editing?.assistant} />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="preoperativeDiagnosis">Diagnóstico preoperatorio</Label>
            <Textarea id="preoperativeDiagnosis" name="preoperativeDiagnosis" rows={2} defaultValue={editing?.preoperativeDiagnosis} />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="procedurePerformed">Procedimiento realizado</Label>
            <Textarea id="procedurePerformed" name="procedurePerformed" rows={2} defaultValue={editing?.procedurePerformed} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="anesthesiaType">Tipo de anestesia</Label>
            <Input id="anesthesiaType" name="anesthesiaType" defaultValue={editing?.anesthesiaType} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="durationMinutes">Duración (min)</Label>
            <Input id="durationMinutes" name="durationMinutes" type="number" min="0" defaultValue={editing?.durationMinutes?.toString()} />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="medications">Medicamentos administrados</Label>
            <Textarea id="medications" name="medications" rows={2} defaultValue={editing?.medications} />
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as SurgeryStatus)}>
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
          <div className="space-y-2 col-span-2">
            <Label htmlFor="postoperativeRecommendations">Recomendaciones postoperatorias</Label>
            <Textarea id="postoperativeRecommendations" name="postoperativeRecommendations" rows={2} defaultValue={editing?.postoperativeRecommendations} />
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

function SurgeryDetailDialog({ item, onClose }: { item: Surgery | null; onClose: () => void }) {
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {item && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 flex-wrap">
                <Stethoscope className="h-4 w-4" /> {item.procedureType}
                <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-1 text-sm">
              <Row label="Fecha" value={item.surgeryDate} />
              <Row label="Procedimiento" value={item.procedureType} />
              <Row label="Veterinario" value={item.veterinarian || "—"} />
              <Row label="Ayudante" value={item.assistant || "—"} />
              <Row label="Tipo de anestesia" value={item.anesthesiaType || "—"} />
              <Row label="Duración" value={item.durationMinutes ? `${item.durationMinutes} min` : "—"} />
              <Block label="Diagnóstico preoperatorio" value={item.preoperativeDiagnosis} />
              <Block label="Procedimiento realizado" value={item.procedurePerformed} />
              <Block label="Medicamentos administrados" value={item.medications} />
              <Block label="Observaciones" value={item.observations} />
              <Block label="Recomendaciones postoperatorias" value={item.postoperativeRecommendations} />
            </div>
            <FollowupsSection surgeryId={item.id} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FollowupsSection({ surgeryId }: { surgeryId: string }) {
  const all = useSurgeryFollowups();
  const items = useMemo(
    () => all.filter((f) => f.surgeryId === surgeryId).sort((a, b) => b.followupDate.localeCompare(a.followupDate)),
    [all, surgeryId]
  );
  const today = new Date().toISOString().split("T")[0];
  const [open, setOpen] = useState(false);
  const vets = useVeterinarios();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = Object.fromEntries(fd.entries()) as Record<string, string>;
    addSurgeryFollowup({
      surgeryId,
      followupDate: v.followupDate,
      veterinarian: v.veterinarian ?? "",
      progressNotes: v.progressNotes ?? "",
      observations: v.observations ?? "",
    });
    toast.success("Control postoperatorio registrado");
    setOpen(false);
  };

  return (
    <div className="mt-4 border-t pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Controles postoperatorios</h4>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nuevo control
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sin controles registrados.</p>
      ) : (
        <div className="space-y-2">
          {items.map((f) => (
            <Card key={f.id} className="p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium">{f.followupDate} · {f.veterinarian || "—"}</div>
                  {f.progressNotes && <div className="text-muted-foreground mt-1"><span className="font-medium text-foreground">Evolución:</span> {f.progressNotes}</div>}
                  {f.observations && <div className="text-muted-foreground mt-1"><span className="font-medium text-foreground">Observaciones:</span> {f.observations}</div>}
                </div>
                <Button variant="ghost" size="sm" onClick={() => { deleteSurgeryFollowup(f.id); toast.success("Control eliminado"); }}>
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
            <DialogTitle>Nuevo control postoperatorio</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="followupDate">Fecha de control</Label>
              <Input id="followupDate" name="followupDate" type="date" required defaultValue={today} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="veterinarian">Veterinario</Label>
              <Input id="veterinarian" name="veterinarian" list="vet-fu-list" defaultValue={vets[0]?.nombre ?? ""} />
              <datalist id="vet-fu-list">
                {vets.map((v) => <option key={v.id} value={v.nombre} />)}
              </datalist>
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="progressNotes">Evolución</Label>
              <Textarea id="progressNotes" name="progressNotes" rows={2} />
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
