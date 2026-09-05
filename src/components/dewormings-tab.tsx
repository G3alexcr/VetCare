import { useMemo, useState } from "react";
import { Plus, Eye, Pencil, Trash2, AlertTriangle, Bug } from "lucide-react";
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
  useDewormings,
  addDeworming,
  updateDeworming,
  deleteDeworming,
  getDewormingStatus,
  type Deworming,
  type DewormingStatus,
  type DewormingType,
} from "@/lib/store";
import { toast } from "sonner";

function statusVariant(s: DewormingStatus): "default" | "secondary" | "destructive" {
  if (s === "Vencida") return "destructive";
  if (s === "Próxima a vencer") return "secondary";
  return "default";
}

type Filter = "all" | DewormingStatus;

export function DewormingsTab({ petId }: { petId: string }) {
  const all = useDewormings();
  const items = useMemo(
    () =>
      all
        .filter((d) => d.petId === petId)
        .sort((a, b) => b.applicationDate.localeCompare(a.applicationDate)),
    [all, petId]
  );

  const [filter, setFilter] = useState<Filter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Deworming | null>(null);
  const [viewing, setViewing] = useState<Deworming | null>(null);

  const filtered = items.filter(
    (d) => filter === "all" || getDewormingStatus(d.nextApplicationDate).label === filter
  );
  const expiringSoon = items.filter(
    (d) => getDewormingStatus(d.nextApplicationDate).label === "Próxima a vencer"
  );

  return (
    <div className="space-y-3">
      {expiringSoon.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {expiringSoon.length === 1
              ? "1 desparasitación próxima a vencer en menos de 15 días."
              : `${expiringSoon.length} desparasitaciones próximas a vencer en menos de 15 días.`}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Total: {items.length}</span>
          <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <SelectTrigger className="w-[180px] h-8 bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="Vigente">Vigentes</SelectItem>
              <SelectItem value="Próxima a vencer">Próximas a vencer</SelectItem>
              <SelectItem value="Vencida">Vencidas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nueva desparasitación
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <Bug className="h-8 w-8 mx-auto text-muted-foreground mb-2 opacity-40" />
          <p className="text-sm text-muted-foreground">No hay desparasitaciones registradas.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha aplicación</TableHead>
                <TableHead>Próxima aplicación</TableHead>
                <TableHead>Veterinario</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => {
                const st = getDewormingStatus(d.nextApplicationDate);
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.productName}</TableCell>
                    <TableCell><Badge variant="outline">{d.dewormingType}</Badge></TableCell>
                    <TableCell className="whitespace-nowrap">{d.applicationDate}</TableCell>
                    <TableCell className="whitespace-nowrap">{d.nextApplicationDate || "—"}</TableCell>
                    <TableCell>{d.veterinarian || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(st.label)}>{st.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setViewing(d)} title="Ver">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setEditing(d); setFormOpen(true); }} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Eliminar"
                        onClick={() => {
                          deleteDeworming(d.id);
                          toast.success("Desparasitación eliminada");
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

      <DewormingFormDialog
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}
        editing={editing}
        petId={petId}
      />
      <DewormingDetailDialog item={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}

function DewormingFormDialog({
  open,
  onOpenChange,
  editing,
  petId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Deworming | null;
  petId: string;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [type, setType] = useState<DewormingType>(editing?.dewormingType ?? "Interna");
  const vets = useVeterinarios();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = Object.fromEntries(fd.entries()) as Record<string, string>;
    const data = {
      petId,
      productName: v.productName,
      activeIngredient: v.activeIngredient ?? "",
      dewormingType: type,
      applicationDate: v.applicationDate,
      nextApplicationDate: v.nextApplicationDate ?? "",
      weight: Number(v.weight) || 0,
      dose: v.dose ?? "",
      veterinarian: v.veterinarian ?? "",
      notes: v.notes ?? "",
    };
    if (editing) {
      updateDeworming(editing.id, data);
      toast.success("Desparasitación actualizada");
    } else {
      addDeworming(data);
      toast.success("Desparasitación registrada");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar desparasitación" : "Nueva desparasitación"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="space-y-2 col-span-2">
            <Label htmlFor="productName">Producto comercial</Label>
            <Input id="productName" name="productName" required defaultValue={editing?.productName} />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="activeIngredient">Principio activo</Label>
            <Input id="activeIngredient" name="activeIngredient" defaultValue={editing?.activeIngredient} />
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as DewormingType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Interna">Interna</SelectItem>
                <SelectItem value="Externa">Externa</SelectItem>
                <SelectItem value="Mixta">Mixta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight">Peso de la mascota (kg)</Label>
            <Input id="weight" name="weight" type="number" step="0.1" defaultValue={editing?.weight?.toString()} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="applicationDate">Fecha aplicación</Label>
            <Input id="applicationDate" name="applicationDate" type="date" required defaultValue={editing?.applicationDate ?? today} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nextApplicationDate">Próxima aplicación</Label>
            <Input id="nextApplicationDate" name="nextApplicationDate" type="date" defaultValue={editing?.nextApplicationDate} />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="dose">Dosis aplicada</Label>
            <Input id="dose" name="dose" defaultValue={editing?.dose} />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="veterinarian">Veterinario</Label>
            <Input id="veterinarian" name="veterinarian" list="vet-dw-list" defaultValue={editing?.veterinarian ?? vets[0]?.nombre ?? ""} />
            <datalist id="vet-dw-list">
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

function DewormingDetailDialog({ item, onClose }: { item: Deworming | null; onClose: () => void }) {
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        {item && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bug className="h-4 w-4" /> {item.productName}
                <Badge variant={statusVariant(getDewormingStatus(item.nextApplicationDate).label)}>
                  {getDewormingStatus(item.nextApplicationDate).label}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-1 text-sm">
              <Row label="Producto" value={item.productName} />
              <Row label="Principio activo" value={item.activeIngredient || "—"} />
              <Row label="Tipo" value={item.dewormingType} />
              <Row label="Fecha aplicación" value={item.applicationDate} />
              <Row label="Próxima aplicación" value={item.nextApplicationDate || "—"} />
              <Row label="Veterinario" value={item.veterinarian || "—"} />
              <Row label="Peso registrado" value={item.weight ? `${item.weight} kg` : "—"} />
              <Row label="Dosis aplicada" value={item.dose || "—"} />
              <div className="pt-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Observaciones</div>
                <div className="whitespace-pre-wrap">{item.notes || "—"}</div>
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
