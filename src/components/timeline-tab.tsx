import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useVeterinarios } from "@/lib/veterinarios-store";
import {
  useConsultations,
  useVaccines,
  useDewormings,
  useSurgeries,
  useHospitalizations,
  usePetFiles,
  usePetPhotos,
  useAppointments,
} from "@/lib/store";

type EventType =
  | "Consulta"
  | "Vacuna"
  | "Desparasitación"
  | "Cirugía"
  | "Hospitalización"
  | "Archivo"
  | "Fotografía"
  | "Cita";

type TimelineEvent = {
  id: string;
  date: string;
  type: EventType;
  icon: string;
  title: string;
  summary: string;
  veterinarian: string;
  searchBlob: string;
};

const TYPE_COLORS: Record<EventType, string> = {
  Consulta: "bg-sky-100 text-sky-700 border-sky-200",
  Vacuna: "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Desparasitación": "bg-lime-100 text-lime-700 border-lime-200",
  "Cirugía": "bg-rose-100 text-rose-700 border-rose-200",
  "Hospitalización": "bg-amber-100 text-amber-700 border-amber-200",
  Archivo: "bg-slate-100 text-slate-700 border-slate-200",
  "Fotografía": "bg-violet-100 text-violet-700 border-violet-200",
  Cita: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

const ALL_TYPES: EventType[] = [
  "Consulta",
  "Vacuna",
  "Desparasitación",
  "Cirugía",
  "Hospitalización",
  "Archivo",
  "Fotografía",
  "Cita",
];

export function TimelineTab({ petId }: { petId: string }) {
  const consultations = useConsultations();
  const vaccines = useVaccines();
  const dewormings = useDewormings();
  const surgeries = useSurgeries();
  const hospitalizations = useHospitalizations();
  const files = usePetFiles();
  const photos = usePetPhotos();
  const appointments = useAppointments();
  const vets = useVeterinarios();

  const [filters, setFilters] = useState<EventType[]>(ALL_TYPES);
  const [q, setQ] = useState("");

  const events: TimelineEvent[] = useMemo(() => {
    const list: TimelineEvent[] = [];
    const vetName = (id?: string) => vets.find((v) => v.id === id)?.nombre ?? "—";

    consultations
      .filter((c) => c.petId === petId)
      .forEach((c) =>
        list.push({
          id: `co-${c.id}`,
          date: c.date,
          type: "Consulta",
          icon: "🩺",
          title: `Consulta — ${c.reason}`,
          summary: `Diagnóstico: ${c.diagnosis || "—"}${c.treatment ? ` · Tratamiento: ${c.treatment}` : ""}`,
          veterinarian: vetName(c.vetId),
          searchBlob: `${c.reason} ${c.diagnosis} ${c.treatment} ${c.medications} ${c.notes} ${vetName(c.vetId)}`,
        })
      );

    vaccines
      .filter((v) => v.petId === petId)
      .forEach((v) =>
        list.push({
          id: `va-${v.id}`,
          date: v.applicationDate,
          type: "Vacuna",
          icon: "💉",
          title: `Vacuna ${v.vaccineName}`,
          summary: `Lote ${v.batchNumber || "—"} · Próxima dosis: ${v.nextDueDate || "—"}`,
          veterinarian: v.veterinarian,
          searchBlob: `${v.vaccineName} ${v.laboratory} ${v.notes} ${v.veterinarian}`,
        })
      );

    dewormings
      .filter((d) => d.petId === petId)
      .forEach((d) =>
        list.push({
          id: `de-${d.id}`,
          date: d.applicationDate,
          type: "Desparasitación",
          icon: "🦠",
          title: `Desparasitación ${d.dewormingType}`,
          summary: `${d.productName} · Dosis: ${d.dose} · Próxima: ${d.nextApplicationDate || "—"}`,
          veterinarian: d.veterinarian,
          searchBlob: `${d.productName} ${d.activeIngredient} ${d.notes} ${d.veterinarian}`,
        })
      );

    surgeries
      .filter((s) => s.petId === petId)
      .forEach((s) =>
        list.push({
          id: `su-${s.id}`,
          date: s.surgeryDate,
          type: "Cirugía",
          icon: "🏥",
          title: `Cirugía — ${s.procedureType}`,
          summary: `${s.procedurePerformed || s.preoperativeDiagnosis || "—"} · Estado: ${s.status}`,
          veterinarian: s.veterinarian,
          searchBlob: `${s.procedureType} ${s.procedurePerformed} ${s.preoperativeDiagnosis} ${s.observations} ${s.veterinarian}`,
        })
      );

    hospitalizations
      .filter((h) => h.petId === petId)
      .forEach((h) =>
        list.push({
          id: `ho-${h.id}`,
          date: h.admissionDate,
          type: "Hospitalización",
          icon: "🏨",
          title: `Hospitalización — ${h.reason}`,
          summary: `${h.initialDiagnosis || "—"} · Estado: ${h.status}${h.dischargeDate ? ` · Alta: ${h.dischargeDate}` : ""}`,
          veterinarian: h.veterinarian,
          searchBlob: `${h.reason} ${h.initialDiagnosis} ${h.treatmentPlan} ${h.observations} ${h.veterinarian}`,
        })
      );

    files
      .filter((f) => f.petId === petId)
      .forEach((f) =>
        list.push({
          id: `fi-${f.id}`,
          date: f.documentDate || f.createdAt.split("T")[0],
          type: "Archivo",
          icon: "📄",
          title: `${f.fileCategory} — ${f.fileName}`,
          summary: f.description || "Documento clínico adjunto",
          veterinarian: f.veterinarian || "—",
          searchBlob: `${f.fileName} ${f.fileCategory} ${f.description} ${f.veterinarian}`,
        })
      );

    photos
      .filter((p) => p.petId === petId)
      .forEach((p) =>
        list.push({
          id: `ph-${p.id}`,
          date: p.photoDate,
          type: "Fotografía",
          icon: "📷",
          title: `${p.category} — ${p.title}`,
          summary: p.clinicalNotes || "Fotografía clínica",
          veterinarian: p.veterinarian || "—",
          searchBlob: `${p.title} ${p.category} ${p.clinicalNotes} ${p.veterinarian}`,
        })
      );

    appointments
      .filter((a) => a.petId === petId)
      .forEach((a) =>
        list.push({
          id: `ap-${a.id}`,
          date: a.date,
          type: "Cita",
          icon: "📅",
          title: `Cita ${a.time} — ${a.reason}`,
          summary: `Estado: ${a.status}`,
          veterinarian: vetName(a.vetId),
          searchBlob: `${a.reason} ${a.status} ${vetName(a.vetId)}`,
        })
      );

    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [petId, consultations, vaccines, dewormings, surgeries, hospitalizations, files, photos, appointments, vets]);

  const filtered = events.filter((e) => {
    if (!filters.includes(e.type)) return false;
    if (!q.trim()) return true;
    return e.searchBlob.toLowerCase().includes(q.trim().toLowerCase());
  });

  const totalEvents = events.length;
  const lastConsult = events.find((e) => e.type === "Consulta");
  const lastVaccine = events.find((e) => e.type === "Vacuna");
  const lastSurgery = events.find((e) => e.type === "Cirugía");

  const toggle = (t: EventType) =>
    setFilters((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Stat label="Total eventos" value={totalEvents} />
        <Stat label="Última atención" value={lastConsult?.date ?? "—"} />
        <Stat label="Última vacuna" value={lastVaccine?.date ?? "—"} />
        <Stat label="Última cirugía" value={lastSurgery?.date ?? "—"} />
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por diagnóstico, procedimiento, veterinario..."
            className="pl-8"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFilters(filters.length === ALL_TYPES.length ? [] : ALL_TYPES)}
        >
          {filters.length === ALL_TYPES.length ? "Ninguno" : "Todos"}
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {ALL_TYPES.map((t) => {
          const active = filters.includes(t);
          return (
            <button
              key={t}
              onClick={() => toggle(t)}
              className={`text-xs px-2.5 py-1 rounded-full border transition ${
                active ? TYPE_COLORS[t] : "bg-muted text-muted-foreground border-transparent opacity-60"
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          Sin eventos clínicos para los filtros seleccionados.
        </Card>
      ) : (
        <ol className="relative border-l border-border ml-3 space-y-4">
          {filtered.map((e) => (
            <li key={e.id} className="ml-4">
              <span className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full bg-background border border-border text-[10px]">
                {e.icon}
              </span>
              <Card className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="text-xs text-muted-foreground">{e.date}</div>
                    <div className="font-semibold mt-0.5">
                      <span className="mr-1">{e.icon}</span>
                      {e.title}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">{e.summary}</div>
                    <div className="text-xs text-muted-foreground mt-1">Veterinario: {e.veterinarian}</div>
                  </div>
                  <Badge variant="outline" className={TYPE_COLORS[e.type]}>
                    {e.type}
                  </Badge>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold mt-0.5">{value}</div>
    </Card>
  );
}
