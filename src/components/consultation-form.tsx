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
import { useAppointments, STANDARD_HOURS, type LinkedConsultation } from "@/lib/store";
import { Clock } from "lucide-react";

export type ConsultationFormDefaults = {
  date?: string;
  time?: string;
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
  onSubmit: (data: Omit<LinkedConsultation, "id" | "appointmentId" | "clinicId"> & { clientId?: string; time?: string }) => void;
  submitLabel?: string;
}) {
  const today = toLocalDateStr(new Date());
  const clientes = useClientes();
  const pets = usePets();
  const vets = useVeterinarios();
  const appointments = useAppointments();
  const d = defaults ?? {};

  const [selectedDate, setSelectedDate] = useState<string>(d.date ?? today);
  const [selectedTime, setSelectedTime] = useState<string>(d.time ?? "09:00");
  const [selectedVetId, setSelectedVetId] = useState<string>(d.vetId ?? vets[0]?.id ?? "");

  // Resolve initial client & pet
  const defaultPet = pets.find((p) => p.id === d.petId);
  const initialClientId = d.clientId || defaultPet?.clientId || clientes[0]?.id || "";
  const [selectedClientId, setSelectedClientId] = useState<string>(initialClientId);

  const availablePets = useMemo(() => {
    return selectedClientId ? pets.filter((p) => p.clientId === selectedClientId) : pets;
  }, [pets, selectedClientId]);

  const initialPetId = d.petId || availablePets[0]?.id || pets[0]?.id || "";
  const [selectedPetId, setSelectedPetId] = useState<string>(initialPetId);

  // Horas ya reservadas para la fecha y veterinario seleccionados
  const bookedHours = useMemo(() => {
    return new Set(
      appointments
        .filter(
          (a) =>
            a.date === selectedDate &&
            (!selectedVetId || a.vetId === selectedVetId) &&
            a.status !== "Cancelada"
        )
        .map((a) => a.time)
    );
  }, [appointments, selectedDate, selectedVetId]);

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
      date: selectedDate,
      time: selectedTime,
      vetId: selectedVetId || v.vetId,
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
      <div className="space-y-1.5">
        <Label>Fecha</Label>
        <Input
          name="date"
          type="date"
          required
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>Hora de atención</Label>
          <span className={`text-[11px] font-semibold ${bookedHours.has(selectedTime) ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
            {bookedHours.has(selectedTime) ? "⚠️ Horario ocupado" : "✓ Horario disponible"}
          </span>
        </div>
        <Input
          name="time"
          type="time"
          required
          value={selectedTime}
          onChange={(e) => setSelectedTime(e.target.value)}
        />
      </div>

      {/* Selector rápido de horas disponibles */}
      <div className="col-span-2 space-y-2 p-3 rounded-xl border bg-slate-50/80 dark:bg-slate-900/40">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <Clock className="h-3.5 w-3.5 text-emerald-600" />
            Horarios disponibles ({selectedDate}):
          </span>
          <span className="text-[11px] text-muted-foreground">
            {STANDARD_HOURS.length - bookedHours.size} libres · {bookedHours.size} ocupados
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {STANDARD_HOURS.map((hour) => {
            const isBooked = bookedHours.has(hour);
            const isSelected = selectedTime === hour;
            return (
              <button
                type="button"
                key={hour}
                disabled={isBooked}
                onClick={() => setSelectedTime(hour)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400 font-bold"
                    : isBooked
                    ? "bg-slate-200/80 dark:bg-slate-800 text-slate-400 dark:text-slate-600 line-through cursor-not-allowed opacity-60"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 cursor-pointer shadow-2xs"
                }`}
                title={isBooked ? `Horario ${hour} ya ocupado` : `Seleccionar ${hour}`}
              >
                {hour}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5 col-span-2 sm:col-span-2">
        <Label>Veterinario asignado</Label>
        <Select name="vetId" value={selectedVetId} onValueChange={setSelectedVetId}>
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

