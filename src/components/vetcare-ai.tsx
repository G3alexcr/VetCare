import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Sparkles,
  MessageSquare,
  FileText,
  Stethoscope,
  ClipboardList,
  Pill,
  UserCheck,
  ScanSearch,
  History,
  Settings,
  Loader2,
  Printer,
  Send,
  Upload,
  Trash2,
  X,
  Mic,
  MicOff,
  Eye,
  EyeOff,
  Package,
  AlertTriangle,
  Volume2,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useClientes } from "@/lib/clientes-store";
import { useVeterinarios } from "@/lib/veterinarios-store";
import { usePets } from "@/lib/pets-store";
import {
  useAppointments,
  useConsultations,
  useVaccines,
  useDewormings,
  useSurgeries,
  useHospitalizations,
  usePetFiles,
  usePetPhotos,
} from "@/lib/store";
import {
  useAiPanel,
  closeVetCareAI,
  openVetCareAI,
  setAiPanelTool,
  setAiPanelPet,
  useAiSettings,
  updateAiSettings,
  useAiHistory,
  addAiHistoryEntry,
  clearAiHistory,
  saveClinicAiSettings,
  type AiToolId,
  type AiProvider,
} from "@/lib/ai-store";
import { useClinics, useCurrentClinicId } from "@/lib/saas-store";
import { useProducts } from "@/lib/inventory-store";
import { runVetCareAI } from "@/lib/ai.functions";

const DISCLAIMER =
  "⚠️ Esta información es únicamente una ayuda clínica y no reemplaza el criterio profesional del veterinario.";

const BASE_SYSTEM =
  "Eres VetCare AI, un asistente clínico veterinario integrado en la plataforma VetCare. " +
  "Asistes al veterinario y al personal de la clínica; nunca reemplazas el criterio profesional. " +
  "Nunca presentes diagnósticos como definitivos: usa siempre lenguaje presuntivo " +
  "('posible', 'sospecha de', 'se recomienda descartar'). Responde en formato markdown, de forma clara y profesional.";

const SYSTEMS: Record<string, string> = {
  resumen:
    "Genera un resumen clínico estructurado del expediente completo de la mascota con estas secciones en markdown: " +
    "Datos del paciente, Historial de consultas (motivos y diagnósticos principales), Vacunas y próximas dosis, " +
    "Desparasitaciones, Cirugías, Hospitalizaciones, Medicamentos y tratamientos, Archivos y fotografías registrados, " +
    "y Alertas y pendientes (vacunas o desparasitaciones próximas, controles, citas futuras). Sé conciso y clínico.",
  diagnostico:
    "A partir de los datos clínicos proporcionados, sugiere hasta 5 diagnósticos diferenciales ordenados por probabilidad " +
    "(usa lenguaje presuntivo, nunca afirmes un diagnóstico), luego las pruebas diagnósticas recomendadas y los exámenes " +
    "de laboratorio sugeridos. Formato markdown con secciones: Posibles diagnósticos, Pruebas recomendadas, Exámenes sugeridos.",
  consulta:
    "A partir de las notas rápidas del veterinario, redacta una consulta médica veterinaria estructurada en markdown con: " +
    "Motivo de consulta, Examen físico, Hallazgos, Diagnóstico presuntivo, Tratamiento, Observaciones. " +
    "Si un dato no fue proporcionado, escribe 'No registrado'.",
  receta:
    "Genera una receta médica veterinaria profesional en markdown: primero los datos del paciente, luego una tabla " +
    "Medicamento | Dosis | Frecuencia | Duración | Vía de administración, y finalmente Indicaciones generales. " +
    "Usa dosis plausibles para la especie y peso indicados y señala que deben ser verificadas por el veterinario.",
  indicaciones:
    "Genera un documento sencillo y empático dirigido al propietario de la mascota, en markdown, con las secciones: " +
    "Cuidados en casa, Medicamentos (horarios y forma de administración), Alimentación, Próximo control, " +
    "y Signos de alarma (cuándo volver a la clínica). Lenguaje claro, sin tecnicismos.",
  documento:
    "Analiza el documento o imagen adjunta del paciente y genera en markdown: Resumen, Hallazgos relevantes y " +
    "Observaciones preliminares. Usa lenguaje presuntivo; nunca emitas diagnósticos definitivos a partir del documento.",
  chat:
    "Eres VetCare AI, el asistente inteligente y copiloto clínico de la clínica veterinaria. " +
    "Tienes acceso directo y en tiempo real a toda la base de datos de la clínica (lista completa de mascotas/pacientes, " +
    "clientes/propietarios, citas de la agenda, inventario y productos con alertas de stock, historial de consultas y equipo veterinario). " +
    "Cuando te pregunten sobre la clínica o sus registros (por ejemplo cuántas mascotas hay registradas, quién es el dueño de una mascota, " +
    "qué citas hay hoy o qué productos están por agotarse), DEBES responder con certeza, precisión y amabilidad utilizando los datos exactos del contexto de la base de datos de la clínica. " +
    "Para consultas farmacológicas o clínicas, responde con rigor veterinario profesional (dosis exactas en mg/kg para caninos o felinos, diagnósticos diferenciales y precauciones). " +
    "Si hay un expediente de paciente seleccionado, contextualiza tu respuesta con sus datos clínicos. " +
    "Sé conciso, directo, empático y responde en formato markdown.",
};

function calcAge(birthDate: string): string {
  if (!birthDate) return "—";
  const birth = new Date(birthDate);
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth()) - (now.getDate() < birth.getDate() ? 1 : 0);
  if (months < 1) return "<1 mes";
  if (months < 12) return `${months} mes${months === 1 ? "" : "es"}`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest ? `${years} año${years === 1 ? "" : "s"} ${rest} m` : `${years} año${years === 1 ? "" : "s"}`;
}

function printAiDocument(title: string, body: string) {
  const w = window.open("", "_blank", "width=820,height=900");
  if (!w) {
    toast.error("El navegador bloqueó la ventana de impresión");
    return;
  }
  const esc = body.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  w.document.write(
    `<html><head><title>${title}</title><style>` +
      `body{font-family:system-ui,sans-serif;padding:32px;line-height:1.55;color:#111}` +
      `h1{font-size:18px;margin-bottom:16px}pre{white-space:pre-wrap;font-family:inherit;font-size:13px}</style>` +
      `</head><body><h1>${title}</h1><pre>${esc}</pre><script>window.print()</script></body></html>`
  );
  w.document.close();
}

