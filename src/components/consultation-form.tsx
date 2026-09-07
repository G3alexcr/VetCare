import { useState, useMemo, useRef } from "react";
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
import { Clock, Mic, MicOff, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { structureConsultationVoice } from "@/lib/ai.functions";
import { useClinics, useCurrentClinicId } from "@/lib/saas-store";
import { useAiSettings } from "@/lib/ai-store";

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
  const clinics = useClinics();
  const currentClinicId = useCurrentClinicId();
  const currentClinic = clinics.find((c) => c.id === currentClinicId);
  const aiSettings = useAiSettings();

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

  // Estados de los campos de la consulta médica (para auto-llenado por voz con IA)
  const [reason, setReason] = useState<string>(d.reason ?? "");
  const [weight, setWeight] = useState<string>(defaultPet?.weight ? String(defaultPet.weight) : "");
  const [temperature, setTemperature] = useState<string>("");
  const [diagnosis, setDiagnosis] = useState<string>("");
  const [treatment, setTreatment] = useState<string>("");
  const [medications, setMedications] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Estado del dictado por voz y estructuración
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [structuring, setStructuring] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startRecording = () => {
    if (typeof window === "undefined") return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      toast.error("Tu navegador no soporta reconocimiento de voz. Usa Google Chrome o Microsoft Edge.");
      return;
    }
    const rec = new SpeechRec();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "es-ES";
    rec.onresult = (e: any) => {
      let full = "";
      for (let i = 0; i < e.results.length; i++) {
        full += e.results[i][0].transcript + " ";
      }
      setTranscript(full.trim());
    };
    rec.onerror = (e: any) => {
      console.error("Speech rec error:", e);
      setRecording(false);
    };
    rec.onend = () => setRecording(false);
    recognitionRef.current = rec;
    try {
      rec.start();
      setRecording(true);
      toast.info("🎙️ Grabando consulta... Habla con naturalidad sobre el paciente.");
    } catch (err) {
      console.error(err);
    }
  };

  const stopAndStructure = async () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setRecording(false);
    }
    const textToProcess = transcript.trim();
    if (!textToProcess) {
      toast.error("No se detectó ningún texto en la grabación.");
      return;
    }

    setStructuring(true);
    try {
      const activePet = pets.find((p) => p.id === selectedPetId);
      const petContext = activePet
        ? `Paciente: ${activePet.name}, Especie: ${activePet.species}, Raza: ${activePet.breed}`
        : undefined;

      const effectiveProvider = (currentClinic?.aiProvider as any) || aiSettings.provider || "openai";
      const effectiveApiKey = currentClinic?.aiApiKey || aiSettings.apiKey || undefined;
      const effectiveModel = currentClinic?.aiModel || aiSettings.model || "gpt-4o-mini";

      const res = await structureConsultationVoice({
        data: {
          transcript: textToProcess,
          petContext,
          provider: effectiveProvider,
          apiKey: effectiveApiKey,
          model: effectiveModel,
        },
      });

      if (res.data) {
        if (res.data.reason) setReason(res.data.reason);
        if (res.data.weight !== undefined) setWeight(String(res.data.weight));
        if (res.data.temperature !== undefined) setTemperature(String(res.data.temperature));
        if (res.data.diagnosis) setDiagnosis(res.data.diagnosis);
        if (res.data.treatment) setTreatment(res.data.treatment);
        if (res.data.medications) setMedications(res.data.medications);
        if (res.data.notes) setNotes(res.data.notes);
        toast.success("✨ ¡Historia clínica estructurada con éxito! Revisa los campos y guarda.");
      }
    } catch (err: any) {
      toast.error("Error al procesar con IA: " + (err.message || err));
    } finally {
      setStructuring(false);
    }
  };

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
    if (petObj?.weight && !weight) {
      setWeight(String(petObj.weight));
    }
  };

  const handle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit({
      date: selectedDate,
      time: selectedTime,
      vetId: selectedVetId,
      petId: selectedPetId,
      clientId: selectedClientId,
      reason: reason.trim() || "Consulta general",
      weight: Number(weight) || 0,
      temperature: Number(temperature) || 0,
      diagnosis: diagnosis.trim(),
      treatment: treatment.trim(),
      medications: medications.trim(),
      notes: notes.trim(),
    });
  };

  return (
    <form onSubmit={handle} className="grid grid-cols-2 gap-4">
      {/* ── BANNER ASISTENTE DE VOZ PARA LA CONSULTA ── */}
      <div className="col-span-2 rounded-2xl border border-teal-200 dark:border-teal-800 bg-gradient-to-r from-teal-50/70 via-emerald-50/40 to-teal-50/70 dark:from-teal-950/30 dark:via-emerald-950/20 dark:to-teal-950/30 p-3.5 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <span className="text-xs font-bold text-teal-950 dark:text-teal-200">
                Dictado Inteligente de Consulta con IA
              </span>
              <p className="text-[11px] text-muted-foreground">
                Graba mientras revisas al paciente. La IA estructurará motivo, peso, T°, diagnóstico, tratamiento y receta automáticamente en los campos.
              </p>
            </div>
          </div>

          {/* Botón de acción */}
          <div className="flex items-center gap-2 shrink-0">
            {!recording ? (
              <Button
                type="button"
                size="sm"
                onClick={startRecording}
                disabled={structuring}
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs gap-1.5 text-xs font-semibold"
              >
                <Mic className="h-3.5 w-3.5" />
                Grabar Consulta por Voz
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={stopAndStructure}
                disabled={structuring}
                className="rounded-xl shadow-xs gap-1.5 text-xs font-semibold animate-pulse"
              >
                <MicOff className="h-3.5 w-3.5" />
                Terminar y Estructurar con IA
              </Button>
            )}
          </div>
        </div>

        {/* Estado en vivo mientras graba */}
        {recording && (
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-700 space-y-1.5">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-red-600">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping inline-block" />
              Escuchando en vivo... Habla libremente sobre los signos, diagnóstico, tratamiento y receta:
            </div>
            <p className="text-xs text-foreground italic bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-dashed">
              {transcript || "Comienza a hablar ahora..."}
            </p>
          </div>
        )}

        {/* Indicador de procesamiento IA */}
        {structuring && (
          <div className="flex items-center gap-2 text-xs text-teal-800 dark:text-teal-200 p-2.5 rounded-xl bg-teal-100/70 dark:bg-teal-900/50 border border-teal-300">
            <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
            La IA está estructurando la historia clínica en los campos del formulario abajo...
          </div>
        )}
      </div>

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
        <Label>Motivo de consulta</Label>
        <Input
          name="reason"
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ej. Control general, vómitos, cojera..."
        />
      </div>
      <div className="space-y-2">
        <Label>Peso (kg)</Label>
        <Input
          name="weight"
          type="number"
          step="0.1"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="Ej. 12.5"
        />
      </div>
      <div className="space-y-2">
        <Label>Temperatura (°C)</Label>
        <Input
          name="temperature"
          type="number"
          step="0.1"
          value={temperature}
          onChange={(e) => setTemperature(e.target.value)}
          placeholder="Ej. 38.5"
        />
      </div>
      <div className="space-y-2 col-span-2">
        <Label>Diagnóstico</Label>
        <Textarea
          name="diagnosis"
          rows={2}
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder="Diagnóstico presuntivo o definitivo..."
        />
      </div>
      <div className="space-y-2 col-span-2">
        <Label>Tratamiento aplicado / pautas</Label>
        <Textarea
          name="treatment"
          rows={2}
          value={treatment}
          onChange={(e) => setTreatment(e.target.value)}
          placeholder="Tratamiento administrado en clínica, curaciones..."
        />
      </div>
      <div className="space-y-2 col-span-2">
        <Label>Medicamentos y Receta</Label>
        <Input
          name="medications"
          value={medications}
          onChange={(e) => setMedications(e.target.value)}
          placeholder="Ej. Amoxicilina 250mg c/12h x 7 días, Meloxicam..."
        />
      </div>
      <div className="space-y-2 col-span-2">
        <Label>Observaciones y Recomendaciones</Label>
        <Textarea
          name="notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observaciones adicionales, control en X días, signos de alarma..."
        />
      </div>
      <DialogFooter className="col-span-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">{submitLabel}</Button>
      </DialogFooter>
    </form>
  );
}
