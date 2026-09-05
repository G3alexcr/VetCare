import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useClientes } from "@/lib/clientes-store";
import { usePets } from "@/lib/pets-store";
import { useVeterinarios } from "@/lib/veterinarios-store";
import type { LinkedConsultation } from "@/lib/store";

export type ConsultationFormDefaults = {
  date?: string;
  vetId?: string;
  petId?: string;
  clientId?: string;
  reason?: string;
};

export function ConsultationForm({
  defaults,
  lockContext,
  onCancel,
  onSubmit,
  submitLabel = "Guardar",
}: {
  defaults?: ConsultationFormDefaults;
  lockContext?: boolean;
  onCancel: () => void;
  onSubmit: (data: Omit<LinkedConsultation, "id" | "appointmentId" | "clinicId">) => void;
  submitLabel?: string;
}) {
  const today = new Date().toISOString().split("T")[0];
  const clientes = useClientes();
  const pets = usePets();
  const vets = useVeterinarios();
  const d = defaults ?? {};
  const initialClient = d.clientId ?? clientes[0]?.id ?? "";
  const petsForClient = initialClient
    ? pets.filter((p) => p.clientId === initialClient)
    : pets;

  const handle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = Object.fromEntries(fd.entries()) as Record<string, string>;
    onSubmit({
      date: v.date,
      vetId: v.vetId,
      petId: v.petId,
      reason: v.reason,
      weight: Number(v.weight) || 0,
      temperature: Number(v.temperature) || 0,
      diagnosis: v.diagnosis ?? "",
      treatment: v.treatment ?? "",
      medications: v.medications ?? "",
      notes: v.notes ?? "",
    });
  };

  return (
    <form onSubmit={handle} className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Fecha</Label>
        <Input name="date" type="date" required defaultValue={d.date ?? today} />
      </div>
      <div className="space-y-2">
        <Label>Veterinario</Label>
        <Select name="vetId" defaultValue={d.vetId ?? vets[0]?.id ?? ""} disabled={lockContext}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {vets.map((v) => <SelectItem key={v.id} value={v.id}>{v.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {lockContext && d.clientId && (
        <div className="space-y-2 col-span-2">
          <Label>Cliente</Label>
          <Input value={clientes.find((c) => c.id === d.clientId)?.fullName ?? ""} disabled />
        </div>
      )}
      <div className="space-y-2 col-span-2">
        <Label>Mascota</Label>
        <Select name="petId" defaultValue={d.petId ?? petsForClient[0]?.id ?? pets[0]?.id ?? ""} disabled={lockContext}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {(lockContext && d.clientId ? petsForClient : pets).map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2 col-span-2">
        <Label>Motivo</Label>
        <Input name="reason" required defaultValue={d.reason ?? ""} />
      </div>
      <div className="space-y-2"><Label>Peso (kg)</Label><Input name="weight" type="number" step="0.1" /></div>
      <div className="space-y-2"><Label>Temperatura (°C)</Label><Input name="temperature" type="number" step="0.1" /></div>
      <div className="space-y-2 col-span-2"><Label>Diagnóstico</Label><Textarea name="diagnosis" rows={2} /></div>
      <div className="space-y-2 col-span-2"><Label>Tratamiento</Label><Textarea name="treatment" rows={2} /></div>
      <div className="space-y-2 col-span-2"><Label>Medicamentos</Label><Input name="medications" /></div>
      <div className="space-y-2 col-span-2"><Label>Observaciones</Label><Textarea name="notes" rows={2} /></div>
      <DialogFooter className="col-span-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">{submitLabel}</Button>
      </DialogFooter>
    </form>
  );
}
