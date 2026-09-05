import { useState } from "react";
import { WebsiteSettings, saveWebsiteSettings, slugify } from "@/lib/website-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Rocket, EyeOff, Eye, Search, Globe } from "lucide-react";
import { toast } from "sonner";

export function SeoTab({ settings, onPreview }: { settings: WebsiteSettings; onPreview: () => void }) {
  const seo = settings.seo;
  const [metaTitle, setMetaTitle] = useState(seo.meta_title);
  const [metaDesc, setMetaDesc] = useState(seo.meta_description);
  const [keywords, setKeywords] = useState(seo.keywords?.join(", ") ?? "");
  const [canonical, setCanonical] = useState(seo.canonical_url);
  const [slug, setSlug] = useState(settings.slug);

  const saveSeo = () => {
    saveWebsiteSettings({
      seo: {
        meta_title: metaTitle,
        meta_description: metaDesc,
        keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
        canonical_url: canonical,
        og_image: seo.og_image,
      },
      slug: slugify(slug) || settings.slug,
    });
    toast.success("Configuración SEO guardada");
  };

  const togglePublish = () => {
    saveWebsiteSettings({ is_published: !settings.is_published });
    toast.success(settings.is_published ? "Sitio despublicado" : "🚀 ¡Sitio publicado en vivo!");
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-2xl font-black text-slate-900">SEO y Publicación en Vivo</h2>
        <p className="text-xs text-slate-500 mt-1">
          Posiciónate en Google cuando los dueños de mascotas busquen veterinarias cercanas.
        </p>
      </div>

      <Card className="p-6 bg-white border-slate-200 shadow-sm rounded-3xl space-y-4">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <Search className="w-4 h-4 text-teal-600" /> Optimización para Motores de Búsqueda (Google)
        </h3>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <Label className="text-slate-700 text-xs font-bold">Título de la Página (Meta Title)</Label>
            <span className="text-[11px] text-slate-400">({metaTitle.length}/60 car.)</span>
          </div>
          <Input 
            value={metaTitle} 
            onChange={(e) => setMetaTitle(e.target.value)} 
            maxLength={70} 
            placeholder="Clínica Veterinaria San Francisco | Urgencias 24h & Cirugía"
            className="bg-white border-slate-300 text-slate-900 text-sm rounded-xl focus:border-teal-500" 
          />
          {metaTitle.length > 60 && <p className="text-xs text-amber-600 mt-1">Recomendado: no superar los 60 caracteres.</p>}
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <Label className="text-slate-700 text-xs font-bold">Descripción en Google (Meta Description)</Label>
            <span className="text-[11px] text-slate-400">({metaDesc.length}/160 car.)</span>
          </div>
          <Textarea 
            value={metaDesc} 
            onChange={(e) => setMetaDesc(e.target.value)} 
            rows={3} 
            maxLength={180} 
            placeholder="Cuidado compasivo para tu mascota. Servicios médicos, cirugías, vacunas y atención 24/7..."
            className="bg-white border-slate-300 text-slate-900 text-xs resize-none rounded-xl focus:border-teal-500" 
          />
          {metaDesc.length > 160 && <p className="text-xs text-amber-600 mt-1">Recomendado: mantener entre 120 y 160 caracteres.</p>}
        </div>

        <div>
          <Label className="text-slate-700 text-xs font-bold mb-1.5 block">Palabras Clave (Keywords separadas por coma)</Label>
          <Input 
            value={keywords} 
            onChange={(e) => setKeywords(e.target.value)} 
            placeholder="veterinaria en madrid, vacunas para cachorros, urgencias 24h, peluqueria canina" 
            className="bg-white border-slate-300 text-slate-900 text-xs rounded-xl focus:border-teal-500" 
          />
        </div>

        <div>
          <Label className="text-slate-700 text-xs font-bold mb-1.5 block">URL Canónica (Dominio propio si aplica)</Label>
          <Input 
            value={canonical} 
            onChange={(e) => setCanonical(e.target.value)} 
            placeholder="https://miclinicaveterinaria.com" 
            className="bg-white border-slate-300 text-slate-900 text-xs font-mono rounded-xl focus:border-teal-500" 
          />
        </div>

        <Button className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs h-9 rounded-xl shadow-xs" onClick={saveSeo}>
          Guardar Ajustes SEO
        </Button>
      </Card>

      <Card className="p-6 bg-white border-slate-200 shadow-sm rounded-3xl space-y-4">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <Globe className="w-4 h-4 text-teal-600" /> Dirección Web y Estado de Publicación
        </h3>

        <div>
          <Label className="text-slate-700 text-xs font-bold mb-1.5 block">Enlace público del sitio web</Label>
          <div className="flex gap-2">
            <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-slate-300 bg-slate-100 text-slate-600 text-xs font-mono">
              /site/
            </span>
            <Input 
              value={slug} 
              onChange={(e) => setSlug(slugify(e.target.value))} 
              className="bg-white border-slate-300 text-slate-900 text-xs rounded-l-none font-mono font-bold flex-1 rounded-r-xl focus:border-teal-500" 
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
          <span className="text-xs font-bold text-slate-700">Estado del Sitio Web:</span>
          <Badge className={settings.is_published ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-xs" : "bg-amber-100 text-amber-800 border-amber-300 font-bold text-xs"}>
            {settings.is_published ? "✓ Publicado en Línea" : "Borrador Privado"}
          </Badge>
        </div>

        <div className="flex gap-3 flex-wrap pt-1">
          <Button 
            onClick={togglePublish} 
            className={`flex-1 font-bold text-xs h-10 rounded-xl shadow-xs text-white ${
              settings.is_published ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {settings.is_published ? <><EyeOff className="w-4 h-4 mr-2" />Despublicar Sitio</> : <><Rocket className="w-4 h-4 mr-2" />Publicar Sitio en Internet</>}
          </Button>

          <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 text-xs h-10 rounded-xl shadow-xs" asChild>
            <a href={`/site/${settings.slug}`} target="_blank" rel="noreferrer">
              <ExternalLink className="w-4 h-4 mr-2 text-teal-600" /> Abrir en Pestaña
            </a>
          </Button>
        </div>
      </Card>

      <Card className="p-6 bg-white border-slate-200 shadow-sm rounded-3xl">
        <h3 className="font-bold text-slate-900 text-base mb-1 flex items-center gap-2">
          <Eye className="w-4 h-4 text-teal-600" /> Simulador de Vista Previa
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Comprueba exactamente cómo ven los dueños de mascotas tu sitio antes de compartir el enlace.
        </p>
        <Button onClick={onPreview} className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-9 rounded-xl shadow-xs">
          Abrir Vista Previa Interactiva
        </Button>
      </Card>
    </div>
  );
}
