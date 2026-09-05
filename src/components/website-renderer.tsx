import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { type WebsiteSettings, type WebsiteService, type WebsiteSlide, type WebsiteGroupItem, type WebsiteTestimonial, type WebsiteGalleryItem, type WebsitePost } from "@/lib/website-store";

type Props = {
  settings: WebsiteSettings;
  services: WebsiteService[];
  slides: WebsiteSlide[];
  clinic: { name: string; logo_url: string } | null;
  team: WebsiteGroupItem[];
  testimonials: WebsiteTestimonial[];
  gallery: WebsiteGalleryItem[];
  posts: WebsitePost[];
};

// Capa de "pintura" por plantilla: la MISMA data, distinto estilo visual.
const STYLES: Record<string, { link: string; btn: string; card: string; hero: string; heroText: string; serif?: boolean }> = {
  modern_clean: { link: "text-white hover:text-white/80", btn: "bg-[var(--accent)] text-white hover:opacity-90", card: "bg-white/5 border-white/10 rounded-2xl", hero: "linear-gradient(135deg,var(--primary),var(--secondary))", heroText: "#fff" },
  clasico: { link: "text-[var(--secondary)] hover:text-[var(--primary)]", btn: "bg-[var(--primary)] text-white hover:opacity-90", card: "bg-white border border-[var(--secondary)]/10 rounded-none", hero: "#ffffff", heroText: "var(--secondary)", serif: true },
  oscuro: { link: "text-amber-300 hover:text-amber-200", btn: "bg-[var(--accent)] text-black font-extrabold hover:brightness-110", card: "bg-black/40 border-amber-500/30 rounded-xl", hero: "linear-gradient(135deg,#000,#111)", heroText: "#fbbf24" },
};

