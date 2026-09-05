import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { slugFromHost } from "@/lib/website-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VetCare — Plataforma para clínicas veterinarias" },
      { name: "description", content: "Gestiona clientes, mascotas, agenda y consultas médicas desde un único panel." },
    ],
  }),
  component: Index,
});

function Index() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (typeof window !== "undefined") {
      // 1. Detección por subdominio real (ej: pawspattient.vetcare.app o pawspattient.vetcare.cr)
      const hostSub = slugFromHost(window.location.hostname);
      if (hostSub) {
        navigate({ to: `/site/${hostSub}` as any, replace: true });
        return;
      }

      // 2. Detección por parámetro de prueba/preview (ej: vet-care-lilac.vercel.app/?s=pawspattient)
      const urlParams = new URLSearchParams(window.location.search);
      const sub = urlParams.get("s") || urlParams.get("clinic") || urlParams.get("subdominio");
      if (sub) {
        navigate({ to: `/site/${sub}` as any, replace: true });
        return;
      }
    }
    if (!ready) return;
    navigate({ to: user ? "/dashboard" : "/login", replace: true });
  }, [user, ready, navigate]);
  return (
    <div className="min-h-screen grid place-items-center bg-background">
      <div className="text-muted-foreground text-sm">Cargando VetCare...</div>
    </div>
  );
}
