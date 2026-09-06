import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchPublicSite, slugFromHost, type WebsiteSettings, type WebsiteService, type WebsiteSlide, type WebsiteGroupItem, type WebsiteTestimonial, type WebsiteGalleryItem, type WebsitePost } from "@/lib/website-store";
import { WebsiteRenderer } from "@/components/website-templates/WebsiteRenderer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Go2Vet — Plataforma para clínicas veterinarias" },
      { name: "description", content: "Sitio web oficial y servicios para el cuidado de mascotas." },
    ],
  }),
  component: Index,
});

function Index() {
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
    let slug = "pawspattient"; // Clínica oficial por defecto
    if (typeof window !== "undefined") {
      const hostSub = slugFromHost(window.location.hostname);
      const urlParams = new URLSearchParams(window.location.search);
      const querySub = urlParams.get("s") || urlParams.get("clinic") || urlParams.get("subdominio");
      slug = hostSub || querySub || "pawspattient";
    }
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
        <div className="text-slate-400 text-sm animate-pulse">Cargando sitio veterinario…</div>
      </div>
    );
  }

  const s = data?.settings;
  if (!s) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🐾</div>
          <div className="text-xl font-bold text-slate-700">Sitio no disponible</div>
          <div className="text-sm text-slate-400 mt-2">No se encontró la configuración del sitio web para esta clínica.</div>
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
