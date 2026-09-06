import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Bot,
  AlertTriangle,
  PhoneCall,
  Calendar,
  BookOpen,
  Send,
  X,
  RefreshCw,
  Stethoscope,
  HeartPulse,
  Clock,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useClinics, useCurrentClinicId } from "@/lib/saas-store";
import { usePets } from "@/lib/pets-store";
import { Link } from "@tanstack/react-router";
import { runVetCareAI } from "@/lib/ai.functions";

const EMERGENCY_KEYWORDS = [
  "envenen",
  "veneno",
  "tóxic",
  "toxico",
  "convulsi",
  "ataque",
  "atropell",
  "sangr",
  "hemorragia",
  "asfixia",
  "no respira",
  "ahogo",
  "ahogando",
  "dificultad para respirar",
  "inconsciente",
  "desmay",
  "colaps",
  "golpe de calor",
  "hueso atravesado",
  "moribund",
];

type Message = {
  id: string;
  sender: "user" | "bot";
  text: string;
  options?: string[];
  isEmergency?: boolean;
};

const TRIAGE_STEPS = [
  {
    question: "¿Tu mascota ha tenido vómitos en las últimas 12 horas?",
    options: ["Sí, varias veces", "Solo una vez", "No ha vomitado"],
  },
  {
    question: "¿Cómo está su nivel de energía y ánimo?",
    options: ["Muy decaído / no se levanta", "Un poco apático", "Activo y normal"],
  },
  {
    question: "¿Ha tomado agua o comido el día de hoy?",
    options: ["Rechaza comida y agua", "Solo bebe agua", "Come normal"],
  },
  {
    question: "¿Presenta diarrea o cambios al orinar?",
    options: ["Sí, con sangre", "Diarrea líquida sin sangre", "Deposiciones normales"],
  },
];

