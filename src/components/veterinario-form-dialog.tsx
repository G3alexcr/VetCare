import { useEffect, useState } from "react";
import {
  Button,
} from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageInput } from "@/components/image-input";
import { Coffee, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  DIAS,
  ESPECIALIDADES_VET,
  VET_ESTADOS,
  emptyDraft,
  type DiaSemana,
  type Pausa,
  type Veterinario,
  type VeterinarioDraft,
  type VetEstado,
} from "@/lib/veterinarios-store";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: Veterinario | null;
  onSave: (data: VeterinarioDraft) => void;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function VeterinarioFormDialog({ open, onOpenChange, initial, onSave }: Props) {
  const [draft, setDraft] = useState<VeterinarioDraft>(emptyDraft());

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setDraft({
        ...initial,
        horario: initial.horario.map((d) => ({ ...d })),
        pausas: initial.pausas.map((p) => ({ ...p })),
      });
    } else {
      setDraft(emptyDraft());
    }
  }, [open, initial]);

  const setField = <K extends keyof VeterinarioDraft>(key: K, value: VeterinarioDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const setDia = (dia: DiaSemana, patch: Partial<VeterinarioDraft["horario"][number]>) =>
    setDraft((d) => ({
      ...d,
      horario: d.horario.map((h) => (h.dia === dia ? { ...h, ...patch } : h)),
    }));

  const addPausa = () => {
    const p: Pausa = { id: `pz_${Date.now()}`, nombre: "", desde: "13:00", hasta: "14:00" };
    setDraft((d) => ({ ...d, pausas: [...d.pausas, p] }));
  };
  const updatePausa = (id: string, patch: Partial<Pausa>) =>
    setDraft((d) => ({ ...d, pausas: d.pausas.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  const removePausa = (id: string) =>
    setDraft((d) => ({ ...d, pausas: d.pausas.filter((p) => p.id !== id) }));

  const handleSave = () => {
    if (!draft.nombre.trim()) return toast.error("Ingresa el nombre completo");
    if (!draft.email.trim()) return toast.error("Ingresa el email");
    if (!draft.password.trim()) return toast.error("Ingresa una contraseña");
    onSave(draft);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar Veterinario" : "Nuevo Veterinario"}</DialogTitle>
        </DialogHeader>

        {/* Foto */}
        <ImageInput label="Foto del veterinario" value={draft.foto} onChange={(v) => setField("foto", v)} className="py-2" />

        {/* Datos básicos */}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>Nombre Completo</Label>
            <Input value={draft.nombre} onChange={(e) => setField("nombre", e.target.value)} placeholder="Ej: Juan Pérez" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={draft.email} onChange={(e) => setField("email", e.target.value)} placeholder="ejemplo@dominio.com" />
          </div>
          <div>
            <Label>Contraseña</Label>
            <Input value={draft.password} onChange={(e) => setField("password", e.target.value)} placeholder="Mínimo 6 caracteres" />
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input value={draft.telefono} onChange={(e) => setField("telefono", e.target.value)} placeholder="5491234567890" />
          </div>
          <div>
            <Label>WhatsApp</Label>
            <Input value={draft.whatsapp} onChange={(e) => setField("whatsapp", e.target.value)} placeholder="5491234567890" />
          </div>
          <div>
            <Label>Especialidad</Label>
            <Select value={draft.especialidad} onValueChange={(v) => setField("especialidad", v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar especialidad" /></SelectTrigger>
              <SelectContent>
                {ESPECIALIDADES_VET.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>% Comisión</Label>
            <Input type="number" min={0} max={100} value={draft.comision}
              onChange={(e) => setField("comision", Number(e.target.value))} />
          </div>
          <div>
            <Label>Estado</Label>
            <Select value={draft.estado} onValueChange={(v) => setField("estado", v as VetEstado)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {VET_ESTADOS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Horario de Trabajo */}
        <div className="mt-2">
          <Label>Horario de Trabajo</Label>
          <div className="border rounded-lg mt-1 overflow-hidden">
            <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] items-center gap-2 bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
              <span>Día</span>
              <span>Entrada</span>
              <span>Salida</span>
              <span>Disponible</span>
            </div>
            <div className="divide-y">
              {DIAS.map((dia) => {
                const h = draft.horario.find((x) => x.dia === dia)!;
                return (
                  <div key={dia} className="grid grid-cols-[1.4fr_1fr_1fr_1fr] items-center gap-2 px-3 py-2">
                    <span className="text-sm font-medium">{dia}</span>
                    <Input type="time" value={h.entrada}
                      onChange={(e) => setDia(dia, { entrada: e.target.value })} />
                    <Input type="time" value={h.salida}
                      onChange={(e) => setDia(dia, { salida: e.target.value })} />
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={h.disponible}
                        onCheckedChange={(v) => setDia(dia, { disponible: v === true })}
                      />
                      <span className="text-xs text-muted-foreground">{h.disponible ? "Sí" : "No"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pausas / Descansos */}
        <div className="mt-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1.5"><Coffee className="h-4 w-4" /> Pausas / Descansos</Label>
            <Button type="button" variant="outline" size="sm" onClick={addPausa}>
              <Plus className="h-4 w-4 mr-1" /> Agregar Pausa
            </Button>
          </div>
          {draft.pausas.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-1">Sin pausas configuradas.</p>
          ) : (
            <div className="space-y-2 mt-2">
              {draft.pausas.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <Input value={p.nombre} onChange={(e) => updatePausa(p.id, { nombre: e.target.value })}
                    placeholder="Ej: Almuerzo" />
                  <Input type="time" value={p.desde} onChange={(e) => updatePausa(p.id, { desde: e.target.value })} />
                  <span className="text-muted-foreground text-sm">a</span>
                  <Input type="time" value={p.hasta} onChange={(e) => updatePausa(p.id, { hasta: e.target.value })} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removePausa(p.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notas */}
        <div className="mt-2">
          <Label>Notas Adicionales</Label>
          <Textarea value={draft.notas} onChange={(e) => setField("notas", e.target.value)}
            placeholder="Observaciones, certificaciones, restricciones..." />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>{initial ? "Guardar cambios" : "Crear veterinario"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
