import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Save, X } from "lucide-react";
import { toast } from "sonner";
import {
  ESPECIE_ESTADOS,
  emptyEspecieDraft,
  type Especie,
  type EspecieDraft,
  type EspecieEstado,
} from "@/lib/especies-store";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: Especie | null;
  onSave: (data: EspecieDraft) => void;
};

export function EspecieFormDialog({ open, onOpenChange, initial, onSave }: Props) {
  const [draft, setDraft] = useState<EspecieDraft>(emptyEspecieDraft());
  const [nuevaRaza, setNuevaRaza] = useState("");

  useEffect(() => {
    if (!open) return;
    setDraft(initial ? { ...initial, razas: [...initial.razas] } : emptyEspecieDraft());
    setNuevaRaza("");
  }, [open, initial]);

  const setField = <K extends keyof EspecieDraft>(key: K, value: EspecieDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const agregarRaza = () => {
    const r = nuevaRaza.trim();
    if (!r) return toast.error("Escribe el nombre de la raza");
    if (draft.razas.some((x) => x.toLowerCase() === r.toLowerCase())) return toast.error("Esa raza ya existe");
    setDraft((d) => ({ ...d, razas: [...d.razas, r] }));
    setNuevaRaza("");
  };
  const quitarRaza = (raza: string) =>
    setDraft((d) => ({ ...d, razas: d.razas.filter((x) => x !== raza) }));

  const handleSave = () => {
    if (!draft.nombre.trim()) return toast.error("Ingresa el nombre de la especie");
    onSave(draft);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar especie" : "Nueva especie"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              value={draft.nombre}
              onChange={(e) => setField("nombre", e.target.value)}
              placeholder="Ej: Canino, Felino, Ave..."
            />
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea
              value={draft.descripcion}
              onChange={(e) => setField("descripcion", e.target.value)}
              placeholder="Descripción de la especie (opcional)"
              rows={3}
            />
          </div>

          <div>
            <Label className="mb-2 block">Razas de la especie</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={nuevaRaza}
                onChange={(e) => setNuevaRaza(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); agregarRaza(); } }}
                placeholder="Ej: Labrador Retriever"
              />
              <Button type="button" variant="outline" onClick={agregarRaza}>
                <Plus className="h-4 w-4 mr-1" /> Agregar
              </Button>
            </div>
            {draft.razas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin razas registradas.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {draft.razas.map((raza) => (
                  <Badge key={raza} variant="secondary" className="gap-1 pr-1">
                    {raza}
                    <button type="button" onClick={() => quitarRaza(raza)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Estado</Label>
            <Select value={draft.estado} onValueChange={(v) => setField("estado", v as EspecieEstado)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ESPECIE_ESTADOS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-1" /> Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-1" /> Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
