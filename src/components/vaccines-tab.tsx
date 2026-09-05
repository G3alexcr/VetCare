import { useState } from "react";
import { Plus, Eye, Pencil, Trash2, AlertTriangle, Syringe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  useVaccines,
  addVaccine,
  updateVaccine,
  deleteVaccine,
  getVaccineStatus,
  type Vaccine,
  type VaccineStatus,
} from "@/lib/store";
import { toast } from "sonner";

function statusVariant(s: VaccineStatus): "default" | "secondary" | "destructive" {
  if (s === "Vencida") return "destructive";
  if (s === "Próxima a vencer") return "secondary";
  return "default";
}

export function VaccinesTab({ petId }: { petId: string }) {
  const all = useVaccines();
  const items = all
    .filter((v) => v.petId === petId)
    .sort((a, b) => b.applicationDate.localeCompare(a.applicationDate));

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vaccine | null>(null);
  const [viewing, setViewing] = useState<Vaccine | null>(null);

  const expiringSoon = items.filter((v) => getVaccineStatus(v.nextDueDate).label === "Próxima a vencer");

  const openNew = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (v: Vaccine) => { setEditing(v); setFormOpen(true); };

  return (
    <div className="space-y-3">
      {expiringSoon.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {expiringSoon.length === 1
              ? `1 vacuna próxima a vencer en menos de 30 días.`
              : `${expiringSoon.length} vacunas próximas a vencer en menos de 30 días.`}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" /> Nueva vacuna
        </Button>
      </div>

      {items.length === 0 ? (
        <Card className="p-10 text-center">
          <Syringe className="h-8 w-8 mx-auto text-muted-foreground mb-2 opacity-40" />
          <p className="text-sm text-muted-foreground">No hay vacunas registradas.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre vacuna</TableHead>
                <TableHead>Fecha aplicación</TableHead>
                <TableHead>Próxima dosis</TableHead>
                <TableHead>Veterinario</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((v) => {
                const st = getVaccineStatus(v.nextDueDate);
                return (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.vaccineName}</TableCell>
                    <TableCell className="whitespace-nowrap">{v.applicationDate}</TableCell>
                    <TableCell className="whitespace-nowrap">{v.nextDueDate || "—"}</TableCell>
                    <TableCell>{v.veterinarian || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(st.label)}>{st.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setViewing(v)} title="Ver">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(v)} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Eliminar"
                        onClick={() => {
                          deleteVaccine(v.id);
                          toast.success("Vacuna eliminada");
                        }}
                      >
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

      <VaccineFormDialog
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}
        editing={editing}
        petId={petId}
      />
      <VaccineDetailDialog vaccine={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}

function VaccineFormDialog({
  open,
  onOpenChange,
  editing,
  petId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Vaccine | null;
  petId: string;
}) {
  const today = new Date().toISOString().split("T")[0];
  const vets = useVeterinarios();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = Object.fromEntries(fd.entries()) as Record<string, string>;
    const data = {
      petId,
      vaccineName: v.vaccineName,
      laboratory: v.laboratory ?? "",
      batchNumber: v.batchNumber ?? "",
      applicationDate: v.applicationDate,
      nextDueDate: v.nextDueDate ?? "",
      veterinarian: v.veterinarian ?? "",
      notes: v.notes ?? "",
    };
    if (editing) {
      updateVaccine(editing.id, data);
      toast.success("Vacuna actualizada");
    } else {
      addVaccine(data);
      toast.success("Vacuna registrada");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar vacuna" : "Nueva vacuna"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="space-y-2 col-span-2">
            <Label htmlFor="vaccineName">Nombre vacuna</Label>
            <Input id="vaccineName" name="vaccineName" required defaultValue={editing?.vaccineName} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="laboratory">Laboratorio</Label>
            <Input id="laboratory" name="laboratory" defaultValue={editing?.laboratory} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="batchNumber">Número de lote</Label>
            <Input id="batchNumber" name="batchNumber" defaultValue={editing?.batchNumber} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="applicationDate">Fecha aplicación</Label>
            <Input
              id="applicationDate"
              name="applicationDate"
              type="date"
              required
              defaultValue={editing?.applicationDate ?? today}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nextDueDate">Próxima dosis</Label>
            <Input
              id="nextDueDate"
              name="nextDueDate"
              type="date"
              defaultValue={editing?.nextDueDate}
            />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="veterinarian">Veterinario</Label>
            <Input
              id="veterinarian"
              name="veterinarian"
              list="vet-list"
              defaultValue={editing?.veterinarian ?? vets[0]?.nombre ?? ""}
            />
            <datalist id="vet-list">
              {vets.map((v) => <option key={v.id} value={v.nombre} />)}
            </datalist>
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="notes">Observaciones</Label>
            <Textarea id="notes" name="notes" rows={3} defaultValue={editing?.notes} />
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

function VaccineDetailDialog({
  vaccine,
  onClose,
}: {
  vaccine: Vaccine | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!vaccine} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        {vaccine && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Syringe className="h-4 w-4" /> {vaccine.vaccineName}
                <Badge variant={statusVariant(getVaccineStatus(vaccine.nextDueDate).label)}>
                  {getVaccineStatus(vaccine.nextDueDate).label}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-1 text-sm">
              <Row label="Nombre" value={vaccine.vaccineName} />
              <Row label="Laboratorio" value={vaccine.laboratory || "—"} />
              <Row label="Lote" value={vaccine.batchNumber || "—"} />
              <Row label="Fecha aplicación" value={vaccine.applicationDate} />
              <Row label="Próxima dosis" value={vaccine.nextDueDate || "—"} />
              <Row label="Veterinario" value={vaccine.veterinarian || "—"} />
              <div className="pt-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Observaciones</div>
                <div className="whitespace-pre-wrap">{vaccine.notes || "—"}</div>
              </div>
            </div>
          </>
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
