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

/**
 * Ruta raíz ("/"):
 * - La raíz ES la aplicación directamente (Login unificado para Clientes, Staff y Administradores).
 * - Si tiene un subdominio de clínica específico, carga el sitio web de esa clínica.
 */
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Go2Vet — Acceso a la Plataforma" },
      {
        name: "description",
        content: "Acceso integral para clientes, propietarios y equipo veterinario.",
      },
    ],
  }),
  component: RootPage,
});

function RootPage() {
  const [subdomain, setSubdomain] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const slug = slugFromHost(window.location.hostname);
      if (slug) setSubdomain(slug);
    }
  }, []);

  if (subdomain) {
    return <ClinicWebsite />;
  }

  return <LoginPage />;
}

/** Renderiza el sitio público de la clínica cuando hay subdominio */
function ClinicWebsite() {
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
    const slug = slugFromHost(window.location.hostname) ?? "pawspattient";
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
  }, []);

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
