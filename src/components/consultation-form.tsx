import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useClientes } from "@/lib/clientes-store";
import { usePets } from "@/lib/pets-store";
import { useVeterinarios } from "@/lib/veterinarios-store";
import { toLocalDateStr } from "@/lib/utils";
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
  onSubmit: (data: Omit<LinkedConsultation, "id" | "appointmentId" | "clinicId"> & { clientId?: string }) => void;
  submitLabel?: string;
}) {
  const today = toLocalDateStr(new Date());
  const clientes = useClientes();
  const pets = usePets();
  const vets = useVeterinarios();
  const d = defaults ?? {};

  // Resolve initial client & pet
  const defaultPet = pets.find((p) => p.id === d.petId);
  const initialClientId = d.clientId || defaultPet?.clientId || clientes[0]?.id || "";
  const [selectedClientId, setSelectedClientId] = useState<string>(initialClientId);

  const availablePets = useMemo(() => {
    return selectedClientId ? pets.filter((p) => p.clientId === selectedClientId) : pets;
  }, [pets, selectedClientId]);

  const initialPetId = d.petId || availablePets[0]?.id || pets[0]?.id || "";
  const [selectedPetId, setSelectedPetId] = useState<string>(initialPetId);

  const handleClientChange = (newClientId: string) => {
    setSelectedClientId(newClientId);
    const clientPets = pets.filter((p) => p.clientId === newClientId);
    if (clientPets.length > 0 && !clientPets.some((p) => p.id === selectedPetId)) {
      setSelectedPetId(clientPets[0].id);
    }
  };

  const handlePetChange = (newPetId: string) => {
    setSelectedPetId(newPetId);
    const petObj = pets.find((p) => p.id === newPetId);
    if (petObj?.clientId && petObj.clientId !== selectedClientId) {
      setSelectedClientId(petObj.clientId);
    }
  };

  const handle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = Object.fromEntries(fd.entries()) as Record<string, string>;
    onSubmit({
      date: v.date,
      vetId: v.vetId,
      petId: selectedPetId || v.petId,
      clientId: selectedClientId,
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
        <Select name="vetId" defaultValue={d.vetId ?? vets[0]?.id ?? ""}>
          <SelectTrigger><SelectValue placeholder="Seleccionar médico" /></SelectTrigger>
          <SelectContent>
            {vets.map((v) => <SelectItem key={v.id} value={v.id}>{v.nombre} ({v.especialidad})</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 col-span-2 sm:col-span-1">
        <Label>Cliente / Dueño de la mascota</Label>
        <Select value={selectedClientId} onValueChange={handleClientChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccionar cliente" />
          </SelectTrigger>
          <SelectContent>
            {clientes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.fullName} {c.phone ? `· ${c.phone}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 col-span-2 sm:col-span-1">
        <Label>Mascota / Paciente</Label>
        <Select value={selectedPetId} onValueChange={handlePetChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccionar mascota" />
          </SelectTrigger>
          <SelectContent>
            {(availablePets.length > 0 ? availablePets : pets).map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name} ({p.species} · {p.breed})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 col-span-2">
        <Label>Motivo</Label>
        <Input name="reason" required defaultValue={d.reason ?? ""} placeholder="Ej. Control general, vómitos, vacunación..." />
      </div>
      <div className="space-y-2"><Label>Peso (kg)</Label><Input name="weight" type="number" step="0.1" defaultValue={defaultPet?.weight || ""} /></div>
      <div className="space-y-2"><Label>Temperatura (°C)</Label><Input name="temperature" type="number" step="0.1" placeholder="Ej. 38.5" /></div>
      <div className="space-y-2 col-span-2"><Label>Diagnóstico</Label><Textarea name="diagnosis" rows={2} placeholder="Diagnóstico presuntivo o definitivo..." /></div>
      <div className="space-y-2 col-span-2"><Label>Tratamiento</Label><Textarea name="treatment" rows={2} placeholder="Tratamiento administrado e indicaciones..." /></div>
      <div className="space-y-2 col-span-2"><Label>Medicamentos</Label><Input name="medications" placeholder="Medicamentos recetados..." /></div>
      <div className="space-y-2 col-span-2"><Label>Observaciones</Label><Textarea name="notes" rows={2} placeholder="Observaciones adicionales o seguimiento..." /></div>
      <DialogFooter className="col-span-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">{submitLabel}</Button>
      </DialogFooter>
    </form>
  );
}