/** Construye el expediente clínico completo de una mascota como texto para el modelo. */
function useClinicalContext() {
  const consultations = useConsultations();
  const vaccines = useVaccines();
  const dewormings = useDewormings();
  const surgeries = useSurgeries();
  const hospitalizations = useHospitalizations();
  const files = usePetFiles();
  const photos = usePetPhotos();
  const appointments = useAppointments();
  const pets = usePets();
  const clientes = useClientes();
  const vets = useVeterinarios();

  return (petId: string): string => {
    const pet = pets.find((p) => p.id === petId);
    if (!pet) return "";
    const owner = clientes.find((c) => c.id === pet.clientId);
    const vetName = (id?: string) => vets.find((v) => v.id === id)?.nombre ?? "—";
    const lines: string[] = [];

    lines.push(`=== EXPEDIENTE CLÍNICO: ${pet.name} ===`);
    lines.push(
      `Especie: ${pet.species} · Raza: ${pet.breed} · Sexo: ${pet.sex} · Color: ${pet.color} · ` +
        `Nacimiento: ${pet.birthDate} (edad aprox. ${calcAge(pet.birthDate)}) · Peso: ${pet.weight} kg · ` +
        `Microchip: ${pet.microchip || "—"} · Esterilizado: ${pet.sterilized ? "Sí" : "No"}`
    );
    lines.push(`Alergias: ${pet.allergies || "Ninguna registrada"} · Notas: ${pet.notes || "—"}`);
    lines.push(`Propietario: ${owner?.fullName ?? "—"} · Tel: ${owner?.phone ?? "—"} · Email: ${owner?.email ?? "—"}`);

    const cons = consultations.filter((c) => c.petId === petId).sort((a, b) => b.date.localeCompare(a.date));
    lines.push(`\nCONSULTAS (${cons.length}):`);
    for (const c of cons) {
      lines.push(
        `- ${c.date} · Vet: ${vetName(c.vetId)} · Motivo: ${c.reason} · Peso: ${c.weight} kg · T°: ${c.temperature} °C · ` +
          `Diagnóstico: ${c.diagnosis || "—"} · Tratamiento: ${c.treatment || "—"} · Medicamentos: ${c.medications || "—"} · Notas: ${c.notes || "—"}`
      );
    }

    const vacs = vaccines.filter((v) => v.petId === petId).sort((a, b) => b.applicationDate.localeCompare(a.applicationDate));
    lines.push(`\nVACUNAS (${vacs.length}):`);
    for (const v of vacs) {
      lines.push(
        `- ${v.applicationDate} · ${v.vaccineName} · Lab: ${v.laboratory || "—"} · Lote: ${v.batchNumber || "—"} · ` +
          `Próxima dosis: ${v.nextDueDate || "—"} · Vet: ${v.veterinarian || "—"} · Notas: ${v.notes || "—"}`
      );
    }

    const dews = dewormings.filter((d) => d.petId === petId).sort((a, b) => b.applicationDate.localeCompare(a.applicationDate));
    lines.push(`\nDESPARASITACIONES (${dews.length}):`);
    for (const d of dews) {
      lines.push(
        `- ${d.applicationDate} · ${d.productName} (${d.activeIngredient || "—"}) · Tipo: ${d.dewormingType} · ` +
          `Peso: ${d.weight} kg · Dosis: ${d.dose || "—"} · Próxima: ${d.nextApplicationDate || "—"} · Vet: ${d.veterinarian || "—"}`
      );
    }

    const surgs = surgeries.filter((s) => s.petId === petId).sort((a, b) => b.surgeryDate.localeCompare(a.surgeryDate));
    lines.push(`\nCIRUGÍAS (${surgs.length}):`);
    for (const s of surgs) {
      lines.push(
        `- ${s.surgeryDate} · ${s.procedureType} · Dx preoperatorio: ${s.preoperativeDiagnosis || "—"} · ` +
          `Procedimiento: ${s.procedurePerformed || "—"} · Anestesia: ${s.anesthesiaType || "—"} · ` +
          `Medicamentos: ${s.medications || "—"} · Estado: ${s.status} · Vet: ${s.veterinarian || "—"} · Observaciones: ${s.observations || "—"}`
      );
    }

    const hosps = hospitalizations.filter((h) => h.petId === petId).sort((a, b) => b.admissionDate.localeCompare(a.admissionDate));
    lines.push(`\nHOSPITALIZACIONES (${hosps.length}):`);
    for (const h of hosps) {
      lines.push(
        `- Ingreso: ${h.admissionDate} ${h.admissionTime} · Motivo: ${h.reason} · Dx inicial: ${h.initialDiagnosis || "—"} · ` +
          `Plan: ${h.treatmentPlan || "—"} · Estado: ${h.status} (${h.patientStatus || "—"}) · Jaula: ${h.roomNumber || "—"} · ` +
          `Alta: ${h.dischargeDate || "Sigue hospitalizado"} · Vet: ${h.veterinarian || "—"}`
      );
    }

    const pfiles = files.filter((f) => f.petId === petId);
    lines.push(`\nARCHIVOS (${pfiles.length}):`);
    for (const f of pfiles) {
      lines.push(
        `- ${f.documentDate || f.createdAt.split("T")[0]} · ${f.fileName} · Categoría: ${f.fileCategory} · ` +
          `Vet: ${f.veterinarian || "—"} · Descripción: ${f.description || "—"}`
      );
    }

    const pphotos = photos.filter((p) => p.petId === petId);
    lines.push(`\nFOTOGRAFÍAS (${pphotos.length}):`);
    for (const p of pphotos) {
      lines.push(`- ${p.photoDate} · ${p.title} · Categoría: ${p.category} · Notas clínicas: ${p.clinicalNotes || "—"}`);
    }

    const appts = appointments
      .filter((a) => a.petId === petId)
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
    lines.push(`\nCITAS (${appts.length}):`);
    for (const a of appts) {
      lines.push(`- ${a.date} ${a.time} · ${a.reason} · Estado: ${a.status} · Vet: ${vetName(a.vetId)}`);
    }

    return lines.join("\n");
  };
}

