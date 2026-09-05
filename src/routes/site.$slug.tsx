import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchPublicSite, slugFromHost, type WebsiteSettings, type WebsiteService, type WebsiteSlide, type WebsiteGroupItem, type WebsiteTestimonial, type WebsiteGalleryItem, type WebsitePost } from "@/lib/website-store";
import { WebsiteRenderer } from "@/components/website-templates/WebsiteRenderer";

export const Route = createFileRoute("/site/$slug")({
  head: () => ({ meta: [{ title: "Sitio — VetCare" }] }),
  component: PublicSitePage,
});

function PublicSitePage() {
  const { slug: slugParam } = Route.useParams();
  const [data, setData] = useState<{ settings: WebsiteSettings | null; services: WebsiteService[]; slides: WebsiteSlide[]; clinic: { name: string; logo_url: string } | null; team: WebsiteGroupItem[]; testimonials: WebsiteTestimonial[]; gallery: WebsiteGalleryItem[]; posts: WebsitePost[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const hostSlug = typeof window !== "undefined" ? slugFromHost(window.location.hostname) : null;
    const slug = hostSlug || slugParam;
    setLoading(true);
    fetchPublicSite(slug).then((d) => { if (active) { setData(d); setLoading(false); } }).catch(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slugParam]);

  if (loading) return <div className="min-h-screen grid place-items-center bg-slate-50"><div className="text-slate-400 text-sm animate-pulse">Cargando sitio…</div></div>;
  const s = data?.settings;
  if (!s) return (
    <div className="min-h-screen grid place-items-center bg-slate-50">
      <div className="text-center">
        <div className="text-6xl mb-4">🐾</div>
        <div className="text-xl font-bold text-slate-700">Este sitio no existe o no está publicado</div>
        <div className="text-sm text-slate-400 mt-2">Verifica la URL o contacta al administrador</div>
      </div>
    </div>
  );

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
