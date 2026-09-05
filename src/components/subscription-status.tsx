import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { RefreshCw, XCircle, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlanCapabilities } from "@/lib/saas-store";

// Bloquea el contenido si la suscripción está suspendida o cancelada.
export function SubscriptionGate({ children }: { children: ReactNode }) {
  const caps = usePlanCapabilities();
  if (caps.subscriptionStatus !== "Suspendida" && caps.subscriptionStatus !== "Cancelada") {
    return <>{children}</>;
  }
  return (
    <div className="grid place-items-center py-24">
      <div className="max-w-md text-center space-y-4">
        <div className="mx-auto h-14 w-14 rounded-full bg-rose-100 text-rose-600 grid place-items-center">
          <XCircle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-semibold">Suscripción {caps.subscriptionStatus}</h2>
        <p className="text-sm text-muted-foreground">
          Tu suscripción está <span className="font-medium text-foreground">{caps.subscriptionStatus}</span>.
          Renueva tu plan para recuperar el acceso a VetCare y a toda la información de tu clínica.
        </p>
        <Button asChild>
          <Link to="/configuracion">
            <RefreshCw className="h-4 w-4 mr-2" /> Renovar ahora
          </Link>
        </Button>
      </div>
    </div>
  );
}

// Banner informativo en la parte superior según el estado de la suscripción.
export function SubscriptionBanner() {
  const caps = usePlanCapabilities();
  const status = caps.subscriptionStatus ?? "Activa";
  if (status === "Activa") return null;
  const isPrueba = status === "Prueba";
  return (
    <div className={`px-4 py-2 text-center text-sm flex items-center justify-center gap-2 ${isPrueba ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-800"}`}>
      {isPrueba ? <BadgeCheck className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
      {isPrueba
        ? "Estás en período de prueba del plan."
        : `Tu suscripción está ${status}. Algunas funciones están limitadas.`}
      <Link to="/configuracion" className="underline font-medium">Gestionar</Link>
    </div>
  );
}