/** Construye un resumen en tiempo real de la base de datos de la clínica para que la IA conozca todos los pacientes, clientes, citas, inventario y consultas */
function useGlobalClinicContext() {
  const pets = usePets();
  const clientes = useClientes();
  const appointments = useAppointments();
  const consultations = useConsultations();
  const products = useProducts();
  const vets = useVeterinarios();
  const clinics = useClinics();
  const currentClinicId = useCurrentClinicId();
  const currentClinic = clinics.find((c) => c.id === currentClinicId);

  return (): string => {
    const lines: string[] = [];
    lines.push(`=== BASE DE DATOS EN TIEMPO REAL: ${currentClinic?.name || "Clínica Veterinaria VetCare"} ===`);

    const activePets = pets.filter((p) => p.active !== false);
    lines.push(`\n🐾 PACIENTES / MASCOTAS REGISTRADAS (Total exacto: ${activePets.length} mascotas):`);
    if (activePets.length === 0) {
      lines.push("- No hay mascotas registradas actualmente en la base de datos.");
    } else {
      activePets.forEach((p, idx) => {
        const owner = clientes.find((c) => c.id === p.clientId);
        lines.push(
          `${idx + 1}. Nombre: "${p.name}" | Especie: ${p.species || "No especificada"} | Raza: ${p.breed || "Mestizo"} | Sexo: ${p.sex || "—"} | Edad aprox: ${calcAge(p.birthDate)} | Peso: ${p.weight ? p.weight + " kg" : "—"} | Propietario: ${owner?.fullName || "Sin dueño asignado"}`
        );
      });
    }

    lines.push(`\n👤 CLIENTES / PROPIETARIOS REGISTRADOS (Total exacto: ${clientes.length} clientes):`);
    if (clientes.length === 0) {
      lines.push("- No hay clientes registrados.");
    } else {
      clientes.forEach((c, idx) => {
        const owned = activePets.filter((p) => p.clientId === c.id).map((p) => p.name);
        lines.push(
          `${idx + 1}. ${c.fullName} | Teléfono: ${c.phone || "—"} | Email: ${c.email || "—"} | Mascotas: [${owned.join(", ") || "Ninguna"}]`
        );
      });
    }

    const today = new Date().toISOString().split("T")[0];
    const todayAppts = appointments.filter((a) => a.date === today);
    const upcomingAppts = appointments
      .filter((a) => a.date >= today)
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

    lines.push(`\n📅 AGENDA Y CITAS (Fecha hoy: ${today} | Citas hoy: ${todayAppts.length} | Próximas citas: ${upcomingAppts.length}):`);
    if (upcomingAppts.length === 0) {
      lines.push("- No hay citas programadas para hoy ni próximas fechas.");
    } else {
      upcomingAppts.slice(0, 15).forEach((a) => {
        const pet = pets.find((p) => p.id === a.petId);
        const vet = vets.find((v) => v.id === a.vetId);
        lines.push(`- Cita: ${a.date} a las ${a.time} | Paciente: ${pet?.name || "—"} | Motivo: ${a.reason} | Estado: ${a.status} | Médico: ${vet?.nombre || "—"}`);
      });
    }

    const lowStock = products.filter((p) => Number(p.stock) <= Number(p.minStock));
    lines.push(`\n📦 INVENTARIO DE FARMACIA Y PRODUCTOS (Total productos: ${products.length} | Productos en stock crítico o bajo: ${lowStock.length}):`);
    if (lowStock.length > 0) {
      lines.push("⚠️ Productos con stock bajo:");
      lowStock.slice(0, 15).forEach((p) => {
        lines.push(`- ${p.name}: ${p.stock} unidades en stock (mínimo requerido: ${p.minStock})`);
      });
    }

    lines.push(`\n📋 HISTORIAL DE CONSULTAS MÉDICAS (Total realizadas: ${consultations.length} consultas):`);
    const recentCons = [...consultations].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
    if (recentCons.length > 0) {
      lines.push("Últimas consultas registradas:");
      recentCons.forEach((c) => {
        const pet = pets.find((p) => p.id === c.petId);
        lines.push(`- ${c.date} | Paciente: ${pet?.name || "—"} | Motivo: ${c.reason} | Diagnóstico: ${c.diagnosis || "—"}`);
      });
    }

    if (vets.length > 0) {
      lines.push(`\n👨‍⚕️ EQUIPO VETERINARIO (${vets.length} veterinarios): ` + vets.map((v) => `${v.nombre} (${v.especialidad || "General"})`).join(", "));
    }

    return lines.join("\n");
  };
}

type AiAttachment = { name: string; kind: "image" | "file"; dataUrl: string };

function useAiRunner() {
  const settings = useAiSettings();
  const clinics = useClinics();
  const currentClinicId = useCurrentClinicId();
  const currentClinic = clinics.find((c) => c.id === currentClinicId);
  const { user } = useAuth();
  const pets = usePets();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const run = async (opts: {
    tool: string;
    system: string;
    prompt: string;
    petId?: string;
    attachments?: AiAttachment[];
  }): Promise<string | null> => {
    setLoading(true);
    setResult("");
    try {
      const effectiveProvider = (currentClinic?.aiProvider as AiProvider) || settings.provider || "openai";
      const effectiveApiKey = currentClinic?.aiApiKey || settings.apiKey || undefined;
      const effectiveModel = currentClinic?.aiModel || settings.model || "gpt-4o-mini";
      const lang =
        settings.language === "en" ? "Responde íntegramente en inglés." : "Responde íntegramente en español.";
      const res = await runVetCareAI({
        data: {
          system: `${opts.system}\n${lang}`,
          prompt: opts.prompt,
          provider: effectiveProvider,
          model: effectiveModel,
          apiKey: effectiveApiKey,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
          attachments: opts.attachments,
        },
      });
      setResult(res.text);
      const pet = opts.petId ? pets.find((p) => p.id === opts.petId) : undefined;
      addAiHistoryEntry({
        tool: opts.tool,
        question: opts.prompt.slice(0, 500),
        answer: res.text,
        userName: user?.name ?? "—",
        petId: pet?.id,
        petName: pet?.name,
      });
      return res.text;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al consultar VetCare AI");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, result, setResult, run };
}

function ResultView({
  loading,
  result,
  printTitle,
}: {
  loading: boolean;
  result: string;
  printTitle?: string;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" /> VetCare AI está analizando…
      </div>
    );
  }
  if (!result) return null;
  return (
    <Card className="p-4 mt-4 space-y-3 border-primary/30">
      {printTitle && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => printAiDocument(printTitle, result)}>
            <Printer className="h-4 w-4 mr-2" /> Imprimir / PDF
          </Button>
        </div>
      )}
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown>{result}</ReactMarkdown>
      </div>
      <div className="text-[11px] text-muted-foreground border-t pt-2">{DISCLAIMER}</div>
    </Card>
  );
}

function PetPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const pets = usePets();
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Seleccionar mascota" />
      </SelectTrigger>
      <SelectContent>
        {pets.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name} · {p.species}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ToolHeading({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-4">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
    </div>
  );
}

// -------- Hook TTS híbrido: Fish Audio → fallback navegador --------

function useTTS() {
  const settings = useAiSettings();
  const clinics = useClinics();
  const currentClinicId = useCurrentClinicId();
  const currentClinic = clinics.find((c) => c.id === currentClinicId);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [speaking, setSpeaking] = useState(false);

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  };

  const speak = async (text: string) => {
    stop();
    setSpeaking(true);

    const clean = text
      .replace(/#{1,6}\s/g, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/`{1,3}/g, "")
      .replace(/>\s/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\n{2,}/g, ". ")
      .replace(/\n/g, " ")
      .trim()
      .slice(0, 3000);

    const fishKey = settings.fishApiKey || currentClinic?.fishAudioApiKey || "";
    const fishVoice = settings.fishVoiceId || currentClinic?.fishAudioVoiceId || "655e3fff79c7463dbf70e2ed5c4bd5d3";

    if (fishKey) {
      try {
        const { runFishAudioTTS } = await import("@/lib/tts.functions");
        const res = await runFishAudioTTS({
          data: {
            text: clean,
            apiKey: fishKey,
            voiceId: fishVoice || undefined,
          },
        });
        const audio = new Audio(res.audioDataUrl);
        audioRef.current = audio;
        audio.onended = () => setSpeaking(false);
        audio.onerror = (e) => {
          console.error("Audio playback error:", e);
          setSpeaking(false);
          browserSpeak(clean);
        };
        await audio.play();
        return;
      } catch (err: any) {
        console.warn("Fish Audio TTS falló, usando voz del navegador:", err);
      }
    }

    browserSpeak(clean);
  };

  const browserSpeak = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "es-ES";
    utter.rate = 1.0;
    utter.pitch = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find((v) => v.lang.startsWith("es") && v.localService) || voices.find((v) => v.lang.startsWith("es"));
    if (esVoice) utter.voice = esVoice;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
  };

  return { speak, stop, speaking };
}

