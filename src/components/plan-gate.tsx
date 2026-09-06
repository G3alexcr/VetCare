import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Rocket, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlanCapabilities } from "@/lib/saas-store";

type Props = {
  planKey: "pos" | "tienda";
  title?: string;
  description?: string;
  children?: ReactNode;
};

export function PlanGate({ planKey, title, description, children }: Props) {
  const caps = usePlanCapabilities();
  const allowed = planKey === "pos" ? caps.posEnabled : caps.tiendaOnlineEnabled;
  if (allowed) return <>{children}</>;

  const featureName = planKey === "pos" ? "Punto de Venta" : "Tienda Online";

  return (
    <div className="grid place-items-center py-20">
      <div className="max-w-md text-center space-y-4">
        <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 text-primary grid place-items-center">
          <Lock className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-semibold">
          {title ?? `${featureName} disponible en planes superiores`}
        </h2>
        <p className="text-sm text-muted-foreground">
          {description ??
            `El módulo de ${featureName} no está incluido en tu plan actual (${caps.plan?.name ?? "—"}). Mejora tu plan para desbloquearlo y sacarle el máximo partido a Go2Vet.`}
        </p>
        {caps.plan && (
          <div className="rounded-lg border p-3 text-sm text-left space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan actual</span>
              <span className="font-medium">{caps.plan.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{featureName}</span>
              <span className="text-rose-600 font-medium">No incluido</span>
            </div>
          </div>
        )}
        <Button asChild>
          <Link to="/configuracion">
            <Rocket className="h-4 w-4 mr-2" /> Mejorar plan
          </Link>
        </Button>
      </div>
    </div>
  );
}
