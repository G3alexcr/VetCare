import React, { useState } from "react";
import { LegalModal, type LegalPolicyKey } from "@/components/legal-modal";
import { Lock, ShieldCheck } from "lucide-react";
import { useCurrentClinicId } from "@/lib/saas-store";
import { useMyClinics } from "@/hooks/use-my-clinics";

interface AppFooterProps {
  className?: string;
}

export function AppFooter({ className = "" }: AppFooterProps) {
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<LegalPolicyKey>("datos-personales");

  const currentClinicId = useCurrentClinicId();
  const myClinics = useMyClinics();
  const activeClinic = myClinics.find((c) => c.id === currentClinicId);
  const clinicName = activeClinic?.name || "Paws Pattient";

  const openPolicy = (policy: LegalPolicyKey) => {
    setSelectedPolicy(policy);
    setLegalModalOpen(true);
  };

  return (
    <>
      <footer
        className={`border-t border-slate-800/90 bg-[#050b14] text-slate-400 py-2 sm:py-2.5 px-4 sm:px-6 select-none shrink-0 ${className}`}
      >
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* Lado izquierdo: Copyright & Powered by (Idéntico a referencia) */}
          <div className="flex flex-col items-center sm:items-start gap-0.5 text-center sm:text-left">
            <div className="text-slate-300 font-medium text-xs">
              © {new Date().getFullYear()} <strong className="text-white font-semibold">Go2Vet</strong>. Todos los derechos reservados.
            </div>
            <div className="text-[10px] tracking-wider uppercase font-semibold text-emerald-400 flex items-center gap-1.5">
              <span>POWERED BY GO2VET CLOUD TECHNOLOGIES</span>
              <span className="text-slate-600 font-normal">•</span>
              <span className="text-slate-400 font-normal lowercase tracking-normal">{clinicName}</span>
            </div>
          </div>

          {/* Lado derecho: Enlaces legales & Badge de Conexión segura */}
          <div className="flex flex-col items-center sm:items-end gap-1.5 text-center sm:text-right">
            {/* Fila de enlaces con modal */}
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-2.5 gap-y-1 text-[11px] text-slate-400">
              <button
                type="button"
                onClick={() => openPolicy("datos-personales")}
                className="hover:text-emerald-400 transition-colors cursor-pointer"
                title="Cumplimiento Ley 1581 de 2012"
              >
                Tratamiento de Datos (Ley 1581)
              </button>
              <span className="text-slate-700">•</span>
              <button
                type="button"
                onClick={() => openPolicy("aplicativos-web")}
                className="hover:text-emerald-400 transition-colors cursor-pointer"
                title="Políticas Web, Cookies y Privacidad"
              >
                Privacidad & Web Apps
              </button>
              <span className="text-slate-700">•</span>
              <button
                type="button"
                onClick={() => openPolicy("condiciones-uso")}
                className="hover:text-emerald-400 transition-colors cursor-pointer"
                title="Términos y Condiciones de Uso"
              >
                Condiciones de Uso
              </button>
              <span className="text-slate-700">•</span>
              <span className="text-slate-500">Cifrado SSL 256-bit</span>
            </div>

            {/* Badge pill de conexión segura */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 text-[10px] font-medium shadow-xs">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <Lock className="h-2.5 w-2.5 text-emerald-400" />
              <span>Conexión segura — A+ en Security & SLA 99.9%</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal con todo el contenido detallado de políticas */}
      <LegalModal
        open={legalModalOpen}
        onOpenChange={setLegalModalOpen}
        initialPolicy={selectedPolicy}
      />
    </>
  );
}
