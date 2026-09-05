import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { SuperAdminLayout } from "@/components/superadmin-layout";
import { useCurrentRoleId } from "@/lib/rbac";
import { useActingClinicId } from "@/lib/saas-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/hooks/use-theme";
import {
  ArrowLeft,
  Moon,
  Sun,
  Bell,
  Shield,
  Globe,
  ChevronDown,
  ChevronUp,
  Volume2,
  Lock,
  Smartphone,
  Check,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/ajustes")({
  head: () => ({ meta: [{ title: "Ajustes de la Aplicación — VetCare" }] }),
  component: AjustesPageWrapper,
});

function AjustesPageWrapper() {
  const roleId = useCurrentRoleId();
  const isSuper = roleId === "role_super";
  const actingClinicId = useActingClinicId();

  if (isSuper && !actingClinicId) {
    return (
      <SuperAdminLayout>
        <AjustesContent />
      </SuperAdminLayout>
    );
  }

  return (
    <AppLayout>
      <AjustesContent />
    </AppLayout>
  );
}

function AjustesContent() {
  const { isDark, toggleTheme } = useTheme();

  // Acordeones desplegables
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  // Estados de alertas
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [appointmentAlerts, setAppointmentAlerts] = useState(true);
  const [vaccineAlerts, setVaccineAlerts] = useState(true);
  const [stockAlerts, setStockAlerts] = useState(true);

  // Estados de contraseña
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  // Idioma
  const [language, setLanguage] = useState("Español");

  const handleChangePw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPw || !newPw) {
      toast.error("Por favor completa los campos");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    toast.success("Contraseña actualizada con éxito");
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    setOpenSection(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header con botón atrás (Igual a Imagen 2) */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => window.history.back()}
          className="h-10 w-10 rounded-full border-border/80 bg-background shadow-xs hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Volver</span>
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground uppercase">
            CONFIGURACIÓN
          </h1>
          <p className="text-xs text-muted-foreground font-medium">Ajustes de la aplicación</p>
        </div>
      </div>

      {/* Tarjeta de Lista de Ajustes (Igual a Imagen 2) */}
      <Card className="rounded-3xl border border-border/70 bg-card divide-y divide-border/60 shadow-xs overflow-hidden">
        {/* 1. MODO OSCURO */}
        <div className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 grid place-items-center flex-shrink-0">
              {isDark ? <Moon className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </div>
            <div>
              <div className="font-bold text-sm text-foreground uppercase tracking-wide">
                Modo Oscuro
              </div>
              <div className="text-xs text-muted-foreground">
                {isDark ? "Activado" : "Desactivado"}
              </div>
            </div>
          </div>
          <Switch checked={isDark} onCheckedChange={toggleTheme} />
        </div>

        {/* 2. NOTIFICACIONES */}
        <div>
          <div
            onClick={() => toggleSection("notificaciones")}
            className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 grid place-items-center flex-shrink-0">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-foreground uppercase tracking-wide">
                  Notificaciones
                </div>
                <div className="text-xs text-muted-foreground">Configurar alertas</div>
              </div>
            </div>
            {openSection === "notificaciones" ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>

          {openSection === "notificaciones" && (
            <div className="px-5 pb-5 pt-1 space-y-3 bg-muted/10">
              <div className="flex items-center justify-between p-3 rounded-2xl border bg-card text-xs">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <span>Sonidos en alertas y notificaciones</span>
                </div>
                <Switch checked={soundEnabled} onCheckedChange={(v) => { setSoundEnabled(v); toast.success("Ajuste guardado"); }} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl border bg-card text-xs">
                <span>Alertas de citas agendadas y cancelaciones</span>
                <Switch checked={appointmentAlerts} onCheckedChange={(v) => { setAppointmentAlerts(v); toast.success("Ajuste guardado"); }} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl border bg-card text-xs">
                <span>Recordatorios de vacunas y desparasitación próximas</span>
                <Switch checked={vaccineAlerts} onCheckedChange={(v) => { setVaccineAlerts(v); toast.success("Ajuste guardado"); }} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl border bg-card text-xs">
                <span>Alertas de inventario y stock crítico</span>
                <Switch checked={stockAlerts} onCheckedChange={(v) => { setStockAlerts(v); toast.success("Ajuste guardado"); }} />
              </div>
            </div>
          )}
        </div>

        {/* 3. PRIVACIDAD Y SEGURIDAD */}
        <div>
          <div
            onClick={() => toggleSection("seguridad")}
            className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 grid place-items-center flex-shrink-0">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-foreground uppercase tracking-wide">
                  Privacidad y Seguridad
                </div>
                <div className="text-xs text-muted-foreground">Contraseña, sesiones</div>
              </div>
            </div>
            {openSection === "seguridad" ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>

          {openSection === "seguridad" && (
            <div className="px-5 pb-5 pt-1 space-y-4 bg-muted/10">
              <form onSubmit={handleChangePw} className="p-4 rounded-2xl border bg-card space-y-3">
                <div className="font-bold text-xs flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" /> Cambiar Contraseña
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px]">Contraseña Actual</Label>
                  <Input
                    type="password"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px]">Nueva Contraseña</Label>
                    <Input
                      type="password"
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px]">Confirmar Nueva Contraseña</Label>
                    <Input
                      type="password"
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                </div>
                <Button type="submit" size="sm" className="rounded-xl text-xs font-bold">
                  Actualizar Contraseña
                </Button>
              </form>

              <div className="p-4 rounded-2xl border bg-card flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-semibold">Sesión Actual</div>
                    <div className="text-[11px] text-muted-foreground">Dispositivo actual • Conectado</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.success("Otras sesiones cerradas")}
                  className="text-xs rounded-xl"
                >
                  Cerrar otras sesiones
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 4. IDIOMA */}
        <div>
          <div
            onClick={() => toggleSection("idioma")}
            className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 grid place-items-center flex-shrink-0">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-foreground uppercase tracking-wide">
                  Idioma
                </div>
                <div className="text-xs text-muted-foreground">{language}</div>
              </div>
            </div>
            {openSection === "idioma" ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>

          {openSection === "idioma" && (
            <div className="px-5 pb-5 pt-1 space-y-2 bg-muted/10">
              {["Español", "English", "Português"].map((lang) => (
                <div
                  key={lang}
                  onClick={() => {
                    setLanguage(lang);
                    toast.success(`Idioma cambiado a ${lang}`);
                    setOpenSection(null);
                  }}
                  className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all text-xs ${
                    language === lang
                      ? "bg-teal-50 border-teal-300 text-teal-900 dark:bg-teal-950/40 dark:text-teal-200 font-bold"
                      : "bg-card hover:bg-muted/40"
                  }`}
                >
                  <span>{lang}</span>
                  {language === lang && <Check className="h-4 w-4 text-teal-600" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
