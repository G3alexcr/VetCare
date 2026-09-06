import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LEGAL_POLICIES, LegalPolicySection } from "@/lib/legal-policies";
import { ShieldCheck, Globe, FileText, Printer, CheckCircle2, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type LegalPolicyKey = "datos-personales" | "aplicativos-web" | "condiciones-uso";

interface LegalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPolicy?: LegalPolicyKey;
}

const POLICY_ICONS: Record<LegalPolicyKey, React.ComponentType<{ className?: string }>> = {
  "datos-personales": ShieldCheck,
  "aplicativos-web": Globe,
  "condiciones-uso": FileText,
};

export function LegalModal({ open, onOpenChange, initialPolicy = "datos-personales" }: LegalModalProps) {
  const [activeKey, setActiveKey] = useState<LegalPolicyKey>(initialPolicy);

  // Sincronizar activeKey cuando se abra con otra directiva
  useEffect(() => {
    if (initialPolicy) {
      setActiveKey(initialPolicy);
    }
  }, [initialPolicy, open]);

  const currentPolicy: LegalPolicySection = LEGAL_POLICIES[activeKey] || LEGAL_POLICIES["datos-personales"];
  const CurrentIcon = POLICY_ICONS[activeKey] || ShieldCheck;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-2xl border-border/80 shadow-2xl">
        {/* Cabecera estilizada */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#046162] text-white p-5 sm:p-6 border-b border-slate-700/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-emerald-400 border border-white/15 shrink-0 shadow-xs">
                <CurrentIcon className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  {currentPolicy.title}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-slate-300">
                  {currentPolicy.badge} · Última actualización: {currentPolicy.lastUpdated}
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-400/40 text-[11px] font-medium">
                <Lock className="h-3 w-3 mr-1 inline" /> Vigente 2026
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={handlePrint}
                className="h-8 text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 hidden sm:inline-flex items-center gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimir
              </Button>
            </div>
          </div>

          {/* Selector de pestañas para cambiar de documento */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mr-1 shrink-0">
              Documentos:
            </span>
            {(
              [
                { key: "datos-personales", label: "Datos Personales", icon: ShieldCheck },
                { key: "aplicativos-web", label: "Aplicativos Web & Cookies", icon: Globe },
                { key: "condiciones-uso", label: "Condiciones de Uso", icon: FileText },
              ] as const
            ).map((tab) => {
              const isSelected = activeKey === tab.key;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveKey(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? "bg-white text-slate-900 shadow-sm font-semibold"
                      : "bg-white/10 text-white hover:bg-white/15"
                  }`}
                >
                  <TabIcon className={`h-3.5 w-3.5 ${isSelected ? "text-emerald-600" : "text-slate-300"}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cuerpo del documento legal con scroll */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-sm text-foreground/90 leading-relaxed max-h-[calc(90vh-170px)]">
          {/* Card de introducción */}
          <div className="p-4 sm:p-5 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-100 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              <CheckCircle2 className="h-4 w-4" />
              Marco Legal & Declaración Institucional
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground dark:text-emerald-100/90">
              {currentPolicy.intro}
            </p>
          </div>

          {/* Artículos y cláusulas */}
          <div className="space-y-6 divide-y divide-border/60">
            {currentPolicy.articles.map((art, idx) => (
              <div key={idx} className={idx > 0 ? "pt-5 space-y-3" : "space-y-3"}>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  {art.title}
                </h3>

                {Array.isArray(art.content) ? (
                  <ul className="space-y-2.5 pl-2">
                    {art.content.map((item, cIdx) => (
                      <li key={cIdx} className="text-xs sm:text-sm text-muted-foreground flex items-start gap-2.5">
                        <ArrowRight className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-1" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs sm:text-sm text-muted-foreground pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                    {art.content}
                  </p>
                )}

                {art.highlight && (
                  <div className="mt-3 p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
                    <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span className="font-medium">{art.highlight}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pie informativo dentro del modal */}
          <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div>
              Para requerimientos formales o consultas legales:{" "}
              <a href="mailto:privacidad@go2vet.app" className="text-primary font-medium hover:underline">
                privacidad@go2vet.app
              </a>
            </div>
            <div className="text-[11px] text-muted-foreground/80">
              Go2Vet Cloud Platform · Sistema Certificado
            </div>
          </div>
        </div>

        {/* Footer del diálogo */}
        <div className="bg-muted/40 px-6 py-3 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Documento vinculante para el uso de Go2Vet®
          </span>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Entendido y Aceptar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
