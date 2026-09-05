import { useState } from "react";
import { useWebsiteServices, addWebsiteService, updateWebsiteService, deleteWebsiteService, DEFAULT_SERVICES } from "@/lib/website-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Package, Sparkles, Upload, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { fileToBase64DataUrl, getBase64SizeKb } from "@/lib/image-upload";

export function ServicesTab() {
  const services = useWebsiteServices();
  const [editing, setEditing] = useState<Record<string, Partial<{ title: string; description: string; icon: string; image_url: string; price: string; price_from: boolean; badge: string; duration: string; is_active: boolean }>>>({});

  const getEdit = (id: string) => editing[id] ?? {};
  const setEdit = (id: string, patch: object) => setEditing((e) => ({ ...e, [id]: { ...e[id], ...patch } }));

  const handleServicePhotoUpload = async (svcId: string, file: File) => {
    try {
      const base64 = await fileToBase64DataUrl(file, 1000, 0.85);
      setEdit(svcId, { image_url: base64 });
      const kb = getBase64SizeKb(base64);
      toast.success(`Foto de servicio cargada (${kb} KB). Haz clic en Guardar Servicio.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al procesar la foto";
      toast.error(msg);
    }
  };

  const saveOne = (svcId: string) => {
    const e = getEdit(svcId);
    updateWebsiteService(svcId, {
      title: e.title,
      description: e.description,
      icon: e.icon,
      image_url: e.image_url,
      price: e.price !== undefined ? (e.price === "" ? null : Number(e.price)) : undefined,
      price_from: e.price_from,
      badge: e.badge,
      duration: e.duration,
      is_active: e.is_active,
    });
    toast.success("Servicio guardado");
  };

  const addNew = () => {
    addWebsiteService({
      title: "Nuevo servicio",
      description: "",
      icon: "🐾",
      image_url: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=600&q=80",
      price: null,
      price_from: false,
      badge: "",
      duration: "",
      sort_order: services.length,
      is_active: true,
    });
    toast.success("Servicio agregado");
  };

  const loadDefaults = () => {
    DEFAULT_SERVICES.forEach((d) => addWebsiteService(d));
    toast.success("Servicios demo cargados");
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Servicios Veterinarios</h2>
          <p className="text-xs text-slate-500 mt-1">
            {services.length} servicio{services.length !== 1 ? "s" : ""} configurado{services.length !== 1 ? "s" : ""} para mostrar en tu web
          </p>
        </div>
        <div className="flex gap-2">
          {services.length === 0 && (
            <Button size="sm" variant="outline" className="border-slate-300 text-slate-700 bg-white hover:bg-slate-50 h-9 text-xs font-bold shadow-xs" onClick={loadDefaults}>
              <Package className="w-3.5 h-3.5 mr-1 text-teal-600" /> Cargar Demos
            </Button>
          )}
          <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white h-9 text-xs font-bold shadow-xs" onClick={addNew}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Nuevo Servicio
          </Button>
        </div>
      </div>

      {services.length === 0 && (
        <div className="border-2 border-dashed border-slate-300 bg-white rounded-3xl p-12 text-center">
          <div className="text-4xl mb-3">🐾</div>
          <h3 className="font-bold text-slate-800 text-base">Aún no tienes servicios</h3>
          <p className="text-slate-500 text-xs mt-1 mb-4">Crea tus propios servicios médicos o carga nuestra lista recomendada.</p>
          <Button size="sm" onClick={loadDefaults} className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold">
            Cargar Servicios Demo
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {services.map((svc) => {
          const e = getEdit(svc.id);
          const val = <K extends keyof typeof svc>(k: K) => (e[k as keyof typeof e] as typeof svc[K]) ?? svc[k];
          return (
            <div key={svc.id} className="bg-white border border-slate-200 shadow-xs rounded-3xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Input value={String(val("icon"))} onChange={(ev) => setEdit(svc.id, { icon: ev.target.value })} className="w-14 text-center text-2xl bg-slate-50 border-slate-200 rounded-xl" />
                <Input value={String(val("title"))} onChange={(ev) => setEdit(svc.id, { title: ev.target.value })} placeholder="Nombre del servicio" className="flex-1 bg-white border-slate-300 text-slate-900 font-bold text-sm rounded-xl focus:border-teal-500" />
                <div className="flex items-center gap-2 pl-2">
                  <span className="text-xs text-slate-500 font-medium">Visible</span>
                  <Switch checked={Boolean(val("is_active"))} onCheckedChange={(v) => setEdit(svc.id, { is_active: v })} />
                </div>
                <Button size="icon" variant="ghost" className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 shrink-0 h-9 w-9 rounded-xl" onClick={() => deleteWebsiteService(svc.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              {/* Foto del Servicio con subida desde PC */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <label className="w-20 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 shadow-xs relative cursor-pointer group block" title="Haz clic para subir foto desde tu PC">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(ev) => {
                      const f = ev.target.files?.[0];
                      if (f) handleServicePhotoUpload(svc.id, f);
                    }} 
                  />
                  <img 
                    src={String(val("image_url") || "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=200&q=80")} 
                    alt="foto servicio"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-bold">
                    <Upload className="w-3.5 h-3.5" />
                  </div>
                </label>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-bold text-slate-700 block">Foto del Servicio Médico</Label>
                    {String(val("image_url") || "").startsWith("data:image") && (
                      <span className="text-[9px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Base64 ({getBase64SizeKb(String(val("image_url")))} KB)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-teal-800 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0 shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-teal-600" />
                      <span>Subir desde PC</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(ev) => {
                          const f = ev.target.files?.[0];
                          if (f) handleServicePhotoUpload(svc.id, f);
                        }} 
                      />
                    </label>
                    <Input 
                      value={String(val("image_url") || "").startsWith("data:image") ? "[Imagen en Base64 cargada]" : String(val("image_url") ?? "")} 
                      onChange={(ev) => setEdit(svc.id, { image_url: ev.target.value })} 
                      placeholder="o pega una URL médica (https://...)" 
                      className="bg-white border-slate-300 text-slate-900 text-xs font-mono rounded-xl focus:border-teal-500 h-8 flex-1" 
                    />
                  </div>
                </div>
              </div>

              <Textarea value={String(val("description"))} onChange={(ev) => setEdit(svc.id, { description: ev.target.value })} placeholder="Descripción médica del servicio..." rows={2} className="bg-white border-slate-300 text-slate-800 text-xs resize-none rounded-xl focus:border-teal-500" />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div>
                  <Label className="text-xs font-bold text-slate-700">Precio ($)</Label>
                  <Input value={val("price") ?? ""} onChange={(ev) => setEdit(svc.id, { price: ev.target.value })} type="number" placeholder="Ej. 35" className="bg-white border-slate-300 text-slate-900 text-xs font-bold mt-1 rounded-xl" />
                </div>
                <div className="flex items-end pb-2 gap-2">
                  <Switch checked={Boolean(val("price_from"))} onCheckedChange={(v) => setEdit(svc.id, { price_from: v })} />
                  <span className="text-xs text-slate-600 font-medium">¿Precio "Desde"?</span>
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-700">Insignia / Badge</Label>
                  <Input value={String(val("badge"))} onChange={(ev) => setEdit(svc.id, { badge: ev.target.value })} placeholder="Ej. POPULAR" className="bg-white border-slate-300 text-slate-900 text-xs mt-1 rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-700">Duración estimada</Label>
                  <Input value={String(val("duration"))} onChange={(ev) => setEdit(svc.id, { duration: ev.target.value })} placeholder="30 min" className="bg-white border-slate-300 text-slate-900 text-xs mt-1 rounded-xl" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div>
                  {svc.badge && <Badge className="bg-teal-100 text-teal-800 border-teal-200 text-[10px] font-bold">{svc.badge}</Badge>}
                </div>
                <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white h-8 text-xs font-bold rounded-xl shadow-xs" onClick={() => saveOne(svc.id)}>
                  Guardar Servicio
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
