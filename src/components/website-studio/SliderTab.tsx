import { useState } from "react";
import { 
  useWebsiteSlides, 
  addWebsiteSlide, 
  updateWebsiteSlide, 
  deleteWebsiteSlide, 
  saveWebsiteSettings, 
  type WebsiteSettings, 
  type WebsiteSlide 
} from "@/lib/website-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Sparkles, 
  Upload, 
  CheckCircle2, 
  Sliders, 
  Save, 
  HelpCircle,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { fileToBase64DataUrl, getBase64SizeKb } from "@/lib/image-upload";
import { ImageUploader } from "./ImageUploader";

const CLINICAL_PRESETS = [
  { 
    label: "🩺 Consulta y Examen Clínico", 
    url: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=1920&q=80",
    title: "Medicina Veterinaria y Cuidado Integral",
    subtitle: "Atención médica con especialistas certificados, diagnóstico avanzado y acompañamiento cercano para tu mascota."
  },
  { 
    label: "🔬 Cirugía y Quirófano Estéril", 
    url: "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=1920&q=80",
    title: "Especialistas en Cirugía & Quirófano",
    subtitle: "Quirófano estéril equipado con anestesia inhalatoria, monitoreo multiparamétrico y cuidados postoperatorios 24h."
  },
  { 
    label: "📡 Diagnóstico y Ultrasonido", 
    url: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=1920&q=80",
    title: "Diagnóstico In Situ & Medicina Preventiva",
    subtitle: "Rayos X digital, ecografía Doppler y laboratorio clínico de respuesta inmediata para diagnósticos certeros."
  },
  { 
    label: "✂️ Grooming & Spa Clínico", 
    url: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=1920&q=80",
    title: "Estética Veterinaria & Cuidado Dermatológico",
    subtitle: "Baños terapéuticos, corte higiénico y estética sin estrés con productos dermatológicos aprobados."
  }
];

