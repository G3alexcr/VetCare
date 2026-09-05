import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PawPrint, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

import { getAllClientes } from "@/lib/clientes-store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Iniciar sesión — VetCare" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (!res.ok) {
      const clean = email.trim().toLowerCase();
      const isClient = clean === "maria@gmail.com" || getAllClientes().some((c) => c.email?.toLowerCase() === clean);
      if (isClient) {
        toast.error("Este correo pertenece al Portal del Propietario (Clientes).", {
          description: "Estás en el login del personal clínico. Haz clic para ir al Portal del Cliente.",
          action: {
            label: "Ir al Portal",
            onClick: () => navigate({ to: "/portal/login" }),
          },
          duration: 8000,
        });
        return;
      }
      toast.error(res.error ?? "Error de autenticación");
      return;
    }
    toast.success("Bienvenido a VetCare");
    navigate({ to: res.user?.role === "super" ? "/admin" : "/dashboard" });
  };

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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    if (data.session?.user) {
      // Confirmación de email desactivada: la sesión ya está iniciada.
      toast.success("Cuenta creada. ¡Bienvenido a VetCare!");
      navigate({ to: "/dashboard" });
    } else {
      toast.success("Cuenta creada. Revisa tu correo para confirmar tu dirección.");
      setMode("login");
    }
  };


  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex relative bg-gradient-to-br from-primary to-primary/70 p-12 text-primary-foreground flex-col justify-between overflow-hidden">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-white/15 grid place-items-center">
            <PawPrint className="h-5 w-5" />
          </div>
          <span className="font-semibold text-lg">VetCare</span>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold leading-tight">
            La plataforma moderna para tu clínica veterinaria.
          </h1>
          <p className="mt-4 text-primary-foreground/80 max-w-md">
            Gestiona clientes, mascotas, agenda y consultas médicas desde un único lugar.
            Diseñado para equipos veterinarios profesionales.
          </p>
        </div>
        <div className="text-xs text-primary-foreground/70">© 2026 VetCare. Todos los derechos reservados.</div>
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-10 right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      </div>

      <div className="flex items-center justify-center p-6 md:p-12">
        <Card className="w-full max-w-md p-8 shadow-lg border-border/60">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground grid place-items-center">
              <PawPrint className="h-5 w-5" />
            </div>
            <span className="font-semibold text-lg">VetCare</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "login"
              ? "Ingresa tus credenciales para acceder al panel"
              : "Regístrate para crear tu cuenta en VetCare"}
          </p>

          <form onSubmit={mode === "login" ? handleSubmit : handleRegister} className="mt-6 space-y-4">
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <div className="relative">
                  <PawPrint className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="pl-9" placeholder="Tu nombre completo" required />
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                {mode === "login" && (
                  <Link to="/login" className="text-xs text-primary hover:underline">
                    ¿Olvidaste tu contraseña?
                  </Link>
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
                ? mode === "login" ? "Ingresando..." : "Creando cuenta..."
                : mode === "login" ? "Iniciar sesión" : "Registrarme"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>¿No tienes cuenta?{" "}
                <button type="button" onClick={() => setMode("register")} className="text-primary hover:underline font-medium">
                  Regístrate
                </button>
              </>
            ) : (
              <>¿Ya tienes cuenta?{" "}
                <button type="button" onClick={() => setMode("login")} className="text-primary hover:underline font-medium">
                  Inicia sesión
                </button>
              </>
            )}
          </div>

          <div className="mt-4 text-center text-xs text-muted-foreground">
            ¿Eres propietario de una mascota?{" "}
            <Link to="/portal/login" className="text-primary hover:underline font-medium">
              Ingresa al Portal
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
