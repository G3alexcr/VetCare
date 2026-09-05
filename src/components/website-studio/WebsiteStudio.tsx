import { useState, useEffect } from "react";
import { useCurrentClinicId, useClinics } from "@/lib/saas-store";
import { useWebsiteSettings, ensureWebsite, hydrateWebsite, saveWebsiteSettings, slugify, VET_TEMPLATES } from "@/lib/website-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Palette, FileText, Briefcase, Phone, Search, Eye, Globe, Menu, X, Rocket, Pencil } from "lucide-react";
import { DesignTab } from "./DesignTab";
import { SliderTab } from "./SliderTab";
import { ContentTab } from "./ContentTab";
import { ServicesTab } from "./ServicesTab";
import { PlansTab } from "./PlansTab";
import { ContactTab } from "./ContactTab";
import { SeoTab } from "./SeoTab";
import { WebsitePreviewModal } from "./WebsitePreviewModal";
import { Image as ImageIcon, ShieldCheck } from "lucide-react";

const TABS = [
  { id: "design", label: "Diseño y Plantilla", icon: Palette },
  { id: "slider", label: "Hero y Slider de Fotos", icon: ImageIcon },
  { id: "content", label: "Contenido y Textos", icon: FileText },
  { id: "services", label: "Servicios Médicos", icon: Briefcase },
  { id: "plans", label: "Planes de Salud", icon: ShieldCheck },
  { id: "contact", label: "Contacto y Teléfonos", icon: Phone },
  { id: "seo", label: "SEO y Publicar", icon: Search },
];

export function WebsiteStudio() {
  const clinicId = useCurrentClinicId();
  const clinics = useClinics();
  const clinic = clinics.find((c) => c.id === clinicId);
  const settings = useWebsiteSettings();
  const [activeTab, setActiveTab] = useState("design");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!settings && clinicId) {
      ensureWebsite(clinicId, slugify(clinic?.name || "mi-clinica")).then(() => hydrateWebsite(clinicId));
    }
  }, [clinicId, settings, clinic?.name]);

  const handlePublish = () => {
    setPublishing(true);
    saveWebsiteSettings({ is_published: !settings?.is_published });
    setTimeout(() => {
      setPublishing(false);
      toast.success(settings?.is_published ? "Sitio despublicado" : "🚀 ¡Sitio publicado con éxito!");
    }, 600);
  };

  const activeTemplate = VET_TEMPLATES.find((t) => t.id === settings?.template_id);
  const isPublished = settings?.is_published;

  const TabContent = () => {
    if (!settings) return <div className="flex-1 grid place-items-center text-slate-400">Cargando...</div>;
    switch (activeTab) {
      case "design": return <DesignTab settings={settings} />;
      case "slider": return <SliderTab settings={settings} />;
      case "content": return <ContentTab settings={settings} />;
      case "services": return <ServicesTab />;
      case "plans": return <PlansTab settings={settings} />;
      case "contact": return <ContactTab settings={settings} />;
      case "seo": return <SeoTab settings={settings} onPreview={() => setPreviewOpen(true)} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Header */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 shrink-0 z-50 shadow-xs">
        <button onClick={() => setSidebarOpen((v) => !v)} className="md:hidden w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 grid place-items-center text-slate-600">
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 grid place-items-center shrink-0">
            <Globe className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <div className="text-[10px] font-black text-teal-700 uppercase tracking-widest leading-none">Website Studio</div>
            <div className="text-sm font-bold text-slate-900 truncate max-w-[160px] sm:max-w-xs">{clinic?.name || "Mi Clínica"}</div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3 ml-4">
          <div className="flex items-center gap-1.5 text-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${isPublished ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-amber-400"}`} />
            <span className="text-slate-600 font-medium">{isPublished ? "Publicado en vivo" : "Borrador"}</span>
          </div>
          {activeTemplate && (
            <Badge variant="outline" className="border-teal-200 bg-teal-50 text-teal-800 text-[11px] font-medium">
              {activeTemplate.name}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Button size="sm" variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs h-8 shadow-xs" onClick={() => setPreviewOpen(true)}>
            <Eye className="w-3.5 h-3.5 mr-1 text-teal-600" /> Vista Previa
          </Button>
          <Button size="sm" onClick={handlePublish} disabled={publishing}
            className={`h-8 text-xs font-bold shadow-xs ${isPublished ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}`}>
            <Rocket className="w-3.5 h-3.5 mr-1" />
            {publishing ? "Guardando..." : isPublished ? "Despublicar" : "Publicar Sitio"}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:static z-40 inset-y-0 left-0 top-14 md:top-auto w-60 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 shrink-0 shadow-xs`}>
          <nav className="flex-1 p-3 space-y-1 pt-4">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${active ? "bg-teal-50 text-teal-800 border border-teal-200 shadow-xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}>
                  <Icon className={`w-4 h-4 shrink-0 ${active ? "text-teal-600" : "text-slate-400"}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
          <div className="p-3 border-t border-slate-100 bg-slate-50/70">
            <a href={`/site/${settings?.slug || ""}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-teal-700 transition-colors px-2 py-1 font-mono">
              <Pencil className="w-3 h-3 text-slate-400" /> /site/{settings?.slug || "..."}
            </a>
          </div>
        </aside>

        {sidebarOpen && <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Content area */}
        <main className="flex-1 overflow-auto bg-slate-50/60">
          <TabContent />
        </main>
      </div>

      {previewOpen && settings && <WebsitePreviewModal slug={settings.slug} onClose={() => setPreviewOpen(false)} />}
    </div>
  );
}
