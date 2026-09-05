import { useState } from "react";
import { WebsiteSettings, WebsiteFaq, WebsiteMetric, saveWebsiteSettings, DEFAULT_FAQS, DEFAULT_METRICS } from "@/lib/website-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ImageUploader } from "./ImageUploader";

export function ContentTab({ settings }: { settings: WebsiteSettings }) {
  const id = settings.identity;
  const [name, setName] = useState(id.name);
  const [tagline, setTagline] = useState(id.tagline);
  const [description, setDescription] = useState(id.description);
  const [logoUrl, setLogoUrl] = useState(id.logo_url || "");
  const [coverUrl, setCoverUrl] = useState(id.cover_image_url || "");
  const [heroTitle, setHeroTitle] = useState(id.hero_title || "");
  const [heroSubtitle, setHeroSubtitle] = useState(id.hero_subtitle || "");
  const [heroBadge, setHeroBadge] = useState(id.hero_badge || "");
  const [ctaPrimaryText, setCtaPrimaryText] = useState(id.cta_primary_text || "");
  const [ctaSecondaryText, setCtaSecondaryText] = useState(id.cta_secondary_text || "");
  const [aboutImageUrl, setAboutImageUrl] = useState(id.about_image_url || "");
  const [mision, setMision] = useState(id.mision);
  const [vision, setVision] = useState(id.vision);
  const [historia, setHistoria] = useState(id.historia);
  const [foundedYear, setFoundedYear] = useState(id.founded_year);
  const [metrics, setMetrics] = useState<WebsiteMetric[]>(settings.metrics?.length ? settings.metrics : DEFAULT_METRICS);
  const [faqs, setFaqs] = useState<WebsiteFaq[]>(settings.faqs?.length ? settings.faqs : DEFAULT_FAQS);

  const saveAll = () => {
    saveWebsiteSettings({
      identity: {
        name,
        tagline,
        description,
        logo_url: logoUrl || null,
        cover_image_url: coverUrl || null,
        hero_image_url: coverUrl || null,
        hero_title: heroTitle,
        hero_subtitle: heroSubtitle,
        hero_badge: heroBadge,
        cta_primary_text: ctaPrimaryText,
        cta_secondary_text: ctaSecondaryText,
        about_image_url: aboutImageUrl || null,
        mision,
        vision,
        historia,
        founded_year: foundedYear,
      },
      metrics,
      faqs,
    });
    toast.success("Contenido guardado correctamente");
  };

  const addMetric = () => setMetrics((m) => [...m, { id: crypto.randomUUID(), value: "0", label: "Nueva métrica", icon: "🐾" }]);
  const delMetric = (mid: string) => setMetrics((m) => m.filter((x) => x.id !== mid));
  const updateMetric = (mid: string, patch: Partial<WebsiteMetric>) => setMetrics((m) => m.map((x) => (x.id === mid ? { ...x, ...patch } : x)));

  const addFaq = () => setFaqs((f) => [...f, { id: crypto.randomUUID(), question: "", answer: "", sort_order: f.length + 1 }]);
  const delFaq = (fid: string) => setFaqs((f) => f.filter((x) => x.id !== fid));
  const updateFaq = (fid: string, patch: Partial<WebsiteFaq>) => setFaqs((f) => f.map((x) => (x.id === fid ? { ...x, ...patch } : x)));

  const field = (label: string, value: string, setter: (v: string) => void, area?: boolean) => (
    <div>
      <Label className="text-slate-700 text-xs font-bold mb-1.5 block">{label}</Label>
      {area ? (
        <Textarea 
          value={value} 
          onChange={(e) => setter(e.target.value)} 
          rows={3} 
          className="bg-white border-slate-300 text-slate-900 text-sm resize-none focus:border-teal-500 rounded-xl" 
        />
      ) : (
        <Input 
          value={value} 
          onChange={(e) => setter(e.target.value)} 
          className="bg-white border-slate-300 text-slate-900 text-sm focus:border-teal-500 rounded-xl" 
        />
      )}
    </div>
  );

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-4xl mx-auto">
      
      <div>
        <h2 className="text-2xl font-black text-slate-900">Contenido y Textos del Sitio</h2>
        <p className="text-xs text-slate-500 mt-1">
          La información aquí guardada se refleja automáticamente en la plantilla que elijas.
        </p>
      </div>

      {/* 1. Hero y Titular Principal */}
      <Card className="p-6 bg-white border-slate-200 shadow-sm rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <span>✨</span> Titular y Portada Principal (Hero)
          </h3>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
            Vista Principal
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Personaliza los textos principales y el llamado a la acción visible en la cabecera de todas las plantillas.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-slate-700 text-xs font-bold mb-1.5 block">Distintivo Superior (Badge / Tag)</Label>
            <Input 
              value={heroBadge} 
              onChange={(e) => setHeroBadge(e.target.value)} 
              placeholder="ej. 🐾 Hospital Veterinario & Cirugía 24 Horas" 
              className="bg-white border-slate-300 text-slate-900 text-sm focus:border-teal-500 rounded-xl"
            />
          </div>
          <div>
            <Label className="text-slate-700 text-xs font-bold mb-1.5 block">Texto Botón Principal (CTA)</Label>
            <Input 
              value={ctaPrimaryText} 
              onChange={(e) => setCtaPrimaryText(e.target.value)} 
              placeholder="ej. Agendar Cita" 
              className="bg-white border-slate-300 text-slate-900 text-sm focus:border-teal-500 rounded-xl"
            />
          </div>
        </div>

        <div>
          <Label className="text-slate-700 text-xs font-bold mb-1.5 block">Título Principal del Hero</Label>
          <Input 
            value={heroTitle} 
            onChange={(e) => setHeroTitle(e.target.value)} 
            placeholder="ej. Cuidado Médico Avanzado y Compasivo para tu Mascota" 
            className="bg-white border-slate-300 text-slate-900 text-sm font-semibold focus:border-teal-500 rounded-xl"
          />
        </div>

        <div>
          <Label className="text-slate-700 text-xs font-bold mb-1.5 block">Subtítulo o Bajada Explicativa</Label>
          <Textarea 
            value={heroSubtitle} 
            onChange={(e) => setHeroSubtitle(e.target.value)} 
            rows={2} 
            placeholder="ej. Quirófano esterilizado, laboratorio propio y médicos certificados listos para atender a tu familia peluda." 
            className="bg-white border-slate-300 text-slate-900 text-sm resize-none focus:border-teal-500 rounded-xl"
          />
        </div>

        <div>
          <Label className="text-slate-700 text-xs font-bold mb-1.5 block">Texto Botón Secundario</Label>
          <Input 
            value={ctaSecondaryText} 
            onChange={(e) => setCtaSecondaryText(e.target.value)} 
            placeholder="ej. Conocer Servicios" 
            className="bg-white border-slate-300 text-slate-900 text-sm focus:border-teal-500 rounded-xl"
          />
        </div>

        {/* Uploader Foto de Portada */}
        <ImageUploader
          label="Foto de Portada de la Clínica (Hero)"
          value={coverUrl}
          onChange={setCoverUrl}
          helperText="Adjunta una foto desde tu computadora (se convertirá a Base64 en la base de datos) o pega una URL web."
          presetSuggestions={[
            { label: "🏥 Quirófano y Médico", url: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=1200&q=80" },
            { label: "🐕 Golden Retriever", url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1200&q=80" },
            { label: "🐱 Gatito en Consulta", url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1200&q=80" },
          ]}
        />
      </Card>

      {/* 2. Identidad Institucional */}
      <Card className="p-6 bg-white border-slate-200 shadow-sm rounded-3xl space-y-4">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <span>🏥</span> Identidad de la Clínica
        </h3>
        {field("Nombre Oficial de la Clínica", name, setName)}
        {field("Eslogan Corto / Lema", tagline, setTagline)}
        {field("Descripción General de la Clínica", description, setDescription, true)}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <ImageUploader
            label="Logo Oficial de la Clínica"
            value={logoUrl}
            onChange={setLogoUrl}
            aspect="square"
            helperText="Adjunta el archivo de logo desde tu computadora o pega un link."
          />
          {field("Año de Fundación o Experiencia", foundedYear, setFoundedYear)}
        </div>
      </Card>

      {/* 3. Sección Nosotros y Fotos de Instalaciones */}
      <Card className="p-6 bg-white border-slate-200 shadow-sm rounded-3xl space-y-4">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <span>🏢</span> Sobre Nosotros & Fotos de Instalaciones
        </h3>
        
        <ImageUploader
          label="Foto de Instalaciones / Equipo (Sobre Nosotros)"
          value={aboutImageUrl}
          onChange={setAboutImageUrl}
          helperText="Adjunta una foto desde tu computadora (se convertirá a Base64 en la base de datos) o pega una URL web."
          presetSuggestions={[
            { label: "🩺 Equipo Veterinario", url: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=1200&q=80" },
            { label: "🔬 Laboratorio Clínico", url: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=1200&q=80" },
            { label: "🏥 Sala de Espera Moderna", url: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80" },
          ]}
        />
        {field("Historia / Sobre Nosotros", historia, setHistoria, true)}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field("Misión Institucional", mision, setMision, true)}
          {field("Visión a Futuro", vision, setVision, true)}
        </div>
      </Card>

      <Card className="p-6 bg-white border-slate-200 shadow-sm rounded-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <span>📊</span> Cifras y Métricas de Confianza
            </h3>
            <p className="text-xs text-slate-500">Muestran tu experiencia en la barra de estadísticas.</p>
          </div>
          <Button size="sm" variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 h-8 text-xs font-bold" onClick={addMetric}>
            <Plus className="w-3.5 h-3.5 mr-1 text-teal-600" /> Agregar Métrica
          </Button>
        </div>
        <div className="space-y-3">
          {metrics.map((m) => (
            <div key={m.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
              <div className="col-span-2">
                <Input value={m.icon} onChange={(e) => updateMetric(m.id, { icon: e.target.value })} className="bg-white border-slate-300 text-slate-900 text-center text-lg h-10 rounded-xl" />
              </div>
              <div className="col-span-4">
                <Input value={m.value} onChange={(e) => updateMetric(m.id, { value: e.target.value })} placeholder="1,200+" className="bg-white border-slate-300 text-slate-900 text-xs font-bold h-10 rounded-xl" />
              </div>
              <div className="col-span-5">
                <Input value={m.label} onChange={(e) => updateMetric(m.id, { label: e.target.value })} placeholder="Mascotas atendidas" className="bg-white border-slate-300 text-slate-900 text-xs h-10 rounded-xl" />
              </div>
              <div className="col-span-1 flex justify-center">
                <Button size="icon" variant="ghost" className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-8 w-8 rounded-lg" onClick={() => delMetric(m.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 bg-white border-slate-200 shadow-sm rounded-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <span>❓</span> Preguntas Frecuentes (FAQs)
            </h3>
            <p className="text-xs text-slate-500">Resuelve dudas habituales de los dueños de mascotas.</p>
          </div>
          <Button size="sm" variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 h-8 text-xs font-bold" onClick={addFaq}>
            <Plus className="w-3.5 h-3.5 mr-1 text-teal-600" /> Agregar FAQ
          </Button>
        </div>
        <div className="space-y-3">
          {faqs.map((f) => (
            <div key={f.id} className="space-y-2 bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
              <div className="flex gap-2">
                <Input 
                  value={f.question} 
                  onChange={(e) => updateFaq(f.id, { question: e.target.value })} 
                  placeholder="Pregunta frecuente (ej. ¿Atienden urgencias?)" 
                  className="bg-white border-slate-300 text-slate-900 font-bold text-xs flex-1 rounded-xl" 
                />
                <Button size="icon" variant="ghost" className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-9 w-9 shrink-0 rounded-xl" onClick={() => delFaq(f.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <Textarea 
                value={f.answer} 
                onChange={(e) => updateFaq(f.id, { answer: e.target.value })} 
                placeholder="Respuesta explicativa para el cliente" 
                rows={2} 
                className="bg-white border-slate-300 text-slate-800 text-xs resize-none rounded-xl" 
              />
            </div>
          ))}
        </div>
      </Card>

      <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold h-11 text-sm rounded-2xl shadow-xs" onClick={saveAll}>
        Guardar Cambios de Contenido
      </Button>
    </div>
  );
}