export function PortalAIAssistant() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"triaje" | "traductor" | "dudas">("triaje");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m0",
      sender: "bot",
      text: "¡Hola! 🐾 Soy tu asistente virtual de cuidado veterinario. ¿Cómo se siente tu mascota hoy? Puedes describirme sus síntomas o tocar una opción rápida.",
      options: ["Tengo una duda sobre síntomas", "¿Cuándo acudir a urgencias?", "Traducir un examen médico"],
    },
  ]);
  const [input, setInput] = useState("");
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [triageIndex, setTriageIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const clinics = useClinics();
  const currentClinicId = useCurrentClinicId();
  const clinic = clinics.find((c) => c.id === currentClinicId) || clinics[0];
  const pets = usePets();
  const [selectedPet, setSelectedPet] = useState<string>(pets[0]?.name || "mi mascota");

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isEmergencyActive, loading]);

  const checkEmergency = (text: string): boolean => {
    const lower = text.toLowerCase();
    return EMERGENCY_KEYWORDS.some((kw) => lower.includes(kw));
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    if (!textToSend) setInput("");

    // 1. Detección de Emergencia ("Filtro Rojo")
    if (checkEmergency(text)) {
      setIsEmergencyActive(true);
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, sender: "user", text },
        {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: "🚨 **¡ALERTA DE EMERGENCIA VITAL DETECTADA!**\nLos signos que describes requieren atención médica veterinaria presencial inmediata. **No esperes respuestas en este chat**.",
          isEmergency: true,
        },
      ]);
      return;
    }

    // Mensaje normal del usuario
    setMessages((prev) => [...prev, { id: `user-${Date.now()}`, sender: "user", text }]);
    setLoading(true);

    try {
      if (activeTab === "triaje" && triageIndex < TRIAGE_STEPS.length) {
        // Flujo guiado de triaje
        setTimeout(() => {
          const nextStep = TRIAGE_STEPS[triageIndex];
          setTriageIndex((i) => i + 1);
          setMessages((prev) => [
            ...prev,
            {
              id: `bot-${Date.now()}`,
              sender: "bot",
              text: `Entendido. Evaluando a **${selectedPet}**:\n\n${nextStep.question}`,
              options: nextStep.options,
            },
          ]);
          setLoading(false);
        }, 600);
        return;
      }

      // Si terminó el triaje o es pregunta libre / traductor, consultamos al modelo
      const systemPrompt =
        activeTab === "traductor"
          ? "Eres un traductor médico veterinario empático. Explica los términos diagnósticos complejos, recetas o exámenes de laboratorio en un lenguaje cotidiano, cálido y fácil de comprender para el dueño de una mascota. Recuerda siempre que el veterinario tratante tiene la palabra final."
          : `Eres el asistente virtual de la clínica veterinaria ${clinic?.name || "Go2Vet"}. Atiendes amablemente a los dueños de mascotas. Da recomendaciones de cuidados preventivos, orientación de signos de alarma y sugiere agendar cita si los síntomas persisten. No recetes fármacos de venta bajo receta médica.`;

      const response = await runVetCareAI({
        data: {
          system: systemPrompt,
          prompt: `Dueño de ${selectedPet}: ${text}`,
          provider: (clinic?.aiProvider as any) || "openai",
          apiKey: clinic?.aiApiKey || undefined,
          model: clinic?.aiModel || undefined,
          temperature: 0.3,
          maxTokens: 500,
        },
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: response.text || "Gracias por la información. Te recomendamos agendar una cita médica para una revisión completa.",
          options: ["Agendar cita en la clínica", "Hacer otra consulta", "Reiniciar triaje"],
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: `Hemos registrado los síntomas de **${selectedPet}**. Te recomendamos acudir a consulta médica o agendar una cita para su bienestar.`,
          options: ["Agendar cita", "Reiniciar triaje"],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = (option: string) => {
    if (option === "Reiniciar triaje") {
      setTriageIndex(0);
      setIsEmergencyActive(false);
      setMessages([
        {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: `Iniciando nuevo triaje para **${selectedPet}**. ¿Cuál es el síntoma principal que presenta?`,
          options: ["Fiebre / decaimiento", "Vómito o diarrea", "Problemas en la piel", "Cojera / dolor"],
        },
      ]);
      return;
    }
    if (option === "Agendar cita en la clínica" || option === "Agendar cita") {
      setOpen(false);
      window.location.href = "/portal/agenda";
      return;
    }
    handleSendMessage(option);
  };

  const emergencyNumber = clinic?.emergencyPhone || clinic?.phone || "+506 2222-9999";

  return (
    <>
      {/* Botón flotante en el Portal */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-14 sm:bottom-16 right-4 sm:right-6 z-40 flex items-center gap-2.5 rounded-full bg-teal-600 hover:bg-teal-700 text-white px-4 py-3 shadow-xl hover:shadow-2xl hover:scale-[1.03] transition-all text-sm font-semibold border-2 border-white/20 group"
      >
        <div className="relative">
          <Sparkles className="h-5 w-5 text-amber-300 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-teal-600" />
        </div>
        <span>Asistente Go2Vet</span>
        <Badge variant="secondary" className="bg-teal-800 text-teal-100 text-[10px] uppercase tracking-wider font-bold">
          24/7
        </Badge>
      </button>

      {/* Panel lateral de Triaje y Chat */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col bg-slate-50 dark:bg-slate-950">
          {/* Header */}
          <SheetHeader className="p-4 bg-white dark:bg-slate-900 border-b shrink-0 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-teal-500/10 text-teal-600 grid place-items-center">
                  <HeartPulse className="h-5 w-5" />
                </div>
                <div>
                  <SheetTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    Go2Vet Guía & Triaje
                  </SheetTitle>
                  <p className="text-[11px] text-muted-foreground">Orientación clínica inmediata para tu mascota</p>
                </div>
              </div>
              <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50 text-[10px] font-bold">
                Online
              </Badge>
            </div>

            {/* Pestañas rápidas */}
            <div className="flex gap-1.5 pt-1">
              <button
                onClick={() => {
                  setActiveTab("triaje");
                  setTriageIndex(0);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "triaje" ? "bg-teal-600 text-white shadow-xs" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" /> Triaje Síntomas
              </button>
              <button
                onClick={() => setActiveTab("traductor")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "traductor" ? "bg-teal-600 text-white shadow-xs" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" /> Traductor Médico
              </button>
              <button
                onClick={() => setActiveTab("dudas")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "dudas" ? "bg-teal-600 text-white shadow-xs" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" /> Dudas 24/7
              </button>
            </div>
          </SheetHeader>

          {/* Banner de FILTRO ROJO DE EMERGENCIA si se detecta riesgo */}
          {isEmergencyActive && (
            <div className="p-4 bg-red-600 text-white space-y-3 animate-in fade-in zoom-in-95 duration-200 shrink-0 shadow-lg">
              <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wide">
                <AlertTriangle className="w-5 h-5 animate-bounce" /> Atención: Posible Urgencia Médica
              </div>
              <p className="text-xs text-red-100 leading-relaxed">
                Por la seguridad de tu mascota, los síntomas graves no deben esperar. Comunícate directamente con el equipo de urgencias de la clínica o acude de inmediato:
              </p>
              <div className="flex flex-col gap-2 pt-1">
                <a
                  href={`tel:${emergencyNumber.replace(/[^0-9+]/g, "")}`}
                  className="w-full py-2.5 px-4 bg-white text-red-700 hover:bg-red-50 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <PhoneCall className="w-4 h-4" /> LLAMAR A URGENCIAS (${emergencyNumber})
                </a>
                <button
                  onClick={() => setIsEmergencyActive(false)}
                  className="text-[11px] text-red-200 hover:text-white underline text-center"
                >
                  No es una emergencia crítica, continuar consulta
                </button>
              </div>
            </div>
          )}

          {/* Área de Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                    m.sender === "user"
                      ? "bg-teal-600 text-white rounded-br-xs"
                      : m.isEmergency
                      ? "bg-red-100 border border-red-300 text-red-950 dark:bg-red-950/40 dark:text-red-200"
                      : "bg-white dark:bg-slate-900 border border-border text-foreground rounded-bl-xs shadow-xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>

                {/* Botones de Opción Múltiple Interactivos */}
                {m.options && m.options.length > 0 && !isEmergencyActive && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                    {m.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleOptionClick(opt)}
                        className="px-3 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800 text-xs font-semibold transition-all flex items-center gap-1 shadow-2xs"
                      >
                        <span>{opt}</span>
                        <ChevronRight className="w-3 h-3 opacity-60" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 bg-white dark:bg-slate-900 rounded-2xl border w-fit">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" /> Analizando síntomas con Go2Vet AI...
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Disclaimer Legal Obligatorio */}
          <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/20 border-t border-amber-200/50 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-amber-600" />
            <span>Soy un asistente virtual clínico. Mis sugerencias son orientativas y nunca reemplazan la consulta con tu veterinario.</span>
          </div>

          {/* Compositor de Mensajes */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t shrink-0 flex items-center gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                activeTab === "traductor"
                  ? "Escribe o pega el texto médico que deseas que te explique..."
                  : "¿Qué síntomas notas en tu mascota?"
              }
              rows={1}
              className="min-h-[42px] max-h-24 resize-none text-xs sm:text-sm py-2 px-3 rounded-xl border-border bg-slate-50 dark:bg-slate-800"
            />
            <Button
              size="icon"
              disabled={loading || !input.trim()}
              onClick={() => handleSendMessage()}
              className="h-10 w-10 shrink-0 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
