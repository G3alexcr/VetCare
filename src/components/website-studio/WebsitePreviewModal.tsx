import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Smartphone, Tablet, Monitor, X, ExternalLink } from "lucide-react";

const VIEWPORTS = [
  { id: "mobile", label: "Móvil", icon: Smartphone, width: 390 },
  { id: "tablet", label: "Tablet", icon: Tablet, width: 768 },
  { id: "desktop", label: "Computadora", icon: Monitor, width: 0 },
] as const;

export function WebsitePreviewModal({ slug, onClose }: { slug: string; onClose: () => void }) {
  const [viewport, setViewport] = useState<"mobile" | "tablet" | "desktop">("desktop");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[98vw] w-full h-[95vh] flex flex-col p-0 bg-white border-slate-200 gap-0 shadow-2xl rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-200 shrink-0 bg-white shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-sm font-bold text-slate-900">Simulador de Vista Previa</span>
          </div>

          <div className="flex gap-1 ml-4 bg-slate-100 rounded-xl p-1 border border-slate-200">
            {VIEWPORTS.map((v) => {
              const Icon = v.icon;
              const active = viewport === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setViewport(v.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    active 
                      ? "bg-white text-teal-800 shadow-xs border border-slate-200" 
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? "text-teal-600" : "text-slate-500"}`} />
                  {v.label}
                </button>
              );
            })}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <a 
              href={`/site/${slug}`} 
              target="_blank" 
              rel="noreferrer"
              className="text-xs text-teal-700 hover:text-teal-900 font-mono font-bold flex items-center gap-1 bg-teal-50 px-3 py-1 rounded-lg border border-teal-200"
            >
              <span>/site/{slug}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <Button size="icon" variant="ghost" className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 h-8 w-8 rounded-lg" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Preview area */}
        <div className="flex-1 overflow-auto bg-slate-100/90 grid place-items-start justify-items-center p-6">
          <div
            className={`transition-all duration-300 ${
              viewport === "mobile" 
                ? "w-[390px] rounded-[2.5rem] border-4 border-slate-900 overflow-hidden shadow-2xl bg-white" 
                : viewport === "tablet" 
                ? "w-[768px] rounded-2xl border-4 border-slate-900 overflow-hidden shadow-2xl bg-white" 
                : "w-full h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
            }`}
            style={{ height: viewport === "desktop" ? "100%" : undefined }}
          >
            {/* Mobile notch */}
            {viewport === "mobile" && (
              <div className="h-7 bg-slate-900 rounded-t-[2.2rem] flex items-center justify-center">
                <div className="w-20 h-3 bg-slate-800 rounded-full" />
              </div>
            )}
            <iframe
              src={`/site/${slug}`}
              className="w-full bg-white"
              style={{ 
                height: viewport === "mobile" ? "74vh" : viewport === "tablet" ? "78vh" : "100%", 
                border: "none" 
              }}
              title="Vista previa del sitio"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
