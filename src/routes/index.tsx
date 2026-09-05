import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

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
      const urlParams = new URLSearchParams(window.location.search);
      const sub = urlParams.get("s");
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