// ---------------- Herramientas ----------------

function useSpeechDictation(onTranscript: (chunk: string) => void) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = "es-ES";
      rec.onresult = (e: any) => {
        let text = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) {
            text += e.results[i][0].transcript + " ";
          }
        }
        if (text) onTranscript(text);
      };
      rec.onerror = () => setListening(false);
      rec.onend = () => setListening(false);
      recognitionRef.current = rec;
    }
  }, [onTranscript]);

  const toggle = () => {
    if (!recognitionRef.current) {
      toast.error("El dictado por voz no está disponible en este navegador (se recomienda Chrome o Edge).");
      return;
    }
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
      toast.info("Dictado pausado.");
    } else {
      try {
        recognitionRef.current.start();
        setListening(true);
        toast.info("🎙️ Escuchando... Dicta tus notas clínicas.");
      } catch (err) {
        console.error(err);
      }
    }
  };

  return { listening, toggle };
}

function ChatTool() {
  const panel = useAiPanel();
  const buildContext = useClinicalContext();
  const buildClinicSummary = useGlobalClinicContext();
  const { loading, run } = useAiRunner();
  const settings = useAiSettings();
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const petId = panel.petId ?? "";
  const products = useProducts();
  const { speak, stop, speaking } = useTTS();
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);

  const { listening, toggle: toggleDictation } = useSpeechDictation((transcribed) => {
    setInput((prev) => (prev ? `${prev} ${transcribed}` : transcribed));
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSpeak = (text: string, idx: number) => {
    if (speaking && speakingIdx === idx) {
      stop();
      setSpeakingIdx(null);
    } else {
      setSpeakingIdx(idx);
      speak(text);
    }
  };

  const handleCommand = (cmd: string) => {
    if (cmd === "/inventario") {
      const lowStock = products.filter((p) => Number(p.stock) <= Number(p.minStock));
      if (!lowStock.length) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text: "✅ **Inventario saludable**: Todos los medicamentos y vacunas están por encima del stock mínimo.",
          },
        ]);
        return;
      }
      const rows = lowStock
        .map((p) => `| ${p.name} | ${p.stock} | ${p.minStock} | ${p.category || "—"} |`)
        .join("\n");
      const table = `## ⚠️ Medicamentos y vacunas por agotarse\n\n| Producto | Stock actual | Stock mínimo | Categoría |\n|---|---|---|---|\n${rows}`;
      setMessages((m) => [...m, { role: "assistant", text: table }]);
      return;
    }

    if (cmd === "/receta") {
      setAiPanelTool("receta");
      return;
    }
    if (cmd === "/diagnostico") {
      setAiPanelTool("diagnostico");
      return;
    }
    if (cmd === "/alta") {
      setAiPanelTool("indicaciones");
      return;
    }
    setInput(cmd + " ");
  };

  const send = async () => {
    const question = input.trim();
    if (!question || loading) return;

    if (question.startsWith("/")) {
      const cmd = question.split(" ")[0];
      if (["/inventario", "/receta", "/diagnostico", "/alta"].includes(cmd)) {
        setInput("");
        handleCommand(cmd);
        return;
      }
    }

    setInput("");
    setMessages((m) => [...m, { role: "user", text: question }]);
    const transcript = [...messages, { role: "user" as const, text: question }]
      .map((m) => `${m.role === "user" ? "Personal" : "VetCare AI"}: ${m.text}`)
      .join("\n");
    const clinicContext = `\n\n${buildClinicSummary()}`;
    const petContext = petId ? `\n\nCONTEXTO DEL EXPEDIENTE DEL PACIENTE SELECCIONADO:\n${buildContext(petId)}` : "";
    const answer = await run({
      tool: "Buscador clínico",
      system: SYSTEMS.chat,
      prompt: `Conversación:\n${transcript}${clinicContext}${petContext}\n\nResponde a la última pregunta del usuario utilizando los datos reales de la clínica proporcionados arriba.`,
      petId: petId || undefined,
    });
    if (answer) {
      setMessages((m) => [...m, { role: "assistant", text: answer }]);
      const idx = messages.length + 1;
      setSpeakingIdx(idx);
      void speak(answer);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ToolHeading
        title="Copiloto Clínico & Buscador"
        desc="Habla con el micrófono, escribe en el campo de texto o usa los comandos rápidos — siempre ambas opciones disponibles."
      />
      <div className="mb-2 max-w-xs">
        <PetPicker value={petId} onChange={(v) => setAiPanelPet(v)} />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2.5">
        <button
          onClick={() => handleCommand("/receta")}
          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition-colors flex items-center gap-1"
        >
          💊 /receta
        </button>
        <button
          onClick={() => handleCommand("/diagnostico")}
          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition-colors flex items-center gap-1"
        >
          🩺 /diagnostico
        </button>
        <button
          onClick={() => handleCommand("/alta")}
          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition-colors flex items-center gap-1"
        >
          📄 /alta
        </button>
        <button
          onClick={() => handleCommand("/inventario")}
          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors flex items-center gap-1"
        >
          <AlertTriangle className="w-3 h-3" /> /inventario
        </button>
      </div>

      <div className="flex-1 min-h-[260px] max-h-[400px] overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 && (
          <div className="text-xs text-muted-foreground border rounded-xl p-4 space-y-2 bg-muted/20">
            <div className="font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Copiloto Médico Activo:
            </div>
            <div>• 🎙️ Usa el <b>micrófono</b> para dictar hallazgos mientras examinas al paciente.</div>
            <div>• ⌨️ O <b>escribe directamente</b> en el campo de texto — siempre disponible ambas opciones.</div>
            <div>• 🔊 Cada respuesta tiene un botón para <b>escucharla en voz alta</b>.</div>
            <div>• Toca <b>/inventario</b> para ver medicamentos por agotarse.</div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`group relative max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
              m.role === "user"
                ? "bg-teal-600 text-white rounded-br-xs"
                : "bg-muted text-foreground rounded-bl-xs shadow-2xs border"
            }`}>
              {m.role === "user" ? (
                m.text
              ) : (
                <>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  </div>
                  <button
                    onClick={() => handleSpeak(m.text, i)}
                    title={speaking && speakingIdx === i ? "Detener lectura" : "Escuchar respuesta"}
                    className={`mt-2 flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border transition-all ${
                      speaking && speakingIdx === i
                        ? "bg-red-100 dark:bg-red-950/40 text-red-700 border-red-300 animate-pulse"
                        : "bg-background text-muted-foreground border-border hover:text-teal-600 hover:border-teal-300"
                    }`}
                  >
                    <Volume2 className="w-3 h-3" />
                    {speaking && speakingIdx === i ? "Detener" : "Escuchar"}
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" /> Analizando expediente clínico…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3 space-y-2">
        {listening && (
          <div className="flex items-center gap-2 text-xs text-red-600 font-medium bg-red-50 dark:bg-red-950/30 rounded-xl px-3 py-1.5 border border-red-200 dark:border-red-800">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
            Escuchando tu voz en tiempo real — lo que digas aparecerá en el campo de texto abajo
          </div>
        )}
        <div className="flex gap-2 items-center">
          <Button
            type="button"
            size="icon"
            variant={listening ? "destructive" : "outline"}
            onClick={toggleDictation}
            title={listening ? "Detener dictado de voz" : "Dictar por voz (el texto aparece abajo)"}
            className={`h-10 w-10 shrink-0 rounded-xl transition-all ${listening ? "animate-pulse ring-2 ring-red-500" : ""}`}
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4 text-teal-600" />}
          </Button>
          <Input
            placeholder="Escribe aquí o dicta con el micrófono (ambas opciones siempre disponibles)…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            disabled={loading}
            className="rounded-xl flex-1"
          />
          <Button
            size="icon"
            onClick={send}
            disabled={loading || !input.trim()}
            className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {messages.length > 0 && <div className="text-[11px] text-muted-foreground mt-2">{DISCLAIMER}</div>}
    </div>
  );
}

function ResumenTool() {
  const panel = useAiPanel();
  const buildContext = useClinicalContext();
  const { loading, result, run } = useAiRunner();
  const petId = panel.petId ?? "";
  const pets = usePets();

  return (
    <div>
      <ToolHeading
        title="Resumen clínico del expediente"
        desc="Síntesis automática de consultas, vacunas, cirugías, hospitalizaciones, archivos y citas."
      />
      <div className="flex gap-2 items-end flex-wrap">
        <div className="flex-1 min-w-[200px] space-y-1.5">
          <Label>Mascota</Label>
          <PetPicker value={petId} onChange={(v) => setAiPanelPet(v)} />
        </div>
        <Button
          disabled={!petId || loading}
          onClick={() =>
            run({
              tool: "Resumen clínico",
              system: SYSTEMS.resumen,
              prompt: `Genera el resumen clínico de esta mascota:\n\n${buildContext(petId)}`,
              petId,
            })
          }
        >
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          Generar resumen
        </Button>
      </div>
      <ResultView loading={loading} result={result} printTitle={petId ? `Resumen clínico — ${pets.find((p) => p.id === petId)?.name}` : undefined} />
    </div>
  );
}

function DiagnosticoTool() {
  const panel = useAiPanel();
  const buildContext = useClinicalContext();
  const { loading, result, run } = useAiRunner();
  const [reason, setReason] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [temperature, setTemperature] = useState("");
  const petId = panel.petId ?? "";

  const pets = usePets();
  const pet = pets.find((p) => p.id === petId);

  return (
    <div>
      <ToolHeading
        title="Sugerir diagnósticos diferenciales"
        desc="Propone diagnósticos presuntivos, pruebas recomendadas y exámenes sugeridos. Nunca definitivos."
      />
      <div className="grid gap-3">
        <div className="space-y-1.5">
          <Label>Mascota (opcional, aporta contexto del expediente)</Label>
          <PetPicker value={petId} onChange={(v) => setAiPanelPet(v)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Motivo de consulta *</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej. Vómitos y decaimiento" />
          </div>
          <div className="space-y-1.5">
            <Label>Temperatura (°C)</Label>
            <Input type="number" step="0.1" value={temperature} onChange={(e) => setTemperature(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Síntomas observados *</Label>
          <Textarea rows={3} value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="Describe los signos clínicos…" />
        </div>
        <Button
          className="w-fit"
          disabled={!reason.trim() || !symptoms.trim() || loading}
          onClick={() => {
            const lines = [
              `Motivo de consulta: ${reason}`,
              `Síntomas: ${symptoms}`,
              temperature ? `Temperatura: ${temperature} °C` : "",
              pet
                ? `Paciente: ${pet.name} · ${pet.species} · ${pet.breed} · ${pet.sex} · Edad aprox. ${calcAge(pet.birthDate)} · Peso ${pet.weight} kg · Alergias: ${pet.allergies || "ninguna"}`
                : "",
              petId ? `\nExpediente del paciente:\n${buildContext(petId)}` : "",
            ]
              .filter(Boolean)
              .join("\n");
            run({ tool: "Diagnósticos diferenciales", system: SYSTEMS.diagnostico, prompt: lines, petId: petId || undefined });
          }}
        >
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Stethoscope className="h-4 w-4 mr-2" />}
          Sugerir diagnósticos
        </Button>
      </div>
      <ResultView loading={loading} result={result} />
    </div>
  );
}

function ConsultaTool() {
  const panel = useAiPanel();
  const buildContext = useClinicalContext();
  const { loading, result, run } = useAiRunner();
  const [notes, setNotes] = useState("");
  const petId = panel.petId ?? "";
  const pets = usePets();
  const pet = pets.find((p) => p.id === petId);

  return (
    <div>
      <ToolHeading
        title="Generador de consulta médica"
        desc="Convierte notas rápidas en una consulta estructurada lista para el expediente."
      />
      <div className="grid gap-3">
        <div className="space-y-1.5">
          <Label>Mascota *</Label>
          <PetPicker value={petId} onChange={(v) => setAiPanelPet(v)} />
        </div>
        <div className="space-y-1.5">
          <Label>Notas rápidas del veterinario *</Label>
          <Textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej. Acude por tos de 3 días, T° 39.2, auscultación normal, se indica jarabe y control en 5 días…"
          />
        </div>
        <Button
          className="w-fit"
          disabled={!petId || !notes.trim() || loading}
          onClick={() =>
            run({
              tool: "Consulta generada",
              system: SYSTEMS.consulta,
              prompt:
                `Paciente: ${pet?.name} · ${pet?.species} · ${pet?.breed} · ${pet?.sex} · ${pet?.weight} kg\n` +
                `Notas rápidas: ${notes}\n\nHistorial reciente:\n${buildContext(petId).split("\n").slice(0, 12).join("\n")}`,
              petId,
            })
          }
        >
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ClipboardList className="h-4 w-4 mr-2" />}
          Generar consulta
        </Button>
      </div>
      <ResultView loading={loading} result={result} printTitle={pet ? `Consulta — ${pet.name}` : undefined} />
    </div>
  );
}

function RecetaTool() {
  const panel = useAiPanel();
  const { loading, result, run } = useAiRunner();
  const [context, setContext] = useState("");
  const petId = panel.petId ?? "";
  const pets = usePets();
  const pet = pets.find((p) => p.id === petId);

  return (
    <div>
      <ToolHeading
        title="Generador de recetas veterinarias"
        desc="Redacta la receta con medicamentos, dosis, frecuencia, duración e indicaciones."
      />
      <div className="grid gap-3">
        <div className="space-y-1.5">
          <Label>Mascota *</Label>
          <PetPicker value={petId} onChange={(v) => setAiPanelPet(v)} />
        </div>
        <div className="space-y-1.5">
          <Label>Diagnóstico y medicamentos a prescribir *</Label>
          <Textarea
            rows={4}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Ej. Otitis externa. Prescribir limpiador ótico y antiinflamatorio por 7 días…"
          />
        </div>
        <Button
          className="w-fit"
          disabled={!petId || !context.trim() || loading}
          onClick={() =>
            run({
              tool: "Receta veterinaria",
              system: SYSTEMS.receta,
              prompt:
                `Paciente: ${pet?.name} · ${pet?.species} · ${pet?.breed} · ${pet?.sex} · Peso: ${pet?.weight} kg · ` +
                `Alergias: ${pet?.allergies || "ninguna"}\nIndicación del veterinario: ${context}`,
              petId,
            })
          }
        >
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Pill className="h-4 w-4 mr-2" />}
          Generar receta
        </Button>
      </div>
      <ResultView loading={loading} result={result} printTitle={pet ? `Receta — ${pet.name}` : undefined} />
    </div>
  );
}

function IndicacionesTool() {
  const panel = useAiPanel();
  const { loading, result, run } = useAiRunner();
  const [context, setContext] = useState("");
  const petId = panel.petId ?? "";
  const pets = usePets();
  const clientes = useClientes();
  const pet = pets.find((p) => p.id === petId);
  const owner = pet ? clientes.find((c) => c.id === pet.clientId) : undefined;

  return (
    <div>
      <ToolHeading
        title="Indicaciones para el propietario"
        desc="Documento claro para el dueño: cuidados, medicamentos, alimentación y signos de alarma."
      />
      <div className="grid gap-3">
        <div className="space-y-1.5">
          <Label>Mascota *</Label>
          <PetPicker value={petId} onChange={(v) => setAiPanelPet(v)} />
        </div>
        <div className="space-y-1.5">
          <Label>Contexto clínico (motivo, tratamiento, recomendaciones) *</Label>
          <Textarea
            rows={4}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Ej. Esterilización realizada hoy. Mantener reposo 5 días, collar isabelino, curación en 7 días…"
          />
        </div>
        <Button
          className="w-fit"
          disabled={!petId || !context.trim() || loading}
          onClick={() =>
            run({
              tool: "Indicaciones al propietario",
              system: SYSTEMS.indicaciones,
              prompt:
                `Mascota: ${pet?.name} (${pet?.species} · ${pet?.breed}) · Propietario: ${owner?.fullName ?? "—"}\n` +
                `Contexto clínico: ${context}`,
              petId,
            })
          }
        >
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserCheck className="h-4 w-4 mr-2" />}
          Generar indicaciones
        </Button>
      </div>
      <ResultView loading={loading} result={result} printTitle={pet ? `Indicaciones — ${pet.name}` : undefined} />
    </div>
  );
}

