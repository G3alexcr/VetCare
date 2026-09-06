import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Mail, Lock, Eye, EyeOff, PawPrint, Stethoscope, ArrowRight, UserCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { usePortalAuth } from "@/lib/portal-auth";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/supabase";
import { getAllClientes, addCliente } from "@/lib/clientes-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Go2VetLogo } from "@/components/Go2VetLogo";
import { LegalModal, type LegalPolicyKey } from "@/components/legal-modal";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Iniciar sesión — Go2Vet" }],
  }),
  component: LoginPage,
});

export function LoginPage() {
  const { login: staffLogin } = useAuth();
  const { login: portalLogin } = usePortalAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState<"client" | "staff">("client");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<LegalPolicyKey>("datos-personales");

  // Si llega con ?email= de la invitación, prellenar
  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const emailParam = p.get("email");
      if (emailParam) {
        const clean = emailParam.trim().toLowerCase();
        setEmail(clean);
        const client = getAllClientes().find((c) => c.email.toLowerCase() === clean);
        if (client) {
          setName(client.fullName || client.name);
        }
      }
    }
  }, []);

  const openLegal = (policy: LegalPolicyKey) => {
    setSelectedPolicy(policy);
    setLegalModalOpen(true);
  };

  /**
   * INICIO DE SESIÓN UNIFICADO:
   * 1. Verifica si el email coincide con un cliente registrado (o de base de datos).
   *    -> En ese caso, autentica en el Portal de Clientes y redirige a /portal/dashboard.
   * 2. Si no es cliente, intenta autenticar en Supabase (Personal Clínico / Super Admin).
   *    -> Si tiene rol en clínica, redirige a /dashboard o /admin.
   * 3. Si no existe, muestra el mensaje de error.
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    // 1. Verificar si es Cliente en memoria o demo (ej. maria@gmail.com, juan@hotmail.com)
    const isLocalClient =
      cleanEmail === "maria@gmail.com" ||
      cleanEmail === "juan@hotmail.com" ||
      getAllClientes().some((c) => c.email?.toLowerCase() === cleanEmail);

    if (isLocalClient) {
      const portalRes = await portalLogin(cleanEmail, password);
      if (portalRes.ok) {
        setLoading(false);
        toast.success("¡Bienvenido al Portal del Propietario!");
        navigate({ to: "/portal/dashboard" });
        return;
      }
    }

    // 2. Autenticar en Supabase (Auth universal para usuarios registrados)
    const staffRes = (await staffLogin(cleanEmail, password)) as {
      ok: boolean;
      error?: string;
      user?: import("@/lib/mock-data").User;
      isClientOnly?: boolean;
    };

    // Caso A: El usuario se autenticó en Supabase pero NO pertenece a clinic_members (es Propietario / Cliente)
    if (staffRes.isClientOnly) {
      await portalLogin(cleanEmail, password);
      setLoading(false);
      toast.success("¡Bienvenido al Portal del Propietario!");
      navigate({ to: "/portal/dashboard" });
      return;
    }

    // Caso B: El usuario es Personal Clínico / Admin / Superadmin
    if (staffRes.ok && staffRes.user) {
      setLoading(false);
      toast.success(`Bienvenido, ${staffRes.user.name}`);
      navigate({ to: staffRes.user.role === "super" ? "/admin" : "/dashboard" });
      return;
    }

    // Caso C: Fallback para clientes que no tienen cuenta de Supabase
    const portalRes = await portalLogin(cleanEmail, password);
    if (portalRes.ok) {
      setLoading(false);
      toast.success("¡Bienvenido al Portal del Propietario!");
      navigate({ to: "/portal/dashboard" });
      return;
    }

    // Caso D: Credenciales incorrectas
    setLoading(false);
    toast.error(
      staffRes.error || "Credenciales incorrectas o usuario no registrado."
    );
  };

  /**
   * REGISTRO UNIFICADO:
   * - Si es Cliente: Registra en el sistema como cliente propietario y abre el portal.
   * - Si es Staff: Registra cuenta en Supabase para el personal clínico.
   */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
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

    if (accountType === "client") {
      // Verificar si la clínica ya lo había registrado previamente
      const existingClient = getAllClientes().find(
        (c) => (c.email || "").trim().toLowerCase() === cleanEmail
      );

      if (!existingClient) {
        // Solo si no existe lo creamos
        addCliente({
          name: name.trim() || "Propietario",
          identification: "",
          phone: "",
          whatsapp: "",
          email: cleanEmail,
          address: "",
          registeredAt: new Date().toISOString().split("T")[0],
          notes: "Registrado desde Portal de Clientes",
        });
      }

      await portalLogin(cleanEmail, password);
      setLoading(false);
      toast.success("¡Cuenta activada con éxito!");
      navigate({ to: "/portal/dashboard" });
    } else {
      // Registro de Personal Clínico con Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { name } },
      });
      setLoading(false);

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.session?.user) {
        toast.success("¡Cuenta clínica creada con éxito! Bienvenido.");
        navigate({ to: "/dashboard" });
      } else {
        toast.success("Cuenta creada. Revisa tu correo para confirmarla.");
        setMode("login");
      }
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Panel izquierdo institucional */}
      <div className="hidden lg:flex relative bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 p-12 text-primary-foreground flex-col justify-between overflow-hidden">
        <Go2VetLogo size="md" variant="light" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-xs">
            🐾 Sistema Veterinario & Portal Mascota
          </div>
          <h1 className="text-4xl font-bold leading-tight text-white">
            Un solo acceso para clínicas y propietarios.
          </h1>
          <p className="text-white/80 max-w-md text-sm leading-relaxed">
            Ingresa tu correo y contraseña. El sistema te llevará automáticamente
            a tu expediente y carnet de mascota si eres tutor, o a tu centro de
            mando si eres parte del equipo médico.
          </p>
        </div>
        <div className="text-xs text-white/60">
          © 2026 Go2Vet. Gestión Integral para Clínicas Veterinarias y Tutores.
        </div>
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-10 right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      </div>

      {/* Panel derecho: Formulario */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <Card className="w-full max-w-md p-8 shadow-xl border-border/70">
          <div className="lg:hidden flex items-center mb-6">
            <Go2VetLogo size="md" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {mode === "login" ? "Acceso Go2Vet" : "Crear nueva cuenta"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {mode === "login"
                ? "Ingresa tus datos para acceder a tu cuenta"
                : "Elige tu tipo de perfil y completa tus datos"}
            </p>
          </div>

          {/* En modo Registro: Selección de tipo de cuenta */}
          {mode === "register" && (
            <div className="grid grid-cols-2 gap-2 mt-5 p-1 bg-muted rounded-lg">
              <button
                type="button"
                onClick={() => setAccountType("client")}
                className={`flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold transition-all ${
                  accountType === "client"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <PawPrint className="h-4 w-4 text-emerald-600" />
                Soy Propietario
              </button>
              <button
                type="button"
                onClick={() => setAccountType("staff")}
                className={`flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold transition-all ${
                  accountType === "staff"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Stethoscope className="h-4 w-4 text-teal-600" />
                Equipo Clínico
              </button>
            </div>
          )}

          <form
            onSubmit={mode === "login" ? handleLogin : handleRegister}
            className="mt-6 space-y-4"
          >
            {/* Nombre (solo registro) */}
            {mode === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Nombre completo</Label>
                <div className="relative">
                  <UserCheck className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9"
                    placeholder="Ej. Carlos González"
                    required
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  placeholder="tu@correo.com"
                  required
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
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

            {/* Confirmación (solo registro) */}
            {mode === "register" && (
              <div className="space-y-1.5">
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
                  >
                    {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium mt-2"
              disabled={loading}
            >
              {loading ? (
                "Validando credenciales..."
              ) : mode === "login" ? (
                <>
                  Ingresar a mi cuenta <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                "Crear mi cuenta"
              )}
            </Button>
          </form>

          {/* Cambiar entre Iniciar Sesión y Registro */}
          <div className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                ¿No tienes cuenta aún?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setName("");
                    setPassword("");
                    setConfirmPassword("");
                  }}
                  className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-semibold underline underline-offset-2 cursor-pointer"
                >
                  Regístrate aquí
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes una cuenta?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-semibold underline underline-offset-2 cursor-pointer"
                >
                  Inicia sesión
                </button>
              </>
            )}
          </div>

          {/* Enlaces Legales */}
          <div className="mt-8 pt-4 border-t border-border/60 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
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
  );
}
