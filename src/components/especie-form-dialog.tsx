import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Edit2, Plus, Save, Search, Tags, X } from "lucide-react";
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
  const [razaFilter, setRazaFilter] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");

  useEffect(() => {
    if (!open) return;
    setDraft(initial ? { ...initial, razas: [...initial.razas] } : emptyEspecieDraft());
    setNuevaRaza("");
    setRazaFilter("");
    setEditingIndex(null);
    setEditingValue("");
  }, [open, initial]);

  const setField = <K extends keyof EspecieDraft>(key: K, value: EspecieDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const agregarRaza = () => {
    const raw = nuevaRaza.trim();
    if (!raw) return toast.error("Escribe el nombre de la raza");

    // Soporta ingresar varias razas separadas por coma o salto de línea
    const items = raw
      .split(/[,;\n]+/)
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    if (items.length === 0) return toast.error("Escribe el nombre de la raza");

    const existingLower = new Set(draft.razas.map((x) => x.toLowerCase()));
    const toAdd: string[] = [];

    for (const item of items) {
      if (!existingLower.has(item.toLowerCase())) {
        existingLower.add(item.toLowerCase());
        toAdd.push(item);
      }
    }

    if (toAdd.length === 0) {
      return toast.info("Las razas ingresadas ya están en la lista");
    }

    setDraft((d) => ({ ...d, razas: [...d.razas, ...toAdd] }));
    setNuevaRaza("");
    if (toAdd.length === 1) {
      toast.success(`Raza "${toAdd[0]}" agregada`);
    } else {
      toast.success(`${toAdd.length} razas agregadas`);
    }
  };

  const quitarRaza = (raza: string) => {
    setDraft((d) => ({ ...d, razas: d.razas.filter((x) => x !== raza) }));
    if (editingIndex !== null) {
      setEditingIndex(null);
    }
  };

  const startEditRaza = (index: number, val: string) => {
    setEditingIndex(index);
    setEditingValue(val);
  };

  const saveEditRaza = () => {
    if (editingIndex === null) return;
    const trimmed = editingValue.trim();
    if (!trimmed) {
      toast.error("El nombre de la raza no puede quedar vacío");
      return;
    }
    const alreadyExists = draft.razas.some(
      (r, idx) => idx !== editingIndex && r.toLowerCase() === trimmed.toLowerCase()
    );
    if (alreadyExists) {
      toast.error("Ya existe otra raza con ese nombre");
      return;
    }
    setDraft((d) => ({
      ...d,
      razas: d.razas.map((r, idx) => (idx === editingIndex ? trimmed : r)),
    }));
    setEditingIndex(null);
    setEditingValue("");
    toast.success("Raza actualizada");
  };

  const cancelEditRaza = () => {
    setEditingIndex(null);
    setEditingValue("");
  };

  const filteredRazas = useMemo(() => {
    const q = razaFilter.trim().toLowerCase();
    if (!q) return draft.razas;
    return draft.razas.filter((r) => r.toLowerCase().includes(q));
  }, [draft.razas, razaFilter]);

  const handleSave = () => {
    if (!draft.nombre.trim()) return toast.error("Ingresa el nombre de la especie");
    onSave(draft);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5 text-primary" />
            {initial ? `Editar especie: ${initial.nombre}` : "Nueva especie"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>
              Nombre de la especie <span className="text-destructive">*</span>
            </Label>
            <Input
              value={draft.nombre}
              onChange={(e) => setField("nombre", e.target.value)}
              placeholder="Ej: Canino, Felino, Ave, Roedor..."
              className="mt-1"
            />
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea
              value={draft.descripcion}
              onChange={(e) => setField("descripcion", e.target.value)}
              placeholder="Descripción o notas de la especie (opcional)"
              rows={2}
              className="mt-1"
            />
          </div>

          {/* Gestión de Razas */}
          <div className="border rounded-lg p-3 bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-semibold flex items-center gap-1.5">
                <Tags className="h-4 w-4 text-primary" />
                Razas de esta especie ({draft.razas.length})
              </Label>
              <span className="text-xs text-muted-foreground">
                Enter o coma para agregar
              </span>
            </div>

            {/* Input para agregar razas */}
            <div className="flex gap-2">
              <Input
                value={nuevaRaza}
                onChange={(e) => setNuevaRaza(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    agregarRaza();
                  }
                }}
                placeholder="Ej: Labrador, Husky, Poodle..."
                className="bg-background"
              />
              <Button type="button" onClick={agregarRaza} className="shrink-0">
                <Plus className="h-4 w-4 mr-1" /> Agregar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              💡 Puedes escribir varias razas separadas por coma (ej: <em>Golden Retriever, Beagle, Boxer</em>) y agregarlas a la vez.
            </p>

            {/* Filtro rápido si hay muchas razas */}
            {draft.razas.length > 8 && (
              <div className="relative mt-2">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={razaFilter}
                  onChange={(e) => setRazaFilter(e.target.value)}
                  placeholder="Buscar en la lista de razas..."
                  className="pl-8 h-8 text-xs bg-background"
                />
              </div>
            )}

            {/* Lista de razas (Chips interactivos con edición y eliminación) */}
            {draft.razas.length === 0 ? (
              <div className="text-center py-4 bg-background rounded border border-dashed text-sm text-muted-foreground">
                No hay razas registradas aún. Agrega una arriba.
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto p-1 bg-background rounded border">
                {filteredRazas.map((raza) => {
                  const originalIndex = draft.razas.indexOf(raza);
                  const isEditing = editingIndex === originalIndex;

                  if (isEditing) {
                    return (
                      <div key={raza} className="flex items-center gap-1 bg-amber-50 border border-amber-300 rounded px-2 py-1">
                        <Input
                          size={1}
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              saveEditRaza();
                            } else if (e.key === "Escape") {
                              cancelEditRaza();
                            }
                          }}
                          className="h-6 text-xs px-1.5 py-0 w-32 bg-white"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={saveEditRaza}
                          className="text-emerald-700 hover:text-emerald-900 p-0.5"
                          title="Guardar nombre"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditRaza}
                          className="text-slate-500 hover:text-slate-700 p-0.5"
                          title="Cancelar"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <Badge
                      key={raza}
                      variant="secondary"
                      className="gap-1 pr-1 pl-2 py-1 text-xs group hover:border-primary/50 transition-colors"
                    >
                      <span
                        className="cursor-pointer hover:underline"
                        title="Haz clic para editar el nombre de esta raza"
                        onClick={() => startEditRaza(originalIndex, raza)}
                      >
                        {raza}
                      </span>
                      <button
                        type="button"
                        onClick={() => startEditRaza(originalIndex, raza)}
                        className="text-muted-foreground hover:text-primary p-0.5 ml-0.5 opacity-60 group-hover:opacity-100"
                        title="Editar nombre"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => quitarRaza(raza)}
                        className="text-muted-foreground hover:text-destructive p-0.5"
                        title="Eliminar raza"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <Label>Estado de la especie</Label>
            <Select value={draft.estado} onValueChange={(v) => setField("estado", v as EspecieEstado)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESPECIE_ESTADOS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-1" /> Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-1" /> Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
