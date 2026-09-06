import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  fetchPublicSite,
  slugFromHost,
  type WebsiteSettings,
  type WebsiteService,
  type WebsiteSlide,
  type WebsiteGroupItem,
  type WebsiteTestimonial,
  type WebsiteGalleryItem,
  type WebsitePost,
} from "@/lib/website-store";
import { WebsiteRenderer } from "@/components/website-templates/WebsiteRenderer";

import { LoginPage } from "./login";
import { LandingPage } from "@/components/landing-page";

/**
 * Ruta raíz ("/"):
 * - app.go2vet.online ➔ Aplicación clínica veterinaria (LoginPage / Portal / Dashboard)
 * - go2vet.online / www.go2vet.online ➔ Landing Page comercial de Go2Vet
 * - *.go2vet.online (ej: pawspatient.go2vet.online) ➔ Sitio web público de la clínica
 */
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Go2Vet — Software de Gestión Veterinaria en la Nube" },
      {
        name: "description",
        content: "Plataforma integral de gestión clínica, expediente digital, agenda, inventario y carné de pacientes.",
      },
    ],
  }),
  component: RootPage,
});

function RootPage() {
  const host = typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const forcedView = params?.get("view");
  const querySlug = params?.get("site") || params?.get("clinic");

  const slug = querySlug || (typeof window !== "undefined" ? slugFromHost(host) : null);
  const isApp = host.startsWith("app.") || host.startsWith("app-") || host === "localhost" || host.includes("127.0.0.1");

  if (forcedView === "landing") return <LandingPage />;
  if (forcedView === "app") return <LoginPage />;

  // 1. Subdominio de clínica específica (ej: pawspatient.go2vet.online)
  if (slug) {
    return <ClinicWebsite forcedSlug={slug} />;
  }

  // 2. Si es el subdominio de la app (app.go2vet.online)
  if (isApp) {
    return <LoginPage />;
  }

  // 3. Dominio principal o www (go2vet.online / www.go2vet.online)
  return <LandingPage />;
}

/** Renderiza el sitio público de la clínica cuando hay subdominio */
function ClinicWebsite({ forcedSlug }: { forcedSlug?: string }) {
  const [data, setData] = useState<{
    settings: WebsiteSettings | null;
    services: WebsiteService[];
    slides: WebsiteSlide[];
    clinic: { name: string; logo_url: string } | null;
    team: WebsiteGroupItem[];
    testimonials: WebsiteTestimonial[];
    gallery: WebsiteGalleryItem[];
    posts: WebsitePost[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const slug = forcedSlug || (typeof window !== "undefined" ? slugFromHost(window.location.hostname) : null) || "pawspatient";
    setLoading(true);
    fetchPublicSite(slug)
      .then((d) => {
        if (active) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [forcedSlug]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <div className="text-slate-400 text-sm animate-pulse">
          Cargando sitio veterinario…
        </div>
      </div>
    );
  }

  const s = data?.settings;
  if (!s) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🐾</div>
          <div className="text-xl font-bold text-slate-700">
            Sitio no disponible
          </div>
          <div className="text-sm text-slate-400 mt-2">
            No se encontró la configuración del sitio web para esta clínica.
          </div>
        </div>
      </div>
    );
  }

  return (
    <WebsiteRenderer
      settings={s}
      services={data!.services}
      slides={data!.slides}
      clinic={data!.clinic}
      team={data!.team}
      testimonials={data!.testimonials}
      gallery={data!.gallery}
      posts={data!.posts}
    />
  );
}

/** Componente de fallback client-side que redirige a /login */
function RedirectToLogin() {
  useEffect(() => {
    window.location.replace("/login");
  }, []);
  return (
    <div className="min-h-screen grid place-items-center bg-slate-50">
      <div className="text-slate-400 text-sm animate-pulse">Redirigiendo…</div>
    </div>
  );
}
