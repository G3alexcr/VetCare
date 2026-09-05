import { useState } from "react";
import { WebsiteSettings, VET_TEMPLATES, DEFAULT_SECTIONS, saveWebsiteSettings, VetTemplateId } from "@/lib/website-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Star, Calendar, ShieldCheck, Heart, AlertCircle, Phone, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export function DesignTab({ settings }: { settings: WebsiteSettings }) {
  const [primary, setPrimary] = useState(settings.identity.primary_color);
  const [secondary, setSecondary] = useState(settings.identity.secondary_color);
  const [accent, setAccent] = useState(settings.identity.accent_color);

  const applyTemplate = (id: VetTemplateId) => {
    const tpl = VET_TEMPLATES.find((t) => t.id === id);
    saveWebsiteSettings({
      template_id: id,
      identity: {
        primary_color: tpl?.defaultColors.primary,
        secondary_color: tpl?.defaultColors.secondary,
        accent_color: tpl?.defaultColors.accent,
      },
    });
    if (tpl) {
      setPrimary(tpl.defaultColors.primary);
      setSecondary(tpl.defaultColors.secondary);
      setAccent(tpl.defaultColors.accent);
    }
    toast.success(`Plantilla "${tpl?.name}" aplicada con éxito`);
  };

  const saveColors = () => {
    saveWebsiteSettings({ identity: { primary_color: primary, secondary_color: secondary, accent_color: accent } });
    toast.success("Colores de marca actualizados");
  };

  const sections = settings.sections_config || DEFAULT_SECTIONS;
  const sectionLabels: Record<string, string> = {
    hero: "Portada / Hero Principal",
    about: "Sobre Nosotros y Filosofía",
    metrics: "Métricas y Logros de Confianza",
    services: "Catálogo de Servicios",
    health_plans: "Planes de Salud / Paquetes Preventivos",
    team: "Doctores y Especialistas",
    testimonials: "Testimonios y Reseñas de Clientes",
    gallery: "Galería de Mascotas",
    blog_news: "Blog / Consejos Médicos",
    faqs: "Preguntas Frecuentes (FAQs)",
    contact_booking: "Contacto y Agendamiento de Citas",
  };

  const toggleSection = (key: string, val: boolean) => {
    const cur = sections[key] || { order: 5, enabled: true };
    saveWebsiteSettings({ sections_config: { ...sections, [key]: { ...cur, enabled: val } } });
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-6xl mx-auto">
      
      {/* Encabezado */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold text-xs uppercase tracking-wider">
                100% Modo Claro & Personalizable
              </span>
              <span className="text-xs text-slate-500">• 5 Arquetipos Únicos</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mt-1">Catálogo de Plantillas Visuales</h2>
            <p className="text-sm text-slate-500 mt-1">
              Cada plantilla posee una arquitectura y estilo gráfico totalmente diferenciado para enamorar a las clínicas y a los dueños de mascotas. Tu contenido se adapta automáticamente sin perder datos.
            </p>
          </div>
        </div>
      </div>

      {/* Grid de Plantillas con Vistas Previas Ilustradas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {VET_TEMPLATES.map((t) => {
          const active = settings.template_id === t.id;
          return (
            <div 
              key={t.id} 
              className={`rounded-3xl border-2 transition-all overflow-hidden flex flex-col justify-between ${
                active 
                  ? "border-teal-600 bg-white shadow-xl ring-2 ring-teal-600/20" 
                  : "border-slate-200 bg-white hover:border-slate-300 shadow-xs hover:shadow-md"
              }`}
            >
              {/* Miniatura Gráfica Fiel de la Plantilla */}
              <div className="relative border-b border-slate-100 overflow-hidden bg-slate-50">
                
                {/* Visual Preview 0: Govet Especialidades */}
                {t.id === "govet" && (
                  <div className="h-48 p-3 bg-[#F8FAFC] flex flex-col justify-between text-[9px] select-none">
                    {/* Topbar verde esmeralda */}
                    <div className="h-3.5 bg-gradient-to-r from-emerald-900 to-teal-900 rounded-md flex items-center justify-between px-2 text-white">
                      <span>Guardia 24/7 • Urgencias y Especialidades</span>
                      <span>+34 900 888 777</span>
                    </div>
                    {/* Header blanco */}
                    <div className="h-6 bg-white rounded-lg shadow-xs flex items-center justify-between px-2.5 border border-slate-200">
                      <div className="flex items-center gap-1 font-black text-slate-900 text-[10px]">
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        Go<span className="text-emerald-600">vet</span>
                      </div>
                      <div className="flex gap-2 text-slate-500 font-bold text-[8px]">
                        <span>Especialidades</span>
                        <span>Quirófano</span>
                        <span>Doctores</span>
                      </div>
                      <div className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[8px]">Cita</div>
                    </div>
                    {/* Hero Slider */}
                    <div className="grid grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-xl border border-emerald-100 shadow-xs">
                      <div className="col-span-7 space-y-1">
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded font-black text-[7px] border border-emerald-200">
                          ESPECIALIDAD #01
                        </span>
                        <div className="font-black text-slate-900 text-[11px] leading-tight">
                          Cirugía Avanzada & Quirófano
                        </div>
                        <div className="text-[7.5px] text-slate-500 line-clamp-1">
                          Monitoreo anestésico y cuidados intensivos 24h.
                        </div>
                        <div className="flex gap-1 pt-0.5">
                          <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-full text-[7px] font-bold">Agendar Cirugía</span>
                        </div>
                      </div>
                      <div className="col-span-5 h-16 rounded-lg overflow-hidden border border-slate-100 shadow-xs relative">
                        <img 
                          src="https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=300&q=80" 
                          alt="preview" 
                          className="w-full h-full object-cover" 
                        />
                        <span className="absolute bottom-1 right-1 bg-white/90 px-1 py-0.2 rounded text-[6.5px] font-bold text-emerald-800">
                          ⭐ 5.0
                        </span>
                      </div>
                    </div>
                    {/* Selector de especialidades */}
                    <div className="h-5 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-around text-[7.5px] font-bold text-slate-700">
                      <span className="text-emerald-700 bg-white px-1.5 py-0.5 rounded shadow-2xs">🩺 Cirugía</span>
                      <span>❤️ Cardiología</span>
                      <span>🦴 Traumatología</span>
                      <span>🐾 Dermatología</span>
                    </div>
                  </div>
                )}

                {/* Visual Preview 1: Welfare Elite */}
                {t.id === "welfare-elite" && (
                  <div className="h-48 p-3 bg-[#FAF7F2] flex flex-col justify-between text-[9px] select-none">
                    {/* Topbar */}
                    <div className="h-3.5 bg-[#8C4A27] rounded-md flex items-center justify-between px-2 text-white">
                      <span>Emergencias 24/7 • Atención crítica</span>
                      <span>+34 900 123 456</span>
                    </div>
                    {/* Header */}
                    <div className="h-6 bg-white rounded-lg shadow-xs flex items-center justify-between px-2.5 border border-stone-200">
                      <div className="font-serif font-bold text-stone-900 text-[10px]">Welfare Vet</div>
                      <div className="flex gap-2 text-stone-500">
                        <span>Servicios</span>
                        <span>Paquetes</span>
                        <span>Nosotros</span>
                      </div>
                      <div className="px-2 py-0.5 rounded-full bg-[#143D43] text-white font-bold">Cita</div>
                    </div>
                    {/* Hero */}
                    <div className="grid grid-cols-12 gap-2 items-center bg-stone-100/50 p-2 rounded-xl border border-stone-200/60">
                      <div className="col-span-7 space-y-1">
                        <div className="font-serif font-bold text-stone-900 text-[11px] leading-tight">
                          Cuidado de <span className="text-[#8C4A27]">Confianza</span>
                        </div>
                        <div className="flex items-center gap-1 text-[8px] text-stone-600">
                          <span className="text-amber-500">★★★★★</span>
                          <span className="font-bold">5.0</span> Google Reviews
                        </div>
                        <div className="flex gap-1 pt-0.5">
                          <span className="px-1.5 py-0.5 bg-[#143D43] text-white rounded-md text-[7px] font-bold">Conocer</span>
                          <span className="px-1.5 py-0.5 bg-[#8C4A27] text-white rounded-md text-[7px] font-bold">Servicios</span>
                        </div>
                      </div>
                      <div className="col-span-5 h-16 rounded-lg overflow-hidden border border-white shadow-xs">
                        <img 
                          src="https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=300&q=80" 
                          alt="preview" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    </div>
                    {/* Capsule stats bar */}
                    <div className="h-5 bg-white rounded-lg border border-stone-200 shadow-xs flex items-center justify-around text-[8px] font-bold text-stone-700">
                      <span>🐾 10K+ Pacientes</span>
                      <span>⭐ 25+ Años</span>
                      <span>🩺 30+ Servicios</span>
                    </div>
                  </div>
                )}

                {/* Visual Preview 2: SmartVet Center */}
                {t.id === "smartvet-center" && (
                  <div className="h-48 p-3 bg-[#F3E8FF] flex flex-col justify-between text-[9px] select-none">
                    {/* Header */}
                    <div className="h-6 bg-white rounded-lg shadow-xs flex items-center justify-between px-2.5 border border-purple-200">
                      <span className="font-black text-slate-900 uppercase">SMARTVET</span>
                      <div className="flex gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-slate-950 text-white font-bold text-[8px]">CITA EXPRESS</span>
                      </div>
                    </div>
                    {/* Hero Split */}
                    <div className="grid grid-cols-12 gap-2 bg-white/90 p-2 rounded-2xl border border-purple-200 relative overflow-hidden">
                      <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-amber-300 text-amber-950 rounded-full font-black text-[7px]">
                        ★ TOP VET 2026 ★
                      </div>
                      <div className="col-span-7 space-y-1">
                        <div className="font-black text-slate-950 text-[11px] leading-tight">
                          ALL-IN-ONE PET CENTER
                        </div>
                        {/* Instant Booking Mini Form */}
                        <div className="bg-purple-50 p-1.5 rounded-lg border border-purple-100 space-y-1">
                          <div className="grid grid-cols-2 gap-1">
                            <div className="h-3 bg-white rounded border border-purple-200 px-1 text-[7px] text-slate-500">Tu Nombre</div>
                            <div className="h-3 bg-white rounded border border-purple-200 px-1 text-[7px] text-slate-500">Mascota</div>
                          </div>
                          <div className="h-3.5 bg-slate-950 text-white font-black text-[7px] rounded flex items-center justify-center">
                            RESERVAR AHORA
                          </div>
                        </div>
                      </div>
                      <div className="col-span-5 h-20 rounded-xl overflow-hidden relative shadow-xs">
                        <img 
                          src="https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=300&q=80" 
                          alt="preview" 
                          className="w-full h-full object-cover" 
                        />
                        <span className="absolute bottom-1 left-1 px-1 py-0.5 bg-white/90 rounded text-[7px] font-black text-purple-900">
                          -20% DTO
                        </span>
                      </div>
                    </div>
                    {/* Brand logos */}
                    <div className="flex items-center justify-around text-[7px] font-black text-slate-400">
                      <span>PURINA</span>
                      <span>ROYAL CANIN</span>
                      <span>ACANA</span>
                      <span>SIMPARICA</span>
                    </div>
                  </div>
                )}

                {/* Visual Preview 3: Medica Zoo */}
                {t.id === "medica-zoo" && (
                  <div className="h-48 p-3 bg-teal-50/40 flex flex-col justify-between text-[9px] select-none">
                    {/* Topbar */}
                    <div className="h-3.5 bg-white border border-slate-200 rounded flex items-center justify-between px-2 text-[7px] text-slate-600">
                      <span>L-S: 8:00 - 20:00h • Urgencias 24h</span>
                      <span className="text-teal-700 font-bold">+34 900 123 456</span>
                    </div>
                    {/* Header */}
                    <div className="h-6 bg-white rounded-lg shadow-xs flex items-center justify-between px-2.5 border border-teal-100">
                      <span className="font-extrabold text-teal-900">MEDICA ZOO</span>
                      <div className="flex gap-1">
                        <span className="px-1.5 py-0.5 bg-slate-900 text-white rounded text-[7px] font-bold">Consulta</span>
                        <span className="px-1.5 py-0.5 bg-teal-600 text-white rounded text-[7px] font-bold">Urgencia</span>
                      </div>
                    </div>
                    {/* Hero */}
                    <div className="bg-white p-2 rounded-2xl border border-teal-100 flex items-center justify-between gap-2">
                      <div>
                        <div className="font-black text-slate-900 text-[10px] leading-tight">
                          Cuidamos como <span className="text-teal-600">nuestra</span>
                        </div>
                        <div className="text-[7px] text-slate-500 mt-0.5">Urgencias 24/7 y cariño</div>
                      </div>
                      <div className="w-16 h-12 rounded-full overflow-hidden border-2 border-teal-400">
                        <img src="https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=200&q=80" alt="dog" className="w-full h-full object-cover" />
                      </div>
                    </div>
                    {/* S-curve paw trail and guarantee bar */}
                    <div className="h-6 bg-slate-900 rounded-xl text-white flex items-center justify-between px-3 text-[8px] font-bold">
                      <span>🚨 Urgencias 24h</span>
                      <span className="text-teal-300">🐾 S-Curve Flow</span>
                      <span>Llamar ahora →</span>
                    </div>
                  </div>
                )}

                {/* Visual Preview 4: Vet Cat & Calidez */}
                {t.id === "vetcat-warm" && (
                  <div className="h-48 p-3 bg-gradient-to-b from-cyan-50 via-amber-50/40 to-white flex flex-col justify-between text-[9px] select-none">
                    {/* Header */}
                    <div className="h-6 bg-white rounded-lg shadow-xs flex items-center justify-between px-2.5 border border-cyan-200">
                      <span className="font-black text-cyan-800">🐱 VET CAT</span>
                      <div className="flex gap-2 text-slate-500 text-[8px]">
                        <span>Servicios</span>
                        <span>Precios</span>
                        <span>Especialistas</span>
                      </div>
                      <span className="px-2 py-0.5 bg-cyan-600 text-white rounded-full text-[7px] font-bold">Citas</span>
                    </div>
                    {/* Hero Friendly */}
                    <div className="text-center space-y-1">
                      <div className="font-black text-slate-900 text-[11px]">
                        Veterinaria Familiar & Cálida
                      </div>
                      <div className="text-[8px] text-slate-500">Amor por los animales y medicina humana</div>
                    </div>
                    {/* Circular Pets Avatars */}
                    <div className="flex justify-center gap-2">
                      {['🐶 Vacunas', '🐱 Felina', '🔬 Análisis', '🦷 Limpieza'].map((s, idx) => (
                        <div key={idx} className="bg-white p-1 rounded-xl border border-cyan-100 text-[7px] font-bold text-center shadow-xs">
                          {s}
                        </div>
                      ))}
                    </div>
                    {/* Precios Transparentes Banner */}
                    <div className="h-7 bg-cyan-600 rounded-xl text-white flex items-center justify-between px-3 text-[8px] font-bold shadow-xs">
                      <span>Tarifas Claras: Consulta $25</span>
                      <span className="px-1.5 py-0.5 bg-white text-cyan-900 rounded text-[7px]">Ver Todas</span>
                    </div>
                  </div>
                )}

                {/* Visual Preview 5: PetClinic Pro */}
                {t.id === "petclinic-pro" && (
                  <div className="h-48 p-3 bg-blue-50/50 flex flex-col justify-between text-[9px] select-none">
                    {/* Header */}
                    <div className="h-6 bg-white rounded-lg shadow-xs flex items-center justify-between px-2.5 border border-blue-200">
                      <div className="font-black text-blue-900 flex items-center gap-1">
                        <span className="text-emerald-600">🩺</span> PET CLINIC
                      </div>
                      <div className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[7px] font-bold">
                        Guardia 24h
                      </div>
                    </div>
                    {/* Hero con Banner 10% DTO */}
                    <div className="grid grid-cols-12 gap-2 bg-white p-2 rounded-2xl border border-blue-100 items-center">
                      <div className="col-span-7 space-y-1">
                        <div className="font-black text-blue-950 text-[10px] leading-tight">
                          The Best Care For Your Pet
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-rose-600 font-black text-base leading-none">10%</span>
                          <span className="text-[7px] font-bold text-slate-700">Dto 1ª Visita</span>
                        </div>
                        <span className="inline-block px-2 py-0.5 bg-rose-600 text-white rounded-md text-[7px] font-bold">
                          Obtener Descuento
                        </span>
                      </div>
                      <div className="col-span-5 h-16 rounded-xl overflow-hidden shadow-xs">
                        <img 
                          src="https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=300&q=80" 
                          alt="preview" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    </div>
                    {/* Diagnostic tech strip */}
                    <div className="h-5 bg-white rounded-lg border border-blue-100 flex items-center justify-around text-[7px] font-bold text-blue-900">
                      <span>✓ Quirófano Certificado</span>
                      <span>✓ Rayos X Digital</span>
                      <span>✓ Monitoreo</span>
                    </div>
                  </div>
                )}

                {/* Legacy Fallback Preview */}
                {!["welfare-elite", "smartvet-center", "medica-zoo", "vetcat-warm", "petclinic-pro"].includes(t.id) && (
                  <div className="h-48 p-4 bg-slate-100 flex items-center justify-center text-xs text-slate-600">
                    Vista previa de plantilla clásica
                  </div>
                )}

                {active && (
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-teal-600 text-white font-bold text-xs shadow-md flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>Plantilla Activa</span>
                  </div>
                )}
              </div>

              {/* Información y Acciones */}
              <div className="p-5 flex-1 flex flex-col justify-between bg-white space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border mb-1.5 ${t.badgeColor || "bg-teal-50 text-teal-800 border-teal-200"}`}>
                        {t.tag}
                      </span>
                      <h3 className="font-black text-slate-900 text-lg">{t.name}</h3>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">{t.description}</p>
                  
                  <div className="space-y-1.5 mb-4">
                    {t.features.map((f) => (
                      <div key={f} className="text-xs text-slate-700 flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  size="sm" 
                  className={`w-full text-xs font-bold h-9 transition-all shadow-xs ${
                    active 
                      ? "bg-teal-600 hover:bg-teal-700 text-white" 
                      : "bg-slate-900 hover:bg-slate-800 text-white"
                  }`} 
                  onClick={() => applyTemplate(t.id)}
                >
                  {active ? "✓ Plantilla Seleccionada" : "Aplicar esta Plantilla"}
                </Button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Editor de Colores de Marca */}
      <Card className="p-6 bg-white border-slate-200 shadow-sm rounded-3xl">
        <div className="mb-4">
          <h3 className="font-bold text-slate-900 text-base">Colores de Marca Personalizados</h3>
          <p className="text-xs text-slate-500">
            Ajusta los tonos principales para alinearlos exactamente con la identidad visual de la clínica.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {[
            { label: "Color Primario", val: primary, set: setPrimary, desc: "Botones principales y acentos" },
            { label: "Color Secundario", val: secondary, set: setSecondary, desc: "Fondos de secciones y contraste" },
            { label: "Color Acento", val: accent, set: setAccent, desc: "Insignias, etiquetas y precios" },
          ].map(({ label, val, set, desc }) => (
            <div key={label} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <Label className="text-slate-800 text-xs font-bold block">{label}</Label>
              <span className="text-[10px] text-slate-500 block mb-2">{desc}</span>
              <div className="flex gap-2 items-center">
                <input 
                  type="color" 
                  value={val} 
                  onChange={(e) => set(e.target.value)} 
                  className="h-9 w-12 rounded-lg cursor-pointer border border-slate-300 bg-white p-0.5 shadow-xs" 
                />
                <Input 
                  value={val} 
                  onChange={(e) => set(e.target.value)} 
                  className="bg-white border-slate-300 text-slate-900 text-xs font-mono font-semibold" 
                />
              </div>
            </div>
          ))}
        </div>

        <Button onClick={saveColors} className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs">
          Guardar Colores
        </Button>
      </Card>

      {/* Gestor de Secciones Activas */}
      <Card className="p-6 bg-white border-slate-200 shadow-sm rounded-3xl">
        <div className="mb-4">
          <h3 className="font-bold text-slate-900 text-base">Secciones del Sitio Web</h3>
          <p className="text-xs text-slate-500">
            Activa o desactiva qué módulos se muestran públicamente a los visitantes.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {Object.entries(sectionLabels).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between py-3">
              <div>
                <span className="text-xs sm:text-sm font-semibold text-slate-800">{label}</span>
              </div>
              <Switch checked={sections[key]?.enabled ?? true} onCheckedChange={(v) => toggleSection(key, v)} />
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
}