export function SliderTab({ settings }: { settings: WebsiteSettings }) {
  const slides = useWebsiteSlides();
  const [heroType, setHeroType] = useState<"single" | "slider">(settings.identity.hero_type || "slider");
  const [heroTitle, setHeroTitle] = useState(settings.identity.hero_title || "");
  const [heroSubtitle, setHeroSubtitle] = useState(settings.identity.hero_subtitle || "");
  const [heroBadge, setHeroBadge] = useState(settings.identity.hero_badge || "");
  const [heroImageUrl, setHeroImageUrl] = useState(settings.identity.hero_image_url || settings.identity.cover_image_url || "");
  const [editing, setEditing] = useState<Record<string, Partial<WebsiteSlide>>>({});
  const [savingSlideId, setSavingSlideId] = useState<string | null>(null);
  const [showAdvancedText, setShowAdvancedText] = useState(false);

  const getEdit = (id: string) => editing[id] ?? {};
  const setEdit = (id: string, patch: Partial<WebsiteSlide>) => setEditing((e) => ({ ...e, [id]: { ...e[id], ...patch } }));

  const saveSlide = async (slideId: string) => {
    try {
      setSavingSlideId(slideId);
      const e = getEdit(slideId);
      await updateWebsiteSlide(slideId, e);
      toast.success("Foto y textos de la diapositiva guardados en la base de datos");
    } catch (err: unknown) {
      toast.error("Error al guardar diapositiva: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSavingSlideId(null);
    }
  };

  const handleAddNewSlide = async () => {
    try {
      const preset = CLINICAL_PRESETS[slides.length % CLINICAL_PRESETS.length];
      await addWebsiteSlide({
        title: preset.title,
        subtitle: preset.subtitle,
        image_url: preset.url,
        cta_text: "Agendar Cita",
        cta_link: "#cita",
        sort_order: slides.length + 1,
      });
      toast.success("Nueva foto agregada al carrusel con éxito");
    } catch (err: unknown) {
      toast.error("No se pudo agregar la foto: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleDeleteSlide = async (slideId: string, title: string) => {
    if (confirm(`¿Estás seguro de quitar la foto "${title || 'esta diapositiva'}" del carrusel?`)) {
      try {
        await deleteWebsiteSlide(slideId);
        toast.success("Foto eliminada del carrusel");
      } catch (err: unknown) {
        toast.error("Error al eliminar la foto: " + (err instanceof Error ? err.message : String(err)));
      }
    }
  };

  const loadDemoSlides = async () => {
    try {
      for (const p of CLINICAL_PRESETS) {
        await addWebsiteSlide({
          title: p.title,
          subtitle: p.subtitle,
          image_url: p.url,
          cta_text: "Agendar Cita",
          cta_link: "#cita",
          sort_order: slides.length + 1,
        });
      }
      toast.success("Diapositivas clínicas de ejemplo cargadas");
    } catch (err: unknown) {
      toast.error("Error al cargar fotos de ejemplo: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const saveHeroSettings = () => {
    saveWebsiteSettings({
      identity: {
        hero_type: heroType,
        hero_title: heroTitle,
        hero_subtitle: heroSubtitle,
        hero_badge: heroBadge,
        hero_image_url: heroImageUrl,
        cover_image_url: heroImageUrl,
      },
    });
    toast.success("Ajustes generales del Hero guardados");
  };

  const handleSlideFileUpload = async (slideId: string, file: File) => {
    try {
      const base64 = await fileToBase64DataUrl(file, 1920, 0.85);
      setEdit(slideId, { image_url: base64 });
      const sizeKb = getBase64SizeKb(base64);
      toast.success(`Foto cargada desde tu PC (${sizeKb} KB). Recuerda hacer clic en 'Guardar Cambios'.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al procesar la imagen";
      toast.error(msg);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-5xl mx-auto">
      
      {/* 1. Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs uppercase tracking-wider">
              Gestor del Slider & Fotos de Portada
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
              {slides.length} {slides.length === 1 ? 'Foto activa' : 'Fotos activas'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            Fotos del Carrusel Principal (Hero Slider)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Aquí puedes ver todas las fotos que rotan en la portada de tu clínica. Sube fotos desde tu computadora, pégalas por enlace web o quita las que no quieras mostrar.
          </p>
        </div>

        {/* Botón Principal para Agregar Nueva Foto */}
        <div className="flex items-center gap-2 shrink-0">
          <Button 
            onClick={handleAddNewSlide} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 hover:scale-[1.02] transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Agregar Foto al Carrusel</span>
          </Button>
        </div>
      </div>

      {/* 2. Selector de Modo: Carrusel vs Foto Fija */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200 flex items-center justify-between max-w-md">
        <button
          onClick={() => { setHeroType("slider"); saveHeroSettings(); }}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            heroType === "slider" 
              ? "bg-white text-emerald-800 shadow-xs ring-1 ring-slate-200" 
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Carrusel / Slider ({slides.length} fotos)</span>
        </button>
        <button
          onClick={() => { setHeroType("single"); saveHeroSettings(); }}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            heroType === "single" 
              ? "bg-white text-emerald-800 shadow-xs ring-1 ring-slate-200" 
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Foto Fija Única</span>
        </button>
      </div>

      {/* Si eligió FOTO FIJA ÚNICA */}
      {heroType === "single" && (
        <Card className="p-6 bg-white border-amber-200 shadow-sm rounded-3xl space-y-4">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Modo Foto Fija Activado</span>
          </div>
          <p className="text-xs text-slate-500">
            En lugar de un carrusel rotativo, tu sitio mostrará una única foto principal destacada en la portada.
          </p>
          <ImageUploader
            label="Foto Destacada de la Clínica"
            value={heroImageUrl}
            onChange={setHeroImageUrl}
            placeholder="https://... o sube una imagen de tu computadora"
            helperText="Selecciona la foto más representativa de tu clínica (fachada, recepción o médicos)."
            presetSuggestions={[
              { label: "🏥 Fachada Clínica", url: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1920&q=80" },
              { label: "🐾 Quirófano", url: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=1920&q=80" },
              { label: "🐕 Mascota Feliz", url: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=1920&q=80" },
            ]}
          />
          <Button onClick={saveHeroSettings} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-xl shadow-xs">
            Guardar Foto Fija
          </Button>
        </Card>
      )}

      {/* 3. LISTA DE FOTOS DEL CARRUSEL (SLIDER) */}
      <div className="space-y-6">
        
        {slides.length === 0 ? (
          <div className="border-2 border-dashed border-slate-300 bg-white rounded-3xl p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto grid place-items-center text-2xl font-bold">
              📸
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">No tienes fotos en el carrusel actualmente</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                El carrusel del Hero necesita al menos una foto para mostrarse. Puedes cargar fotos recomendadas de alta resolución o subir fotos desde tu computadora.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button onClick={handleAddNewSlide} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
                <Plus className="w-4 h-4 mr-1.5" /> Agregar Mi Primera Foto
              </Button>
              <Button variant="outline" onClick={loadDemoSlides} className="border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold">
                Cargar Fotos Clínicas de Ejemplo
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {slides.map((slide, idx) => {
              const e = getEdit(slide.id);
              const title = e.title !== undefined ? e.title : slide.title;
              const subtitle = e.subtitle !== undefined ? e.subtitle : slide.subtitle;
              const imageUrl = e.image_url !== undefined ? e.image_url : slide.image_url;
              const ctaText = e.cta_text !== undefined ? e.cta_text : slide.cta_text;
              const ctaLink = e.cta_link !== undefined ? e.cta_link : slide.cta_link;
              const isBase64 = imageUrl?.startsWith("data:image");
              const sizeKb = isBase64 ? getBase64SizeKb(imageUrl) : null;
              const isSaving = savingSlideId === slide.id;

              return (
                <Card 
                  key={slide.id} 
                  className="bg-white border-2 border-slate-200/90 hover:border-emerald-300/80 transition-colors shadow-sm rounded-3xl p-5 sm:p-6 space-y-5"
                >
                  
                  {/* Barra Superior de la Diapositiva: Número y Botón Quitar Foto */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-emerald-700 text-white text-xs font-black grid place-items-center shadow-xs">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-800 text-sm">
                        Diapositiva #{idx + 1}: {title || "Sin Título"}
                      </span>
                      {isBase64 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          Foto Local Base64 ({sizeKb} KB)
                        </span>
                      )}
                    </div>

                    {/* BOTÓN PROMINENTE PARA QUITAR LA FOTO */}
                    <button
                      type="button"
                      onClick={() => handleDeleteSlide(slide.id, title)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs hover:scale-105"
                      title="Eliminar esta foto del carrusel"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Quitar Foto / Eliminar</span>
                    </button>
                  </div>

                  {/* Cuerpo: Vista previa grande + Opciones de Imagen */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Vista Previa de la Foto */}
                    <div className="lg:col-span-5 space-y-3">
                      <div className="relative w-full h-52 sm:h-56 rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-200 shadow-inner group">
                        <img 
                          src={imageUrl || "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=800&q=80"} 
                          alt={title}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                        
                        {/* Botón flotante para cambiar foto al hacer clic en la imagen */}
                        <label className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white font-bold text-xs gap-1 backdrop-blur-2xs">
                          <Upload className="w-6 h-6" />
                          <span>Cambiar Foto desde PC</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(ev) => {
                              const f = ev.target.files?.[0];
                              if (f) handleSlideFileUpload(slide.id, f);
                            }}
                          />
                        </label>

                        <div className="absolute bottom-2.5 left-3 right-3 text-white text-xs drop-shadow-sm font-semibold truncate">
                          {title}
                        </div>
                      </div>

                      {/* Botones de acción rápida para la imagen */}
                      <div className="flex items-center gap-2">
                        <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-2xs">
                          <Upload className="w-3.5 h-3.5 text-emerald-700" />
                          <span>📁 Subir desde PC</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(ev) => {
                              const f = ev.target.files?.[0];
                              if (f) handleSlideFileUpload(slide.id, f);
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Campos de Textos y Enlaces */}
                    <div className="lg:col-span-7 space-y-3.5">
                      
                      {/* URL o Enlace Web de la Imagen */}
                      <div>
                        <Label className="text-slate-700 text-xs font-bold mb-1 block">
                          URL de la Imagen (o foto en Base64 cargada de tu PC)
                        </Label>
                        <Input 
                          value={isBase64 ? `[Foto en Base64 desde tu PC (~${sizeKb} KB)]` : imageUrl} 
                          onChange={ev => setEdit(slide.id, { image_url: ev.target.value })} 
                          placeholder="https://images.unsplash.com/..."
                          className="bg-white border-slate-300 text-slate-800 text-xs font-mono rounded-xl focus:border-emerald-500 h-9" 
                        />
                      </div>

                      {/* Sugerencias Rápidas de Fotos para esta diapositiva */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-500">Fotos clínicas recomendadas:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {CLINICAL_PRESETS.map((p, pIdx) => (
                            <button
                              key={pIdx}
                              type="button"
                              onClick={() => {
                                setEdit(slide.id, { 
                                  image_url: p.url,
                                  title: p.title,
                                  subtitle: p.subtitle
                                });
                                toast.success(`Aplicado: ${p.label}`);
                              }}
                              className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 transition-colors font-medium"
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Título Principal de la Diapositiva */}
                      <div>
                        <Label className="text-slate-700 text-xs font-bold mb-1 block">Título de la Diapositiva</Label>
                        <Input 
                          value={title} 
                          onChange={ev => setEdit(slide.id, { title: ev.target.value })} 
                          placeholder="Ej. Medicina Veterinaria y Cuidado Integral"
                          className="bg-white border-slate-300 text-slate-900 font-bold text-xs rounded-xl focus:border-emerald-500 h-9" 
                        />
                      </div>

                      {/* Subtítulo / Descripción */}
                      <div>
                        <Label className="text-slate-700 text-xs font-bold mb-1 block">Subtítulo o Descripción Breve</Label>
                        <Input 
                          value={subtitle} 
                          onChange={ev => setEdit(slide.id, { subtitle: ev.target.value })} 
                          placeholder="Ej. Atención con médicos certificados y quirófano 24/7..."
                          className="bg-white border-slate-300 text-slate-700 text-xs rounded-xl focus:border-emerald-500 h-9" 
                        />
                      </div>

                      {/* Botón de Acción y Enlace */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <Label className="text-slate-600 text-[11px] font-bold mb-1 block">Texto del Botón</Label>
                          <Input 
                            value={ctaText} 
                            onChange={ev => setEdit(slide.id, { cta_text: ev.target.value })} 
                            placeholder="Ej. Agendar Cita"
                            className="bg-white border-slate-300 text-slate-800 text-xs rounded-xl h-8" 
                          />
                        </div>
                        <div>
                          <Label className="text-slate-600 text-[11px] font-bold mb-1 block">Enlace de Destino</Label>
                          <Input 
                            value={ctaLink} 
                            onChange={ev => setEdit(slide.id, { cta_link: ev.target.value })} 
                            placeholder="#cita, #servicios, https://..."
                            className="bg-white border-slate-300 text-slate-800 text-xs font-mono rounded-xl h-8" 
                          />
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Pie de Diapositiva: Botón Guardar Cambios */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400">
                      Cambios en diapositiva #{idx + 1}
                    </span>
                    <Button 
                      onClick={() => saveSlide(slide.id)} 
                      disabled={isSaving}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-xs flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSaving ? "Guardando..." : "Guardar Cambios de Esta Foto"}</span>
                    </Button>
                  </div>

                </Card>
              );
            })}
          </div>
        )}

      </div>

      {/* 4. SECCIÓN COLAPSABLE: Textos Globales del Hero (Insignia & Subtítulos Generales) */}
      <Card className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
        <button
          type="button"
          onClick={() => setShowAdvancedText(!showAdvancedText)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-slate-900 text-sm">
              Ajustes de Insignia y Textos Generales del Hero (Opcional)
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showAdvancedText ? 'rotate-180' : ''}`} />
        </button>

        {showAdvancedText && (
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-700 text-xs font-bold mb-1 block">Insignia / Badge Superior</Label>
                <Input 
                  value={heroBadge} 
                  onChange={e => setHeroBadge(e.target.value)} 
                  placeholder="Ej. ★ GUARDIA 24/7 EN URGENCIAS ★" 
                  className="bg-white border-slate-300 text-slate-900 text-xs rounded-xl focus:border-emerald-500" 
                />
              </div>
              <div>
                <Label className="text-slate-700 text-xs font-bold mb-1 block">Titular Alternativo del Hero</Label>
                <Input 
                  value={heroTitle} 
                  onChange={e => setHeroTitle(e.target.value)} 
                  placeholder="Ej. Medicina Veterinaria de Excelencia" 
                  className="bg-white border-slate-300 text-slate-900 text-xs font-bold rounded-xl focus:border-emerald-500" 
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-700 text-xs font-bold mb-1 block">Subtítulo de Bienvenida</Label>
              <Input 
                value={heroSubtitle} 
                onChange={e => setHeroSubtitle(e.target.value)} 
                placeholder="Ej. En nuestra clínica, médicos certificados cuidan a tus compañeros..." 
                className="bg-white border-slate-300 text-slate-900 text-xs rounded-xl focus:border-emerald-500" 
              />
            </div>

            <Button onClick={saveHeroSettings} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-xl shadow-xs">
              Guardar Textos Generales
            </Button>
          </div>
        )}
      </Card>

    </div>
  );
}
