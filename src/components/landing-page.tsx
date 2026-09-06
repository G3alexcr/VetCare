import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  FileText,
  CreditCard,
  Globe,
  Sparkles,
  ShieldCheck,
  Smartphone,
  ArrowRight,
  Heart,
  Stethoscope,
  Users,
  Menu,
  X,
  Clock,
  QrCode,
} from "lucide-react";

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [appUrl, setAppUrl] = useState("https://app.go2vet.online");
  const [portalUrl, setPortalUrl] = useState("https://app.go2vet.online/portal/login");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLocal = window.location.hostname === "localhost" || window.location.hostname.includes("127.0.0.1");
      if (isLocal) {
        setAppUrl("/login");
        setPortalUrl("/portal/login");
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white text-xs font-medium py-2 px-4 text-center">
        <span>🐾 Go2Vet 2.0 ya está disponible: Gestión clínica inteligente, portal de clientes y sitios web para cada veterinaria.</span>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 8.5c1.4 0 2.5-1.1 2.5-2.5S13.4 3.5 12 3.5 9.5 4.6 9.5 6s1.1 2.5 2.5 2.5zm-5 1c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm10 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-8.5 4c0-.8.7-1.5 1.5-1.5h4c.8 0 1.5.7 1.5 1.5 0 2.2-1.8 4-4 4s-4-1.8-4-4zm11-1.5c-.8 0-1.5.7-1.5 1.5 0 1.4-.7 2.6-1.8 3.3.4.5.9.8 1.5.8 1.8 0 3.3-1.5 3.3-3.3 0-1.3-.7-2.3-1.5-2.3zm-15 0c-.8 0-1.5 1-1.5 2.3 0 1.8 1.5 3.3 3.3 3.3.6 0 1.1-.3 1.5-.8-1.1-.7-1.8-1.9-1.8-3.3 0-.8-.7-1.5-1.5-1.5z"/>
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent">
              Go2Vet
            </span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#modulos" className="hover:text-foreground transition-colors">Módulos</a>
            <a href="#portal" className="hover:text-foreground transition-colors">Portal Propietarios</a>
            <a href="#web" className="hover:text-foreground transition-colors">Sitio Web Propio</a>
            <a href="#beneficios" className="hover:text-foreground transition-colors">Beneficios</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <a href={portalUrl}>Soy Tutor / Propietario</a>
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20" asChild>
              <a href={appUrl}>Ingresar al Software</a>
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-b bg-background px-4 pt-2 pb-4 space-y-3">
            <a href="#modulos" onClick={() => setMenuOpen(false)} className="block py-2 text-sm font-medium">Módulos</a>
            <a href="#portal" onClick={() => setMenuOpen(false)} className="block py-2 text-sm font-medium">Portal Propietarios</a>
            <a href="#web" onClick={() => setMenuOpen(false)} className="block py-2 text-sm font-medium">Sitio Web Propio</a>
            <div className="pt-2 flex flex-col gap-2">
              <Button variant="outline" size="sm" asChild className="w-full">
                <a href={portalUrl}>Soy Tutor / Propietario</a>
              </Button>
              <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
                <a href={appUrl}>Ingresar al Software</a>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_35%_at_50%_20%,rgba(16,185,129,0.12),transparent)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <Badge variant="outline" className="px-3.5 py-1 text-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-full font-medium inline-flex items-center gap-1.5 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            Software de Gestión Veterinaria en la Nube
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.15]">
            Todo lo que tu clínica veterinaria necesita,{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              en un solo lugar
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Expediente clínico digital, agenda de citas, punto de venta e inventario, portal para los tutores de mascotas y un sitio web público para tu veterinaria.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button size="lg" className="w-full sm:w-auto h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-600/25 gap-2 text-base" asChild>
              <a href={appUrl}>
                Acceder al Software <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 font-medium text-base" asChild>
              <a href={portalUrl}>
                Portal del Propietario
              </a>
            </Button>
          </div>

          <div className="pt-8 flex flex-wrap items-center justify-center gap-8 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-600" /> 100% en la Nube y Seguro</span>
            <span className="flex items-center gap-1.5"><Smartphone className="h-4 w-4 text-emerald-600" /> Compatible con Móviles y Tablets</span>
            <span className="flex items-center gap-1.5"><Globe className="h-4 w-4 text-emerald-600" /> Dominio propio para tu veterinaria</span>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section id="modulos" className="py-16 sm:py-20 bg-muted/30 border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">Módulos especializados</h2>
            <p className="text-muted-foreground">
              Diseñado con veterinarios y para veterinarios. Optimiza cada proceso clínico y administrativo.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-card border rounded-2xl p-6 space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg">Expediente Clínico Digital</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Historial médico completo por mascota: consultas, vacunas, desparasitaciones, cirugías, hospitalizaciones y fotos clínicas tomadas en tiempo real.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-card border rounded-2xl p-6 space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg">Agenda y Citas Inteligente</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Control de disponibilidad por veterinario y sala. Los clientes agendan en los horarios oficiales disponibles de tu clínica.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-card border rounded-2xl p-6 space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                <CreditCard className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg">Punto de Venta e Inventario</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Venta de medicamentos, accesorios y servicios. Control de stock, alertas de agotamiento y facturación en caja integrada.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-card border rounded-2xl p-6 space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                <QrCode className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg">Carné Digital del Paciente</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Cada mascota tiene su carné digital oficial con código QR. Los tutores consultan vacunas vigentes y próximas citas desde su teléfono.
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-card border rounded-2xl p-6 space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                <Globe className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg">Sitio Web Propio por Clínica</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Tu veterinaria tiene su propia página web en internet (ej: <code>tuclinica.go2vet.online</code>) con plantilla personalizable, catálogo de servicios y equipo.
              </p>
            </div>

            {/* Card 6 */}
            <div className="bg-card border rounded-2xl p-6 space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg">Inteligencia Artificial Médica</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Asistente VetCare AI para resúmenes automáticos de expedientes, sugerencias de dosis y apoyo al equipo profesional.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Wildcard Subdomains showcase */}
      <section id="web" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="outline" className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/20">
                Páginas públicas multiclínica
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Cada clínica con su propia presencia web en internet
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Olvídate de pagar hosting o contratar diseñadores web por separado. En Go2Vet, cada veterinaria cuenta con su propia dirección web:
              </p>
              <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-sm space-y-1">
                <div className="text-emerald-400"># Tu subdominio personalizado:</div>
                <div className="text-white font-bold">https://<span className="text-emerald-400">tu-veterinaria</span>.go2vet.online</div>
              </div>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">✓ Servicios y horarios de atención al público</li>
                <li className="flex items-center gap-2">✓ Equipo de veterinarios y especialistas</li>
                <li className="flex items-center gap-2">✓ Botón de reserva de citas en línea sincronizado con tu agenda</li>
              </ul>
            </div>

            <div className="relative rounded-2xl border bg-card p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b pb-4">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-emerald-400" />
                <div className="ml-2 flex-1 rounded-md bg-muted px-3 py-1 text-xs font-mono text-muted-foreground truncate">
                  https://pawspatient.go2vet.online
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <div className="h-32 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/30 flex items-center justify-center text-emerald-800 dark:text-emerald-200 font-semibold">
                  🐾 Sitio Web Veterinario Oficial
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-16 rounded-lg bg-muted/60" />
                  <div className="h-16 rounded-lg bg-muted/60" />
                  <div className="h-16 rounded-lg bg-muted/60" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Comienza a transformar la atención de tus pacientes hoy
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-base">
            Accede de inmediato al software en la nube o consulta tu carné de mascota en el portal de propietarios.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold" asChild>
              <a href={appUrl}>Ingresar a la Plataforma</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Bottom Footer */}
      <footer className="border-t py-6 text-xs text-muted-foreground text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} Go2Vet — Software de Gestión Veterinaria. Todos los derechos reservados.</span>
          <div className="flex items-center gap-4">
            <a href={appUrl} className="hover:underline">App</a>
            <a href={portalUrl} className="hover:underline">Portal Propietario</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
