import { type ReactNode, useEffect } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useCurrentRoleId } from "@/lib/rbac";
import { setActingClinic } from "@/lib/saas-store";
import { DataHydrator } from "@/components/data-hydrator";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  LayoutGrid,
  PawPrint,
  ShieldAlert,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsMenu } from "@/components/notifications-menu";
import { UserNavDropdown } from "@/components/user-nav-dropdown";
import { Go2VetLogo } from "@/components/Go2VetLogo";
import { AppFooter } from "@/components/AppFooter";

export function SuperAdminLayout({ children }: { children?: ReactNode }) {
  const { user, ready, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const roleId = useCurrentRoleId();
  const isSuper = roleId === "role_super";

  // Al entrar al Centro de Mando de la plataforma, limpiamos cualquier clínica activa
  useEffect(() => {
    setActingClinic(null);
  }, []);

  useEffect(() => {
    if (ready && !user) {
      navigate({ to: "/login", replace: true });
    }
  }, [navigate, ready, user]);

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="text-muted-foreground text-sm">Cargando Centro de Mando...</div>
      </div>
    );
  }

  if (!user) return null;

  if (!isSuper) {
    return (
      <div className="min-h-screen grid place-items-center bg-background p-6">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border bg-card shadow-sm">
          <div className="mx-auto h-14 w-14 rounded-full bg-destructive/10 text-destructive grid place-items-center">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold">Acceso exclusivo para Super Administrador</h2>
          <p className="text-sm text-muted-foreground">
            Este Centro de Mando es exclusivo para la administración general de la plataforma SaaS.
            Tu cuenta pertenece al panel operativo de clínica.
          </p>
          <Button onClick={() => navigate({ to: "/dashboard" })} className="w-full">
            Ir al Dashboard de Clínica
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <DataHydrator />
      <div className="min-h-screen flex flex-col bg-slate-50/60 dark:bg-zinc-950">
        {/* Header superior limpio del Centro de Mando (Sin sidebar clínico) */}
        <header className="sticky top-0 z-30 bg-card border-b border-border/70 backdrop-blur-md bg-card/95 safe-top">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-2.5 flex items-center justify-between gap-3">
            {/* Logo y título de Plataforma */}
            <div className="flex items-center gap-4 sm:gap-6 min-w-0">
              <Go2VetLogo badgeText="SUPER ADMIN" subtitle="Centro de Mando SaaS" />

              {/* Enlaces de plataforma */}
              <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-border">
                <Link
                  to="/admin"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === "/admin"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                  Centro de Mando
                </Link>
                <Link
                  to="/clinicas"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === "/clinicas"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  Métricas y Planes
                </Link>
              </nav>
            </div>

            {/* Controles superiores derechos para todos los usuarios */}
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <NotificationsMenu />
              <UserNavDropdown />
            </div>
          </div>
        </header>

        {/* Contenedor principal sin sidebar */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>

        <AppFooter />
      </div>
    </>
  );
}