export function WebsiteRenderer({ settings, services, slides, clinic, team, testimonials, gallery, posts }: Props) {
  const s = settings;
  const id = s.identity;
  const ctx = s.contact;
  const sec = s.sections_config;
  const st = STYLES[s.template_id] ?? STYLES.modern_clean;
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", service: "", message: "" });

  const theme = {
    "--primary": id.primary_color || "#0ea5e9",
    "--secondary": id.secondary_color || "#0f172a",
    "--accent": id.accent_color || "#f59e0b",
    fontFamily: id.font_family || "Inter",
  } as React.CSSProperties;

  const ordered = Object.entries(sec).filter(([, v]) => v.enabled).sort((a, b) => a[1].order - b[1].order).map(([k]) => k);
  const has = (k: string) => ordered.includes(k);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { db } = await import("@/lib/supabase");
    const { error } = await db.from("website_leads").insert({
      clinic_id: s.clinicId, name: form.name, phone: form.phone, email: form.email, service_interested: form.service, message: form.message,
    });
    if (!error) setSent(true);
  };

  const heroData = slides[0];
  return (
    <div style={theme} className={st.serif ? "min-h-screen bg-white text-[var(--secondary)]" : "min-h-screen bg-[var(--secondary)] text-white"}>
      {/* Hero */}
      {has("hero") && (
        <header className="relative overflow-hidden" style={{ background: st.hero }}>
          {!st.serif && heroData?.image_url && <img src={heroData.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />}
          <div className="relative max-w-5xl mx-auto px-6 py-20 md:py-28 text-center">
            {id.logo_url && <img src={id.logo_url} alt={id.name} className="mx-auto h-20 w-20 rounded-2xl object-cover mb-4" />}
            {slides.length > 0 && <div className="text-xs uppercase tracking-widest mb-2" style={{ color: st.heroText, opacity: 0.7 }}>{slides.map((sl) => sl.title).join(" · ")}</div>}
            <h1 className={`text-4xl md:text-6xl font-extrabold tracking-tight ${st.serif ? "font-serif" : ""}`} style={{ color: st.heroText }}>{id.name || clinic?.name || "Mi Negocio"}</h1>
            <p className="mt-3 text-xl md:text-2xl" style={{ color: st.heroText, opacity: 0.9 }}>{id.tagline || heroData?.subtitle}</p>
            {id.description && <p className="mt-4 max-w-2xl mx-auto" style={{ color: st.heroText, opacity: 0.8 }}>{id.description}</p>}
            <div className="mt-8 flex gap-3 justify-center flex-wrap">
              {ctx.whatsapp && <a href={`https://wa.me/${ctx.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className={`px-6 py-3 rounded-xl font-semibold ${st.btn}`}>WhatsApp</a>}
              <a href="#contacto" className={`px-6 py-3 rounded-xl font-semibold ${st.serif ? "bg-[var(--primary)] text-white" : "bg-white/20 text-white hover:bg-white/30"}`}>{heroData?.cta_text || "Agendar cita"}</a>
            </div>
          </div>
        </header>
      )}

      {/* About */}
      {has("about") && id.description && (
        <section className="max-w-5xl mx-auto px-6 py-16">
          <h2 className={`text-3xl font-bold mb-6 ${st.serif ? "font-serif text-[var(--primary)]" : ""}`} style={st.serif ? undefined : { color: id.primary_color }}>Sobre nosotros</h2>
          <p className={st.serif ? "text-[var(--secondary)]/80 leading-relaxed" : "text-white/80"}>{id.description}</p>
        </section>
      )}

      {/* Services */}
      {has("services") && services.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 py-16">
          <h2 className={`text-3xl font-bold mb-8 ${st.serif ? "font-serif text-[var(--primary)]" : ""}`} style={st.serif ? undefined : { color: id.primary_color }}>Nuestros servicios</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((sv) => (
              <div key={sv.id} className={`p-6 ${st.card}`}>
                <div className="text-3xl">{sv.icon}</div>
                <div className="mt-3 font-bold text-lg">{sv.title}</div>
                {sv.description && <p className={`mt-1 text-sm ${st.serif ? "text-[var(--secondary)]/70" : "text-white/70"}`}>{sv.description}</p>}
                <div className="mt-4 flex items-center justify-between">
                  {sv.price != null && <span className="font-semibold" style={{ color: id.accent_color }}>₡{sv.price.toLocaleString("es-CR")}</span>}
                  {sv.badge && <span className="text-xs px-2 py-1 rounded-full bg-[var(--accent)] text-white">{sv.badge}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Team */}
      {has("team") && team.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 py-16">
          <h2 className={`text-3xl font-bold mb-8 ${st.serif ? "font-serif text-[var(--primary)]" : ""}`} style={st.serif ? undefined : { color: id.primary_color }}>{id.font_family ? "Nuestro equipo" : "Nuestro equipo"}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((m) => (
              <div key={m.id} className={`flex flex-col items-center text-center p-6 ${st.card}`}>
                {m.photo ? <img src={m.photo} alt={m.name} className="h-20 w-20 rounded-full object-cover mb-3" /> : <div className="h-20 w-20 rounded-full bg-[var(--primary)] text-white grid place-items-center font-bold text-2xl mb-3">{m.name.charAt(0)}</div>}
                <div className="font-bold">{m.name}</div>
                <div className={`text-sm ${st.serif ? "text-[var(--secondary)]/70" : "text-white/70"}`}>{m.role}</div>
                {m.description && <p className={`mt-2 text-xs ${st.serif ? "text-[var(--secondary)]/60" : "text-white/60"}`}>{m.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Testimonios */}
      {has("testimonials") && testimonials.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 py-16">
          <h2 className={`text-3xl font-bold mb-8 ${st.serif ? "font-serif text-[var(--primary)]" : ""}`} style={st.serif ? undefined : { color: id.primary_color }}>Lo que dicen nuestros clientes</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.id} className={`p-6 ${st.card}`}>
                <div className="text-amber-400 text-sm mb-2">{"★".repeat(Math.max(1, Math.min(5, t.rating)))}</div>
                <p className={`text-sm italic ${st.serif ? "text-[var(--secondary)]/80" : "text-white/80"}`}>“{t.content}”</p>
                <div className="mt-3 font-semibold">{t.author}</div>
                {t.role && <div className={`text-xs ${st.serif ? "text-[var(--secondary)]/60" : "text-white/60"}`}>{t.role}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Galería */}
      {has("gallery") && gallery.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 py-16">
          <h2 className={`text-3xl font-bold mb-8 ${st.serif ? "font-serif text-[var(--primary)]" : ""}`} style={st.serif ? undefined : { color: id.primary_color }}>Galería</h2>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {gallery.map((g) => (
              <div key={g.id} className="aspect-square overflow-hidden rounded-xl">
                <img src={g.image_url} alt={g.title} className="w-full h-full object-cover hover:scale-105 transition-transform" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Blog / Noticias */}
      {has("blog_news") && posts.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 py-16">
          <h2 className={`text-3xl font-bold mb-8 ${st.serif ? "font-serif text-[var(--primary)]" : ""}`} style={st.serif ? undefined : { color: id.primary_color }}>Noticias</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((po) => (
              <article key={po.id} className={`overflow-hidden ${st.card}`}>
                {po.cover_image && <img src={po.cover_image} alt={po.title} className="w-full h-40 object-cover" />}
                <div className="p-5">
                  <h3 className="font-bold text-lg">{po.title}</h3>
                  {po.summary && <p className={`mt-2 text-sm ${st.serif ? "text-[var(--secondary)]/70" : "text-white/70"}`}>{po.summary}</p>}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Contacto / Cita */}
      {has("contact_booking") && (
        <section id="contacto" className="max-w-5xl mx-auto px-6 py-16">
          <h2 className={`text-3xl font-bold mb-8 ${st.serif ? "font-serif text-[var(--primary)]" : ""}`} style={st.serif ? undefined : { color: id.primary_color }}>Contacto y citas</h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div className={`space-y-3 ${st.serif ? "text-[var(--secondary)]/85" : "text-white/85"}`}>
              <div><strong>Teléfono:</strong> {ctx.phone || "—"}</div>
              <div><strong>Correo:</strong> {ctx.email || "—"}</div>
              <div><strong>Dirección:</strong> {ctx.address || "—"}</div>
              <div><strong>Horario:</strong> {ctx.schedule || "—"}</div>
            </div>
            {sent ? (
              <div className="grid place-items-center text-center">
                <div className="text-4xl mb-3">✅</div>
                <div className="text-lg font-semibold">¡Gracias! Te contactaremos pronto.</div>
              </div>
            ) : (
              <form onSubmit={submit} className={`space-y-3 ${st.serif ? "bg-[var(--surface)] border border-[var(--line)] rounded-lg p-6" : st.card + " p-6"}`}>
                {[
                  { label: "Nombre", k: "name", type: "text", req: true },
                  { label: "Teléfono", k: "phone", type: "text", req: false },
                  { label: "Correo", k: "email", type: "email", req: false },
                  { label: "Servicio de interés", k: "service", type: "text", req: false },
                ].map((f) => (
                  <div key={f.k}>
                    <Label className={st.serif ? "text-[var(--secondary)]/70" : "text-white/80"}>{f.label}</Label>
                    <Input required={f.req} type={f.type} value={(form as any)[f.k]} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} className={st.serif ? "bg-white border-[var(--line)] text-[var(--secondary)]" : "bg-white/10 border-white/20 text-white"} />
                  </div>
                ))}
                <div>
                  <Label className={st.serif ? "text-[var(--secondary)]/70" : "text-white/80"}>Mensaje</Label>
                  <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={st.serif ? "bg-white border-[var(--line)] text-[var(--secondary)]" : "bg-white/10 border-white/20 text-white"} />
                </div>
                <Button className={`w-full ${st.btn}`}>Enviar solicitud</Button>
              </form>
            )}
          </div>
        </section>
      )}

      <footer className={`py-8 text-center text-sm border-t ${st.serif ? "text-[var(--secondary)]/60 border-[var(--line)]" : "text-white/60 border-white/10"}`}>
        © {new Date().getFullYear()} {id.name || clinic?.name || "Mi Negocio"} · {id.tagline}
      </footer>
    </div>
  );
}
