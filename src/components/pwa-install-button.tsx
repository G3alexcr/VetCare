import { useEffect, useState } from "react";
import { Download, Smartphone, Monitor, CheckCircle2, HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallButton({ className }: { className?: string }) {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    // Detectar si ya está en modo standalone (instalada)
    if (typeof window !== "undefined") {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      if (isStandalone) {
        setInstalled(true);
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setPromptEvent(null);
      toast.success("¡VetCare App instalada con éxito!");
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleClick = async () => {
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === "accepted") {
          toast.success("Instalando VetCare...");
        }
        setPromptEvent(null);
      } catch {
        setModalOpen(true);
      }
    } else {
      // Si no está disponible el prompt automático (ej. iOS Safari, ya instalada o navegadores de escritorio)
      setModalOpen(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        type="button"
        className={`w-full group relative flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-full border border-cyan-400/80 bg-slate-950/80 hover:bg-slate-900 text-cyan-400 hover:text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all cursor-pointer font-bold tracking-wider text-xs uppercase ${className ?? ""}`}
        title="Instalar aplicación en tu dispositivo"
      >
        <Download className="h-4 w-4 stroke-[2.4] transition-transform group-hover:-translate-y-0.5" />
        <span>{installed ? "APP INSTALADA" : "DESCARGAR APP"}</span>
      </button>

      {/* Modal de instrucciones PWA si no se puede auto-lanzar el prompt */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Download className="h-5 w-5 text-primary" />
              Instalar VetCare PWA
            </DialogTitle>
            <DialogDescription className="text-xs">
              Instala VetCare directamente en tu teléfono, tablet o computadora sin necesidad de tiendas de aplicaciones.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            {installed ? (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-xl border border-emerald-200">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <span>La aplicación ya está instalada y funcionando en este dispositivo.</span>
              </div>
            ) : (
              <>
                <div className="p-3 rounded-xl border bg-muted/30 space-y-1.5">
                  <div className="font-semibold flex items-center gap-2 text-foreground">
                    <Smartphone className="h-4 w-4 text-primary" />
                    En iPhone / iPad (Safari)
                  </div>
                  <ol className="list-decimal list-inside text-muted-foreground space-y-1 pl-1 text-[11px]">
                    <li>Toca el botón <strong>Compartir</strong> (icono de cuadrado con flecha hacia arriba).</li>
                    <li>Desliza hacia abajo y selecciona <strong>"Añadir a pantalla de inicio"</strong> (+).</li>
                    <li>Toca <strong>Añadir</strong> en la esquina superior derecha.</li>
                  </ol>
                </div>

                <div className="p-3 rounded-xl border bg-muted/30 space-y-1.5">
                  <div className="font-semibold flex items-center gap-2 text-foreground">
                    <Smartphone className="h-4 w-4 text-primary" />
                    En Android (Chrome / Edge)
                  </div>
                  <ol className="list-decimal list-inside text-muted-foreground space-y-1 pl-1 text-[11px]">
                    <li>Toca los tres puntos <strong>(⋮)</strong> arriba a la derecha.</li>
                    <li>Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Añadir a pantalla principal"</strong>.</li>
                  </ol>
                </div>

                <div className="p-3 rounded-xl border bg-muted/30 space-y-1.5">
                  <div className="font-semibold flex items-center gap-2 text-foreground">
                    <Monitor className="h-4 w-4 text-primary" />
                    En Windows o Mac (Chrome / Edge)
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    Haz clic en el icono de instalación <strong>(⊕)</strong> en el lado derecho de la barra de direcciones de tu navegador.
                  </p>
                </div>
              </>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={() => setModalOpen(false)} className="w-full">
            Entendido
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