function DocumentoTool() {
  const panel = useAiPanel();
  const buildContext = useClinicalContext();
  const { loading, result, run } = useAiRunner();
  const [question, setQuestion] = useState("");
  const [file, setFile] = useState<AiAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const petId = panel.petId ?? "";

  const pickFile = (f: File) => {
    const isImage = f.type.startsWith("image/");
    const isPdf = f.type === "application/pdf";
    if (!isImage && !isPdf) {
      toast.error("Solo se admiten imágenes o archivos PDF");
      return;
    }
    if (f.size > 4 * 1024 * 1024) {
      toast.error("El archivo supera 4 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setFile({ name: f.name, kind: isImage ? "image" : "file", dataUrl: String(reader.result) });
    reader.readAsDataURL(f);
  };

  return (
    <div>
      <ToolHeading
        title="Análisis de documentos e imágenes"
        desc="Sube radiografías, informes de laboratorio o documentos clínicos para un análisis preliminar."
      />
      <div className="grid gap-3">
        <div className="space-y-1.5">
          <Label>Mascota (opcional, aporta contexto)</Label>
          <PetPicker value={petId} onChange={(v) => setAiPanelPet(v)} />
        </div>
        <div className="space-y-1.5">
          <Label>Documento o imagen *</Label>
          {file ? (
            <div className="flex items-center gap-2 border rounded-lg p-2 text-sm">
              {file.kind === "image" ? (
                <img src={file.dataUrl} alt={file.name} className="h-10 w-10 rounded object-cover" />
              ) : (
                <FileText className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="flex-1 truncate">{file.name}</span>
              <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" /> Seleccionar archivo (imagen o PDF, máx. 4 MB)
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) pickFile(f);
              e.target.value = "";
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Pregunta o indicación (opcional)</Label>
          <Textarea rows={2} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ej. ¿Qué valores están fuera de rango?" />
        </div>
        <Button
          className="w-fit"
          disabled={!file || loading}
          onClick={() =>
            run({
              tool: "Análisis de documento",
              system: SYSTEMS.documento,
              prompt:
                `${question.trim() ? `Pregunta del veterinario: ${question}\n\n` : ""}` +
                `Analiza el documento adjunto.${petId ? `\n\nContexto del paciente:\n${buildContext(petId).split("\n").slice(0, 6).join("\n")}` : ""}`,
              petId: petId || undefined,
              attachments: file ? [file] : undefined,
            })
          }
        >
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ScanSearch className="h-4 w-4 mr-2" />}
          Analizar documento
        </Button>
      </div>
      <ResultView loading={loading} result={result} />
    </div>
  );
}

function HistorialTool() {
  const history = useAiHistory();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-start justify-between gap-2 mb-4">
        <ToolHeading title="Historial de consultas IA" desc="Registro local de las consultas realizadas a VetCare AI." />
        {history.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearAiHistory();
              toast.success("Historial eliminado");
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Limpiar
          </Button>
        )}
      </div>
      <div className="space-y-3">
        {history.map((h) => (
          <Card key={h.id} className="p-3">
            <button className="w-full text-left" onClick={() => setExpanded(expanded === h.id ? null : h.id)}>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-[10px]">{h.tool}</Badge>
                {h.petName && <Badge variant="outline" className="text-[10px]">{h.petName}</Badge>}
                <span className="text-[11px] text-muted-foreground ml-auto">
                  {new Date(h.createdAt).toLocaleString()} · {h.userName}
                </span>
              </div>
              <div className="text-sm mt-1.5 line-clamp-2">{h.question}</div>
            </button>
            {expanded === h.id && (
              <div className="prose prose-sm max-w-none dark:prose-invert border-t mt-3 pt-3">
                <ReactMarkdown>{h.answer}</ReactMarkdown>
              </div>
            )}
          </Card>
        ))}
        {history.length === 0 && (
          <Card className="p-10 text-center text-sm text-muted-foreground">
            Aún no hay consultas a VetCare AI.
          </Card>
        )}
      </div>
    </div>
  );
}

const FISH_LATIN_VOICES = [
  { id: "655e3fff79c7463dbf70e2ed5c4bd5d3", name: "Verity — Asistente Femenina (Español Latino) ⭐ Recomendada" },
  { id: "07a03f5ca90849b3bf0638135b0a40c3", name: "Natasha — Femenina Cálida (Español)" },
  { id: "21adf3cda02a4aa88dc593353cc9d715", name: "Jarvis — Asistente Masculino (Español Latino)" },
  { id: "fe01beac32a141fc8173aac6c8729499", name: "Médico — Profesional Clínico Masculino (Español)" },
  { id: "custom", name: "Personalizada (Ingresar ID propio de Fish Audio)" },
];

function ConfigTool() {
  const currentClinicId = useCurrentClinicId();
  const clinics = useClinics();
  const currentClinic = clinics.find((c) => c.id === currentClinicId);

  const settings = useAiSettings();
  const [form, setForm] = useState(settings);
  const [emergencyPhone, setEmergencyPhone] = useState(currentClinic?.emergencyPhone || "");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingVoice, setTestingVoice] = useState(false);

  useEffect(() => {
    if (currentClinic) {
      const savedModel = currentClinic.aiModel;
      const cleanModel =
        !savedModel || savedModel.includes("gpt-5") || savedModel.includes("sol")
          ? "gpt-4o-mini"
          : savedModel;

      setForm((prev) => ({
        ...prev,
        provider: (currentClinic.aiProvider as AiProvider) || prev.provider || "openai",
        apiKey: currentClinic.aiApiKey || prev.apiKey || "",
        model: cleanModel,
        fishApiKey: currentClinic.fishAudioApiKey || prev.fishApiKey || "",
        fishVoiceId: currentClinic.fishAudioVoiceId || prev.fishVoiceId || "655e3fff79c7463dbf70e2ed5c4bd5d3",
        autoSpeak: currentClinic.aiAutoSpeak ?? prev.autoSpeak ?? false,
      }));
      if (currentClinic.emergencyPhone) {
        setEmergencyPhone(currentClinic.emergencyPhone);
      }
    } else {
      setForm(settings);
    }
  }, [currentClinic, settings]);

  const handleTestVoice = async () => {
    const key = form.fishApiKey || currentClinic?.fishAudioApiKey;
    if (!key) {
      toast.error("Ingresa tu API Key de Fish Audio antes de probar la voz.");
      return;
    }
    const voice = form.fishVoiceId || "655e3fff79c7463dbf70e2ed5c4bd5d3";
    setTestingVoice(true);
    try {
      const { runFishAudioTTS } = await import("@/lib/tts.functions");
      const res = await runFishAudioTTS({
        data: {
          text: "Hola, soy el copiloto de inteligencia artificial de tu veterinaria. ¿En qué te puedo ayudar hoy?",
          apiKey: key,
          voiceId: voice,
        },
      });
      const audio = new Audio(res.audioDataUrl);
      audio.onended = () => setTestingVoice(false);
      audio.onerror = () => {
        setTestingVoice(false);
        toast.error("Error al reproducir el audio de prueba.");
      };
      await audio.play();
    } catch (err: any) {
      setTestingVoice(false);
      toast.error("Error al probar voz: " + (err.message || err));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      updateAiSettings(form);
      if (currentClinicId) {
        await saveClinicAiSettings(currentClinicId, {
          provider: form.provider,
          apiKey: form.apiKey,
          model: form.model,
          emergencyPhone: emergencyPhone.trim(),
          fishApiKey: form.fishApiKey,
          fishVoiceId: form.fishVoiceId,
          autoSpeak: form.autoSpeak,
        });
      }
      toast.success("Configuración de IA, Voz y Urgencias guardada en Supabase");
      setAiPanelTool("chat");
    } catch (err: any) {
      toast.error("Error al guardar: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <ToolHeading
        title="Configuración de IA & Urgencias"
        desc="Configura tus credenciales de IA (OpenAI / Gemini) y canal de emergencias guardados de forma segura en Supabase (sin localStorage)."
      />
      <div className="grid gap-4 max-w-md pb-6">
        <div className="space-y-1.5">
          <Label>Proveedor de Inteligencia Artificial</Label>
          <Select
            value={form.provider}
            onValueChange={(v) => {
              const provider = v as AiProvider;
              setForm({
                ...form,
                provider,
                model:
                  provider === "gemini"
                    ? "gemini-1.5-flash"
                    : provider === "openai"
                      ? "gpt-4o-mini"
                      : "claude-sonnet",
              });
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI (Oficial)</SelectItem>
              <SelectItem value="gemini">Google Gemini (Oficial)</SelectItem>
              <SelectItem value="claude" disabled>Anthropic Claude — próximamente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>API Key de tu cuenta ({form.provider === "gemini" ? "Google AI Studio" : "OpenAI"})</Label>
            <span className="text-[10px] text-teal-600 font-medium">Cero LocalStorage • Guardado en Supabase</span>
          </div>
          <div className="relative">
            <Input
              type={showKey ? "text" : "password"}
              placeholder={form.provider === "gemini" ? "AIzaSy..." : "sk-proj-..."}
              value={form.apiKey || ""}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              className="pr-10 font-mono text-xs"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Ingresa tu propia clave para llamadas clínicas ilimitadas con tu cuota directa de proveedor.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>Modelo oficial</Label>
          <Input
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            className="font-mono text-xs"
            placeholder={form.provider === "gemini" ? "gemini-1.5-flash" : "gpt-4o-mini"}
          />
          {form.provider === "openai" ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setForm({ ...form, model: "gpt-4o-mini" })}
                className={`text-[11px] px-2 py-0.5 rounded-md border transition-all ${
                  form.model === "gpt-4o-mini"
                    ? "bg-teal-600 text-white border-teal-600 font-bold"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                gpt-4o-mini (Recomendado)
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, model: "gpt-4o" })}
                className={`text-[11px] px-2 py-0.5 rounded-md border transition-all ${
                  form.model === "gpt-4o"
                    ? "bg-teal-600 text-white border-teal-600 font-bold"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                gpt-4o (Avanzado)
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, model: "o3-mini" })}
                className={`text-[11px] px-2 py-0.5 rounded-md border transition-all ${
                  form.model === "o3-mini"
                    ? "bg-teal-600 text-white border-teal-600 font-bold"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                o3-mini
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setForm({ ...form, model: "gemini-1.5-flash" })}
                className={`text-[11px] px-2 py-0.5 rounded-md border transition-all ${
                  form.model === "gemini-1.5-flash"
                    ? "bg-teal-600 text-white border-teal-600 font-bold"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                gemini-1.5-flash (Recomendado)
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, model: "gemini-2.0-flash" })}
                className={`text-[11px] px-2 py-0.5 rounded-md border transition-all ${
                  form.model === "gemini-2.0-flash"
                    ? "bg-teal-600 text-white border-teal-600 font-bold"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                gemini-2.0-flash
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, model: "gemini-1.5-pro" })}
                className={`text-[11px] px-2 py-0.5 rounded-md border transition-all ${
                  form.model === "gemini-1.5-pro"
                    ? "bg-teal-600 text-white border-teal-600 font-bold"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                gemini-1.5-pro
              </button>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">
            {form.provider === "openai"
              ? "Usa gpt-4o-mini para respuestas clínicas veloces y económicas con tu API Key."
              : "Usa gemini-1.5-flash para máxima velocidad y contexto extenso."}
          </p>
        </div>

        <div className="space-y-1.5 pt-2 border-t">
          <Label className="text-red-700 dark:text-red-400 font-semibold flex items-center gap-1.5">
            🚨 Teléfono de Urgencias 24/7 (Portal de Clientes)
          </Label>
          <Input
            type="tel"
            placeholder="+506 8888-8888 o 2222-3333"
            value={emergencyPhone}
            onChange={(e) => setEmergencyPhone(e.target.value)}
          />
          <p className="text-[11px] text-muted-foreground">
            Si el triaje automático del dueño de mascota detecta signos de riesgo vital o emergencia roja, mostrará de inmediato un botón para llamar a este número.
          </p>
        </div>

        {/* ── Sección Fish Audio TTS ── */}
        <div className="space-y-3 pt-3 border-t">
          <div>
            <Label className="font-semibold flex items-center gap-1.5">
              🔊 Voz de IA — Fish Audio TTS
            </Label>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Cada respuesta de la IA tendrá un botón 🔊 <b>Escuchar</b>. Con Fish Audio obtienes voz hiperrealista en español por tu propia cuenta.
              Sin clave, la IA habla usando la voz gratuita del navegador como respaldo automático.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>API Key de Fish Audio</Label>
              <a href="https://fish.audio" target="_blank" rel="noopener noreferrer" className="text-[10px] text-teal-600 hover:underline">
                Obtener clave en fish.audio →
              </a>
            </div>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                placeholder="Empieza con tu clave de Fish Audio..."
                value={form.fishApiKey || ""}
                onChange={(e) => setForm({ ...form, fishApiKey: e.target.value })}
                className="pr-10 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Guardada por clínica en Supabase. Sin clave → voz del navegador (gratis, siempre disponible).
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Voz en Español Latino (Fish Audio)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1 text-teal-700 dark:text-teal-400 border-teal-300 dark:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                disabled={testingVoice}
                onClick={handleTestVoice}
              >
                {testingVoice ? <Loader2 className="w-3 h-3 animate-spin" /> : <Volume2 className="w-3.5 h-3.5" />}
                {testingVoice ? "Reproduciendo..." : "🔊 Probar voz"}
              </Button>
            </div>

            <Select
              value={
                FISH_LATIN_VOICES.some((v) => v.id === form.fishVoiceId)
                  ? form.fishVoiceId
                  : form.fishVoiceId
                    ? "custom"
                    : "655e3fff79c7463dbf70e2ed5c4bd5d3"
              }
              onValueChange={(val) => {
                if (val === "custom") {
                  if (FISH_LATIN_VOICES.some((v) => v.id === form.fishVoiceId)) {
                    setForm({ ...form, fishVoiceId: "" });
                  }
                } else {
                  setForm({ ...form, fishVoiceId: val });
                }
              }}
            >
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Seleccionar voz latina..." />
              </SelectTrigger>
              <SelectContent>
                {FISH_LATIN_VOICES.map((v) => (
                  <SelectItem key={v.id} value={v.id} className="text-xs">
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(!FISH_LATIN_VOICES.some((v) => v.id === form.fishVoiceId && v.id !== "custom") ||
              form.fishVoiceId === "custom") && (
              <div className="pt-1 space-y-1">
                <Label className="text-[11px] text-muted-foreground">ID Personalizado de Fish Audio</Label>
                <Input
                  placeholder="Pega el reference_id de tu voz clonada en fish.audio"
                  value={form.fishVoiceId === "custom" ? "" : form.fishVoiceId || ""}
                  onChange={(e) => setForm({ ...form, fishVoiceId: e.target.value })}
                  className="font-mono text-xs"
                />
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">
              Voz con acento latino cálido y natural. Puedes cambiar de voz o clonar la tuya en{" "}
              <a href="https://fish.audio" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">
                fish.audio
              </a>.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-xl border px-4 py-3 bg-muted/20">
            <div>
              <Label className="font-medium">Lectura automática</Label>
              <p className="text-[11px] text-muted-foreground">
                La IA leerá en voz alta cada respuesta automáticamente sin tocar el botón 🔊.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, autoSpeak: !form.autoSpeak })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                form.autoSpeak ? "bg-teal-600" : "bg-muted border"
              }`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                form.autoSpeak ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div className="space-y-1.5">
            <Label>Temperatura (0–1)</Label>
            <Input
              type="number"
              min={0}
              max={1}
              step={0.1}
              value={form.temperature}
              onChange={(e) =>
                setForm({ ...form, temperature: Math.max(0, Math.min(1, Number(e.target.value) || 0)) })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Máx. tokens</Label>
            <Input
              type="number"
              min={256}
              max={8192}
              step={256}
              value={form.maxTokens}
              onChange={(e) => setForm({ ...form, maxTokens: Math.max(256, Math.min(8192, Number(e.target.value) || 2048)) })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Idioma de las respuestas</Label>
          <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v as "es" | "en" })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          className="w-full bg-teal-600 hover:bg-teal-700 text-white mt-2"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Guardar configuración en Supabase
        </Button>
      </div>
    </div>
  );
}

// ---------------- Panel principal ----------------

const TOOLS: Array<{ id: AiToolId; label: string; icon: typeof Sparkles }> = [
  { id: "chat", label: "Asistente", icon: MessageSquare },
  { id: "resumen", label: "Resumen clínico", icon: FileText },
  { id: "diagnostico", label: "Diagnósticos", icon: Stethoscope },
  { id: "consulta", label: "Consulta", icon: ClipboardList },
  { id: "receta", label: "Receta", icon: Pill },
  { id: "indicaciones", label: "Indicaciones", icon: UserCheck },
  { id: "documento", label: "Documentos", icon: ScanSearch },
  { id: "historial", label: "Historial", icon: History },
  { id: "config", label: "Configuración", icon: Settings },
];

export function VetCareAIFloating() {
  const panel = useAiPanel();

  return (
    <>
      <button
        onClick={() => openVetCareAI(panel.tool, panel.petId)}
        className="fixed bottom-14 sm:bottom-16 right-4 sm:right-6 z-40 flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all text-sm font-medium"
      >
        <Sparkles className="h-4 w-4" /> Go2Vet AI
      </button>

      <Sheet open={panel.open} onOpenChange={(o) => !o && closeVetCareAI()}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b shrink-0">
            <SheetTitle className="flex items-center gap-2 text-base">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary grid place-items-center">
                <Sparkles className="h-4 w-4" />
              </div>
              Go2Vet AI
              <Badge variant="secondary" className="text-[10px] font-normal">Asistente clínico</Badge>
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-1 min-h-0">
            <nav className="w-14 shrink-0 border-r flex flex-col items-center py-3 gap-1 overflow-y-auto">
              {TOOLS.map((t) => {
                const Icon = t.icon;
                const active = panel.tool === t.id;
                return (
                  <button
                    key={t.id}
                    title={t.label}
                    onClick={() => setAiPanelTool(t.id)}
                    className={`h-10 w-10 rounded-lg grid place-items-center transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </nav>
            <div className="flex-1 min-w-0 overflow-y-auto p-4">
              {panel.tool === "chat" && <ChatTool />}
              {panel.tool === "resumen" && <ResumenTool />}
              {panel.tool === "diagnostico" && <DiagnosticoTool />}
              {panel.tool === "consulta" && <ConsultaTool />}
              {panel.tool === "receta" && <RecetaTool />}
              {panel.tool === "indicaciones" && <IndicacionesTool />}
              {panel.tool === "documento" && <DocumentoTool />}
              {panel.tool === "historial" && <HistorialTool />}
              {panel.tool === "config" && <ConfigTool />}
            </div>
          </div>
          <div className="border-t px-4 py-2 text-[11px] text-muted-foreground shrink-0">{DISCLAIMER}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}
