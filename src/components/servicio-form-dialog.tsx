import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Save, X } from "lucide-react";
import { toast } from "sonner";
import { getCurrencySymbol, useCurrency } from "@/lib/config-store";
import {
  SERVICIO_ESTADOS,
  emptyServicioDraft,
  type Servicio,
  type ServicioDraft,
  type ServicioEstado,
} from "@/lib/servicios-store";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: Servicio | null;
  onSave: (data: ServicioDraft) => void;
};

export function ServicioFormDialog({ open, onOpenChange, initial, onSave }: Props) {
  const [draft, setDraft] = useState<ServicioDraft>(emptyServicioDraft());
  const currency = useCurrency();

  useEffect(() => {
    if (!open) return;
    setDraft(initial ? { ...initial } : emptyServicioDraft());
  }, [open, initial]);

  const setField = <K extends keyof ServicioDraft>(key: K, value: ServicioDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const handleSave = () => {
    if (!draft.nombre.trim()) return toast.error("Ingresa el nombre del servicio");
    if (draft.precio < 0 || Number.isNaN(draft.precio)) return toast.error("Ingresa un precio válido");
    if (draft.duracionMin <= 0) return toast.error("Ingresa una duración mayor a 0");
    onSave(draft);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
              <Plus className="h-4 w-4" />
            </span>
            {initial ? "Editar Servicio" : "Nuevo Servicio"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>
              Nombre del Servicio <span className="text-destructive">*</span>
            </Label>
            <Input
              value={draft.nombre}
              onChange={(e) => setField("nombre", e.target.value)}
              placeholder="Ej: Consulta, Hotel, Grooming canino..."
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>
                Precio <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {getCurrencySymbol(currency)}
                </span>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  className="pl-9"
                  value={draft.precio}
                  onChange={(e) => setField("precio", Number(e.target.value))}
                />
              </div>
            </div>
            <div>
              <Label>
                Duración <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  min={1}
                  className="pr-10"
                  value={draft.duracionMin}
                  onChange={(e) => setField("duracionMin", Number(e.target.value))}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  min
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Ej: Vacuna=15, Consulta=30, Cirugía=90</p>
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={draft.estado} onValueChange={(v) => setField("estado", v as ServicioEstado)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SERVICIO_ESTADOS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Grava impuestos</Label>
            <Select
              value={draft.gravaImpuestos ? "si" : "no"}
              onValueChange={(v) => setField("gravaImpuestos", v === "si")}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="si">Sí</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea
              value={draft.descripcion}
              onChange={(e) => setField("descripcion", e.target.value)}
              placeholder="Descripción del servicio..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-1" /> Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-1" /> Guardar Servicio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
