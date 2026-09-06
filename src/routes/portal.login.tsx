import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Heart, Mail, Lock, Eye, EyeOff, PawPrint, User } from "lucide-react";
import { usePortalAuth } from "@/lib/portal-auth";
import { getAllClientes, addCliente } from "@/lib/clientes-store";
import { DataHydrator } from "@/components/data-hydrator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Go2VetLogo } from "@/components/Go2VetLogo";
import { LegalModal, type LegalPolicyKey } from "@/components/legal-modal";

export const Route = createFileRoute("/portal/login")({
  head: () => ({ meta: [{ title: "Portal Propietario — Go2Vet" }] }),
  component: PortalLoginPage,
});

function PortalLoginPage() {
  const { owner, ready, login } = usePortalAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && owner) {
      navigate({ to: "/portal/dashboard", replace: true });
    }
  }, [ready, owner, navigate]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get("email");
      if (emailParam) {
        const clean = emailParam.trim().toLowerCase();
        setEmail(clean);
        setMode("register");
        const allClients = getAllClientes();
        const found = allClients.find((c) => c.email.toLowerCase() === clean);
        if (found) {
          setName(found.fullName || found.name);
        }
        toast.info("Crea tu contraseña para acceder al expediente y carnet de tu mascota");
      }
    }
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [mode, setMode] = useState<"login" | "register" | "recover">("login");
  const [loading, setLoading] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<LegalPolicyKey>("datos-personales");

  const openLegal = (policy: LegalPolicyKey) => {
    setSelectedPolicy(policy);
    setLegalModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "recover") {
      toast.success("Enviamos un enlace de recuperación a tu correo");
      setMode("login");
      return;
    }

    if (mode === "register") {
      if (password !== confirmPassword) {
        toast.error("Las contraseñas no coinciden");
        return;
      }
      if (password.length < 6) {
        toast.error("La contraseña debe tener al menos 6 caracteres");
        return;
      }
      setLoading(true);
      const cleanEmail = email.trim().toLowerCase();
      const allClients = getAllClientes();
      const existing = allClients.find((c) => c.email.toLowerCase() === cleanEmail);
      if (!existing) {
        addCliente({
          name: name.trim() || cleanEmail.split("@")[0],
          identification: "",
          phone: "",
          whatsapp: "",
          email: cleanEmail,
          address: "",
          registeredAt: new Date().toISOString().split("T")[0],
          notes: "Registrado vía Portal del Propietario",
        });
      }
      const res = login(cleanEmail, password);
      setLoading(false);
      if (!res.ok) {
        toast.error(res.error ?? "Error al registrar");
        return;
      }
      toast.success("¡Cuenta creada exitosamente!");
      navigate({ to: "/portal/dashboard" });
      return;
    }

    setLoading(true);
    const res = login(email, password);
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error ?? "Error de autenticación");
      return;
    }
    toast.success("Bienvenido de nuevo");
    navigate({ to: "/portal/dashboard" });
  };

  return (
    <>
      <DataHydrator />
      <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex relative bg-gradient-to-br from-emerald-500 to-teal-600 p-12 text-white flex-col justify-between overflow-hidden">
        <Go2VetLogo size="md" variant="light" subtitle="Portal Propietarios" />
        <div className="relative z-10">
          <h1 className="text-4xl font-bold leading-tight">
            Todo el cuidado de tus mascotas en un solo lugar.
          </h1>
          <p className="mt-4 text-white/80 max-w-md">
            Consulta el historial médico, agenda citas y recibe recordatorios de vacunas
            desde tu portal personal.
          </p>
        </div>
        <div className="text-xs text-white/70">© 2026 Go2Vet</div>
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      </div>

      <div className="flex items-center justify-center p-6 md:p-12">
        <Card className="w-full max-w-md p-8 shadow-lg border-border/60">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-xl bg-emerald-500 text-white grid place-items-center">
              <Heart className="h-5 w-5" />
            </div>
            <span className="font-semibold text-lg">Portal Propietario</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            {mode === "login" ? "Iniciar sesión" : mode === "register" ? "Crear cuenta" : "Recuperar contraseña"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "login"
              ? "Accede a la información de tus mascotas"
              : mode === "register"
              ? "Regístrate para consultar el expediente y carnet de tus mascotas"
              : "Te enviaremos un enlace a tu correo"}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <div className="relative">
                  <User className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9"
                    placeholder="Tu nombre y apellido"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>
            </div>

            {mode !== "recover" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  {mode === "login" && (
                    <button type="button" onClick={() => setMode("recover")} className="text-xs text-primary hover:underline">
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <div className="relative">
                  <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPw ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 pr-10"
                    placeholder="Repite tu contraseña"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showConfirmPw ? "Ocultar confirmación" : "Mostrar confirmación"}
                  >
                    {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-[11px] text-destructive font-medium">Las contraseñas no coinciden</p>
                )}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? mode === "login"
                  ? "Ingresando..."
                  : mode === "register"
                  ? "Creando cuenta..."
                  : "Enviando enlace..."
                : mode === "login"
                ? "Iniciar sesión"
                : mode === "register"
                ? "Registrarme"
                : "Enviar enlace"}
            </Button>

            {mode === "recover" && (
              <Button type="button" variant="ghost" className="w-full" onClick={() => setMode("login")}>
                Volver a iniciar sesión
              </Button>
            )}
          </form>

          {mode !== "recover" && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              {mode === "login" ? (
                <>
                  ¿No tienes cuenta?{" "}
                  <button type="button" onClick={() => setMode("register")} className="text-primary hover:underline font-medium">
                    Regístrate
                  </button>
                </>
              ) : (
                <>
                  ¿Ya tienes cuenta?{" "}
                  <button type="button" onClick={() => setMode("login")} className="text-primary hover:underline font-medium">
                    Inicia sesión
                  </button>
                </>
              )}
            </div>
          )}

          <div className="mt-6 text-center text-xs text-muted-foreground">
            ¿Eres parte del equipo clínico o veterinario?{" "}
            <Link to="/dashboard" className="text-primary hover:underline font-medium">
              Ir a la App Clínica
            </Link>
          </div>

          <div className="mt-6 pt-4 border-t border-border/60 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <button
              type="button"
              onClick={() => openLegal("datos-personales")}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Habeas Data
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => openLegal("aplicativos-web")}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Aplicativos Web
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => openLegal("condiciones-uso")}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Condiciones de Uso
            </button>
          </div>
        </Card>
      </div>

      <LegalModal
        open={legalModalOpen}
        onOpenChange={setLegalModalOpen}
        initialPolicy={selectedPolicy}
      />
      </div>
    </>
  );
}
